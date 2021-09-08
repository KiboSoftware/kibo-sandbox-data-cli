var { parse } = require("@jsonlines/core");
require("dotenv").config();

import fs from "fs";

export function createJsonLFileStream(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parseStream = parse();
  const dataStream = source.pipe(parseStream);
  return dataStream;
}

//function for creating appclient for mozunodesdk

export function createAppsClientMozu() {
  var appClient = require("mozu-node-sdk/clients/platform/application")({
    context: {
      appKey: process.env.KIBO_CLIENT_ID,
      sharedSecret: process.env.KIBO_SHARED_SECRET,
      baseUrl: process.env.KIBO_API_BASE_URL,
      tenant: process.env.KIBO_TENANT,
      siteId: process.env.KIBO_SITE_ID,
      masterCatalogId: process.env.KIBO_MASTER_CATALOG_ID,
      catalogId: process.env.KIBO_CATALOG_ID,
    },
  });
  return appClient;
}
