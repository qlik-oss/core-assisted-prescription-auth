const nock = require('nock');
const githubPassportStrategy = require('../../src/github-passport-strategy');

const accessToken = 'accessToken';
const profile = { username: 'GithubUser' };
const userProfile = { username: 'GithubUser', authMethod: 'github', userRole: 'User' };
const adminProfile = { username: 'GithubUser', authMethod: 'github', userRole: 'Admin' };

const strategySingleOrg = githubPassportStrategy.strategy({ clientId: 'clientId', clientSecret: 'clientSecret', port: 3000, githubOrgIsAdmin: 'qlik-ea' });
const strategyMultipleOrg = githubPassportStrategy.strategy({ clientId: 'clientId', clientSecret: 'clientSecret', port: 3000, githubOrgIsAdmin: 'qlik-ea;qlik-trial' });
const strategyNonOrg = githubPassportStrategy.strategy({ clientId: 'clientId', clientSecret: 'clientSecret', port: 3000, githubOrgIsAdmin: '' });

describe('github-passport-strategy', () => {
  it('should verify inputs - remove if this test causes issues (only for development)', () => {
    expect(strategySingleOrg._oauth2._clientId).to.eql('clientId'); // eslint-disable-line
    expect(strategySingleOrg._oauth2._clientSecret).to.eql('clientSecret'); // eslint-disable-line
  });

  it('should return admin profile if 204 is returned', (done) => {
    nock('https://api.github.com')
      .get(`/orgs/qlik-ea/members/GithubUser?access_token=${accessToken}`)
      .reply(204);

      strategySingleOrg._verify(accessToken, undefined, profile, (a, b) => {// eslint-disable-line
      expect(b).to.eql(adminProfile);
      done();
    });
  });

  it('should return user profile if 401 is returned', (done) => {
    nock('https://api.github.com')
      .get(`/orgs/qlik-ea/members/GithubUser?access_token=${accessToken}`)
      .reply(401);

      strategySingleOrg._verify(accessToken, undefined, profile, (a, b) => { // eslint-disable-line
      expect(b).to.eql(userProfile);
      done();
    });
  });

  it('should return admin profile if 204 is returned with multiple orgs', (done) => {
    nock('https://api.github.com')
      .get(`/orgs/qlik-ea/members/GithubUser?access_token=${accessToken}`)
      .reply(204);

      strategyMultipleOrg._verify(accessToken, undefined, profile, (a, b) => {// eslint-disable-line
      expect(b).to.eql(adminProfile);
      done();
    });
  });

  it('should return admin profile if Github org is not defined', (done) => {
    strategyNonOrg._verify(accessToken, undefined, profile, (a, b) => { // eslint-disable-line
      expect(b).to.eql(adminProfile);
      done();
    });
  });

  it('should return scope read:org', () => {
    expect(githubPassportStrategy.scope).to.eql(['read:org']);
  });
});
