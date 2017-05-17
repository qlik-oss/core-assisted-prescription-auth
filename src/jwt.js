var jwt = require('jsonwebtoken');

var header = {
  algorithm: 'HS256'
};

function getJWT(profile){
  var payload = {
    sub: profile.name
  };

  var secret = 'hemligt';

  return jwt.sign(payload, secret, header);
}

module.exports = getJWT;
