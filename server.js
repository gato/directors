"use strict";

var express    = require('express');        
var bodyParser = require('body-parser');
var HttpStatus = require('http-status-codes');
var director   = require('./director.js');
var livestream = require('./livestream.js')
var app        = express();                 
var port 	   = 8080; 


// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

var router = express.Router();

// logger
router.use(function(req, res, next) {
	var now = new Date().toString()
    console.log('' + now+ ':' + req.method + ' ' + req.url);
    next(); 
});

// routes
router.route('/directors')
    .post(function(req, res) {
        // create a director
        // check json payload
        if (req.header('Content-Type') != 'application/json') {
        	res.status(HttpStatus.BAD_REQUEST);
			res.send('Content-Type should be "application/json"');
			return;
        }
        // get id
        var lsid = req.body.livestream_id;
        if (!lsid) {
        	res.status(HttpStatus.BAD_REQUEST);
			res.send('Invalid payload livestream_id not found');
			return;
        }
        // check in redis for existance 
        director.findByLsId(lsid, function(err, uuid) {
        	if (err) {
        		// error with redis => server error 500
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
				res.send('Something happend with redis:'+err);
				return;		
        	}
        	if (uuid) {
        		// found => 409
                res.status(HttpStatus.CONFLICT);
				res.send('Director already imported');
				return;		
        	}
	        // get data from livestream
	        livestream.getAccount(lsid, function(err, account) {
	        	if (err) {
	        		// error communicationg with livestream => error 500
	                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
					res.send('Something happend with livestream:'+err);	  
					return;       		
	        	}
	        	if (!account) {
	        		// account !found => 400 
	        		res.status(HttpStatus.BAD_REQUEST);
					res.send('account not found on livestream');
					return;
	        	}
	        	director.create(account, function(err, dir){
	        		if (err) {
		        		// error saving director => server error 500
		                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
						res.send('Something happend with redis:'+err);
						return;			        			
	        		}
			        res.status(HttpStatus.CREATED)
			        res.json(JSON.stringify(dir));   	        		
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
        console.log('get director id:'+req.params.id);  
        res.json({ message: 'director' + req.params.id });      	
    })
    .put(function(req, res) { 
        console.log('put');  
        res.json({ message: 'director updated!' });        
    });

app.use('/', router);

app.listen(port);
console.log('Server started on port:' + port);