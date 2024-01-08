import * as fsPromise from 'fs/promises';
import fs from 'fs';
import { pipeline } from 'stream';
import util from 'util';
import path from 'path';
import { Spinner } from 'cli-spinner';
import nconf from 'nconf';
import { createFilesDirIfNotExists, isValidZip } from '../utilites';
import { createAppsClientMozu } from '../profile';
import { allResources, pollJob, constants } from './shared';
import AdmZip from 'adm-zip';
import StreamZip from 'node-stream-zip';
import * as csv from 'fast-csv';
// reading archives
const asyncPipeline = util.promisify(pipeline);

nconf.argv();

let appsClient, importClient, tenantClient;

function initClients() {
  appsClient = createAppsClientMozu();
  importClient = require('../clients/import')(appsClient);
  tenantClient = require('mozu-node-sdk/clients/platform/tenant')(appsClient);
}
const pathSegments = [];
const dataDir = nconf.get('data') || './data';
if (nconf.get('exportFile')) {
  pathSegments.push(nconf.get('exportFile'));
} else {
  pathSegments.push(dataDir, 'catalog-export.zip');
}
const exportZipPath = path.join(...pathSegments);
const importZipPath = path.resolve(dataDir, 'catalog-import.zip');
const importDir = path.resolve(dataDir, 'catalog-import');

async function upload() {
  try {
    console.log('uploading catalog import file');
    const file = await fsPromise.readFile(importZipPath);
    const response = await importClient.uploadFile(
      { fileName: 'catalog-import-test.zip' },
      { body: file }
    );
    console.log('catalog import file upload complete');
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('unable to upload catalog import file');
  }
}
async function createImport(
  remoteFile,
  tenant,
  site,
  masterCatalog,
  resources = allResources()
) {
  console.log(`creating import job for file id: ${remoteFile.id}`);
  const req = {
    name: 'kibo-ucp-cli-catalog-import',
    domain: 'catalog',
    resources,
    contextOverride: {
      masterCatalog: masterCatalog.id,
      locale: site.localeCode,
      currency: site.countryCode,
      catalog: site.catalogId,
      site: site.id,
    },
    files: [remoteFile],
  };
  return importClient.create(null, { body: req });
}

async function cleanupTemp() {
  await fsPromise.rm(importDir, { recursive: true, force: true });
  await fsPromise.rm(importZipPath, { recursive: true, force: true });
}
async function generateImportZipForKiboContext(masterCatalog, siteCatalog) {
  try {
    console.log('creating creating import zip file.');
    const { name: masterCatalogName } = masterCatalog;
    const { name: siteCatalogName } = siteCatalog;
    const importZip = new AdmZip();
    const exportZip = new StreamZip.async({ file: exportZipPath });
    const entries = await exportZip.entries();
    for (const entry of Object.values(entries)) {
      const entryStream = await exportZip.stream(entry.name);
      const generatedFile = await generateResourceFile(
        masterCatalogName,
        siteCatalogName,
        entry.name,
        entryStream
      );
      // csv parser will not write file if file only contains headers
      // in that case, copy zip entry to output directory to prevent import api errors
      if (!generatedFile.size) {
        await exportZip.extract(entry, generatedFile.path);
      }
      importZip.addLocalFile(generatedFile.path);
    }
    importZip.writeZip(importZipPath);
  } catch (error) {
    console.error(error);
    throw new Error('unable to generate kibo import zip from export file');
  }
}

async function generateResourceFile(
  masterCatalogName,
  catalogName,
  fileName,
  readStream
) {
  try {
    const resourceFilePath = path.join(importDir, fileName);
    createFilesDirIfNotExists(resourceFilePath);
    const transformCatalogName = (row: any): any => {
      if (row[constants.HEADERS.MASTER_CATALOG]) {
        row[constants.HEADERS.MASTER_CATALOG] = masterCatalogName;
      }
      if (row[constants.HEADERS.CATALOG]) {
        row[constants.HEADERS.CATALOG] = catalogName;
      }
      return row;
    };
    const writeStream = fs.createWriteStream(resourceFilePath);
    await asyncPipeline(
      readStream,
      csv.parse({ headers: true }),
      csv
        .format({
          headers: true,
          rowDelimiter: '\r\n',
          writeHeaders: true,
        })
        .transform(transformCatalogName),
      writeStream
    );
    // fast-csv library won't write headers for empty files
    const { size } = await fsPromise.stat(resourceFilePath);
    return { path: resourceFilePath, size };
  } catch (error) {
    console.log('unable to write resource file');
    throw error;
  }
}

export async function importAllCatalogByAPI() {
  var spinner = new Spinner('importing catalog via api.. %s');
  const updateSpinner = (text) => (spinner.text = `${text}... %s`);
  spinner.start();
  try {
    initClients();
    // check for valid catalog export file
    await isValidZip(exportZipPath);

    // // fetch tenant / site data
    const tenant = await tenantClient.getTenant({
      tenantId: tenantClient.context.tenant,
    });
    const site = tenant.sites.find((x) => x.id == tenantClient.context.site);
    const masterCatalog = tenant.masterCatalogs.find((x) =>
      x.catalogs.some((y) => y.id == site.catalogId)
    );
    const siteCatalog = masterCatalog.catalogs.find(
      (c) => c.id == site.catalogId
    );
    if (!siteCatalog) {
      throw new Error('No catalog configured for site');
    }
    updateSpinner('creating catalog-import zip');
    // parse export files, modify catalog names and generate import zip
    await generateImportZipForKiboContext(masterCatalog, siteCatalog);
    //validate zip created
    await isValidZip(importZipPath);
    // upload import zip to kibo
    updateSpinner('sending catalog-import to kibo');
    const remoteFile = await upload();
    // create kibo import job
    updateSpinner('creating catalog-import job');
    const importJob = await createImport(
      remoteFile,
      tenantClient.context.tenant,
      site,
      masterCatalog
    );
    updateSpinner('checking import job status');
    // check kibo import job status
    await pollJob((id) => importClient.get({ id }), importJob.id);
    spinner.stop();
    console.log(`import catalog via api complete`);
  } catch (error) {
    console.log('import catalog via api failed');
  } finally {
    spinner.stop();
    //await cleanupTemp();
  }
}
