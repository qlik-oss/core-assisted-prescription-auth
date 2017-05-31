const AuthenticationService = require('./authentication-service');
const githubPassportStrategy = require('./github-passport-strategy');
const commandLineArgs = require('command-line-args');

const options = commandLineArgs([
  { name: 'clientId', type: String, defaultValue: process.env.GITHUB_CLIENT_ID },
  { name: 'clientSecret', type: String, defaultValue: process.env.GITHUB_CLIENT_SECRET },
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'sessionCookieName', type: String, defaultValue: process.env.SESSION_COOKIE_NAME },
  { name: 'successRedirectUrl', type: String, defaultValue: process.env.SUCCESS_REDIRECT_URL },
  { name: 'failureRedirectUrl', type: String, defaultValue: process.env.FAILURE_REDIRECT_URL }

]);

AuthenticationService.initialize({
  strategy: githubPassportStrategy.strategy({
    port: options.port,
    clientId: options.clientId,
    clientSecret: options.clientSecret }
  ),

  scope: githubPassportStrategy.scope,
  port: options.port,
  sessionCookieName: options.sessionCookieName,
  successRedirectUrl: options.successRedirectUrl,
  failureRedirectUrl: options.failureRedirectUrl
});
