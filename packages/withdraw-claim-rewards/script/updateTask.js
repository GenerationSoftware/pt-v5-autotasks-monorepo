#!/usr/bin/env node

import { AutotaskClient } from "defender-autotask-client";
import fs from "fs";

async function updateAutotask(autotaskId, file) {
  const client = new AutotaskClient({
    apiKey: DEFENDER_TEAM_API_KEY,
    apiSecret: DEFENDER_TEAM_SECRET_KEY
  });

  const source = fs.readFileSync(file);

  console.log(`Updating autotask ${autotaskId} with sourcefile ${file}`);

  await client.updateCodeFromSources(autotaskId, {
    "index.js": source
  });
}

async function run() {
  await updateAutotask(AUTOTASK_ID, "./dist/handler.cjs");
}

run();
