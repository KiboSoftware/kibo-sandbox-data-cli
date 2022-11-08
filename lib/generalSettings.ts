import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'general-settings.jsonl'
);
let appsClient, generalSettingsClient;
function initClients() {
  appsClient = createAppsClientMozu();

  generalSettingsClient =
    require('mozu-node-sdk/clients/commerce/settings/generalSettings')(
      appsClient
    );
}
const updateSettings = async (settings) => {
  try {
    const updatedSettings = await generalSettingsClient.updateGeneralSettings(
      null,
      {
        body: settings,
      }
    );
    console.log('general settings updated');
  } catch (error) {
    console.error(error);
  }
};
export async function importGeneralSettings() {
  var spinner = new Spinner('importing general settings.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let generalSettings of dataStream) {
    updateSettings(generalSettings);
  }
  spinner.stop();
  console.log('general settings imported');
}

export async function exportGeneralSettings() {
  var spinner = new Spinner('exporting general settings.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  const settings = await generalSettingsClient.getGeneralSettings();
  await stream.write(settings);
  stream.end();
  spinner.stop(true);
  console.log('general settings exported');
}
