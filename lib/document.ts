import path from 'path';

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();
const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'documents.jsonl'
);
const doclists = (nconf.get('documents') || '').split(',');

let appsClient, document, documentTree;
function initClients() {
  appsClient = createAppsClientMozu();

  document = require('mozu-node-sdk/clients/content/documentlists/document')(
    appsClient
  );
  documentTree =
    require('mozu-node-sdk/clients/content/documentlists/documentTree')(
      appsClient
    );
}

//function for creating documentType
const generateDocument = async (documentData) => {
  try {
    await document.createDocument(
      {
        documentListName: documentData.listFQN,
      },
      { body: documentData }
    );
  } catch (error) {
    console.error(
      'Error in creating documentData',
      error.originalError.message
    );
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        //before updating will fetch documentId
        const documentID = await fetchDocumentDetails(documentData);
        await document.updateDocument(
          {
            documentListName: documentData.listFQN,
            documentId: documentID,
          },
          { body: documentData }
        );
      } catch (updateError) {
        console.error(
          'Error while updating documentData',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete document
const deleteDocuments = async (documentListData) => {
  try {
    await document.deleteDocument({
      documentListName: documentListData.listFQN,
    });
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting document',
      deleteError.originalError.message
    );
  }
};

//below function will fetch document data, for getting documentId of document
const fetchDocumentDetails = async (documentData) => {
  const result = await document.getDocument({
    documentListName: documentData.listFQN,
  });
  for (let documentDetails of result.items) {
    if (documentData.name === documentDetails.name) {
      return documentDetails.id;
    } else {
      console.log('Didnt find documentId required for updation');
    }
  }
};

//processing data to create Document
if (nconf.get('import')) {
  (async function () {
    let dataStream = createJsonLFileStream(dataFilePath);
    for await (let documentData of dataStream) {
      await generateDocument(documentData);
    }
  })();
} else if (nconf.get('clean')) {
  //document will be deleted
  (async function () {
    let dataStream = createJsonLFileStream(dataFilePath);
    for await (let documentData of dataStream) {
      await deleteDocuments(documentData);
    }
  })();
}

async function* exportDocs() {
  for (const documentListName of doclists) {
    try {
      while (true) {
        let page = 0;

        let ret = await document.getDocuments({
          startIndex: page * 200,
          documentListName: documentListName,
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
    } catch (error) {
      console.log(
        `Error while exporting doclist ${documentListName}`,
        error.originalError.message
      );
    }
  }
}

export async function deleteAllDocuments() {
  initClients();
  for await (let item of exportDocs()) {
    await deleteDocuments(item);
  }
}
export async function importAllDocuments() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let documentTypeData of dataStream) {
    await generateDocument(documentTypeData);
  }
}
export async function exportAllDocuments() {
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportDocs()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}
