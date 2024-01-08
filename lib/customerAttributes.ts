
import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'customer-attributes.jsonl'
);
let appsClient, customerAttributeClient;

function initClients() {
  appsClient = createAppsClientMozu();

  let Client = require('mozu-node-sdk/client');
  let constants = Client.constants;
  let customerAttributeFactory = Client.sub({
    getCustomerAttributes: Client.method({
      method: constants.verbs.GET,
      url: "{+tenantPod}api/commerce/customer/attributedefinition/attributes"
    }),
    updateCustomerAttribute: Client.method({
      method: constants.verbs.PUT,
      url: "{+tenantPod}api/commerce/customer/attributedefinition/attributes/{attributeFQN}"
    }),
    createCustomerAttribute: Client.method({
      method: constants.verbs.POST,
      url: "{+tenantPod}api/commerce/customer/attributedefinition/attributes"
    }),
  })
  customerAttributeClient = new customerAttributeFactory(appsClient)
}
const generateAttributes = async (attribute) => {
  try {
    const response = await customerAttributeClient.createCustomerAttribute(null, {
      body: attribute,
    });
    console.log('attribute created');
  } catch (error) {
    console.error(`'Error in adding ${attribute.attributeFQN}`, error.originalError.message);
    if (error.originalError.statusCode === 409) {
      try {
        await customerAttributeClient.updateCustomerAttribute(
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
    let ret = await customerAttributeClient.getCustomerAttributes({
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
export async function importCustomerAttributes() {
  var spinner = new Spinner('importing Customer attributes... %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let attribute of dataStream) {
    generateAttributes(attribute);
  }
  spinner.stop();
  console.log('attribute imported');
}

export async function exportCustomerAttributes() {
  var spinner = new Spinner('exporting Customer attributes... %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let attribute of exportAttributes()) {
    delete attribute['auditInfo'];
    await stream.write(attribute);
  }
  stream.end();
  spinner.stop(true);
  console.log('Customer attributes exported');
}
