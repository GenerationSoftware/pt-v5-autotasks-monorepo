import { RelayerParams } from "defender-relay-client";

import { processTransactions } from "./transactions";

const handlerLoadParams = () => {
  return { chainId: Number(CHAIN_ID) };
};

export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  await processTransactions(event, params);
}
