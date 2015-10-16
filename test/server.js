var deployd = require('deployd'),
    os = require('os'),
    fs = require('fs'),
    chai = require('chai'),
    chaiHttp = require('chai-http');

    chai.use(chaiHttp);


describe('/upload', function() {

  before(function() {
    var server = deployd({
        port: process.env.PORT || 3000,
        env: 'development',
        db: {
            host: 'localhost',
            port: 27017,
            name: 'kinoa'
        }
    });

    server.listen();
    console.log('Express server listening on http://' + os.hostname() + ":" + server.options.port + " with DB " + server.options.db.host + "/" + server.options.db.name);

    server.on('error', function (err) {
        console.error(err);
        process.nextTick(function () { // Give the server a chance to return an error
            process.exit();
        });
    });
  });

  it('post an image', function(done) {

    chai.request('http://localhost:3000')
      .post('/upload')
      .attach('uploadedFile', fs.readFileSync('bear.jpg'), 'bear.jpg')
      .then(function (res) {
        console.log('Image upload', res);
         expect(res).to.have.status(200);
      })
      .catch(function (err) {
        console.log('Error', err);
         throw err;
      })
  });
});
