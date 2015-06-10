"use strict";

var redis = require('redis');
var uuid = require('uuid')
// TODO: read configuration for redis (now localhost / default port)
// and the same instance for test and "production"
var client = redis.createClient();

// TODO: handle redis connection errors 
client.on('error', function (err) {
    console.log('Error on redis connect:' + err);
});

var getDirectorKey = function(id) {
	return 'director:' + id;
}

var getLivestreamKey = function(lsid) {
	return 'ls:' + lsid;
} 
var getMoviesKey = function(id) {
	return 'movies:' + id;
}

// method for retrieving a director from redis
var get = function(id, callback) {
	var director = null;
	client.get(getDirectorKey(id), function(err, reply) {
		if (err || reply == null) {
			return callback(err,reply);
		}
		try {
			director = JSON.parse(reply);
			director.id = id; // set id as is not stored in redis value
			client.smembers(getMoviesKey(id), function(err, reply) {
				if (err) {
					return callback("Error getting movies:"+err);
				}
				director.favorite_movies = reply;
				return callback(null, director)
			});
		}
		catch (e) {
			return callback("Error parsing director data:"+e);
		}
	});
};

// find director id (uuid) by Livestream_id
var findByLsId = function(lsid, callback) {
	client.get(getLivestreamKey(lsid), function (err, reply) {
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

// store and indexes director on redis
// creates 3 entries for a director
// director:uuid => director_data
// ls:livestream_id => director.uuid
// movies:director.uuid => set of movies (strings for now)
var saveOnRedis = function (director, callback) {
	var storable = {livestream_id: director.livestream_id,
		   full_name: director.full_name,
		   dob: director.dob,
		   favorite_camera: director.favorite_camera};
    // index main data
	client.set(getDirectorKey(director.id), JSON.stringify(storable), function(err, reply) {
		if (err) {
			return callback(err);
		}
		// index livestream ids for quick duplicate finding
		client.set(getLivestreamKey(director.livestream_id), director.id, function(err, reply) {
			if (err) {
				return callback(err);
			}
			// remove previous movies
			client.del(getMoviesKey(director.id), function(err, reply) {
				if (err) {
					return callback(err);
				}

				if (director.favorite_movies.length == 0) {
					return callback(null);
				}
				// index movies
				client.sadd(getMoviesKey(director.id), director.favorite_movies, function(err, reply) {
					return callback(err);
				});		
			});
		});
	});
};

// create new director from data
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

// update director 
var update = function(director, callback) {
	saveOnRedis(director, function(err) {
		return callback(err);
	});
}

// return all directors
var getAll = function(callback) {
	// get all keys matching director:*
	// uses getDirectorKey because function do not check for id validity to
	// construct it
	client.keys(getDirectorKey('*'), function (err, keys) {
		if (err) {
			return callback(err,null);
		}
		var directors = [];
		// use iterate() pattern to avoid making too many gets to redis concurrently.
		function iterate() {
			var key = keys.shift();
			if (key == null) {
				return callback (null, directors);
			}
			// getDirectorKey('') will return the director key prefix
			// that will be removed from the redis returned key to obtain
			// only the id which is what get uses 
			var id = key.substring(getDirectorKey('').length);
			get(id, function(err, director) {
				if (err) {
					return callback(err, null);
				}
				directors = directors.concat(director);
				return iterate();
			});
		}
		iterate();
	});
}

exports.get = get;
exports.findByLsId = findByLsId;
exports.create = create;
exports.update = update;
exports.getAll = getAll;