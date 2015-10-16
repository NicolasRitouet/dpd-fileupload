var fs = require('fs'),
    path = require('path'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    request = require('request'),
    expect = chai.expect;

    chai.use(chaiHttp);

if (!global.Promise) {
  var q = require('q');
  chai.request.addPromises(q.Promise);
}


var endpoint = 'http://localhost:3000/upload/',
    filename = 'bear.jpg';


describe('/upload', function() {
  var server;

  before(function() {
    server = require('./server');
  });

  it('get the list of images', function(done) {
    setTimeout(function() {

      request(endpoint, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          expect(response.statusCode).to.be.equal(200);
          console.log(body); // Show the HTML for the Google homepage.
          done();
        }
      });

    }, 500);
  });

  it('get a 404', function(done) {
    setTimeout(function() {

      chai.request(server)
        .get('/nothing-here')
        .then(function (res) {
           expect(res).to.have.status(404);
           done();
        })
        .catch(function (err) {
          console.log('Error', err);
           throw err;
        });

    }, 500);
  });


    it('upload an image', function(done) {
      setTimeout(function() {

        var formData = {
          subdir: 'images',
          uniqueFilename: 'true',
          uploadedFile: fs.createReadStream(path.join(__dirname, filename))
        };
        request.post({url: endpoint, formData: formData}, function(err, httpResponse, body) {
          if (err) throw err;
          body = JSON.parse(body)[0];
          expect(body).to.not.be.empty;
          request.get(endpoint, function(err, response, body) {
            if (err) throw err;
            body = JSON.parse(body);
            console.log("get", body);
            expect(body).to.be.length.above(0);
            expect(body[0].id).to.be.defined;
            done();
          });
        });
      }, 500);
    });



      it('delete an image', function(done) {
        setTimeout(function() {


          request.get(endpoint, function(err, response, body) {
            if (err) throw err;
            body = JSON.parse(body);
            console.log("get", body);
            expect(body).to.be.length.above(0);
            expect(body[0].id).to.be.defined;

            request.del(endpoint + body[0].id, {}, function(err, response, body) {
              if (err) throw err;
              body = JSON.parse(body);
              console.log("delete", body);
              expect(response.statusCode).to.be.equal(200);
              expect(body.message).to.be.equal('File ' + filename + ' successfuly deleted');

              request.get(endpoint, function(err, response, body) {
                if (err) throw err;
                body = JSON.parse(body)[0];
                console.log("get", body);
                expect(body).to.be.undefined;
                done();
              });
            });
          });
        }, 500);
      });



});
