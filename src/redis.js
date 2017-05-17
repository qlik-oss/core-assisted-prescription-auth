var redis = require('redis');
var redisClient = redis.createClient({host : 'localhost', port : 6379});

redisClient.on('ready',function() {
  console.log("Redis is ready");

  redisClient.set("language","nodejs")

  redisClient.get("language",function(err,reply) {
    console.log(err);
    console.log(reply);
  });
});

redisClient.on('error',function() {
  console.log("Error in Redis");
});
