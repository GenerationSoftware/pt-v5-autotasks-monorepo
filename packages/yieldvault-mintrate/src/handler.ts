import { RelayerParams } from "defender-relay-client";

import { processTransactions } from "./transactions";

const handlerLoadParams = () => {
  return { chainId: Number(CHAIN_ID) };
};

export async function handler(event: RelayerParams) {
  console.clear();

  const params = handlerLoadParams();
  console.log(params);

  processTransactions(event, params);
}
