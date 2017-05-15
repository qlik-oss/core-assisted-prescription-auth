const AuthenticationService = require('./authentication-service');
const githubPassportStrategy = require('./github-passport-strategy');
const commandLineArgs = require('command-line-args');

const options = commandLineArgs([
  { name: 'clientId', type: String },
  { name: 'clientSecret', type: String },
  { name: 'port', type: Number, defaultValue: 3000 }
]);

AuthenticationService.initialize({
  strategy: githubPassportStrategy.strategy({
    port: options.port,
    clientId: options.clientId,
    clientSecret: options.clientSecret }
  ),
  scope: githubPassportStrategy.scope,
  port: options.port
});
