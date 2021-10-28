import path from 'path';

import {
  createJsonLFileStream,
  createAppsClientMozu,
  createJsonLFileWriteStream,
} from './utilites';

import nconf from 'nconf';

nconf.argv();

var appsClient = createAppsClientMozu();

var productTypeMethods =
  require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType')(
    appsClient
  );

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'product-types.jsonl'
);

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
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productTypeDetail of dataStream) {
    await deleteProductType(productTypeDetail);
  }
}
export async function importAllProductTypes() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productTypeDetail of dataStream) {
    await generateProductType(productTypeDetail);
  }
}
export async function exportAllProductTypes() {
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportProductTypes()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}
(async function () {
  if (nconf.get('clean')) {
    await deleteAllProductTypes();
  }

  if (nconf.get('import')) {
    await importAllProductTypes();
  }

  if (nconf.get('export')) {
    await exportAllProductTypes();
  }
})();
