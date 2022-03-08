import {
  deleteCategories,
  importCategories,
  exportCategories,
} from './category';
import {
  deleteAllProducts,
  importAllProducts,
  exportAllProducts,
} from './product';
import {
  deleteAllProductAttributes,
  importAllProductAttributes,
  exportAllProductAttributes,
} from './productAttribute';
import {
  deleteAllProductTypes,
  importAllProductTypes,
  exportAllProductTypes,
} from './productType';
import {
  deleteAllLocations,
  importAllLocations,
  exportAllLocations,
} from './locations';
import {
  deleteAllDiscounts,
  importAllDiscounts,
  exportAllDiscounts,
} from './discount';
import {
  deleteAllDocumentTypes,
  importAllDocumentTypes,
  exportAllDocumentTypes,
} from './documentType';
import {
  deleteAllDocumentLists,
  importAllDocumentLists,
  exportAllDocumentLists,
} from './documentList';
import {
  deleteAllDocuments,
  importAllDocuments,
  exportAllDocuments,
} from './document';
import { fstat, existsSync } from 'fs';

var ncp = require('ncp').ncp;
const taskReducer = (result, fn) => result.then(fn);

const deleteAllData = () => {
  console.log('--Deleting all data--');
  return [
    deleteAllProducts,
    deleteCategories,
    deleteAllProductAttributes,
    deleteAllProductTypes,
    deleteAllLocations,
    deleteAllDiscounts,
    deleteAllDocuments,
    deleteAllDocumentLists,
    deleteAllDocumentTypes,
  ].reduce(taskReducer, Promise.resolve());
};

const importAllData = () => {
  console.log('--Importing all data--');
  return [
    importAllLocations,
    importAllProductAttributes,
    importAllProductTypes,
    importCategories,
    importAllProducts,
    importAllDiscounts,
    importAllDocumentTypes,
    importAllDocumentLists,
    importAllDocuments,
  ].reduce(taskReducer, Promise.resolve());
};

const exportAllData = () => {
  console.log('--exporting all data--');
  return [
    exportCategories,
    exportAllProducts,
    exportAllProductAttributes,
    exportAllProductTypes,
    exportAllLocations,
    exportAllDiscounts,
    exportAllDocumentTypes,
    exportAllDocumentLists,
    exportAllDocuments,
  ].reduce(taskReducer, Promise.resolve());
};

const deleteAndImport = () =>
  [deleteAllData, importAllData].reduce(taskReducer, Promise.resolve());

const initDataDir = (cfg) => {
  console.log(__dirname);
  const dataDir = require('path').join(__dirname, '..', 'data');
  ncp(dataDir, cfg.data, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log(`inited data dir ${cfg.data}!`);
  });
};
export {
  initDataDir,
  importAllData,
  exportAllData,
  deleteAllData,
  deleteAndImport,
  deleteAllProducts,
  deleteCategories,
  deleteAllProductAttributes,
  deleteAllProductTypes,
  deleteAllLocations,
  deleteAllDiscounts,
  deleteAllDocuments,
  deleteAllDocumentLists,
  deleteAllDocumentTypes,
  importAllLocations,
  importAllProductAttributes,
  importAllProductTypes,
  importCategories,
  importAllProducts,
  importAllDiscounts,
  importAllDocumentTypes,
  importAllDocumentLists,
  importAllDocuments,
  exportCategories,
  exportAllProducts,
  exportAllProductAttributes,
  exportAllProductTypes,
  exportAllLocations,
  exportAllDiscounts,
  exportAllDocumentTypes,
  exportAllDocumentLists,
  exportAllDocuments,
};
