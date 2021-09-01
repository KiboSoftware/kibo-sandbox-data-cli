import path from "path";

import { createJsonLFileStream } from "./utilites";

import nconf from "nconf";

nconf.argv();

const documentListData = nconf.get("import") || nconf.get("clean");

var appsClient = require("mozu-node-sdk/clients/platform/application")();

var documentList = require("mozu-node-sdk/clients/content/documentList")(
  appsClient
);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + documentListData;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating documentType
const generateDocumentList = async (documentListData) => {
  try {
    await documentList.createDocumentList(documentListData);
    console.log("Successfully created documentList");
  } catch (error) {
    console.error("Error in creating DocumentList", error);
    if (error.originalError.statusCode === 500 && nconf.get("upsert")) {
      try {
        await documentList.updateDocumentList(
          { documentListName: documentListData.listFQN },
          documentListData
        );
        console.log("Updated DocumentList Successfully");
      } catch (updateError) {
        console.error("Error while updating documentlist", updateError);
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
    console.log("Successfully deleted DocumentList");
  } catch (deleteError) {
    console.error("Error while cleaning , deleting document", deleteError);
  }
};

//processing data to create DocumentType
if (nconf.get("import")) {
  (async function () {
    for await (let documentListData of dataStream) {
      await generateDocumentList(documentListData);
    }
  })();
} else if (nconf.get("clean")) {
  //document will be deleted
  (async function () {
    for await (let documentListData of dataStream) {
      await deleteDocumentList(documentListData);
    }
  })();
}
