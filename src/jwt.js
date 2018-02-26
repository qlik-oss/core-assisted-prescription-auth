const jwt = require('jsonwebtoken');
const uuidV4 = require('uuid/v4');

const header = {
  algorithm: 'HS256',
};

function getJWT(profile, jwtSecret) {
  const payload = {
    sub: uuidV4(),
    userRole: profile.userRole,
  };
  return jwt.sign(payload, jwtSecret, header);
}

module.exports = getJWT;
