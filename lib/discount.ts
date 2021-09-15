import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const discountDataPath = nconf.get("import") || nconf.get("clean");

var appsClient = createAppsClientMozu();

var discountMethod =
  require("mozu-node-sdk/clients/commerce/catalog/admin/discount")(appsClient);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + discountDataPath;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating discount
const generateDiscount = async (discountData) => {
  try {
    await discountMethod.createDiscount(discountData);
    console.log("Successfully added discount");
  } catch (error) {
    console.error("Error in adding discount", error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        console.log("disocount id ", discountData.thresholdMessage.discountId);
        await discountMethod.updateDiscount(
          { discountId: discountData.thresholdMessage.discountId },
          { body: discountData }
        );
        console.log("Updated Discount Successfully");
      } catch (updateError) {
        console.error(
          "Error while updating discount",
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete discount
const deleteDiscount = async (discountData) => {
  try {
    await discountMethod.deleteDiscount({
      discountId: discountData.thresholdMessage.discountId,
    });
    console.log("Successfully deleted discount");
  } catch (deleteError) {
    console.error(
      "Error while cleaning , deleting discount",
      deleteError.originalError.message
    );
  }
};

//processing data to create/update discount
if (nconf.get("import")) {
  (async function () {
    for await (let discountDetail of dataStream) {
      await generateDiscount(discountDetail);
    }
  })();
} else if (nconf.get("clean")) {
  //discount will be deleted
  (async function () {
    for await (let discountDetail of dataStream) {
      await deleteDiscount(discountDetail);
    }
  })();
}
