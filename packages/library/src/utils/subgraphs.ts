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
  winners: any;
}> => {
  const query = accountsQuery();
  // const variables = { id: address.toLowerCase() };

  const accountsResponse = await client.request(query).catch((e) => {
    console.error(e.message);
    throw e;
  });
  console.log(accountsResponse);
  // const accountsResponse = await client.request(query, variables).catch((e) => {
  //   console.error(e.message);
  //   throw e;
  // });

  // const { accounts } = accountsResponse || {};
  // const { account } = account || {};
  const winners = accountsResponse;

  // draws?.map((draw) => {
  //   claimedAmountsKeyedByDrawId[draw.id.split("-")[1]] = roundPrizeAmount(
  //     BigNumber.from(draw.claimed),
  //     ticket.decimals
  //   );
  // });

  return {
    winners,
  };
};

const accountsQuery = () => {
  return gql`
    query accountsQuery() {
      accounts() {
        id
      }
    }
  `;
};
