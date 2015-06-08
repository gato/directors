"use strict";

var redis = require('redis');
var uuid = require('uuid')
// TODO: read configuration for redis (now localhost / default port)
var client = redis.createClient();

// TODO: handle redis connection errors 
client.on('error', function (err) {
    console.log('Error on redis connect:' + err);
});

var get = function(id, callback) {
	return callback(null, null)
};

var findByLsId = function(lsid, callback) {
	client.get('ls:'+lsid, function (err, reply) {
        if(err) {
        	return callback('Error checking id on redis:'+err)
        } 
        else {
        	// if found returns director id else returns null 
        	// if redis is not found reply is null so no need to check just return
    		return callback(null, reply)	
        }
	});
};

var saveOnRedis = function (director, callback) {
	var storable = {livestream_id: director.livestream_id,
		   full_name: director.full_name,
		   dob: director.dob,
		   favorite_camera: director.favorite_camera};
    // index main data
	client.set('director:'+director.id, JSON.stringify(storable), function(err, reply) {
		if (err) {
			return callback(err);
		}
		// remove previous movies
		var moviesKey = 'movies:'+director.id
		client.del(moviesKey, function(err, reply) {
			if (err) {
				return callback(err);
			}
			// index livestream ids for quick duplicate finding
			client.set('ls:'+director.livestream_id, director.id, function(err, reply) {
				if (err) {
					return callback(err);
				}
				if (director.favorite_movies.length == 0) {
					return callback(null);
				}
				// index movies
				// var movies = [moviesKey].concat(director.favorite_movies)
				client.sadd(moviesKey, director.favorite_movies, function(err, reply) {
					return callback(err);
				});		
			});

		});
	});
};

var create = function(account, callback) {
	// create director entity
	var director = {id : uuid.v1(), 
		            livestream_id: account.id,
		            full_name: account.full_name,
		            dob: account.dob,
		            favorite_camera: '',
		            favorite_movies: [] };
    // index on redis
    saveOnRedis(director, function(err) {
		return callback(err,director);
    });
};

exports.get = get;
exports.findByLsId = findByLsId;
exports.create = create;