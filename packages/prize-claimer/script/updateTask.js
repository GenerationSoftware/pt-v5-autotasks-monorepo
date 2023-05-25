#!/usr/bin/env node

import Configstore from "configstore";
import { AutotaskClient } from "defender-autotask-client";
import fs from "fs";

import pkg from "../package.json";
const config = new Configstore(pkg.name);
const chainId = config.get("CHAIN_ID");

async function updateAutotask(autotaskId, file) {
  const client = new AutotaskClient({
    apiKey: config.get("DEFENDER_TEAM_API_KEY"),
    apiSecret: config.get("DEFENDER_TEAM_SECRET_KEY"),
  });

  const source = fs.readFileSync(file);

  console.log(`Updating autotask ${autotaskId} with sourcefile ${file}`);

  await client.updateCodeFromSources(autotaskId, {
    "index.js": source,
  });
}

async function run() {
  await updateAutotask(config.get(`${chainId}.AUTOTASK_ID`), "./dist/handler.cjs");
}

run();
