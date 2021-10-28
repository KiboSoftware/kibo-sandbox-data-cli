import path from 'path';

import {
  createJsonLFileStream,
  createAppsClientMozu,
  createJsonLFileWriteStream,
} from './utilites';

import nconf from 'nconf';

nconf.argv();

var appsClient = createAppsClientMozu();

var discountMethod =
  require('mozu-node-sdk/clients/commerce/catalog/admin/discount')(appsClient);

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'discounts.jsonl'
);

//function for creating discount
const generateDiscount = async (discountData) => {
  try {
    await discountMethod.createDiscount(discountData);
    console.log('Successfully added discount');
  } catch (error) {
    console.error('Error in adding discount', error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        console.log('disocount id ', discountData.thresholdMessage.discountId);
        await discountMethod.updateDiscount(
          { discountId: discountData.thresholdMessage.discountId },
          { body: discountData }
        );
        console.log('Updated Discount Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating discount',
          updateError.originalError.message
        );
      }
    }
  }
};

//below function will clean the data , delete discount
const deleteDiscount = async (discountData) => {
  try {
    await discountMethod.deleteDiscount({
      discountId: discountData.thresholdMessage.discountId,
    });
    console.log('Successfully deleted discount');
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting discount',
      deleteError.originalError.message
    );
  }
};

async function* exportItems() {
  let page = 0;
  while (true) {
    let ret = await discountMethod.getDiscounts({
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

export async function deleteAllDiscounts() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let item of dataStream) {
    await deleteDiscount(item);
  }
}
export async function importAllDiscounts() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let item of dataStream) {
    await generateDiscount(item);
  }
}
export async function exportAllDiscounts() {
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let item of exportItems()) {
    ['auditInfo'].forEach((key) => delete item[key]);
    await stream.write(item);
  }
}

(async function () {
  if (nconf.get('clean')) {
    await deleteAllDiscounts();
  }

  if (nconf.get('import')) {
    await importAllDiscounts();
  }

  if (nconf.get('export')) {
    await exportAllDiscounts();
  }
})();
