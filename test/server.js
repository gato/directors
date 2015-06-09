'use strict';


var request = require('supertest');
var should = require('should');
var httpStatus = require('http-status-codes');

process.env.NODE_ENV = 'test';
var app = require('../server.js').app;

beforeEach(function (done) {
	function clearDB() {
		return done();
	}
	clearDB();
});

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
});

