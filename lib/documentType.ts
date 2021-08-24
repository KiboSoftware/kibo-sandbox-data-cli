var appsClient = require("mozu-node-sdk/clients/platform/application")();

function log(result) {
  console.log(result);
}

function reportError(error) {
  console.error(error.message, error);
}

var data = {
  data: [
    {
      name: "banner",
      namespace: "mozuadmin",
      documentTypeFQN: "banner@mozuadmin",
      metadata: {
        isWebPage: false,
      },
      properties: [
        {
          name: "tag",
          isRequired: false,
          isMultiValued: true,
          propertyType: {
            name: "string",
            namespace: "mozu",
            propertyTypeFQN: "string@mozu",
            installationPackage: "core@mozu",
            version: "1.0",
            dataType: "string",
          },
        },
        {
          name: "slot",
          isRequired: false,
          isMultiValued: false,
          propertyType: {
            name: "string",
            namespace: "mozu",
            propertyTypeFQN: "string@mozu",
            installationPackage: "core@mozu",
            version: "1.0",
            dataType: "string",
          },
        },
        {
          name: "title",
          isRequired: true,
          isMultiValued: false,
          propertyType: {
            name: "string",
            namespace: "mozu",
            propertyTypeFQN: "string@mozu",
            installationPackage: "core@mozu",
            version: "1.0",
            dataType: "string",
          },
        },
        {
          name: "subtitle",
          isRequired: false,
          isMultiValued: false,
          propertyType: {
            name: "string",
            namespace: "mozu",
            propertyTypeFQN: "string@mozu",
            installationPackage: "core@mozu",
            version: "1.0",
            dataType: "string",
          },
        },
      ],
    },
  ],
};
//for document type
var documentType = require("mozu-node-sdk/clients/content/documentType")(
  appsClient
);
//documentType.getDocumentType().then(log, reportError);
documentType.createDocumentType({ body: data.data[0] }).then(log, reportError);
