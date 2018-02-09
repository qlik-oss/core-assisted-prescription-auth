const AuthenticationService = require('./authentication-service');
const githubPassportStrategy = require('./github-passport-strategy');
const LocalPassportStrategy = require('passport-local').Strategy;
const commandLineArgs = require('command-line-args');
const fs = require('fs');

const options = commandLineArgs([
  { name: 'strategy', type: String, defaultValue: process.env.AUTH_STRATEGY || 'local' },
  { name: 'clientId', type: String, defaultValue: process.env.GITHUB_CLIENT_ID },
  { name: 'clientSecret', type: String, defaultValue: process.env.GITHUB_CLIENT_SECRET },
  { name: 'githubOrgIsAdmin', type: String, defaultValue: process.env.GITHUB_ORG_IS_ADMIN || ''},
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'sessionCookieName', type: String, defaultValue: process.env.SESSION_COOKIE_NAME },
  { name: 'failureRedirectUrl', type: String, defaultValue: process.env.FAILURE_REDIRECT_URL },
  { name: 'jwtSecret', type: String, defaultValue: process.env.JWT_SECRET },
  { name: 'cookieSigning', type: String, defaultValue: process.env.COOKIE_SIGNING },
  { name: 'redisHost', type: String, defaultValue: process.env.REDIS_HOST || 'redis' },
  { name: 'redisPort', type: String, defaultValue: process.env.REDIS_PORT || 6379 },
  { name: 'localAccountsFile', type: String, defaultValue: process.env.ACCOUNTS_FILE },
]);

let strategy;
const accounts = {};
if (options.localAccountsFile) {
  const contents = fs.readFileSync(options.localAccountsFile).toString();
  const lines = contents.split(/\r?\n/); // handle both windows and linux newlines
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].split(':');
    accounts[line[0]] = line[1];
  }
}

switch (options.strategy) {
  case 'github':
    strategy = githubPassportStrategy.strategy({
      port: options.port,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      githubOrgIsAdmin: options.githubOrgIsAdmin,
    });
    break;
  case 'local':
    strategy = new LocalPassportStrategy((username, password, done) => {
      if (!accounts[username]) {
        return done(null, false);
      } else if (accounts[username] !== password) {
        return done(null, false);
      }
      //Local user will get User rights, change to Admin for admin rights
      return done(null, { username, authMethod: 'local', userRole: 'User' });
    });
    break;
  default:
    throw new Error('Specify a specific authentication strategy using the --strategy parameter');
}

AuthenticationService.initialize({
  strategy,
  port: options.port,
  scope: options.strategy === 'github' ? githubPassportStrategy.scope : undefined,
  sessionCookieName: options.sessionCookieName,
  failureRedirectUrl: options.failureRedirectUrl,
  jwtSecret: options.jwtSecret,
  cookieSigning: options.cookieSigning,
  redisHost: options.redisHost,
  redisPort: options.redisPort,
});

