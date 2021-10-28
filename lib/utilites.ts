import jsonlines from 'jsonlines';
import path from 'path';
require('dotenv').config();
const stream = require('stream');
import fs from 'fs';

export function createJsonLFileStream(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parser = jsonlines.parse({ emitInvalidLines: true });
  const dataStream = source.pipe(parser);
  return dataStream;
}

export function createJsonLFileWriteStream(dataFilePath) {
  createFilesDirIfNotExists(dataFilePath);
  var stringifier = jsonlines.stringify();
  const destStream = fs.createWriteStream(dataFilePath);
  stringifier.pipe(destStream);
  return stringifier;
}

function createFilesDirIfNotExists(filename) {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

//function for creating appclient for mozunodesdk

export function createAppsClientMozu() {
  var appClient = require('mozu-node-sdk/clients/platform/application')({
    context: {
      appKey: process.env.KIBO_CLIENT_ID,
      sharedSecret: process.env.KIBO_SHARED_SECRET,
      baseUrl: process.env.KIBO_API_BASE_URL,
      tenant: process.env.KIBO_TENANT,
      siteId: process.env.KIBO_SITE_ID,
      masterCatalogId: process.env.KIBO_MASTER_CATALOG_ID,
      catalogId: process.env.KIBO_CATALOG_ID,
    },
    //plugins: [FiddlerProxy({ url: 'http://localhost:8866' })]
  });
  return appClient;
}
