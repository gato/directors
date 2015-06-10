#Directors

Directors is a demo project for working with Livestream API and create a service around it.
It creates *directors* based on livestream's accounts, save them on redis and publish a REST API
written in NodeJS.

## Dependencies:
 - node
 - redis
 - express
 - body-parser
 - http-status-codes
 - uuid
 - MD5

 and for test
 - supertest
 - mocha
 - should

for convenience file package.json was created allowing to run 
``` 
npm install 
```
to install all dependencies

## Running server
to run the server a redis must be running on the same machine & configured on default port
for starting server run
```
node server.js
```

## Tests
tests are written using mocha, supertest and should.
tests also need a running redis running on default port on the same machine. note that
database is shared with server and that test will clean that db before each test.
to run test 
```
npm test
```

## Known issues & todos:
- server & test depend on redis been running on localhost and with default port
- redis operations and livestream api use are tested through testing API that use them, but they 
  shoud be tested directly
- redis should be externaly configurable 
- redis used on "production" & on test should be different (at least different databases)
- actually test can take some time (mostly waiting a response from livestream API) test should mock livestream api to make them fast and also some error conditions could be tested.
- server.js should be splitted in files main and methods (based on HTTP methods)
- devel dependencies are declared in main package and not in devDependencies 
- movies are a string, but should be an entity with id, name & other useful data. in redis movies:uuid key instead of a set of string should be a set of uuids pointing to these movies. 
- with movies stored in it's own key, director.get will have a 1+n issue (retrieving the movies). This issue shouldn't be a real problem when getting a single entity but will be a real one when doing director.getAll(). 
- to reduce the impact on getAll() a possible solution could be: to not retrieve movies (only retrieve keys or nothing) when doing getall() and change the api response to http status 206 (partial content), and retrive them when get for a specific director is called.
