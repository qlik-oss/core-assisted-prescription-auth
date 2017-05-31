const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');
const logger = require('./logger/logger').get();

function approvedMember(accessToken, profile, done) {
  const url = `https://api.github.com/orgs/qlik-ea/members/${profile.username}?access_token=${accessToken}`;

  httpLibrary.get(url).end((err, res) => {
    if (err || !res.noContent) {
      logger.warn(err);
      logger.warn(res);
      return done(null, false);
    }

    return done(null, profile);
  });
}

function githubPassportStrategy(options) {
  return new GitHubStrategy(
    {
      clientID: options.clientId,
      clientSecret: options.clientSecret
    },
    (accessToken, refreshToken, profile, done) => approvedMember(accessToken, profile, done));
}

function getScope() {
  return ['read:org'];
}

module.exports = {
  strategy: githubPassportStrategy,
  scope: getScope()
};
