'use strict';

const _ = require('lodash');
const debug = require('debug')('mongolass-gridfs');
const mongodb = require('mongodb');
const inflected = require('inflected');
const Promise = require('bluebird');
const Query = require('./query');

function bindGridCB(ctx) {
  const NativeClass = mongodb.GridFSBucket;
  for (let propName in NativeClass.prototype) {
    if (propName[0] !== '_') _bindProperty(propName);
  }

  function _bindProperty(propName) {
    let fn;
    let desc = Object.getOwnPropertyDescriptor(NativeClass.prototype, propName);
    if (!desc) {
      try {
        fn = NativeClass.prototype[propName];
      } catch (e) {
      }
    } else {
      fn = desc.value;
    }


    if (_.isFunction(fn)) {
      if (propName.indexOf('open') === 0) {
        _bindMethod(propName);
      } else {
        _bindCBMethod(propName);
      }
    }

  }

  class GridCB {
    constructor(op, args) {
      this._op = op;
      this._args = args;
    }

    exec(cb) {
      return Promise.resolve()
        .then(() => ctx._connect())
        .then(conn => {
          let res = conn[this._op].apply(conn, this._args);
          if (res.toArray && (typeof res.toArray === 'function')) {
            return res.toArray();
          }
          return res;
        })
        .asCallback(cb);
    }

    then(resolve, reject) {
      return this.exec().then(resolve, reject);
    }
  }

  function _bindMethod(propName) {
    Object.defineProperty(ctx, propName, {
      enumerable: true,
      value: (...args) => {
        return ctx._connect()
          .then(conn => {
            return conn[propName](args);
          })
      }
    })
    Object.defineProperty(ctx[propName], 'name', {
      value: propName
    });

  }

  function _bindCBMethod(propName) {
    Object.defineProperty(ctx, propName, {
      enumerable: true,
      value: (...args) => {
        if (args.length && ('function' === typeof args[args.length - 1])) {
          throw new TypeError('Not support callback for method: ' + propName + ', please call .exec() or .cursor()');
        }
        if (['find'].indexOf(propName) !== -1) {
          if (args.length > 2) {
            throw new TypeError('Only support this usage: ' + propName + '(query, options)');
          }
        }
        return new GridCB(propName, args);
      }
    });
    Object.defineProperty(ctx[propName], 'name', {
      value: propName
    });
  }


}
class GridFS {
  constructor(db, opts) {
    opts = opts || {};
    this._db = db;
    let bucketName = inflected.pluralize(opts.bucketName).toLowerCase();
    this._bucketName = bucketName;
    this._chunksColl = bucketName + '.chunks';
    this._filesColl = bucketName + '.files';
    this._opts = opts;

    this._connect();

    bindGridCB(this);

  }


  /**
   * get a collection
   */
  _connect(collName, opts) {
    if (this._coll) {
      return Promise.resolve(this._coll);
    }
    this._collName = collName || this._collName;
    this._opts = opts || this._opts;
    this._conn = this._conn || this._db
        .connect()
        .then(db => {
          this._bucket = new mongodb.GridFSBucket(db, this._opts);

          debug('Get bucket: ' + this._bucketName);
          return this._bucket;
        })
        .catch(e => {
          console.error(e);
          throw e;
        });
    return this._conn;
  }


}

module.exports = GridFS;
