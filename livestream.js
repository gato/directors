"use strict";

var https = require('https');
var httpStatus = require('http-status-codes');

// gets a livestream account from its id
var getAccount = function(id, callback) {
  	// https://api.new.livestream.com/accounts/6488818
	https.get('https://api.new.livestream.com/accounts/'+id, function(res) {
		if (res.statusCode == httpStatus.NOT_FOUND) {
			return callback(null,null);
		}
		if (res.statusCode != httpStatus.OK) {
	  		return callback("error retriving account from livestream status:"+res.statusCode, null);
	  	}
		res.setEncoding('utf-8');
	    var response = '';

	    res.on('data', function(data) {
	    	response += data;
	    });

	    res.on('end', function() {
	    	var account = null
	    	var err = null
	    	try {
	    		account = JSON.parse(response);
	    	}
	    	catch (e) {
	    		err = "Can't parse livestream response error:" + e;
	    	}
	    	return callback(err , account);
	    });
	}).on('error', function(e) {
	  	return callback("error retriving account from livestream error:" + e, null);
	});
}

exports.getAccount = getAccount;

