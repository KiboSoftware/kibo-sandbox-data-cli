import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';
import nconf from 'nconf';

nconf.argv();
const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'carrier-configurations.jsonl'
);

let appsClient, carrierConfigurationClient;
function initClients() {
  appsClient = createAppsClientMozu();
  carrierConfigurationClient =
    require('mozu-node-sdk/clients/commerce/shipping/admin/carrierConfiguration')(
      appsClient
    );
}

const generateCarrierConfiguration = async (carrierConfiguration) => {
  try {
    const response = await carrierConfigurationClient.createConfiguration(
      { carrierId: carrierConfiguration.id },
      {
        body: carrierConfiguration,
      }
    );
    console.log('carrier configuration created');
  } catch (error) {
    console.log(error);
    console.error(
      'Error in adding carrier configuration',
      error.originalError.message
    );
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await carrierConfigurationClient.updateConfiguration(
          {},
          { body: carrierConfiguration }
        );
        console.log('Updated carrier configuration Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating carrier configuration',
          updateError.originalError.message
        );
      }
    }
  }
};
async function* exportCarrierConfigurations() {
  let page = 0;
  while (true) {
    let ret = await carrierConfigurationClient.getConfigurations({
      startIndex: page * 200,
      pageSize: 200,
    });
    for (const prod of ret.items) {
      yield prod;
    }
    page++;
    if (ret.pageCount <= page) {
      break;
    }
  }
}
export async function importAllCarrierConfigurations() {
  var spinner = new Spinner('importing carrier configuration.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let configuration of dataStream) {
    await generateCarrierConfiguration(configuration);
  }
  spinner.stop();
  console.log('carrier configuration imported');
}

export async function exportAllCarrierConfigurations() {
  var spinner = new Spinner('exporting carrier configuration.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let configuration of exportCarrierConfigurations()) {
    await stream.write(configuration);
  }
  stream.end();
  spinner.stop(true);
  console.log('carrier configuration exported');
}
