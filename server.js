"use strict";

var express    = require('express');        
var bodyParser = require('body-parser');
var httpStatus = require('http-status-codes');
var director   = require('./director.js');
var livestream = require('./livestream.js')
var app        = express();                 
var port 	   = 8080; 

exports.app = app;

// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

var router = express.Router();

if (process.env.NODE_ENV != 'test') {
	// logger only when not testing to avoid cluttering the tests report
	router.use(function(req, res, next) {
		var now = new Date().toString()
	    console.log('' + now+ ':' + req.method + ' ' + req.url);
	    next(); 
	});
}
// routes
router.route('/directors')
    .post(function(req, res) {
        // create a director
        // check json payload
        if (req.header('Content-Type') != 'application/json') {
        	res.status(httpStatus.BAD_REQUEST);
			res.send('Content-Type should be "application/json"');
			return;
        }
        // get id
        var lsid = req.body.livestream_id;
        if (!lsid) {
        	res.status(httpStatus.BAD_REQUEST);
			res.send('Invalid payload livestream_id not found');
			return;
        }
        // check in redis for existence 
        director.findByLsId(lsid, function(err, uuid) {
        	if (err) {
        		// error with redis => server error 500
                res.status(httpStatus.INTERNAL_SERVER_ERROR);
				res.send('Something happend with redis:'+err);
				return;		
        	}
        	if (uuid) {
        		// found => 409
                res.status(httpStatus.CONFLICT);
				res.send('Director already imported');
				return;		
        	}
	        // get data from livestream
	        livestream.getAccount(lsid, function(err, account) {
	        	if (err) {
	        		// error communicationg with livestream => error 500
	                res.status(httpStatus.INTERNAL_SERVER_ERROR);
					res.send('Something happend with livestream:'+err);	  
					return;       		
	        	}
	        	if (!account) {
	        		// account !found => 400 
	        		res.status(httpStatus.BAD_REQUEST);
					res.send('account not found on livestream');
					return;
	        	}
	        	director.create(account, function(err, dir){
	        		if (err) {
		        		// error saving director => server error 500
		                res.status(httpStatus.INTERNAL_SERVER_ERROR);
						res.send('Something happend with redis:'+err);
						return;			        			
	        		}
			        res.status(httpStatus.CREATED)
			        res.json(dir);   	        		
	        	});
	        });
        });
    })
    .get(function(req, res) {
        console.log('get');  
        res.json({ message: 'all directors' });        
    });

router.route('/directors/:id')

    .get(function(req, res) {        
        director.get(req.params.id, function(err, dir) {
        	if (err) {
				res.status(httpStatus.INTERNAL_SERVER_ERROR);
				res.send('Internal error recovering director:'+err);	  
				return; 	
        	}
        	if (!dir) {
        		res.status(httpStatus.NOT_FOUND);
				res.send('Director not found');
				return;
        	}
        	res.status(httpStatus.OK);
			res.json(dir);  
        });
    })
    .put(function(req, res) { 
        if (req.header('Content-Type') != 'application/json') {
        	res.status(httpStatus.BAD_REQUEST);
			res.send('Content-Type should be "application/json"');
			return;
        }
        // check existence
        director.get(req.params.id, function(err, old) {
        	if (err) {
				res.status(httpStatus.INTERNAL_SERVER_ERROR);
				res.send('Internal error recovering director:'+err);	  
				return; 	
        	}
        	if (!old) {
        		// could be 404 too, but bad request seems better.
        		res.status(httpStatus.BAD_REQUEST);
				res.send('Director not found');
				return;
        	}
        	var dir=req.body;
        	dir.id = req.params.id;
        	// check if any of the forbidden fields where modified
        	if (dir.livestream_id != old.livestream_id ||
				dir.full_name != old.full_name ||
				dir.dob != old.dob) {
        		res.status(httpStatus.FORBIDDEN);
				res.send("Reserved field can't be updated");
				return;
			}
			// update redis 
			director.update(dir, function(err){
	        	if (err) {
					res.status(httpStatus.INTERNAL_SERVER_ERROR);
					res.send('Internal error storing director:'+err);	  
					return; 	
	        	}
	        	res.status(httpStatus.OK);
				res.json(dir);  
			});
        });
    });

app.use('/', router);

app.listen(port);
console.log('Server started on port:' + port);

