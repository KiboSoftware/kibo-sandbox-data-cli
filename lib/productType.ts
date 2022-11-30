import path from 'path';

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = path.join(
  nconf.get('data') || './data',
  'product-types.jsonl'
);
let appsClient, productTypeMethods;
function initClients() {
  appsClient = createAppsClientMozu();

  productTypeMethods =
    require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType')(
      appsClient
    );
}

//function for creating productType
const generateProductType = async (productTypeData) => {
  try {
    await productTypeMethods.addProductType(productTypeData);
    console.log('Successfully added productType');
  } catch (error) {
    console.error('Error in adding productType', error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await productTypeMethods.updateProductType(
          { productTypeId: productTypeData.id },
          { body: productTypeData }
        );
        console.log('Updated productType Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating productType',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete productType
const deleteProductType = async (productTypeData) => {
  try {
    await productTypeMethods.deleteProductType({
      productTypeId: productTypeData.id,
    });
    console.log('Successfully deleted productType');
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting productType',
      deleteError.originalError.message
    );
  }
};

async function* exportProductTypes() {
  let page = 0;
  while (true) {
    let ret = await productTypeMethods.getProductTypes({
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

export async function deleteAllProductTypes() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productTypeDetail of dataStream) {
    await deleteProductType(productTypeDetail);
  }
}
export async function importAllProductTypes() {
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productTypeDetail of dataStream) {
    await generateProductType(productTypeDetail);
  }
}
export async function exportAllProductTypes() {
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportProductTypes()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}
