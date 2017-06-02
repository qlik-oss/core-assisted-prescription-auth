const ChaiHttp = require('chai-http');

const MockStrategy = require('./mock-strategy');
const AuthenticationService = require('../../src/authentication-service');
const redis = require('redis-mock');

const sinon = require('sinon');

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
  }
);

const redisClient = redis.createClient();

sinon.stub(require('redis'), 'createClient').returns(redisClient);

const autenticationService = AuthenticationService.initialize({
  strategy: mockStrategy,
  port: 3000,
  successRedirectUrl: '/login/github/succeeded',
  failureRedirectUrl: '/login/github/failed',
  sessionCookieName: 'sessionCookieName'
});

describe('endpoints', () => {
  let sandbox;

  beforeEach(() => {
    loginSuccessfull = true;
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('github', () => {
    it('should respond to /login/github and redirect to succeeded', (done) => {
      chai.request(autenticationService).get('/login/github')
        .end((err, res) => {
          expect(res).to.redirectTo('http://localhost:3000/login/github/succeeded');
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should respond to /login/github and redirect to failed if login is unsuccessfull', (done) => {
      loginSuccessfull = false;

      chai.request(autenticationService).get('/login/github')
        .end((err, res) => {
          expect(res).to.redirectTo('http://localhost:3000/login/github/failed');
          expect(res.status).to.eql(200);
          done();
        });
    });

    it('should return 500 if session cannot be stored', (done) => {
      const errorMsg = 'Error in redis';

      sandbox.stub(redisClient, 'set', (sessionId, jwt, callbackFn) => {
        callbackFn(errorMsg, 0);
      });

      chai.request(autenticationService).get('/login/github')
        .end((err, res) => {
          expect(res.status).to.eql(500);
          expect(res.text).to.eql(errorMsg);
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

  describe('logout', () => {
    it('should return 200', (done) => {
      sandbox.stub(redisClient, 'del', (sessionId, callbackFn) => {
        callbackFn(undefined, 1);
      });

      chai.request(autenticationService).get('/logout')
        .end((err, res) => {
          expect(res.status).to.eql(200);
          expect(res.text).to.eql('Logged out');
          done();
        });
    });

    it('should return 200 even if session cannot be found in the database (ie. logout endpoint triggered multiple times)', (done) => {
      sandbox.stub(redisClient, 'del', (sessionId, callbackFn) => {
        callbackFn(undefined, 0);
      });

      chai.request(autenticationService).get('/logout')
        .end((err, res) => {
          expect(res.status).to.eql(200);
          expect(res.text).to.eql('Logged out');
          done();
        });
    });

    it('should return 500 if an error is throw from database', (done) => {
      const errorMsg = 'Error in redis';

      sandbox.stub(redisClient, 'del', (sessionId, callbackFn) => {
        callbackFn(errorMsg, 0);
      });

      chai.request(autenticationService).get('/logout')
        .end((err, res) => {
          expect(res.status).to.eql(500);
          done();
        });
    });
  });
});
