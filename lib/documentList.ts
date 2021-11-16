import path from 'path';

import {
  createJsonLFileStream,
  createAppsClientMozu,
  createJsonLFileWriteStream,
} from './utilites';

import nconf from 'nconf';

nconf.argv();

var appsClient = createAppsClientMozu();

var documentList = require('mozu-node-sdk/clients/content/documentList')(
  appsClient
);

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'document-lists.jsonl'
);

require('path').join(nconf.get('data') || './data', 'document-lists.jsonl');

//function for creating documentType
const createDocumentList = async (documentListData) => {
  try {
    await documentList.createDocumentList(documentListData);
  } catch (error) {
    console.error(
      'Error in creating DocumentList',
      error.originalError.message
    );
    if (error.originalError.statusCode === 500 && nconf.get('upsert')) {
      try {
        await documentList.updateDocumentList(
          { documentListName: documentListData.listFQN },
          documentListData
        );
      } catch (updateError) {
        console.error(
          'Error while updating documentlist',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete document
const deleteDocumentList = async (documentListData) => {
  try {
    await documentList.deleteDocumentList({
      documentListName: documentListData.listFQN,
    });
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting document',
      deleteError.originalError.message
    );
  }
};

async function* exportDocLists() {
  let page = 0;
  while (true) {
    let ret = await documentList.getDocumentLists({
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

export async function deleteAllDocumentLists() {
  for await (let item of exportDocLists()) {
    await deleteDocumentList(item);
  }
}
export async function importAllDocumentLists() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let item of dataStream) {
    if (item.scopeType === 'Tenant') {
      item.scopeId = parseInt(documentList.context.tenant);
    }
    await createDocumentList(item);
  }
}
export async function exportAllDocumentLists() {
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportDocLists()) {
    if (item.namespace === 'mozu') {
      continue;
    }

    ['auditInfo'].forEach((key) => delete item[key]);

    await stream.write(item);
  }
}
