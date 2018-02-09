const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');
const logger = require('./logger/logger').get();

async function approvedMember(options, accessToken, profile, done) {
  profile.authMethod = 'github';  
  //If no organisation is defined as admin, all will be granted admin rights
  if(!options.githubOrgIsAdmin) {
    setAdminRole(profile);  
    return done(null, profile);    
  }

  var adminOrganisations = options.githubOrgIsAdmin.split(";");
  const req = adminOrganisations.map(org => {
    return httpLibrary.get(`https://api.github.com/orgs/${org}/members/${profile.username}?access_token=${accessToken}`).catch(result => Promise.resolve(result));
  });

  const results = await Promise.all(req);
  
  const isMember = results.some(result => result.noContent);
  if (isMember) {
    setAdminRole(profile);
  }
  else {
    setUserRole(profile);
  }
  return done(null, profile);
}

function setAdminRole(profile) {
  profile.userRole = 'Admin';
}

function setUserRole(profile) {
  profile.userRole = 'User';
}

function githubPassportStrategy(options) {
  return new GitHubStrategy(
    {
      clientID: options.clientId,
      clientSecret: options.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => approvedMember(options, accessToken, profile, done));
}

function getScope() {
  return ['read:org'];
}

module.exports = {
  strategy: githubPassportStrategy,
  scope: getScope(),
};
