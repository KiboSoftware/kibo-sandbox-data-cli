import path from "path";

import { createJsonLFileStream } from "./utilites";

import nconf from "nconf";

nconf.argv();

const documentData = nconf.get("import") || nconf.get("clean");

var appsClient = require("mozu-node-sdk/clients/platform/application")();

var document = require("mozu-node-sdk/clients/content/documentlists/document")(
  appsClient
);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + documentData;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating documentType
const generateDocument = async (documentData) => {
  try {
    await document.createDocument({
      documentListName: documentData.listFQN,
      responseFields: documentData,
    });
    console.log("Successfully created documentData");
  } catch (error) {
    console.error("Error in creating documentData", error);
    if (error.originalError.statusCode === 500 && nconf.get("upsert")) {
      try {
        await document.updateDocument({
          documentListName: documentData.listFQN,
        });
        console.log("Updated documentData Successfully");
      } catch (updateError) {
        console.error("Error while updating documentData", updateError);
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
    console.log("deleted document successfully");
  } catch (deleteError) {
    console.error("Error while cleaning , deleting document", deleteError);
  }
};

//processing data to create DocumentType
if (nconf.get("import")) {
  (async function () {
    for await (let documentData of dataStream) {
      await generateDocument(documentData);
    }
  })();
} else if (nconf.get("clean")) {
  //document will be deleted
  (async function () {
    for await (let documentData of dataStream) {
      await deleteDocuments(documentData);
    }
  })();
}
