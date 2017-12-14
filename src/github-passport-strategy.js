const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');
const logger = require('./logger/logger').get();

async function approvedMember(accessToken, profile, done) {
  const githubTemplate = org => `https://api.github.com/orgs/${org}/members/${profile.username}?access_token=${accessToken}`;
  const requests = [
    githubTemplate('qlik-ea'),
    githubTemplate('qlik-trial'),
  ].map(url => httpLibrary.get(url).catch(result => Promise.resolve(result)));

  const results = await Promise.all(requests);
  const isMember = results.some(result => result.noContent);
  if (isMember) {
    return done(null, profile);
  }
  logger.warn(`user ${profile.username} failed to login`);
  return done(null, false);
}

function githubPassportStrategy(options) {
  return new GitHubStrategy(
    {
      clientID: options.clientId,
      clientSecret: options.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => approvedMember(accessToken, profile, done));
}

function getScope() {
  return ['read:org'];
}

module.exports = {
  strategy: githubPassportStrategy,
  scope: getScope(),
};
