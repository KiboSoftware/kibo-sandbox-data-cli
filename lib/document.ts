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

//function for creating documentType
const generateDocument = async (documentData) => {
  try {
    await document.createDocument(
      {
        documentListName: documentData.listFQN,
      },
      { body: documentData }
    );
    console.log("Successfully created documentData");
  } catch (error) {
    console.error("Error in creating documentData", error);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
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
        console.log("Updated documentData Successfully");
      } catch (updateError) {
        console.error("Error while updating documentData", updateError);
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
    console.log("Deleted Document successfully");
  } catch (deleteError) {
    console.error("Error while cleaning , deleting document", deleteError);
  }
};

//below function will fetch document data, for getting documentId of document
const fetchDocumentDetails = async (documentData) => {
  const result = await document.getDocument({
    documentListName: documentData.listFQN,
  });
  for (let documentDetails of result.items) {
    if (documentData.name === documentDetails.name) {
      console.log("documentId for updation", documentDetails.id);
      return documentDetails.id;
    } else {
      console.log("Didnt find documentId required for updation");
    }
  }
};

//processing data to create Document
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
