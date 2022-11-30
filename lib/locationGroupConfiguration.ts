import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = path.join(
  nconf.get('data') || './data',
  'location-group-configurations.jsonl'
);
let appsClient, locationGroups, locationConfigClient;
function initClients() {
  appsClient = createAppsClientMozu();

  locationGroups = require('../clients/location-groups')(appsClient);
  locationConfigClient = require('../clients/location-group-configuration')(
    appsClient
  );
}

const getLocationGroupConfiguration = async (locationGroupCode) => {
  try {
    const locationGroupConfig =
      await locationConfigClient.getLocationGroupConfiguration({
        locationGroupCode,
      });
    console.log(
      'successfully fetched location group config for',
      locationGroupCode
    );
    return locationGroupConfig;
  } catch (error) {
    console.error('error fetching location group configuration', error);
  }
};
const generateLocationGroupConfiguration = async (
  locationGroupConfiguration
) => {
  try {
    await locationConfigClient.setLocationGroupConfiguration(
      { locationGroupCode: locationGroupConfiguration.locationGroupCode },
      { body: locationGroupConfiguration }
    );
    console.log('Successfully added location group');
  } catch (error) {
    console.error(
      'Error in adding location group',
      error.originalError.message
    );
  }
};
async function* exportLocationGroups() {
  let page = 0;
  while (true) {
    let ret = await locationGroups.getGroups({
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

export async function exportAllLocationGroupConfigurations() {
  var spinner = new Spinner('exporting location groups.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportLocationGroups()) {
    const config = await getLocationGroupConfiguration(item.locationGroupCode);
    if (config) {
      delete config['auditInfo'];
      await stream.write(config);
    }
  }
  spinner.stop(true);
  console.log('location groups exported');
}
export async function importAllLocationGroupConfigurations() {
  var spinner = new Spinner('importing location groups.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let locationGroupConfiguration of dataStream) {
    locationGroupConfiguration.tenantId = locationConfigClient.tenant;
    locationGroupConfiguration.siteId = locationConfigClient.site;
    await generateLocationGroupConfiguration(locationGroupConfiguration);
  }
  spinner.stop(true);
  console.log('location groups exported');
}
// export async function deleteAllLocations() {
//   let dataStream = createJsonLFileStream(dataFilePath);
//   for await (let locationDetail of dataStream) {
//     await deleteLocation(locationDetail);
//   }
// }
