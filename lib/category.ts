import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const categoriesDataPath = nconf.get("import") || nconf.get("clean");

var appsClient = createAppsClientMozu();

var categoryMethod =
  require("mozu-node-sdk/clients/commerce/catalog/admin/category")(appsClient);

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + categoriesDataPath;

let dataStream = createJsonLFileStream(dataFilePath);

//function for creating discount
const generateCategory = async (categoryData) => {
  try {
    await categoryMethod.addCategory(
      { incrementSequence: true, useProvidedId: true },
      { body: categoryData }
    );
    console.log("Successfully added categories");
  } catch (error) {
    console.error("Error in adding categories", error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get("upsert")) {
      try {
        await categoryMethod.updateCategory(
          { categoryId: categoryData.categoryId, cascadeVisibility: false },
          { body: categoryData }
        );
        console.log("Updated Categories Successfully");
      } catch (updateError) {
        console.error(
          "Error while updating categories",
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete category
const deleteCategory = async (categoryData) => {
  try {
    await categoryMethod.deleteCategoryById({
      categoryId: categoryData.categoryId,
      cascadeDelete: true,
      forceDelete: true,
      reassignToParent: false,
    });
    console.log("Successfully deleted categories");
  } catch (deleteError) {
    console.error(
      "Error while cleaning , deleting categories",
      deleteError.originalError.message
    );
  }
};

//processing data to create/update cfategory
if (nconf.get("import")) {
  (async function () {
    for await (let categoryDetail of dataStream) {
      await generateCategory(categoryDetail);
    }
  })();
} else if (nconf.get("clean")) {
  //discount will be deleted
  (async function () {
    for await (let categoryDetail of dataStream) {
      await deleteCategory(categoryDetail);
    }
  })();
}
