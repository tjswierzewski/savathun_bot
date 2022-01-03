"use strict";

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _fs = _interopRequireDefault(require("fs"));

var _yauzl = _interopRequireDefault(require("yauzl"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const zippedDBFile = 'world-content-manifest.zip';

const getManifest = async () => {
  const response = await (0, _crossFetch.default)('https://www.bungie.net/Platform/Destiny2/Manifest/', {
    method: 'GET',
    headers: {
      'X-API-Key': 'e76627c3ed2c40468ca14f05ca6a5e76'
    }
  });
  const manifests = (await response.json()).Response;
  const worldContentAssetDB = manifests.mobileWorldContentPaths.en;
  const contentDBURL = response.headers.get('access-control-allow-origin') + worldContentAssetDB;

  let contentDBFile = _fs.default.createWriteStream(zippedDBFile);

  const dbResponse = await (0, _crossFetch.default)(contentDBURL, {
    method: 'GET',
    headers: {
      'X-API-Key': 'e76627c3ed2c40468ca14f05ca6a5e76'
    }
  });
  dbResponse.body.pipe(contentDBFile);
  contentDBFile.on('finish', () => {
    contentDBFile.close();

    const contentDB = _fs.default.createWriteStream('world-content-manifest.db');

    _yauzl.default.open(zippedDBFile, {
      lazyEntries: true
    }, (err, zipFile) => {
      if (err) throw err;
      zipFile.readEntry();
      zipFile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          zipFile.readEntry();
        } else {
          zipFile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;
            readStream.on('end', () => {
              zipFile.readEntry();
            });
            readStream.pipe(contentDB);
          });
        }
      });
    });
  });
};

getManifest();