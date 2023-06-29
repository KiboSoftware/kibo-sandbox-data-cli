const Client = require('mozu-node-sdk/client'),
  constants = Client.constants;
module.exports = Client.sub({
  getLocationGroupConfiguration: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/commerce/admin/locationGroupConfiguration/{locationGroupCode}',
  }),
  getLocationGroupConfigurationByLocation: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/commerce/admin/locationGroupConfiguration/location/{locationCode}',
  }),
  setLocationGroupConfiguration: Client.method({
    method: constants.verbs.PUT,
    url: '{+tenantPod}api/commerce/admin/locationGroupConfiguration/{locationGroupCode}',
  }),
});
