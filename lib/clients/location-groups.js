const Client = require('mozu-node-sdk/client'),
  constants = Client.constants;
module.exports = Client.sub({
  getGroups: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/commerce/admin/locationGroups?filter={filter}&startIndex={startIndex}&pageSize={pageSize}&sortBy={sortBy}',
  }),
  getGroup: Client.method({
    method: constants.verbs.GET,
    url: '{+tenantPod}api/commerce/admin/locationGroups/{locationGroupCode}',
  }),
  deleteGroup: Client.method({
    method: constants.verbs.DELETE,
    url: '{+tenantPod}api/commerce/admin/locationGroups/{locationGroupCode}',
  }),
  createGroup: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/commerce/admin/locationGroups',
  }),
  setGroupSorts: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}_orderRouting/api/v1/group/{groupId}/setSorts?responseFields={responseFields}',
  }),
  updateGroup: Client.method({
    method: constants.verbs.POST,
    url: '{+tenantPod}api/commerce/admin/locationGroups/{locationGroupCode}',
  }),
});
