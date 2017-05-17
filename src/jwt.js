const jwt = require('jsonwebtoken');

const header = {
  algorithm: 'HS256'
};

function getJWT(profile) {
  const payload = {
    sub: profile.name
  };

  const secret = 'hemligt';

  return jwt.sign(payload, secret, header);
}

module.exports = getJWT;
