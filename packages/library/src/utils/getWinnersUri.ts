const WINNERS_PROTOCOL_AND_HOSTNAME = `https://raw.githubusercontent.com`;
const WINNERS_ORG_AND_REPO = `GenerationSoftware/pt-v5-winners-mainnet`;
const WINNERS_TESTNET_ORG_AND_REPO = `GenerationSoftware/pt-v5-winners-testnet`;
const WINNERS_URI = {
  10: `${WINNERS_PROTOCOL_AND_HOSTNAME}/${WINNERS_ORG_AND_REPO}`,
  84532: `${WINNERS_PROTOCOL_AND_HOSTNAME}/${WINNERS_TESTNET_ORG_AND_REPO}`,
  11155420: `${WINNERS_PROTOCOL_AND_HOSTNAME}/${WINNERS_TESTNET_ORG_AND_REPO}`,
};

export const getWinnersUri = (
  chainId: number,
  prizePoolAddress: string,
  drawId: number,
  vaultAddress: string,
) => {
  const path = `/main/winners/vaultAccounts/${chainId}/${prizePoolAddress.toLowerCase()}/draw/${drawId}/${vaultAddress.toLowerCase()}.json`;
  return `${WINNERS_URI[chainId]}${path}`;
};
