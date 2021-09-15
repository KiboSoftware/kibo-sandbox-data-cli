import path from "path";

import { createJsonLFileStream, createAppsClientMozu } from "./utilites";

import nconf from "nconf";

nconf.argv();

const generalSettingsDataPath = nconf.get("import");

var appsClient = createAppsClientMozu();

var generalSettingsMethods =
  require("mozu-node-sdk/clients/commerce/settings/generalSettings")(
    appsClient
  );

const filePath = path.join(__dirname, "../");

const dataFilePath = filePath + generalSettingsDataPath;

let dataStream = createJsonLFileStream(dataFilePath);

//function for updating generalSettings
const updateGeneralSettings = async (generalSettingData) => {
  try {
    await generalSettingsMethods.updateGeneralSettings(generalSettingData);
    console.log("Updated General Settings  Successfully");
  } catch (updateError) {
    console.error(
      "Error while updating generalSettings",
      updateError.originalError.message
    );
  }
};

//processing data to update generalSettings

(async function () {
  for await (let generalSettingData of dataStream) {
    await updateGeneralSettings(generalSettingData);
  }
})();
