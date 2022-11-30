import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'order-routing.jsonl'
);
let appsClient, orderRoutingExport;
function initClients() {
  appsClient = createAppsClientMozu();

  orderRoutingExport = require('../clients/order-routing-export-import')(
    appsClient
  );
}

const removeUserInfo = (routing) => {
  for (let route of routing.routes) {
    route.creatorUsername = '';
    route.updaterUsername = '';
  }
  for (let group of routing.groups) {
    group.creatorUsername = '';
    group.updaterUsername = '';
  }
  return routing;
};
const generateOrderRouting = async (tenantID, siteID, orderRouting) => {
  try {
    await orderRoutingExport.import(
      { tenantID, siteID },
      { body: orderRouting }
    );
    console.log('Successfully imported order routing');
  } catch (error) {
    console.error('Error in adding order routing', error.originalError.message);
  }
};
const getOrderRoutingConfig = async ({ tenantID, siteID, environmentID }) => {
  try {
    const orderRoutingConfig = await orderRoutingExport.export({
      tenantID,
      siteID,
      environmentID,
    });
    return orderRoutingConfig;
  } catch (error) {
    console.error('unable to fetch order routing', error);
  }
};
export async function exportOrderRouting() {
  var spinner = new Spinner('exporting order routing.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  const config = await getOrderRoutingConfig({
    tenantID: appsClient.tenant,
    siteID: appsClient.site,
    environmentID: 1,
  });
  await stream.write(config);
  spinner.stop(true);
  console.log('order routing exported');
}
export async function importOrderRouting() {
  var spinner = new Spinner('importing order routing.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let orderRouting of dataStream) {
    const { tenant, site } = orderRoutingExport.context;
    await generateOrderRouting(tenant, site, removeUserInfo(orderRouting));
  }
  spinner.stop(true);
  console.log('order routing imported');
}
