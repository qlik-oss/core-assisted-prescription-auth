const nock = require('nock');
const githubPassportStrategy = require('../../src/github-passport-strategy');

const accessToken = 'accessToken';
const profile = { username: 'GithubUser' };

const strategy = githubPassportStrategy.strategy({ clientId: 'clientId', clientSecret: 'clientSecret', port: 3000 });

describe('github-passport-strategy', () => {
  it('should verify inputs - remove if this test causes issues (only for development)', () => {
    expect(strategy._oauth2._clientId).to.eql('clientId'); // eslint-disable-line
    expect(strategy._oauth2._clientSecret).to.eql('clientSecret'); // eslint-disable-line
  });

  it('should return profile if 204 is returned', (done) => {
    nock('https://api.github.com')
      .get(`/orgs/qlik-ea/members/GithubUser?access_token=${accessToken}`)
      .reply(204);

    strategy._verify(accessToken, undefined, profile, (a, b) => {// eslint-disable-line
      expect(b).to.eql(profile);
      done();
    });
  });

  it('should return undefined profile if 204 is not returned', (done) => {
    nock('https://api.github.com')
      .get(`/orgs/qlik-ea/members/GithubUser?access_token=${accessToken}`)
      .reply(401);

    strategy._verify(accessToken, undefined, profile, (a, b) => { // eslint-disable-line
      expect(b).to.not.eql(profile);
      done();
    });
  });

  it('should return scope read:org', () => {
    expect(githubPassportStrategy.scope).to.eql(['read:org']);
  });
});
