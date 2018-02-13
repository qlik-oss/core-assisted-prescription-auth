const jwt = require('jsonwebtoken');

const header = {
  algorithm: 'HS256',
};

function getJWT(profile, jwtSecret) {
  const payload = {
    sub: profile.username,
    userRole: profile.userRole,
  };
  return jwt.sign(payload, jwtSecret, header);
}

module.exports = getJWT;
