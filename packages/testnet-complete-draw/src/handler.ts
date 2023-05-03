import { RelayerParams } from "defender-relay-client";

import { processTransaction } from "./transactions";

const handlerLoadParams = () => {
  return { chainId: Number(CHAIN_ID) };
};

export async function handler(event: RelayerParams) {
  console.clear();

  const params = handlerLoadParams();

  processTransaction(event, params);
}
