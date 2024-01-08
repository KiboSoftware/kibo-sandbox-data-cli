#! /usr/bin/env node
const createAppsClientMozu = require('../dist/profile').createAppsClientMozu;
const yenv = require('yenv');
const fs = require('fs');
const path = require('path');
const profiles = {
  IMPORT: 'import',
  EXPORT: 'export',
  DELETE: 'clear',
};
const app = require('../dist/index');
const args = require('yargs/yargs')(process.argv.slice(2))
  .option('all', {
    alias: 'a',
    type: 'boolean',
    describe: 'include all resources',
  })
  .option('data', {
    type: 'string',
    default: './data',
    describe: 'location of data directory',
  })
  .option('categories', {
    describe: 'include categories',
    type: 'boolean',
  })
  .option('discounts', {
    describe: 'include discounts',
    type: 'boolean',
  })
  .option('catalogSet', {
    describe: 'include catalog csvs',
    type: 'boolean',
  })
  .option('fulfillmentSettings', {
    describe: 'include fulfillmentSettings',
    type: 'boolean',
  })
  .option('b2bAttributes', {
    describe: 'include b2bAttributes',
    type: 'boolean',
  })
  .option('customerAttributes', {
    describe: 'include customerAttributes',
    type: 'boolean',
  })
  .option('locationAttributes', {
    describe: 'include locationAttributes',
    type: 'boolean',
  })
  .option('categoryAttributes', {
    describe: 'include categoryAttributes',
    type: 'boolean',
  })
  .option('orderAttributes', {
    describe: 'include orderAttributes',
    type: 'boolean',
  })
  .option('documents', {
    describe: 'include documents from an array of lists',
    type: 'array',
  })
  .option('documentLists', {
    describe: 'include document lists',
    type: 'boolean',
  })
  .option('documentTypes', {
    describe: 'include documentTypes',
    type: 'boolean',
  })
  .option('locations', {
    describe: 'include locations',
    type: 'boolean',
  })
  .option('products', {
    describe: 'include products',
    type: 'boolean',
  })
  .option('productAttributes', {
    describe: 'include productAttributes',
    type: 'boolean',
  })
  .option('productTypes', {
    describe: 'include productTypes',
    type: 'boolean',
  })
  .option('orderRouting', {
    describe: 'include orderRouting',
    type: 'boolean',
  })
  .option('inventory', {
    describe: 'include inventory',
    type: 'boolean',
  })
  .option('locationGroups', {
    describe: 'include inventory',
    type: 'boolean',
  })
  .option('locationGroupConfigurations', {
    describe: 'include inventory',
    type: 'boolean',
  })
  .option('channels', {
    describe: 'include inventory',
    type: 'boolean',
  })
  .option('search', {
    describe: 'include search',
    type: 'boolean',
  })
  .command({
    command: 'export',
    desc: 'export --categoies --documents banners,hero_images ',
    handler: (argv) => {
      exportData(argv);
    },
  })
  .command({
    command: 'import',
    desc: 'import --products --documents banners,hero_images ',
    handler: (argv) => {
      importData(argv);
    },
  })
  .command({
    command: 'clean',
    desc: 'clean --productAttributes --documents banners,hero_images ',
    handler: (argv) => {
      clearData(argv);
    },
  })
  .command({
    command: 'sync',
    desc: 'sync --all ',
    handler: (argv) => {
      syncData(argv);
    },
  })
  .command({
    command: 'initDataDir',
    desc: 'initDataDir #copies default data directory',
    handler: (argv) => {
      app.initDataDir(argv);
    },
  })
  .command({
    command: 'initEnv',
    desc: 'initEnv #copies creates an empty .env.yaml file',
    handler: (argv) => {
      initEnvYaml(argv);
    },
  })
  .demandCommand()
  .strict()
  .help().argv;

function validateCfg(envProfile) {
  try {
    createAppsClientMozu(true, envProfile);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function initEnvYaml(argv) {
  const template = `
${profiles.IMPORT}: 
  KIBO_CLIENT_ID: 
  KIBO_SHARED_SECRET: 
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: 
  KIBO_SITE_ID: 
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1

${profiles.EXPORT}:
  KIBO_CLIENT_ID: 
  KIBO_SHARED_SECRET: 
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: 
  KIBO_SITE_ID: 
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1

${profiles.DELETE}:
  KIBO_CLIENT_ID: 
  KIBO_SHARED_SECRET: 
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: 
  KIBO_SITE_ID: 
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1
`;
  fs.writeFileSync('.env.yaml', template);
  console.log('update the .env.yaml file');
}

function getEnvProfile(argv, profile) {
  const ymlPath = path.resolve(argv.configPath || '.env.yaml');
  return yenv(ymlPath, { env: profile });
}
function validatePath(cfg) {
  if (!fs.existsSync(cfg.data)) {
    console.error('missing data directory...run initDataDir?');
    process.exit(2);
  }
}

async function importData(argv) {
  const importEnv = getEnvProfile(argv, profiles.IMPORT);
  validateCfg(importEnv);
  app.setActiveProfile(importEnv);
  validatePath(argv);
  if (argv.all) {
    await app.importAllData(argv);
  }
  if (argv.productAttributes) {
    await app.importAllProductAttributes(argv);
  }
  if (argv.productTypes) {
    await app.importAllProductTypes(argv);
  }
  if (argv.categories) {
    await app.importCategories(argv);
  }
  if (argv.catalogSet) {
    await app.importAllCatalogByAPI(argv);
  }
  if (argv.products) {
    await app.importAllProducts(argv);
  }
  if (argv.locations) {
    await app.importAllLocations(argv);
  }
  if (argv.discounts) {
    await app.importAllDiscounts(argv);
  }
  if (argv.documentTypes) {
    await app.importAllDocumentTypes(argv);
  }
  if (argv.documentLists) {
    await app.importAllDocumentLists(argv);
  }
  if (argv.documents) {
    await app.importAllDocuments(argv);
  }
  if (argv.orderRouting) {
    await app.importOrderRouting(argv);
  }
  if (argv.locationGroups) {
    await app.importAllLocationGroups(argv);
  }
  if (argv.locationGroupConfigurations) {
    await app.importAllLocationGroupConfigurations(argv);
  }
  if (argv.generalSettings) {
    await app.importGeneralSettings(argv);
  }
  if (argv.fulfillmentSettings) {
    await app.importFulfillmentSettings(argv);
  }
  if (argv.b2bAttributes) {
    await app.importB2BAttributes(argv);
  }
  if (argv.customerAttributes) {
    await app.importCustomerAttributes(argv);
  }
  if (argv.locationAttributes) {
    await app.importLocationAttributes(argv);
  }
  if (argv.categoryAttributes) {
    await app.importCategoryAttributes(argv);
  }
  if (argv.orderAttributes) {
    await app.importOrderAttributes(argv);
  }
  if (argv.inventory) {
    await app.importAllInventory(argv);
  }
  if (argv.channels) {
    await app.importAllChannels(argv);
  }
  if (argv.search) {
    await app.importAllSearch(argv);
  }
}
async function exportData(argv) {
  const exportEnv = getEnvProfile(argv, profiles.EXPORT);
  validateCfg(exportEnv);
  app.setActiveProfile(exportEnv);
  if (argv.all) {
    await app.exportAllData(argv);
  }

  if (argv.productAttributes) {
    await app.exportAllProductAttributes(argv);
  }
  if (argv.productTypes) {
    await app.exportAllProductTypes(argv);
  }
  if (argv.categories) {
    await app.exportCategories(argv);
  }
  if (argv.products) {
    await app.exportAllProducts(argv);
  }
  if (argv.locations) {
    await app.exportAllLocations(argv);
  }
  if (argv.catalogSet) {
    await app.exportAllCatalogByAPI(argv);
  }
  if (argv.discounts) {
    await app.exportAllDiscounts(argv);
  }
  if (argv.documentTypes) {
    await app.exportAllDocumentTypes(argv);
  }
  if (argv.documentLists) {
    await app.exportAllDocumentLists(argv);
  }
  if (argv.documents) {
    await app.exportAllDocuments(argv);
  }
  if (argv.orderRouting) {
    await app.exportOrderRouting(argv);
  }
  if (argv.locationGroups) {
    await app.exportAllLocationGroups(argv);
  }
  if (argv.locationGroupConfigurations) {
    await app.exportAllLocationGroupConfigurations(argv);
  }
  if (argv.generalSettings) {
    await app.exportGeneralSettings(argv);
  }
  if (argv.fulfillmentSettings) {
    await app.exportFulfillmentSettings(argv);
  }
  if (argv.b2bAttributes) {
    await app.exportB2BAttributes(argv);
  }
  if (argv.customerAttributes) {
    await app.exportCustomerAttributes(argv);
  }
  if (argv.locationAttributes) {
    await app.exportLocationAttributes(argv);
  }
  if (argv.categoryAttributes) {
    await app.exportCategoryAttributes(argv);
  }
  if (argv.orderAttributes) {
    await app.exportOrderAttributes(argv);
  }
  if (argv.inventory) {
    await app.exportAllInventory(argv);
  }
  if (argv.channels) {
    await app.exportAllChannels(argv);
  }
  if (argv.search) {
    await app.exportAllSearch(argv);
  }
}
async function clearData(argv) {
  const deleteEnv = getEnvProfile(argv, profiles.DELETE);
  validateCfg(deleteEnv);
  app.setActiveProfile(exportEnv);
  if (argv.all) {
    await app.deleteAllData(argv);
  }

  if (argv.productAttributes) {
    await app.deleteAllProductAttributes(argv);
  }
  if (argv.productTypes) {
    await app.deleteAllProductTypes(argv);
  }
  if (argv.categories) {
    await app.deleteCategories(argv);
  }
  if (argv.products) {
    await app.deleteAllProducts(argv);
  }
  if (argv.locations) {
    await app.deleteAllLocations(argv);
  }
  if (argv.discounts) {
    await app.deleteAllDiscounts(argv);
  }
  if (argv.documentTypes) {
    await app.deleteAllDocumentTypes(argv);
  }
  if (argv.documentLists) {
    await app.deleteAllDocumentLists(argv);
  }
  if (argv.documents) {
    await app.deleteAllDocuments(argv);
  }
}

async function syncData(argv) {
  await exportData(argv);
  await importData(argv);
}
