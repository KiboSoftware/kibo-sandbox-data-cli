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

const nconf = require('nconf');

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
    importCategories,
    importAllProducts,
    importAllProductAttributes,
    importAllProductTypes,
    importAllLocations,
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

if (nconf.get('all:export')) {
  exportAllData().then(() => console.log('--The project data is exported--'));
}
if (nconf.get('all:clean')) {
  deleteAllData().then(() => console.log('--The project data is deleted--'));
} else if (nconf.get('all:import')) {
  importAllData().then(() => console.log('--All data is imported--'));
} else if (nconf.get('start')) {
  deleteAndImport().then(() => console.log('--All data is imported--'));
}
