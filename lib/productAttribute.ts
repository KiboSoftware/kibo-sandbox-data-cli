import path from 'path';

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = path.join(
  nconf.get('data') || './data',
  'product-attributes.jsonl'
);
let appsClient, productAttributeMethods;
function initClients() {
  appsClient = createAppsClientMozu();

  productAttributeMethods =
    require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attribute')(
      appsClient
    );
}

//function for creating productAttributes
const generateProductAttribute = async (productAttributeData) => {
  try {
    await productAttributeMethods.addAttribute(productAttributeData);
    console.log('Successfully added productAttribute');
  } catch (error) {
    console.error(
      'Error in adding productAttribute',
      error.originalError.message
    );
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await productAttributeMethods.updateAttribute(
          { attributeFQN: productAttributeData.attributeFQN },
          { body: productAttributeData }
        );
        console.log('Updated productAttribute Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating productAttribute',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete productAttribute
const deleteProductAttribute = async (productAttributeData) => {
  try {
    await productAttributeMethods.deleteAttribute({
      attributeFQN: productAttributeData.attributeFQN,
    });
    console.log('Successfully deleted productAttribute');
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting productAttribute',
      deleteError.originalError.message
    );
  }
};

async function* exportProductAttributes() {
  let page = 0;
  while (true) {
    let ret = await productAttributeMethods.getAttributes({
      startIndex: page * 200,
      pageSize: 200,
    });
    for (const item of ret.items) {
      yield item;
    }
    page++;
    if (ret.pageCount <= page) {
      break;
    }
  }
}

export async function deleteAllProductAttributes() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productAttributeDetail of dataStream) {
    await deleteProductAttribute(productAttributeDetail);
  }
}
export async function importAllProductAttributes() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productAttributeDetail of dataStream) {
    await generateProductAttribute(productAttributeDetail);
  }
}
export async function exportAllProductAttributes() {
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportProductAttributes()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}
