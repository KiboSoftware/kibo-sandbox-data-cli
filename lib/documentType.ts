var fs = require("fs");
var path = require("path");

var { parse } = require("@jsonlines/core");

var nconf = require("nconf");
nconf.argv();

const documentTypeData = nconf.get("import");

var appsClient = require("mozu-node-sdk/clients/platform/application")();

var documentType = require("mozu-node-sdk/clients/content/documentType")(
  appsClient
);

const dataFilePath = path.join(__dirname, "../");

const source = fs.createReadStream(dataFilePath + documentTypeData);
const parseStream = parse();
const dataStream = source.pipe(parseStream);

//processing data to create DocumentType

(async function () {
  for await (let documentTypeData of dataStream) {
    await createDocumentType(documentTypeData);
  }
})();

//function for creating documentType
const createDocumentType = async (documentTypeData) => {
  try {
    const result = await documentType.createDocumentType(documentTypeData);
    console.log("Successfully created document");
  } catch (error) {
    console.error("Error in creating Document", error);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        const updateDocumentTypeResult = await documentType.updateDocumentType(
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
