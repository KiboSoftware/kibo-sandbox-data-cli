import path from 'path';

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = path.join(
  nconf.get('data') || './data',
  'locations.jsonl'
);
let appsClient, locationTypeMethods, locationMethods, locationUsagesMethods;
function initClients() {
  appsClient = createAppsClientMozu();

  locationTypeMethods =
    require('mozu-node-sdk/clients/commerce/admin/locationType')(appsClient);

  locationMethods = require('mozu-node-sdk/clients/commerce/admin/location')(
    appsClient
  );
  locationUsagesMethods =
    require('mozu-node-sdk/clients/commerce/settings/locationUsage')(
      appsClient
    );
}

const setDirectShipLocationUsage = async (code) => {
  var ds = await locationUsagesMethods.getLocationUsage({ code: 'ds' });
  if (ds.locationCodes.includes(code)) {
    return;
  }
  ds.locationCodes.push(code);
  await locationUsagesMethods.updateLocationUsage({ code: 'ds' }, { body: ds });
};
const locationTypes = {};
//function for creating location
const generateLocation = async (locationData) => {
  for (const locationType of locationData.locationTypes || []) {
    if (!locationTypes[locationType.code]) {
      locationTypes[locationType.code] = true;
      try {
        await locationTypeMethods.addLocationType(locationType);
      } catch (error) {}
    }
  }
  try {
    await locationMethods.addLocation(locationData);
    console.log('Successfully added location');
  } catch (error) {
    console.error('Error in adding location', error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await locationMethods.updateLocation(
          { locationCode: locationData.code },
          { body: locationData }
        );
        console.log('Updated location Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating location',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete location
const deleteLocation = async (locationData) => {
  try {
    await locationMethods.deleteLocation({
      locationId: locationData.id,
    });
    console.log('Successfully deleted location');
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting location',
      deleteError.originalError.message
    );
  }
};

async function* exportLocations() {
  let page = 0;
  while (true) {
    let ret = await locationMethods.getLocations({
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

export async function exportAllLocations() {
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportLocations()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}
export async function importAllLocations() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let locationDetail of dataStream) {
    await generateLocation(locationDetail);
    if (locationDetail.fulfillmentTypes.some((_) => _.code === 'DS')) {
      await setDirectShipLocationUsage(locationDetail.code);
    }
  }
}
export async function deleteAllLocations() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let locationDetail of dataStream) {
    await deleteLocation(locationDetail);
  }
}
