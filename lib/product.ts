import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import {
  createJsonLFileStream,
  createAppsClientMozu,
  createJsonLFileWriteStream,
} from './utilites';
import { allCategories } from './category';

import nconf from 'nconf';

nconf.argv();

var appsClient = createAppsClientMozu();

var product = require('mozu-node-sdk/clients/commerce/catalog/admin/product')(
  appsClient
);

var productVariant =
  require('mozu-node-sdk/clients/commerce/catalog/admin/products/productVariation')(
    appsClient
  );

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'products.jsonl'
);
const variationDataFilePath = require('path').join(
  nconf.get('data') || './data',
  'product-variations.jsonl'
);

//function for creating documentType
const generateProduct = async (productData) => {
  try {
    await product.addProduct(
      { productCode: productData.productCode },
      { body: productData }
    );
    console.log('Successfully added product');
  } catch (error) {
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await product.updateProduct(
          { productCode: productData.productCode },
          { body: productData }
        );
      } catch (updateError) {
        console.error(
          `Error while updating product ${product.productCode}`,
          updateError.originalError.message
        );
      }
    }
  }
};

//function for creating documentType
const generateProductVariation = async (productDatas, productCode) => {
  productDatas.forEach((element) => {
    delete element.variationkey;
  });
  const body = {
    totalCount: productDatas.length,
    items: productDatas,
  };
  try {
    await productVariant.updateProductVariations(
      { productCode: productCode },
      { body: body }
    );
  } catch (error) {
    console.error(
      `Error in adding product variant ${productCode}`,
      error.originalError.message
    );
  }
};

const prepForExport = (product, cats) => {};

async function* exportProducts() {
  let page = 0;
  while (true) {
    let ret = await product.getProducts({
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
async function* exportProductVariations(productCode) {
  let page = 0;
  while (true) {
    let ret = await productVariant.getProductVariations({
      startIndex: page * 200,
      productCode: productCode,
      filter: 'isActive eq true',
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

//below function will clean the data , delete document
const deleteProduct = async (productData) => {
  try {
    await product.deleteProduct({
      productCode: productData.productCode,
    });
  } catch (deleteError) {
    console.error(
      `Error while cleaning , deleting product ${productData.productCode}`,
      deleteError.originalError.message
    );
  }
};

export async function deleteAllProducts() {
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let productDetail of dataStream) {
    await deleteProduct(productDetail);
  }
}
export async function importAllProducts() {
  let dataStream = createJsonLFileStream(dataFilePath);
  const cats = (await allCategories()).lookup;
  for await (let productDetail of dataStream) {
    productDetail.productInCatalogs?.forEach((catalog) => {
      catalog.productCategories?.forEach((pCat) => {
        pCat.categoryId = cats[pCat.categoryCode]?.id;
      });
      if (catalog.primaryProductCategory) {
        catalog.primaryProductCategory.categoryId =
          cats[catalog.primaryProductCategory.categoryCode]?.categoryId;
      }
    });

    await generateProduct(productDetail);
  }
}
export async function importAllProductVariations() {
  let dataStream = createJsonLFileStream(variationDataFilePath);
  let set = [];
  let curPc = null;
  for await (let variation of dataStream) {
    curPc = curPc || variation.productCode;
    if (variation.productCode !== curPc && set.length) {
      await generateProductVariation(set, curPc);
      curPc = variation.productCode;
      set = [];
    }
    set.push(variation);
  }
  if (set.length) {
    await generateProductVariation(set, curPc);
  }
}
export async function exportAllProducts() {
  var spinner = new Spinner('exporting products.. %s');
  spinner.start();

  const cats = (await allCategories()).idLookup;
  const stream = createJsonLFileWriteStream(dataFilePath);
  const variationStream = createJsonLFileWriteStream(variationDataFilePath);
  for await (let productDetail of exportProducts()) {
    ['auditInfo'].forEach((key) => delete productDetail[key]);
    productDetail.productInCatalogs = productDetail.productInCatalogs?.filter(
      (catalog) => catalog.catalogId === 1
    );
    if (
      !productDetail.productInCatalogs ||
      !productDetail.productInCatalogs?.length
    ) {
      return;
    }
    productDetail.productInCatalogs?.forEach((catalog) => {
      delete catalog.content;
      delete catalog.isPriceOverridden;
      delete catalog.seoContent;
      catalog.isContentOverridden = false;
      catalog.isPriceOverridden = false;
      catalog.isSeoContentOverridden = false;
      catalog.productCategories?.forEach((pCat) => {
        pCat.categoryCode = cats[pCat.categoryId]?.categoryCode;
      });
      if (catalog.primaryProductCategory) {
        catalog.primaryProductCategory.categoryCode =
          cats[catalog.primaryProductCategory.categoryId]?.categoryCode;
      }
    });
    await stream.write(productDetail);
    if (productDetail.productUsage !== 'Configurable') {
      continue;
    }
    for await (let variation of exportProductVariations(
      productDetail.productCode
    )) {
      variation.productCode = productDetail.productCode;
      await variationStream.write(variation);
    }
  }
  spinner.stop(true);
  console.log('products exported');
}
