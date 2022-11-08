const Client = require('mozu-node-sdk/client'),
  constants = Client.constants;
module.exports = Client.sub({
  export: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/commerce/orders/orderRouting/api/v1/environment/export?tenantID={tenantID}&siteID={siteID}&environmentID={environmentID}',
  }),
  import: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/commerce/orders/orderRouting/api/v1/environment/export?tenantID={tenantID}&siteID={siteID}',
  }),
});
