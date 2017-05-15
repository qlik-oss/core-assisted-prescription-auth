const Koa = require('koa');
const Router = require('koa-router');
const passport = require('koa-passport');

function initiate(opt) {
  const options = opt || {};
  const passportStrategy = options.strategy;
  const scope = options.scope;

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
      return passport.authenticate(ctx.params.idp, { successRedirect: `/login/${ctx.params.idp}/succeeded`, failureRedirect: `/login/${ctx.params.idp}/failed` })(ctx, next);
    }
    return next();
  });

  router.get('/logout', (ctx) => {
    ctx.response.body = 'logout';
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.listen(options.port);
}

module.exports = { initialize: initiate };
