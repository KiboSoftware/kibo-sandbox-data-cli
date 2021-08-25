var appsClient = require("mozu-node-sdk/clients/platform/application")();

const documentTypeData = require("../data/documentType.json");

var documentType = require("mozu-node-sdk/clients/content/documentType")(
  appsClient
);

//Calling function to create documentType
documentType
  .createDocumentType(documentTypeData.data[0])
  .then((apiResult) => console.log(apiResult))
  .catch((err) => console.log(err));
