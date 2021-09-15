import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const productTypeDataPath = nconf.get("import") || nconf.get("clean");

var appsClient = createAppsClientMozu();

var productTypeMethods =
  require("mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType")(
    appsClient
  );

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + productTypeDataPath;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating productType
const generateProductType = async (productTypeData) => {
  try {
    await productTypeMethods.addProductType(productTypeData);
    console.log("Successfully added productType");
  } catch (error) {
    console.error("Error in adding productType", error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await productTypeMethods.updateProductType(
          { productTypeId: productTypeData.id },
          { body: productTypeData }
        );
        console.log("Updated productType Successfully");
      } catch (updateError) {
        console.error(
          "Error while updating productType",
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete productType
const deleteProductType = async (productTypeData) => {
  try {
    await productTypeMethods.deleteProductType({
      productTypeId: productTypeData.id,
    });
    console.log("Successfully deleted productType");
  } catch (deleteError) {
    console.error(
      "Error while cleaning , deleting productType",
      deleteError.originalError.message
    );
  }
};

//processing data to create/update productType
if (nconf.get("import")) {
  (async function () {
    for await (let productTypeDetail of dataStream) {
      await generateProductType(productTypeDetail);
    }
  })();
} else if (nconf.get("clean")) {
  //productType will be deleted
  (async function () {
    for await (let productTypeDetail of dataStream) {
      await deleteProductType(productTypeDetail);
    }
  })();
}
