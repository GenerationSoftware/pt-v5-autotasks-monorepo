#!/usr/bin/env node

import { AutotaskClient } from 'defender-autotask-client';
import fs from 'fs';

const chainId = config.get('CHAIN_ID');

async function updateAutotask(autotaskId, file) {
  const config = {
    apiKey: process.env.DEFENDER_TEAM_API_KEY,
    apiSecret: process.env.DEFENDER_TEAM_API_SECRET,
  };

  const client = new AutotaskClient(config);

  const source = fs.readFileSync(file);

  console.log(`Updating autotask ${autotaskId} with sourcefile ${file}`);

  await client.updateCodeFromSources(autotaskId, {
    'index.js': source,
  });
}

async function run() {
  await updateAutotask(process.env.AUTOTASK_ID, './dist/handler.cjs');
}

run();
