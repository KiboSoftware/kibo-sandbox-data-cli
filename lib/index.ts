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
  importAllLocationGroupConfigurations,
  exportAllLocationGroupConfigurations,
} from './locationGroupConfiguration';
import {
  importAllLocationGroups,
  exportAllLocationGroups,
} from './locationGroups';
import { importOrderRouting, exportOrderRouting } from './orderRouting';
import {
  importGeneralSettings,
  exportGeneralSettings,
} from './generalSettings';
import {
  importAllCarrierConfigurations,
  exportAllCarrierConfigurations,
} from './carrierConfiguration';
import {
  importAllInventory,
  exportAllInventory,
  seedInventory,
} from './inventory';
import { exportAllChannels, importAllChannels } from './channel';

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

import { exportAllCatalogByAPI } from './api-import-export/catalogExport';
import { importAllCatalogByAPI } from './api-import-export/catalogImport';
import { activeProfile } from './profile';

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
    importAllChannels,
    importAllLocations,
    importAllLocationGroups,
    importAllLocationGroupConfigurations,
    importGeneralSettings,
    importAllCarrierConfigurations,
    importAllCatalogByAPI,
    importAllDiscounts,
    importAllDocumentTypes,
    importAllDocumentLists,
    importAllDocuments,
    importAllInventory,
    importOrderRouting,
  ].reduce(taskReducer, Promise.resolve());
};

const exportAllData = () => {
  console.log('--exporting all data--');

  return [
    exportAllCatalogByAPI,
    exportAllChannels,
    exportGeneralSettings,
    exportAllDiscounts,
    exportAllLocations,
    exportAllLocationGroups,
    exportAllLocationGroupConfigurations,
    exportAllCarrierConfigurations,
    exportAllDocumentTypes,
    exportAllDocumentLists,
    exportAllDocuments,
    exportAllInventory,
    exportOrderRouting,
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
const setActiveProfile = (env) => {
  activeProfile.set(env);
};
export {
  setActiveProfile,
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
  importAllChannels,
  importAllLocations,
  importAllLocationGroups,
  importAllLocationGroupConfigurations,
  importAllProductAttributes,
  importAllProductTypes,
  importCategories,
  importAllProducts,
  importAllDiscounts,
  importAllDocumentTypes,
  importAllDocumentLists,
  importAllDocuments,
  importGeneralSettings,
  importAllCarrierConfigurations,
  importAllCatalogByAPI,
  exportCategories,
  exportAllCatalogByAPI,
  exportAllChannels,
  exportAllProducts,
  exportAllProductAttributes,
  exportAllProductTypes,
  exportAllLocations,
  exportAllLocationGroups,
  exportAllLocationGroupConfigurations,
  exportAllDiscounts,
  exportAllDocumentTypes,
  exportAllDocumentLists,
  exportAllDocuments,
  exportAllInventory,
  exportOrderRouting,
  exportAllCarrierConfigurations,
};
