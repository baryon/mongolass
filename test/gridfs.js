'use strict';

const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test';

const assert = require('assert');
const Mongolass = require('..');
const mongolass = new Mongolass(MONGODB);
const fs = require('fs');


describe('gridfs.js', function () {
  before(function*() {
  });

  after(function*() {
    // yield mongolass.gridfs('Test').drop();
    // mongolass.disconnect();
  });

  it('uploadStream', function () {
    var gridfs = mongolass.gridfs('Test');
    var readStream = fs.createReadStream('../LICENSE');
    gridfs.openUploadStream('test.dat')
      .then(uploadStream => {
        var license = fs.readFileSync('./LICENSE');
        var id = uploadStream.id;
        readStream.pipe(uploadStream);

      })

  });

  it('uploadFile', function () {
    var gridfs = mongolass.gridfs('Test');
    var readStream = fs.createReadStream('../LICENSE');
    gridfs.openUploadStream('test.dat')
      .then(uploadStream => {
        var license = fs.readFileSync('./LICENSE');
        var id = uploadStream.id;

        console.log(license)
        uploadStream.write(license);
        uploadStream.end();

      });

  });

});
