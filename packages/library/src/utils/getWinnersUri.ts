const WINNERS_PROTOCOL_AND_HOSTNAME = `https://raw.githubusercontent.com`;
const WINNERS_ORG_AND_REPO = `GenerationSoftware/pt-v5-winners`;

export const getWinnersUri = (
  chainId: number,
  prizePoolAddress: string,
  drawId: number,
  vaultAddress: string,
) => {
  const path = `/main/winners/vaultAccounts/${chainId}/${prizePoolAddress.toLowerCase()}/draw/${drawId}/${vaultAddress.toLowerCase()}.json`;
  return `${WINNERS_PROTOCOL_AND_HOSTNAME}/${WINNERS_ORG_AND_REPO}${path}`;
};
