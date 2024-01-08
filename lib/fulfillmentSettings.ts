import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'fulfillment-settings.jsonl'
);
let appsClient, fulfillmentSettingsClient;
function initClients() {
  appsClient = createAppsClientMozu();

  let Client = require('mozu-node-sdk/client');
  let constants = Client.constants;
  let fulfillmentSettingsFactory = Client.sub({
    getFulfillmentSettings: Client.method({
      method: constants.verbs.GET,
      url: '{+tenantPod}api/commerce/settings/fulfillment/fulfillmentsettings'
    }),
    updateFulfillmentSettings: Client.method({
      method: constants.verbs.PUT,
      url: '{+tenantPod}api/commerce/settings/fulfillment/fulfillmentsettings'
    }),
  })
  fulfillmentSettingsClient = new fulfillmentSettingsFactory(appsClient)
}
const updateSettings = async (settings) => {
  try {
    const updatedSettings = await fulfillmentSettingsClient.updateFulfillmentSettings(
      null,
      {
        body: settings,
      }
    );
    console.log('fulfillment settings updated');
  } catch (error) {
    console.error(error);
  }
};
export async function importFulfillmentSettings() {
  var spinner = new Spinner('importing fulfillment settings.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let fulfillmentSettings of dataStream) {
    updateSettings(fulfillmentSettings);
  }
  spinner.stop();
  console.log('fulfillment settings imported');
}

export async function exportFulfillmentSettings() {
  var spinner = new Spinner('exporting fulfillment settings.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  const settings = await fulfillmentSettingsClient.getFulfillmentSettings();
  await stream.write(settings);
  stream.end();
  spinner.stop(true);
  console.log('fulfillment settings exported');
}
