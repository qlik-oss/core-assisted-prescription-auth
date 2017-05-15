class MockStrategy {
  constructor(options, verify) {
    this.name = options.name;
    this.callbackURL = options.callbackURL;
    this.verify = verify;
  }

  authenticate(req) {
    if (!req.query.mockedCallback) {
      this.redirect(`${this.callbackURL}?mockedCallback=true`);
    } else {
      const verified = function verified(e, d) {
        if (e) {
          return this.fail(e);
        }

        if (d) {
          return this.success(d); // Added to strategy by Passport (lib/middleware/authenticate.js)
        }
        return this.fail(d); // Added to strategy by Passport (lib/middleware/authenticate.js)
      }.bind(this);

      const profile = this._profile || {}; // eslint-disable-line
      const tokenResponse = this._token_response || {}; // eslint-disable-line

      this.verify(tokenResponse.access_token, tokenResponse.refresh_token, profile, verified);
    }
  }
}

module.exports = MockStrategy;
