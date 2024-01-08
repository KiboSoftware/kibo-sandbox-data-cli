
import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'category-attributes.jsonl'
);
let appsClient, categoryAttributeClient;

function initClients() {
  appsClient = createAppsClientMozu();

  let Client = require('mozu-node-sdk/client');
  let constants = Client.constants;
  let categoryAttributeFactory = Client.sub({
    getCategoryAttributes: Client.method({
      method: constants.verbs.GET,
      url: "{+tenantPod}api/commerce/catalog/admin/categoryattributedefinition/attributes"
    }),
    updateCategoryAttribute: Client.method({
      method: constants.verbs.PUT,
      url: "{+tenantPod}api/commerce/catalog/admin/categoryattributedefinition/attributes/{attributeFQN}"
    }),
    createCategoryAttribute: Client.method({
      method: constants.verbs.POST,
      url: "{+tenantPod}api/commerce/catalog/admin/categoryattributedefinition/attributes"
    }),
  })
  categoryAttributeClient = new categoryAttributeFactory(appsClient)
}
const generateAttributes = async (attribute) => {
  try {
    const response = await categoryAttributeClient.createCategoryAttribute(null, {
      body: attribute,
    });
    console.log('attribute created');
  } catch (error) {
    console.error(`'Error in adding ${attribute.attributeFQN}`, error.originalError.message);
    if (error.originalError.statusCode === 409) {
      try {
        await categoryAttributeClient.updateCategoryAttribute(
          { attributeFQN: attribute.attributeFQN },
          { body: attribute }
        );
        console.log(`Updated ${attribute.attributeFQN} Successfully`);
      } catch (updateError) {
        console.error(
          'Error while updating attribute',
          updateError.originalError.message
        );
      }
    }
  }
};
async function* exportAttributes() {
  let page = 0;
  while (true) {
    let ret = await categoryAttributeClient.getCategoryAttributes({
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
export async function importCategoryAttributes() {
  var spinner = new Spinner('importing Category attributes... %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let attribute of dataStream) {
    generateAttributes(attribute);
  }
  spinner.stop();
  console.log('attribute imported');
}

export async function exportCategoryAttributes() {
  var spinner = new Spinner('exporting Category attributes... %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let attribute of exportAttributes()) {
    delete attribute['auditInfo'];
    await stream.write(attribute);
  }
  stream.end();
  spinner.stop(true);
  console.log('Category attributes exported');
}
