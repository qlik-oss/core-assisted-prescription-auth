const ChaiHttp = require('chai-http');

const MockStrategy = require('./mock-strategy');
const AuthenticationService = require('../../src/authentication-service');

chai.use(ChaiHttp);

let loginSuccessfull;

const mockStrategy = new MockStrategy({
  name: 'github',
  clientID: 'clientID',
  clientSecret: 'clientSecret',
  callbackURL: 'http://localhost:3000/login/github/callback'
},
  (accessToken, refreshToken, profile, done) => {
    if (loginSuccessfull) {
      done(null, profile);
    } else {
      done(null, false);
    }
  });

const autenticationService = AuthenticationService.initialize({ strategy: mockStrategy, port: 3000 });

describe('endpoints', () => {
  afterEach(() => {
    loginSuccessfull = true;
  });

  describe('github', () => {
    it('should respond to /login/github and redirec to succeeded', (done) => {
      chai.request(autenticationService).get('/login/github')
        .end((err, res) => {
          expect(res).to.redirectTo("http://localhost:3000/login/github/succeeded"); // eslint-disable-line
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should respond to /login/github and redirect to failed if login is unsuccessfull', (done) => {
      loginSuccessfull = false;

      chai.request(autenticationService).get('/login/github')
        .end((err, res) => {
          expect(res).to.redirectTo("http://localhost:3000/login/github/failed"); // eslint-disable-line
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should respond to /login/github/callback', (done) => {
      chai.request(autenticationService).get('/login/github/callback')
        .end((err, res) => {
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should respond to /login/github/succeeded', (done) => {
      chai.request(autenticationService).get('/login/github/succeeded')
        .end((err, res) => {
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should respond to /login/github/failed', (done) => {
      chai.request(autenticationService).get('/login/github/failed')
        .end((err, res) => {
          expect(res.status).to.eql(200);
          done();
        });
    });
  });

  describe('unknown passport strategy', () => {
    it('should respond with 404 to /login/somethingnotspecified', (done) => {
      chai.request(autenticationService).get('/login/somethingnotspecified')
        .end((err, res) => {
          expect(res.status).to.eql(404);
          done();
        });
    });

    it('should respond with 404 to /login/somethingnotspecified', (done) => {
      chai.request(autenticationService).get('/login/somethingnotspecified/callback')
        .end((err, res) => {
          expect(res.status).to.eql(404);
          done();
        });
    });

    it('should respond to /login/somethingnotspecified/succeeded', (done) => {
      chai.request(autenticationService).get('/login/somethingnotspecified/succeeded')
        .end((err, res) => {
          expect(res.status).to.eql(404);
          done();
        });
    });

    it('should respond to /login/somethingnotspecified/failed', (done) => {
      chai.request(autenticationService).get('/login/somethingnotspecified/failed')
        .end((err, res) => {
          expect(res.status).to.eql(404);
          done();
        });
    });
  });

  it('should respond to /logout', (done) => {
    chai.request(autenticationService).get('/logout')
      .end((err, res) => {
        expect(res.status).to.eql(200);
        expect(res.text).to.eql('logout');
        done();
      });
  });
});
