import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const productAttributeDataPath = nconf.get("import") || nconf.get("clean");

var appsClient = createAppsClientMozu();

var productAttributeMethods =
  require("mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attribute")(
    appsClient
  );

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + productAttributeDataPath;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating productAttributes
const generateProductAttribute = async (productAttributeData) => {
  try {
    await productAttributeMethods.addAttribute(productAttributeData);
    console.log("Successfully added productAttribute");
  } catch (error) {
    console.error(
      "Error in adding productAttribute",
      error.originalError.message
    );
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await productAttributeMethods.updateAttribute(
          { attributeFQN: productAttributeData.attributeFQN },
          { body: productAttributeData }
        );
        console.log("Updated productAttribute Successfully");
      } catch (updateError) {
        console.error(
          "Error while updating productAttribute",
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete productAttribute
const deleteProductAttribute = async (productAttributeData) => {
  try {
    await productAttributeMethods.deleteAttribute({
      attributeFQN: productAttributeData.attributeFQN,
    });
    console.log("Successfully deleted productAttribute");
  } catch (deleteError) {
    console.error(
      "Error while cleaning , deleting productAttribute",
      deleteError.originalError.message
    );
  }
};

//processing data to create/update productAttribute
if (nconf.get("import")) {
  (async function () {
    for await (let productAttributeDetail of dataStream) {
      await generateProductAttribute(productAttributeDetail);
    }
  })();
} else if (nconf.get("clean")) {
  //productAttribute will be deleted
  (async function () {
    for await (let productAttributeDetail of dataStream) {
      await deleteProductAttribute(productAttributeDetail);
    }
  })();
}
