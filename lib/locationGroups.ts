import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'location-groups.jsonl'
);
let appsClient, locationGroupsClient;
function initClients() {
  appsClient = createAppsClientMozu();
  locationGroupsClient = require('./clients/location-groups')(appsClient);
}

const generateLocationGroup = async (locationGroup) => {
  try {
    await locationGroupsClient.createGroup(null, { body: locationGroup });
    console.log('Successfully added location group');
  } catch (error) {
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        console.log('update location group ', locationGroup.locationGroupId);
        await locationGroupsClient.updateGroup(
          { locationGroupCode: locationGroup.locationGroupId },
          { body: locationGroup }
        );
        console.log('update location group Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating location group',
          updateError.originalError.message
        );
      }
    } else {
      console.error(
        'Error in adding location group',
        error.originalError.message
      );
    }
  }
};
async function* exportLocationGroups() {
  let page = 0;
  while (true) {
    let ret = await locationGroupsClient.getGroups({
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

export async function exportAllLocationGroups() {
  var spinner = new Spinner('exporting location groups.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportLocationGroups()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
  spinner.stop(true);
  console.log('location groups exported');
}
export async function importAllLocationGroups() {
  var spinner = new Spinner('importing location groups.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let locationGroup of dataStream) {
    locationGroup.siteIds = [locationGroupsClient.context.site];
    await generateLocationGroup(locationGroup);
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
