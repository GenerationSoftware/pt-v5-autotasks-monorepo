const DRAW_RESULTS_PROTOCOL_AND_HOSTNAME = `https://raw.githubusercontent.com`;
const DRAW_RESULTS_ORG_AND_REPO = `GenerationSoftware/pt-v5-draw-results-mainnet`;
const DRAW_RESULTS_TESTNET_ORG_AND_REPO = `GenerationSoftware/pt-v5-draw-results-testnet`;
const DRAW_RESULTS_URI = {
  10: `${DRAW_RESULTS_PROTOCOL_AND_HOSTNAME}/${DRAW_RESULTS_ORG_AND_REPO}`,
  420: `${DRAW_RESULTS_PROTOCOL_AND_HOSTNAME}/${DRAW_RESULTS_TESTNET_ORG_AND_REPO}`,
};

export const getDrawResultsUri = (chainId: number, prizePoolAddress: string, drawId: number) => {
  const path = `/main/prizes/${chainId}/${prizePoolAddress.toLowerCase()}/draw/${drawId}/prizes.json`;
  return `${DRAW_RESULTS_URI[chainId]}${path}`;
};
