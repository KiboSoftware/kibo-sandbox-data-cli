import path from "path";

import { createJsonLFileStream } from "./utilites";

import nconf from "nconf";

nconf.argv();

const documentListTypeData = nconf.get("import");

var appsClient = require("mozu-node-sdk/clients/platform/application")();

var documentListType =
  require("mozu-node-sdk/clients/content/documentListType")(appsClient);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + documentListTypeData;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating documentType
const generateDocumentListType = async (documentListTypeData) => {
  try {
    await documentListType.createDocumentListType(documentListTypeData);
    console.log("Successfully created documentListType");
  } catch (error) {
    console.error("Error in creating DocumentListType", error);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await documentListType.updateDocumentListType(
          { documentTypeName: documentListTypeData.name },
          documentListTypeData
        );
        console.log("Updated DocumentListType Successfully");
      } catch (updateError) {
        console.error("Error while updating documentListType", updateError);
      }
    }
  }
};

//processing data to create DocumentType

(async function () {
  for await (let documentListTypeData of dataStream) {
    await generateDocumentListType(documentListTypeData);
  }
})();
