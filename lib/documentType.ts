import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const documentTypeData = nconf.get("import");

var appsClient = createAppsClientMozu();

var documentType = require("mozu-node-sdk/clients/content/documentType")(
  appsClient
);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + documentTypeData;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating documentType
const createDocumentType = async (documentTypeData) => {
  try {
    await documentType.createDocumentType(documentTypeData);
    console.log("Successfully created document");
  } catch (error) {
    console.error("Error in creating Document", error);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await documentType.updateDocumentType(
          { documentTypeName: documentTypeData.name },
          documentTypeData
        );
        console.log("Updated DocumentType Successfully");
      } catch (updateError) {
        console.error("Error while updating document", updateError);
      }
    }
  }
};

//processing data to create DocumentType

(async function () {
  for await (let documentTypeData of dataStream) {
    await createDocumentType(documentTypeData);
  }
})();
