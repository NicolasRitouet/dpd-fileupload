'use strict';
var fs = require('fs'),
    path = require('path'),
    chai = require('chai'),
    request = require('request'),
    expect = chai.expect;


var endpoint = 'http://localhost:3000/upload/',
    imageFilename = 'bear.jpg',
    txtFilename = 'example.txt',
    uploadedFolder = '_upload';


describe('Integration tests for dpd-fileupload', function() {
  var server;

  before(function() {
    server = require('./server');

  });

  it('get an empty list of images', function(done) {
    setTimeout(function() { // Waiting for server to be ready
      request(endpoint, function (err, response, body) {
        if (err) throw err;
        body = JSON.parse(body);
        expect(response.statusCode).to.be.equal(200);
        expect(body).to.be.empty;
        done();
      });
    }, 500);
  });


  it('upload an image', function(done) {
    var formData = {
      uploadedFile: fs.createReadStream(path.join(__dirname, imageFilename))
    };
    request.post({url: endpoint.slice(0,-1) + '?' + JSON.stringify({subdir: 'images'}), formData: formData}, function(err, httpResponse, body) {
      if (err) throw err;
      body = JSON.parse(body)[0];
      expect(body).to.not.be.empty;
      expect(body.id).to.be.defined;
      done();
    });
  });

  it('get the uploaded image', function(done) {
    request.get(endpoint, function(err, response, body) {
      if (err) throw err;
      body = JSON.parse(body);
      expect(body).to.be.length.above(0);
      expect(body[0].id).to.be.defined;
      request.get('http://localhost:3000/' + path.join(uploadedFolder, body[0].subdir, body[0].filename), function(err, response, body) {
        if (err) throw err;
        expect(body).to.be.defined;
        expect(response.statusCode).to.be.equal(200);
        done();
      });
    });
  });


  it('delete the uploaded image', function(done) {
    request.get(endpoint, function(err, response, body) {
      if (err) throw err;
      body = JSON.parse(body);
      expect(body).to.be.length.above(0);
      expect(body[0].id).to.be.defined;

      request.del(endpoint + body[0].id, {}, function(err, response, body) {
        if (err) throw err;
        body = JSON.parse(body);
        expect(response.statusCode).to.be.equal(200);
        expect(body.message).to.be.equal('File ' + imageFilename + ' successfuly deleted');
        done();
      });
    });
  });

  it('get an empty list of images', function(done) {
      request(endpoint, function (err, response, body) {
        if (err) throw err;
        body = JSON.parse(body);
        expect(response.statusCode).to.be.equal(200);
        expect(body).to.be.empty;
        done();
      });
  });




  it('upload many files', function(done) {
    var formData = {
      uniqueFilename: 'true',
      uploadedFile: [
        fs.createReadStream(path.join(__dirname, imageFilename)),
        fs.createReadStream(path.join(__dirname, txtFilename))
      ]
    };
    request.post({url: endpoint + '?subdir=images', formData: formData}, function(err, httpResponse, body) {
      if (err) throw err;
      expect(body).to.contain(imageFilename);
      expect(body).to.contain(txtFilename);
      expect(body).to.not.contain('E11000');
      body = JSON.parse(body);
      expect(body).to.be.length.above(1);
      expect(body[0].id).to.be.defined;
      expect(body[1].id).to.be.defined;
      done();
    });
  });
  
  it('get one file info', function(done) {
    request.get(endpoint, function(err, response, body) {
      if (err) throw err;
        body = JSON.parse(body);
      expect(response.statusCode).to.be.equal(200);
      expect(body).to.be.length(2);
      expect(body[0].id).to.be.defined;
    
      request.get(endpoint + body[0].id, function(err, response, body) {
        body = JSON.parse(body);
        expect(response.statusCode).to.be.equal(200);
        expect(body).to.be.instanceof(Object);
        expect(body.id).to.be.defined;
        expect(body.filename).to.be.defined;
        expect([imageFilename, txtFilename]).to.include(body.originalFilename);
        done();
      });
    });
  });

  it('delete the uploaded files', function(done) {
    request.get(endpoint, function(err, response, body) {
      if (err) throw err;
      body = JSON.parse(body);
      expect(body).to.be.length.above(0);
      expect(body[0].id).to.be.defined;

      request.del(endpoint + body[0].id, {}, function(err, responseDelete1, bodyDelete1) {
        if (err) throw err;
        bodyDelete1 = JSON.parse(bodyDelete1);
        expect(responseDelete1.statusCode).to.be.equal(200);
        expect(bodyDelete1.message).to.contain('successfuly deleted');
        request.del(endpoint + body[1].id, {}, function(err, responseDelete2, bodyDelete2) {
          if (err) throw err;
          bodyDelete2 = JSON.parse(bodyDelete2);
          expect(responseDelete2.statusCode).to.be.equal(200);
          expect(bodyDelete2.message).to.contain('successfuly deleted');
          done();
        });
      });
    });
  });
});
