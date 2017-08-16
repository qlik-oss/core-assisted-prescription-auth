const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');
const logger = require('./logger/logger').get();

async function approvedMember(accessToken, profile, done) {
  const urls = [];
  const requests = [];
  urls.push(`https://api.github.com/orgs/qlik-ea/members/${profile.username}?access_token=${accessToken}`);
  urls.push(`https://api.github.com/orgs/qlik-trial/members/${profile.username}?access_token=${accessToken}`);

  urls.forEach((url) => {
    requests.push(httpLibrary.get(url).catch(result => Promise.resolve(result)));
  });

  let isMember = false;
  const results = await Promise.all(requests);
  results.forEach((result) => {
    if (result.noContent) {
      isMember = true;
    }
  });
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
