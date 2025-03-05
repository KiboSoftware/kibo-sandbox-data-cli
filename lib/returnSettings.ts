import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'return-settings.jsonl'
);
let appsClient, returnSettingsClient;
function initClients() {
  appsClient = createAppsClientMozu();

  let Client = require('mozu-node-sdk/client');
  let constants = Client.constants;
  let returnSettingsFactory = Client.sub({
    getReturnSettings: Client.method({
      method: constants.verbs.GET,
      url: '{+tenantPod}api/commerce/settings/return/returnsettings'
    }),
    updateReturnSettings: Client.method({
      method: constants.verbs.PUT,
      url: '{+tenantPod}api/commerce/settings/return/returnsettings'
    }),
  })
  returnSettingsClient = new returnSettingsFactory(appsClient)
}
const updateSettings = async (settings) => {
  try {
    const updatedSettings = await returnSettingsClient.updateReturnSettings(
      null,
      {
        body: settings,
      }
    );
    console.log('return settings updated');
  } catch (error) {
    console.error(error);
  }
};
export async function importReturnSettings() {
  var spinner = new Spinner('importing return settings.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let returnSettings of dataStream) {
    updateSettings(returnSettings);
  }
  spinner.stop();
  console.log('return settings imported');
}

export async function exportReturnSettings() {
  var spinner = new Spinner('exporting return settings.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  const settings = await returnSettingsClient.getReturnSettings();
  await stream.write(settings);
  stream.end();
  spinner.stop(true);
  console.log('return settings exported');
}
