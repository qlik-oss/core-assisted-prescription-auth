const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const passport = require('koa-passport');
const uuidV4 = require('uuid/v4');

const logger = require('./logger/logger').get();
const redis = require('redis');

const getJWT = require('./jwt');

function initiate(opt) {
  const options = opt;
  const passportStrategy = options.strategy;
  const scope = options.scope;

  // TODO: Populate setting + credentials???

  passport.use(passportStrategy);

  // passport.serializeUser((user, done) => {
  //   done(null, user);
  // });
  //
  // passport.deserializeUser((user, done) => {
  //   done(null, user);
  // });

  function setTempRedirectCookie(ctx) {
    const successRedirectUrl = ctx.request.query.redirect_url;
    if (successRedirectUrl) {
      ctx.cookies.set(`${options.sessionCookieName}_redirect_url`, successRedirectUrl);
    }
  }

  function validStrategy(idp) {
    return passportStrategy.name === idp;
  }

  function getRedisClient() {
    return redis.createClient({
      host: options.redisHost || 'redis',
      port: options.redisPort || 6379,
    });
  }

  async function createSessionInRedisAndSetCookie(authenticationErr, profile, ctx) {
    if (profile) {
      const jwt = getJWT(profile, options.jwtSecret);

      logger.info('Authenticated and this is the jwt: ', jwt);

      const sessionId = uuidV4();

      const p = new Promise((resolve, reject) => {
        const redisClient = getRedisClient();
        redisClient.set(sessionId, jwt, (dbErr, reply) => {
          if (!dbErr) {
            logger.info('Session stored in database: ', sessionId, jwt);
            resolve(reply);
          } else {
            reject(dbErr);
          }

          redisClient.quit();
        });
      });

      try {
        await p;
        ctx.cookies.set(options.sessionCookieName, sessionId, {
          signed: true,
          httpOnly: true,
          // secure: true //Should be turned on when we have https going
        });
        const successRedirectUrl = ctx.cookies.get(`${options.sessionCookieName}_redirect_url`) || '/';
        ctx.cookies.set(`${options.sessionCookieName}_redirect_url`);
        ctx.redirect(successRedirectUrl);
      } catch (err) {
        ctx.cookies.set(`${options.sessionCookieName}_redirect_url`);
        logger.error('Failed to create session ', err);
        ctx.status = 500;
        logger.error(err);
      }
    } else {
      logger.error('Failed to authenticate ', authenticationErr);
      ctx.redirect(options.failureRedirectUrl);
    }
  }

  const app = new Koa();
  app.use(bodyParser());
  app.use(passport.initialize());

  app.keys = [options.cookieSigning]; // Needed to sign cookies

  const router = new Router();

  router.get('/health', async (ctx) => {
    ctx.body = 'OK';
  });

  router.get('/login/:idp/succeeded', (ctx) => {
    if (validStrategy(ctx.params.idp)) {
      ctx.response.body = 'succeeded';
    }
  });

  router.get('/login/:idp/failed', (ctx) => {
    if (validStrategy(ctx.params.idp)) {
      ctx.response.body = 'failed';
    }
  });

  router.get('/idp', (ctx) => {
    ctx.response.body = passportStrategy.name;
  });

  router.get('/login/local', (ctx) => {
    if (validStrategy('local')) {
      setTempRedirectCookie(ctx);
      ctx.response.body = '<form action="/login/local/callback" method="get"><div><label>Username:</label><input type="text" name="username" /> <br /></div ><div> <label>Password:</label><input type="password" name="password" /></div><div><input type="submit" value="Submit" /></div></form >';
    }
  });

  router.get('/login/:idp', (ctx, next) => {
    if (validStrategy(ctx.params.idp)) {
      setTempRedirectCookie(ctx);
      return passport.authenticate(ctx.params.idp, { scope })(ctx, next);
    }
    return next();
  });

  router.get('/login/:idp/callback', (ctx, next) => {
    // TODO: If user is already logged in return same session cookie and do not create a new one
    if (validStrategy(ctx.params.idp)) {
      // handle the case when we call the callback directly (as we do from the UI in custom analytics)
      setTempRedirectCookie(ctx);
      return passport.authenticate(ctx.params.idp, (err, user) => createSessionInRedisAndSetCookie(err, user, ctx))(ctx, next);
    }
    return next();
  });

  router.get('/logout', async (ctx) => {
    const sessionId = ctx.cookies.get(options.sessionCookieName);

    const p = new Promise((resolve, reject) => {
      const redisClient = getRedisClient();

      redisClient.del(sessionId, (err, reply) => {
        if (!err) {
          if (reply === 1) {
            logger.info('Session removed from database: ', sessionId);
            resolve(reply);
          } else {
            logger.warn('No session found to remove from database: ', sessionId);
            resolve(reply);
          }
        } else {
          reject(err);
        }

        redisClient.quit();
      });
    });

    try {
      await p;
      ctx.cookies.set(options.sessionCookieName, null);
      ctx.cookies.set(`${options.sessionCookieName}.sig`, null);
      ctx.response.body = 'Logged out';
    } catch (err) {
      ctx.status = 500;
      logger.error(err);
    }
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.listen(options.port);
}

module.exports = { initialize: initiate };
