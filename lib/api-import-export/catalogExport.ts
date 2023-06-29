import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { pipeline } from 'stream';
import util from 'util';
import { Spinner } from 'cli-spinner';
import nconf from 'nconf';
import { createAppsClientMozu } from '../profile';
import { pollJob, allResources } from './shared';
import path from 'path';

const streamPipeline = util.promisify(pipeline);

nconf.argv();

let appsClient, exportClient, tenantClient;
function initClients() {
  appsClient = createAppsClientMozu();
  exportClient = require('../clients/export')(appsClient);
  tenantClient = require('mozu-node-sdk/clients/platform/tenant')(appsClient);
}
const dataFilePath = path.join(
  nconf.get('data') || './data',
  'catalog-export.zip'
);

async function download(exportResponse) {
  const fileRes = exportResponse.files.find((x) => x.fileType == 'export');
  if (!fileRes) {
    throw new Error('export  not found');
  }
  const linkRes = await exportClient.generateExportLink({
    id: fileRes.id,
    hourDuration: 24,
  });
  const s3Res = await fetch(linkRes);
  if (!s3Res.ok) throw new Error(`unexpected response ${s3Res.statusText}`);
  await streamPipeline(s3Res.body, fs.createWriteStream(dataFilePath));
  console.log(`saved export to ${dataFilePath}`);
}

async function createExport(
  tenantId,
  site,
  masterCatalog,
  resources = allResources()
) {
  try {
    const req = {
      resources,
      name: 'kibo-ucp-cli-catalog-export',
      domain: 'catalog',
      tenant: tenantId,
      contextOverride: {
        masterCatalog: masterCatalog.id,
        locale: site.localeCode,
        currency: site.countryCode,
        catalog: site.catalogId,
        site: site.id,
      },
    };
    return exportClient.create(null, { body: req });
  } catch (error) {
    console.error('error exporting catalog via catalog', error);
    throw new Error(error.message);
  }
}
export async function exportAllCatalogByAPI() {
  var spinner = new Spinner('exporting catalog via api.. %s');
  spinner.start();
  try {
    initClients();
    const tenant = await tenantClient.getTenant({
      tenantId: tenantClient.context.tenant,
    });
    const site = tenant.sites.find((x) => x.id == tenantClient.context.site);
    const masterCatalog = tenant.masterCatalogs.find((x) =>
      x.catalogs.some((y) => y.id == site.catalogId)
    );
    const exportJob = await createExport(
      tenantClient.context.tenant,
      site,
      masterCatalog
    );
    const jobResult = await pollJob(
      (id) => exportClient.get({ id }),
      exportJob.id
    );
    await download(jobResult);
  } catch (error) {
    console.error(error);
  }
  spinner.stop();
  console.log(`export catalog via api complete`);
}
