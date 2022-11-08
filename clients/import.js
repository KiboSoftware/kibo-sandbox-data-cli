const Client = require('mozu-node-sdk/client'),
  constants = Client.constants;
module.exports = Client.sub({
  create: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/platform/data/import',
  }),
  get: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/platform/data/import/{id}',
  }),
  uploadFile: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/platform/data/files?fileType=import&fileName={fileName}',
  }),
});
