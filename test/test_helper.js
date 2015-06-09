"use strict";

var redis = require('redis');
var client = redis.createClient();

// TODO: handle redis connection errors 
client.on('error', function (err) {
    console.log('Error on redis connect:' + err);
});

var clearDB = function(callback) {
	client.flushdb( function (err, didSucceed) {
		return callback(err);
    });
};

exports.clearDB = clearDB;
