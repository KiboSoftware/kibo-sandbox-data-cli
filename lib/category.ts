import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'categories.jsonl'
);

let appsClient, categoryMethod;
function initClients() {
  appsClient = createAppsClientMozu();

  categoryMethod =
    require('mozu-node-sdk/clients/commerce/catalog/admin/category')(
      appsClient
    );
}

//function for creating discount
const generateCategory = async (categoryData) => {
  if (categoryData.id) {
    categoryData = await categoryMethod.updateCategory(
      {
        categoryId: categoryData.id,
        id: categoryData.id,
        cascadeVisibility: false,
      },
      { body: categoryData }
    );
    console.log('Successfully updated categories');
    return categoryData;
  }

  try {
    categoryData = await categoryMethod.addCategory(
      { incrementSequence: true, useProvidedId: true },
      { body: categoryData }
    );
    console.log('Successfully added categories');
    return categoryData;
  } catch (error) {
    console.error('Error in adding categories', error.originalError.message);
  }
};

//below function will clean the data , delete category
const deleteCategory = async (categoryData) => {
  try {
    await categoryMethod.deleteCategoryById({
      categoryId: categoryData.id,
      id: categoryData.id,
      cascadeDelete: true,
      forceDelete: true,
      reassignToParent: false,
    });
    console.log('Successfully deleted categories');
  } catch (deleteError) {
    console.error(
      'Error while cleaning , deleting categories',
      deleteError.originalError.message
    );
  }
};

export async function allCategories() {
  initClients();
  let page = 0;
  let cats = [];
  const catHash = {};
  const catIdHash = {};
  const depth = (cat, cur = 0) => {
    if (!cat || cur > 20) {
      return cur - 1;
    }
    return depth(catHash[cat.parentCategoryCode], cur + 1);
  };
  const comp = (a, b) => {
    const depthA = depth(a);
    const depthB = depth(b);
    if (depthA > depthB) {
      return -1;
    }
    if (depthB > depthA) {
      return 1;
    }
    return 0;
  };
  while (true) {
    let ret = await categoryMethod.getCategories({
      startIndex: page * 200,
      pageSize: 200,
    });
    ret.items.forEach((cat) => {
      catHash[cat.categoryCode] = cat;
      catIdHash[cat.id] = cat;
      cats.push(cat);
    });
    page++;
    if (ret.pageCount <= page) {
      break;
    }
  }
  return {
    list: cats.sort(comp),
    lookup: catHash,
    idLookup: catIdHash,
  };
}

export async function importCategories() {
  var spinner = new Spinner('importing categories.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  let catLookup = (await allCategories()).lookup;
  for await (let categoryDetail of dataStream) {
    categoryDetail.id = catLookup[categoryDetail.categoryCode]?.id;
    categoryDetail.parentCategoryId =
      catLookup[categoryDetail.parentCategoryCode]?.id;
    categoryDetail = await generateCategory(categoryDetail);
    catLookup[categoryDetail.categoryCode] = categoryDetail;
  }
  spinner.stop();
  console.log('categories imported');
}

export async function exportCategories() {
  var spinner = new Spinner('exporting categories.. %s');
  spinner.start();
  initClients();
  const allCats = (await allCategories()).list;
  const stream = createJsonLFileWriteStream(dataFilePath);

  allCats.forEach((cat) => {
    ['id', 'parentCategoryId', 'auditInfo'].forEach((key) => delete cat[key]);
    delete cat.id;
    delete cat.parentCategoryId;
    delete cat.auditInfo;
    stream.write(cat);
  });
  stream.end();
  spinner.stop(true);
  console.log('categories exported');
}

export async function deleteCategories() {
  initClients();
  const allCats = (await allCategories()).list.reverse();
  for await (let categoryDetail of allCats) {
    await deleteCategory(categoryDetail);
  }
}
