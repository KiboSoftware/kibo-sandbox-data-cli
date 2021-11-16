#! /usr/bin/env node
const createAppsClientMozu = require('../dist/utilites').createAppsClientMozu;
validateCfg();
const app = require('../dist/index');
const fs = require('fs');
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
    command: 'initDataDir',
    desc: 'initDataDir #copies default data directory',
    handler: (argv) => {
      app.initDataDir(argv);
    },
  })
  .command({
    command: 'initEnv',
    desc: 'initEnv #copies creates an empty .env file',
    handler: (argv) => {
      initEnv(argv);
    },
  })
  .demandCommand()
  .strict()
  .help().argv;

function validateCfg() {
  try {
    createAppsClientMozu(true);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
function initEnv(argv) {
  const template = `KIBO_CLIENT_ID=
  KIBO_SHARED_SECRET=
  KIBO_API_BASE_URL=https://home.mozu.com
  KIBO_TENANT=
  KIBO_SITE_ID=
  KIBO_MASTER_CATALOG_ID=1
  KIBO_CATALOG_ID=1`;
  fs.writeFileSync('.env', template);
  console.writeline('update the .env file?');
}
function validatePath(cfg) {
  if (!fs.existsSync(cfg.data)) {
    console.error('missing data directory...run initDataDir?');
    process.exit(2);
  }
}

async function importData(argv) {
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
}
async function exportData(argv) {
  if (argv.all) {
    app.exportAllData(argv);
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
}
async function clearData(argv) {
  if (argv.all) {
    app.deleteAllData(argv);
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
