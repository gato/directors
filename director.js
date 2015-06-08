"use strict";

var redis = require('redis');
var uuid = require('uuid')
// TODO: read configuration for redis (now localhost / default port)
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

var get = function(id, callback) {
	var director = null;
	client.get(getDirectorKey(id), function(err, reply) {
		if (err || reply == null) {
			return callback(err,reply);
		}
		try {
			director = JSON.parse(reply);
			client.smembers(getMoviesKey(id), function(err, reply) {
				console.log(reply);
				if (err) {
					return callback("Error getting movies:"+err);
				}
				director.movies = reply;
				return callback(null, director)
			});
		}
		catch (e) {
			return callback("Error parsing director data:"+e);
		}
	});
};

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

var update = function(director, callback) {
	get(director.id, function(err, old) {
		if (err || old == null) {
			return callback("Error updating director:"+err);
		}
		if (director.livestream_id != old.livestream_id ||
			director.full_name != old.full_name ||
			director.dob != old.dob) {
			return callback("Error trying to update reserved fields", director, old)
		}
		saveOnRedis(director, function(err) {
			return callback(err, director, old);
   		});
	});
}

exports.get = get;
exports.findByLsId = findByLsId;
exports.create = create;
exports.update = update;