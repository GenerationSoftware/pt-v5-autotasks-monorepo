import { gql, GraphQLClient } from "graphql-request";

const CHAIN_ID = {
  goerli: 5,
};

/**
 * Subgraphs to query for depositors
 */
export const TWAB_CONTROLLER_SUBGRAPH_URIS = {
  [CHAIN_ID.goerli]: `https://api.thegraph.com/subgraphs/name/pooltogether/v5-eth-goerli-twab-controller`,
};

export const getTwabControllerSubgraphUri = (chainId) => {
  return TWAB_CONTROLLER_SUBGRAPH_URIS[chainId];
};

export const getTwabControllerSubgraphClient = (chainId) => {
  const uri = getTwabControllerSubgraphUri(chainId);

  return new GraphQLClient(uri, {
    timeout: 20000,
  });
};

export const getAccounts = async (
  client: GraphQLClient
): Promise<{
  vaultsResponse: any;
}> => {
  const query = vaultsQuery();
  // const variables = { id: address.toLowerCase() };

  const vaultsResponse: any = await client.request(query).catch((e) => {
    console.error(e.message);
    throw e;
  });
  console.log(vaultsResponse.vaults[0]);

  const { vaults } = vaultsResponse || {};

  vaults?.map((vault) => {
    console.log(vault.id);
  });

  // draws?.map((draw) => {
  //   claimedAmountsKeyedByDrawId[draw.id.split("-")[1]] = roundPrizeAmount(
  //     BigNumber.from(draw.claimed),
  //     ticket.decimals
  //   );
  // });

  return {
    vaultsResponse,
    // winners,
  };
};

const vaultsQuery = () => {
  return gql`
    {
      vaults {
        id
        accounts {
          id
        }
      }
    }
  `;
};
