import { setTimeout } from 'timers/promises';

const toResource = (resource) => ({
  resource,
  format: 'legacy',
  fields: ['*'],
});

export const constants = {
  HEADERS: {
    MASTER_CATALOG: 'MasterCatalogName',
    CATALOG: 'CatalogName',
  },
  CATALOG_RESOURCE_TYPES: [
    'productoptions',
    'productpropertylocale',
    'productoptionlocalization',
    'productcatalog',
    'products',
    'attributes',
    'productimages',
    'productbundles',
    'productextras',
    'producttypes',
    'pricelists',
    'pricelistentries',
    'pricelistentryprices',
    'pricelistentryextras',
    'categories',
    'categoryimages',
    'producttypeattributes',
    'producttypeattributevalues',
    'attributevalues',
  ],
};

export const allResources = () =>
  constants.CATALOG_RESOURCE_TYPES.map(toResource);

export async function pollJob(jobStatus: (id) => Promise<any>, id) {
  let resp = null;
  console.log(`jobid: ${id}`);
  while (true) {
    await setTimeout(5000);
    resp = await jobStatus(id);
    if (resp.isComplete) {
      break;
    }
    console.log(`polling status:  ${resp.status || 'submitted'}`);
  }
  console.log(`jobid: ${id}\nstatus:  ${resp.status}`);
  if (resp.statusMessage) {
    console.log(`statusMessage: ${resp.statusMessage}`);
  }
  if (resp.statusDetails) {
    console.log(`statusDetails: ${resp.statusDetails}`);
  }
  for (const sub of resp.resources || []) {
    console.log(
      `resource: ${sub.resource} sub.status: ${sub.status} stateDetails:  ${sub.stateDetails}`
    );
  }
  return resp;
}
