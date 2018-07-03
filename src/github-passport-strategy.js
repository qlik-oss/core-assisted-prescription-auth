const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');
const logger = require('./logger/logger').get();

async function approvedMember(options, accessToken, profile, done) {
  const userProfile = Object.assign({}, profile, { userRole: 'User' });

  // If no organisation is defined as admin, all will be granted admin rights
  if (options.githubOrgIsAdmin) {
    const adminOrganisations = options.githubOrgIsAdmin.split(';');
    const req = adminOrganisations.map(org => httpLibrary.get(`https://api.github.com/orgs/${org}/members/${profile.username}?access_token=${accessToken}`).catch(result => Promise.resolve(result)));
    const results = await Promise.all(req);
    const isMember = results.some(result => result.noContent);

    if (isMember) {
      userProfile.userRole = 'Admin';
      logger.debug('Access to defined Github org, setting admin privilege');
    } else {
      logger.debug('No access to defined Github org, setting user privilege');
    }
  } else {
    userProfile.userRole = 'Admin';
    logger.debug('No Github organisation defined, setting admin rights');
  }
  return done(null, userProfile);
}

function githubPassportStrategy(options) {
  return new GitHubStrategy(
    {
      clientID: options.clientId,
      clientSecret: options.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => approvedMember(
      options, accessToken, profile, done,
    ),
  );
}

function getScope() {
  return ['read:org'];
}

module.exports = {
  strategy: githubPassportStrategy,
  scope: getScope(),
};
