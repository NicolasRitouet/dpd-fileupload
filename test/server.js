var deployd = require('deployd'),
    os = require('os'),
    fs = require('fs'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    expect = chai.expect;

if (!global.Promise) {
  var q = require('q');
  chai.request.addPromises(q.Promise);
}

chai.use(chaiHttp);


describe('/upload', function() {
  var server;

  before(function() {
    server = deployd({
        port: process.env.PORT || 3000,
        env: 'development',
        db: {
            host: 'localhost',
            port: 27017,
            name: 'kinoa'
        }
    });

    server.listen();
    console.log('Server listening on http://' + os.hostname() + ":" + server.options.port + " with DB " + server.options.db.host + "/" + server.options.db.name);

    server.on('error', function (err) {
        console.error(err);
        process.nextTick(function () { // Give the server a chance to return an error
            process.exit();
        });
    });
  });

  it('get the list of images', function(done) {
    setTimeout(function() {

      chai.request(server)
        .get('/upload')
        .then(function (res) {
          console.log('get a response', res);
           expect(res).to.have.status(200);
           done();
        })
        .catch(function (err) {
          console.log('Error', err);
           throw err;
        });

    }, 500);
  });
});
