var fs = require('fs'),
    path = require('path'),
    chai = require('chai'),
    request = require('request'),
    expect = chai.expect;


var endpoint = 'http://localhost:3000/upload/',
    filename = 'bear.jpg',
    uploadedFolder = 'upload_';


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
      uniqueFilename: 'true',
      uploadedFile: fs.createReadStream(path.join(__dirname, filename))
    };
    request.post({url: endpoint + '?subdir=images', formData: formData}, function(err, httpResponse, body) {
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
        expect(body.message).to.be.equal('File ' + filename + ' successfuly deleted');
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
});
