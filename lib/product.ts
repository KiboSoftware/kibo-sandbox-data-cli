import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const productPathData = nconf.get("import") || nconf.get("clean");

var appsClient = createAppsClientMozu();

var product = require("mozu-node-sdk/clients/commerce/catalog/admin/product")(
  appsClient
);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + productPathData;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating documentType
const generateProduct = async (productData) => {
  try {
    await product.addProduct(
      { productCode: productData.productCode },
      { body: productData }
    );
    console.log("Successfully added product");
  } catch (error) {
    console.error("Error in adding product", error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await product.updateProduct(
          { productCode: productData.productCode },
          { body: productData }
        );
        console.log("Updated Product Successfully");
      } catch (updateError) {
        console.error(
          "Error while updating product",
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete document
const deleteProduct = async (productData) => {
  try {
    await product.deleteProduct({
      productCode: productData.productCode,
    });
    console.log("Successfully deleted Product");
  } catch (deleteError) {
    console.error(
      "Error while cleaning , deleting product",
      deleteError.originalError.message
    );
  }
};

//processing data to create/update product
if (nconf.get("import")) {
  (async function () {
    for await (let productDetail of dataStream) {
      await generateProduct(productDetail);
    }
  })();
} else if (nconf.get("clean")) {
  //product will be deleted
  (async function () {
    for await (let productDetail of dataStream) {
      await deleteProduct(productDetail);
    }
  })();
}
