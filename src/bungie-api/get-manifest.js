import fetch from 'cross-fetch';
import fs from 'fs';
import yauzl from 'yauzl';

const zippedDBFile = 'world-content-manifest.zip';

const getManifest = async () => {
  const response = await fetch('https://www.bungie.net/Platform/Destiny2/Manifest/', {
    method: 'GET',
    headers: {
      'X-API-Key': 'e76627c3ed2c40468ca14f05ca6a5e76',
    },
  });
  const manifests = (await response.json()).Response;
  const worldContentAssetDB = manifests.mobileWorldContentPaths.en;
  const contentDBURL = response.headers.get('access-control-allow-origin') + worldContentAssetDB;
  let contentDBFile = fs.createWriteStream(zippedDBFile);
  const dbResponse = await fetch(contentDBURL, {
    method: 'GET',
    headers: {
      'X-API-Key': 'e76627c3ed2c40468ca14f05ca6a5e76',
    },
  });
  dbResponse.body.pipe(contentDBFile);
  contentDBFile.on('finish', () => {
    contentDBFile.close();
    const contentDB = fs.createWriteStream('world-content-manifest.db');
    yauzl.open(zippedDBFile, { lazyEntries: true }, (err, zipFile) => {
      if (err) throw err;
      zipFile.readEntry();
      zipFile.on('entry', (entry) => {
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
