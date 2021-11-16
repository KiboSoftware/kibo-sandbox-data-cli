import path from 'path';

import {
  createJsonLFileStream,
  createAppsClientMozu,
  createJsonLFileWriteStream,
} from './utilites';

import nconf from 'nconf';

nconf.argv();

var appsClient = createAppsClientMozu();

var documentType = require('mozu-node-sdk/clients/content/documentType')(
  appsClient
);

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'document-types.jsonl'
);

//function for creating documentType
const createDocumentType = async (documentTypeData) => {
  try {
    await documentType.createDocumentType(documentTypeData);
    console.log('Successfully created document');
  } catch (error) {
    console.error('Error in creating Document', error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await documentType.updateDocumentType(
          { documentTypeName: documentTypeData.name },
          documentTypeData
        );
        console.log('Updated DocumentType Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating document',
          updateError.originalError.message
        );
      }
    }
  }
};

async function* exportDocTypes() {
  let page = 0;
  while (true) {
    let ret = await documentType.getDocumentTypes({
      startIndex: page * 200,
      pageSize: 200,
    });
    for (const item of ret.items) {
      yield item;
    }
    page++;
    if (ret.pageCount <= page) {
      break;
    }
  }
}

export async function deleteAllDocumentTypes() {
  //na
}
export async function importAllDocumentTypes() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let documentTypeData of dataStream) {
    await createDocumentType(documentTypeData);
  }
}
export async function exportAllDocumentTypes() {
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportDocTypes()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    if (item.namespace === 'mozu') {
      continue;
    }
    await stream.write(item);
  }
}
