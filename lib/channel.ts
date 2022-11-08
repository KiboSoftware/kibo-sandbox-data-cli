import path from 'path';
var Spinner = require('cli-spinner').Spinner;

import { createJsonLFileStream, createJsonLFileWriteStream } from './utilites';
import { createAppsClientMozu } from './profile';

import nconf from 'nconf';

nconf.argv();

const dataFilePath = require('path').join(
  nconf.get('data') || './data',
  'channels.jsonl'
);
let appsClient, channelClient;

function initClients() {
  var appsClient = createAppsClientMozu();

  var channelClient = require('mozu-node-sdk/clients/commerce/channel')(
    appsClient
  );
}
const generateChannels = async (channel) => {
  try {
    const response = await channelClient.createChannel(null, {
      body: channel,
    });
    console.log('channel created');
  } catch (error) {
    console.error('Error in adding channel', error.originalError.message);
    if (error.originalError.statusCode === 409 && nconf.get('upsert')) {
      try {
        await channelClient.updateChannel(
          { code: channel.code },
          { body: channel }
        );
        console.log('Updated channel Successfully');
      } catch (updateError) {
        console.error(
          'Error while updating channel',
          updateError.originalError.message
        );
      }
    }
  }
};
async function* exportChannels() {
  let page = 0;
  while (true) {
    let ret = await channelClient.getChannels({
      startIndex: page * 200,
      pageSize: 200,
    });
    for (const prod of ret.items) {
      yield prod;
    }
    page++;
    if (ret.pageCount <= page) {
      break;
    }
  }
}
export async function importAllChannels() {
  var spinner = new Spinner('importing channels.. %s');
  spinner.start();
  initClients();
  let dataStream = createJsonLFileStream(dataFilePath);
  for await (let channel of dataStream) {
    channel.tenantId = channelClient.context.tenant;
    channel.siteIds = [channelClient.context.site];
    generateChannels(channel);
  }
  spinner.stop();
  console.log('channels imported');
}

export async function exportAllChannels() {
  var spinner = new Spinner('exporting channels.. %s');
  spinner.start();
  initClients();
  const stream = createJsonLFileWriteStream(dataFilePath);
  for await (let channel of exportChannels()) {
    delete channel['auditInfo'];
    await stream.write(channel);
  }
  stream.end();
  spinner.stop(true);
  console.log('channels exported');
}
