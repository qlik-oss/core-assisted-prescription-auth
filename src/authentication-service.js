const Koa = require('koa');
const Router = require('koa-router');
const passport = require('koa-passport');
const Promise = require('bluebird');
const logger = require('./logger/Logger').get();
const redis = require('redis');

const getJWT = require('./jwt');

function initiate(opt) {
  const options = opt || {};
  const passportStrategy = options.strategy;
  const scope = options.scope;

  // TODO: Populate setting + credentials???
  const redisClient = redis.createClient({
    host: options.redisHost || 'redis',
    port: options.redisPort || 6379
  });

  if (!options.port) {
    options.port = 3000;
  }

  passport.use(passportStrategy);

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  function validStrategy(idp) {
    return passportStrategy.name === idp;
  }

  const app = new Koa();
  app.use(passport.initialize());

  app.keys = ['hemligt']; // Needed to sign cookies

  const router = new Router();

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

  router.get('/login/:idp', (ctx, next) => {
    if (validStrategy(ctx.params.idp)) {
      return passport.authenticate(ctx.params.idp, { scope })(ctx, next);
    }
    return next();
  });

  router.get('/login/:idp/callback', (ctx, next) => {
    // TODO: If user is already logged in return same session cookie and do not create a new one

    if (validStrategy(ctx.params.idp)) {
      return passport.authenticate(ctx.params.idp, (authenticationErr, profile) => {
        if (profile) {
          logger.info('Authenticated and this is the jwt: ', getJWT(profile));

          const jwt = getJWT(profile);
          const sessionId = Math.floor(Math.random() * Date.now()); // TODO: MAKE IT GOOD!

          const p = new Promise((resolve, reject) => {
            redisClient.set(sessionId, jwt, (dbErr, reply) => {
              if (!dbErr) {
                logger.info('Session entered into db: ', sessionId, jwt);
                resolve(reply);
              } else {
                reject(dbErr);
              }
            });
          });


          return p.then(() => {
            ctx.cookies.set(options.sessionCookieName, sessionId, {
              signed: true,
              httpOnly: true
              // secure: true //Should be turned on when we have https going
            });

            ctx.redirect(`/login/${ctx.params.idp}/succeeded`);
          }).catch((err) => {
            logger.error('Something when wrong creating session ', err);
          });
        }

        logger.error('Couldn\'t authenticate ', authenticationErr);
        return ctx.redirect(`/login/${ctx.params.idp}/failed`);
      })(ctx, next);
    }

    return next();
  });

  router.get('/logout', (ctx) => {
    const sessionId = ctx.cookies.get(options.sessionCookieName);

    const p = new Promise((resolve, reject) => {
      redisClient.del(sessionId, (err, reply) => {
        if (!err) {
          if (reply === 1) {
            logger.info('Session removed from db: ', sessionId);
            resolve(reply);
          } else {

            logger.warn('Session removed from db: ', sessionId);
            reject(err);
          }
        }
      });
    });

    return p.then(() => {
      ctx.cookies.set(options.sessionCookieName, null);
      ctx.cookies.set(`${options.sessionCookieName}.sig`, null);
      ctx.response.body = 'User has logged out';
    }).catch((err) => {
      ctx.throw(500, err);
    });
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.listen(options.port);
}

module.exports = { initialize: initiate };
