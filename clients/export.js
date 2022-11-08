const Client = require('mozu-node-sdk/client'),
  constants = Client.constants;
module.exports = Client.sub({
  create: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/platform/data/export',
  }),
  get: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/platform/data/export/{id}',
  }),
  list: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/platform/data/export',
  }),
  generateExportLink: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/platform/data/files/{id}/generatelink?hourDuration={hourDuration}',
  }),
});
