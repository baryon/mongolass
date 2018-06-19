const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const Mongolass = require('..')
const mongolass = new Mongolass(MONGODB)
const fs = require('fs');

describe('gridfs.js', function () {
  before(function*() {
  });

  after(function * () {
    yield mongolass.disconnect()
  })

  it('uploadStream', function () {
    const gridfs = mongolass.gridfs('Test');
    const readStream = fs.createReadStream('./LICENSE');
    gridfs.openUploadStream('test.dat')
      .then(uploadStream => {
        const license = fs.readFileSync('./LICENSE');
        const id = uploadStream.id;
        readStream.pipe(uploadStream);

      })

  });

  it('uploadFile', function () {
    const gridfs = mongolass.gridfs('Test');
    const readStream = fs.createReadStream('./LICENSE');
    gridfs.openUploadStream('test.dat')
      .then(uploadStream => {
        const license = fs.readFileSync('./LICENSE');
        const id = uploadStream.id;

        console.log(license)
        uploadStream.write(license);
        uploadStream.end();

      });

  });

});
