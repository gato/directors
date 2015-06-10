"use strict";

var request = require('supertest');
var should = require('should');
var httpStatus = require('http-status-codes');
var th = require('./test_helper.js')

process.env.NODE_ENV = 'test';
var app = require('../server.js').app;

beforeEach(function (done) {
	th.clearDB(function(err) {
		return done();
	});
});

var createTestDirector = function(app, callback) {
	request(app)
    .post('/directors/')
	.set('Content-Type','application/json')
	.send(JSON.stringify({ livestream_id: 6488818 }))
    .expect(httpStatus.CREATED)
    .end(function(err, res) {
		should.not.exist(err);
    	callback(res);
    });
};

var director = {id : 'invalid' , 
	livestream_id: 6488818,
	full_name: 'Martin Scorsese',
	dob: '1942-11-17T00:00:00.000Z',
	favorite_camera: '',
	favorite_movies: [] };

describe('POST /directors', function() {
	it('should return "Bad Request" if post has no payload', function (done) {
   		request(app)
    	.post('/directors/')
    	.expect(httpStatus.BAD_REQUEST)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
	it('should return "Bad Request" if payload is not json', function (done) {
   		request(app)
    	.post('/directors/')
	    .send("Hello World")
    	.expect(httpStatus.BAD_REQUEST)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
	it('should return "Bad Request" if payload does not contain a livestream_id', function (done) {
   		request(app)
    	.post('/directors/')
	    .set('Content-Type','application/json')
	    .send(JSON.stringify({ hello: 'World'}))
    	.expect(httpStatus.BAD_REQUEST)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
   	it('should return "Bad Request" if livestream_id is not a valid one', function (done) {
   		this.timeout(10000);
   		request(app)
    	.post('/directors/')
	    .set('Content-Type','application/json')
	    .send(JSON.stringify({ livestream_id: "invalid"}))
    	.expect(httpStatus.BAD_REQUEST)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
   	it('should create a director if livestream_id is valid', function (done) {
   		this.timeout(10000);
   		request(app)
    	.post('/directors/')
	    .set('Content-Type','application/json')
	    .send(JSON.stringify({ livestream_id: 6488818 }))
    	.expect(httpStatus.CREATED)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });        
   	it('should return "Conflict (409)" if livestream_id is alredy used by other director', function (done) {
   		this.timeout(15000);
   		createTestDirector(app,function (res) {
	   		request(app)
	    	.post('/directors/')
		    .set('Content-Type','application/json')
		    .send(JSON.stringify({ livestream_id: 6488818 }))
	    	.expect(httpStatus.CONFLICT)
 			.end(function (err, res) {
    			should.not.exist(err);
    			done();
   			}); 
 		});
    });      
});

describe('GET /directors/:id', function () {
	it('should return "Not Found" given a non existing id', function (done) {
   		request(app)
    	.get('/directors/invalid')
    	.expect(httpStatus.NOT_FOUND)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
   	it('should return a director when uuid is ok', function (done) {
   		this.timeout(15000);   		
   		createTestDirector(app,function (res) {
    		var uuid=res.body.id
	   		request(app)
	    	.get('/directors/'+uuid)
	    	.expect(httpStatus.OK)
 			.end(function (err, res) {
    			should.not.exist(err);
    			res.body.should.have.property('id');
    			res.body.id.should.equal(uuid);    			
    			res.body.should.have.property('livestream_id');
    			res.body.livestream_id.should.equal(6488818);    			
    			res.body.should.have.property('full_name');
    			res.body.full_name.should.equal('Martin Scorsese');    			
    			done();
   			});
   		});
    });      
});

describe('PUT /directors', function() {
   	it('should return "Bad Request" if no payload is present', function (done) {
   		this.timeout(15000);
   		createTestDirector(app,function (res) {
	   		request(app)
	    	.put('/directors/'+res.id)
	    	.expect(httpStatus.BAD_REQUEST)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		done();
	   		});
 		});
    });      
	it('should return "Bad Request" if payload is not json', function (done) {
   		this.timeout(15000);
   		createTestDirector(app,function (res) {
	   		request(app)
	    	.put('/directors/'+res.id)
	    	.send("Hello World")
	    	.expect(httpStatus.BAD_REQUEST)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		done();
	   		});
 		});
    });
	it('should return "Bad Request" if uuid is not found', function (done) {
   		this.timeout(15000);
   		request(app)
    	.put('/directors/invalid')
	    .set('Content-Type','application/json')
	    .send(JSON.stringify(director))
    	.expect(httpStatus.BAD_REQUEST)
    	.end(function (err, res) {
    		should.not.exist(err);
    		done();
   		});
    });
	it('should return "Forbidden" if trying to change livestream_id', function (done) {
   		this.timeout(15000);
   		var dir1 = JSON.parse(JSON.stringify(director)); // clone director
   		createTestDirector(app, function (res) {
   			var uuid=res.body.id
	   		dir1.id = uuid;
	   		dir1.livestream_id = 1;
	   		request(app)
	    	.put('/directors/'+uuid)
	    	.set('Content-Type','application/json')	    	
	    	.send(JSON.stringify(dir1))
	    	.expect(httpStatus.FORBIDDEN)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		done();
	   		});
 		});
    });
	it('should return "Forbidden" if trying to change full_name', function (done) {
   		this.timeout(15000);
   		var dir1 = JSON.parse(JSON.stringify(director)); // clone director
   		createTestDirector(app, function (res) {
   			var uuid=res.body.id
	   		dir1.id = uuid;
	   		dir1.full_name = 'other name';
	   		request(app)
	    	.put('/directors/'+uuid)
	    	.set('Content-Type','application/json')	    	
	    	.send(JSON.stringify(dir1))
	    	.expect(httpStatus.FORBIDDEN)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		done();
	   		});
 		});
    });
	it('should return "Forbidden" if trying to change dob', function (done) {
   		this.timeout(15000);
   		var dir1 = JSON.parse(JSON.stringify(director)); // clone director
   		createTestDirector(app, function (res) {
   			var uuid=res.body.id
	   		dir1.id = uuid;
	   		dir1.dob = '2000-11-17T00:00:00.000Z';
	   		request(app)
	    	.put('/directors/'+uuid)
	    	.set('Content-Type','application/json')	    	
	    	.send(JSON.stringify(dir1))
	    	.expect(httpStatus.FORBIDDEN)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		done();
	   		});
 		});
    });
	it('should update camera and movies', function (done) {
   		this.timeout(15000);
   		var dir1 = JSON.parse(JSON.stringify(director)); // clone director
   		createTestDirector(app, function (res) {
   			var uuid=res.body.id
	   		dir1.id = uuid;
	   		dir1.favorite_camera = 'Canon 7D';
	   		dir1.favorite_movies = ['Plan 9 from outer space', 'Megashark vs giant octopus', 'tokio gore police' ];
	   		request(app)
	    	.put('/directors/'+uuid)
	    	.set('Content-Type','application/json')	    	
	    	.send(JSON.stringify(dir1))
	    	.expect(httpStatus.OK)
	    	.end(function (err, res) {
	    		should.not.exist(err);
	    		// check put response
	    		res.body.should.have.property('favorite_camera');
    			res.body.favorite_camera.should.equal('Canon 7D');    			
	    		res.body.should.have.property('favorite_movies').with.lengthOf(3);
		   		request(app)
		    	.get('/directors/'+uuid)
		    	.expect(httpStatus.OK)
	 			.end(function (err, res) {
		    		should.not.exist(err);
		    		// check that data was actually stored
		    		res.body.should.have.property('favorite_camera');
	    			res.body.favorite_camera.should.equal('Canon 7D');    			
		    		res.body.should.have.property('favorite_movies').with.lengthOf(3);
	    			done();
	   			});
	   		});
 		});
    });
});


