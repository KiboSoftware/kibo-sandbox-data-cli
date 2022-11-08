import path from 'path';
import { setTimeout } from 'timers/promises';
import {
  createJsonLFileStream,
  createJsonLFileWriteStream,
  isValidZip,
} from './utilites';
import { createAppsClientMozu } from './profile';
import util from 'util';
import { pipeline } from 'stream';
import * as csv from 'fast-csv';
import nconf from 'nconf';
import StreamZip from 'node-stream-zip';
const asyncPipeline = util.promisify(pipeline);

nconf.argv();

const dataDir = nconf.get('data') || './data';
const locationsFilePath = path.join(dataDir, 'locations.jsonl');
const inventoryFilePath = path.join(dataDir, 'inventory.jsonl');
const catalogExportPath = path.join(dataDir, 'catalog-export.zip');
let appsClient, inventoryClient;
function initClients() {
  appsClient = createAppsClientMozu();

  inventoryClient = require('mozu-node-sdk/clients/commerce/inventory')(
    appsClient
  );
}

class InventoryBatch {
  locationCode: any;
  items: any[];
  batchSize: number;
  constructor() {
    this.items = [];
    this.batchSize = 3000;
  }
  addItem(inventoryRecord) {
    const {
      upc,
      floor = 0,
      safetyStock = 0,
      onHand,
      ltd = 0,
    } = inventoryRecord;
    this.items.push({
      upc,
      floor,
      safetyStock,
      LTD: ltd,
      quantity: onHand,
    });
  }
  toJSON() {
    return { locationCode: this.locationCode, items: [...this.items] };
  }
  clear() {
    this.items = [];
  }
  full() {
    return this.items.length === this.batchSize;
  }
  size() {
    return this.items.length;
  }
}

class RefetchJobManager {
  jobs: any;
  constructor() {
    this.jobs = new Set();
  }
  async create(batch) {
    try {
      if (!batch.locationCode || batch.size() === 0) {
        return;
      }
      const refreshJob = await inventoryClient.refreshInventory(null, {
        body: batch.toJSON(),
      });
      batch.clear();
      this.watch(refreshJob.jobID);
      console.log(`inventory refresh job created ${refreshJob.jobID}`);
    } catch (error) {
      console.error(error);
    }
  }
  async watch(id) {
    this.jobs.add(id);
    let resp = null;
    console.log(`jobid: ${id}`);
    while (true) {
      await setTimeout(5000);
      resp = await inventoryClient.getInventoryJob({ jobId: id });
      if (resp.success || resp.status === 'FAILED') {
        break;
      }
      console.log(`polling status:  ${resp.status}`);
    }
    console.log(
      `jobid: ${id} locationCode: ${resp.locationCode} status:  ${resp.status} items: ${resp.itemCount}`
    );
    if (resp.messages) {
      for (let message of resp.messages) {
        console.log(`jobid: ${id} message: ${message}`);
      }
    }
    this.jobs.delete(id);
    return resp;
  }
  async waitForJobs() {
    while (this.jobs.size) {
      await setTimeout(5000);
    }
  }
}

async function* exportLocationInventory(locationCode) {
  let page = 1,
    pageSize = 200;
  while (true) {
    const resp = await inventoryClient.getInventory(null, {
      body: {
        requestLocation: {
          locationCode,
        },
        type: 'ANY',
        pageSize,
        pageNum: page,
      },
    });
    for (const prod of resp) {
      yield prod;
    }
    page++;
    if (resp.length <= pageSize) {
      break;
    }
  }
}

export async function exportAllInventory() {
  initClients();
  const locationStream = createJsonLFileStream(locationsFilePath);
  const inventoryStream = createJsonLFileWriteStream(inventoryFilePath);
  for await (let location of locationStream) {
    for await (let inventory of exportLocationInventory(location.code)) {
      await inventoryStream.write(inventory);
    }
  }
}
export async function importAllInventory() {
  initClients();
  let dataStream = createJsonLFileStream(inventoryFilePath);
  const inventoryBatch = new InventoryBatch();
  const jobManager = new RefetchJobManager();
  for await (let record of dataStream) {
    if (inventoryBatch.locationCode !== record.locationCode) {
      await jobManager.create(inventoryBatch);
    }
    if (inventoryBatch.full()) {
      await jobManager.create(inventoryBatch);
    }
    inventoryBatch.locationCode = record.locationCode;
    inventoryBatch.addItem(record);
  }
  if (inventoryBatch.size() > 0) {
    await jobManager.create(inventoryBatch);
  }
  await jobManager.waitForJobs();
}

async function getStandardProducts() {
  await isValidZip(catalogExportPath);
  const catalogZip = new StreamZip.async({ file: catalogExportPath });
  const readStream = await catalogZip.stream('productoptions.csv');
  readStream.on('end', () => catalogZip.close());

  const transformer = (row) => {
    const { ProductCode, ProductUsage } = row;
    return { ProductCode, ProductUsage };
  };
  const standardProducts = [];
  const parser = csv
    .parse({ headers: true })
    .transform(transformer)
    .on('data', (row) => {
      if (row.ProductUsage === 'Standard') {
        standardProducts.push(row.ProductCode);
      }
    });
  await asyncPipeline(readStream, parser);
  return standardProducts;
}

async function getConfigurableProduct() {
  await isValidZip(catalogExportPath);

  const catalogZip = new StreamZip.async({ file: catalogExportPath });
  const readStream = await catalogZip.stream('productoptions.csv');
  readStream.on('end', () => catalogZip.close());

  const transformer = (row) => {
    const { VariationCode } = row;
    return { VariationCode };
  };
  const products = [];
  const parser = csv
    .parse({ headers: true })
    .transform(transformer)
    .on('data', (row) => {
      products.push(row.VariationCode);
    });
  await asyncPipeline(readStream, parser);
  return products;
}
export async function seedInventory() {
  initClients();
  const seedOnHand = 1000;
  const standard = await getStandardProducts();
  const variants = await getConfigurableProduct();
  const products = [...standard, ...variants];
  const locationStream = createJsonLFileStream(locationsFilePath);
  const jobManager = new RefetchJobManager();
  for await (let location of locationStream) {
    const inventoryBatch = new InventoryBatch();
    inventoryBatch.locationCode = location.code;
    for (const code of products) {
      if (inventoryBatch.full()) {
        await jobManager.create(inventoryBatch);
      }
      inventoryBatch.addItem({ upc: code, onHand: seedOnHand });
    }
    if (inventoryBatch.size() > 0) {
      await jobManager.create(inventoryBatch);
    }
  }
  await jobManager.waitForJobs();
}
