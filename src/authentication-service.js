const Koa = require('koa');
const Router = require('koa-router');
const passport = require('koa-passport');
var redis = require('redis');

const getJWT = require('./jwt');

function initiate(opt) {
  const options = opt || {};
  const passportStrategy = options.strategy;
  const scope = options.scope;

  // TODO: Populate setting + credentials???
  const redisClient = redis.createClient({
    host : options.redisHost || 'localhost',
    port : options.redisPort || 6379
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
    if (validStrategy(ctx.params.idp)) {
      return passport.authenticate(ctx.params.idp, { successRedirect: `/login/${ctx.params.idp}/succeeded`, failureRedirect: `/login/${ctx.params.idp}/failed` }, (err, profile) => {
        if(profile){
          console.log('Authenticated and this is the jwt: ', getJWT(profile));

          let jwt = getJWT(profile);
          let sessionId = Math.floor(Math.random() * Date.now()); //TODO: MAKE IT GOOD!

          redisClient.set(sessionId, jwt, function(err, reply) {
            if(!err) {
              console.log('Session entered into db: ', sessionId, jwt);
            }
            else{


            }
          });


          ctx.cookies.set(options.cookieKey, sessionId, {
            //signed: true,
            httpOnly: true
          });


          ctx.redirect(`/login/${ctx.params.idp}/succeeded`);
        }
        else {
          ctx.redirect(`/login/${ctx.params.idp}/failed`);
        }
      })(ctx, next)
    }
    return next();
  });

  router.get('/logout', (ctx, next) => {

    const sessionId = ctx.cookies.get(options.cookieKey);

    redisClient.del(sessionId, function(err, reply) {
      if(!err) {
        if(reply === 1) {
          console.log("Key is deleted");
        } else {
          console.log("Does't exists");
        }
      }
      else{

      }
    });

    next();
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.listen(options.port);
}

module.exports = { initialize: initiate };
