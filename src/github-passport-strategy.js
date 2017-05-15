const GitHubStrategy = require('passport-github2').Strategy;
const httpLibrary = require('superagent');

function approvedMember(accessToken, profile, done) {
  const url = `https://api.github.com/orgs/qlik-ea/members/${profile.username}?access_token=${accessToken}`;

  httpLibrary.get(url).end((err, res) => {
    if (err || !res.noContent) {
      return done(null, false);
    }

    return done(null, profile);
  });
}

function githubPassportStrategy(options) {
  return new GitHubStrategy(
    {
      clientID: options.clientId,
      clientSecret: options.clientSecret,
      callbackURL: `http://localhost:${options.port}/login/github/callback`
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
