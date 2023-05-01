import { gql, GraphQLClient } from "graphql-request";

import { Vault } from "../types";

const CHAIN_ID = {
  goerli: 5
};

/**
 * Subgraphs to query for depositors
 */
export const TWAB_CONTROLLER_SUBGRAPH_URIS = {
  [CHAIN_ID.goerli]: `https://api.thegraph.com/subgraphs/name/pooltogether/v5-eth-goerli-twab-controller`
};

export const getTwabControllerSubgraphUri = chainId => {
  return TWAB_CONTROLLER_SUBGRAPH_URIS[chainId];
};

export const getTwabControllerSubgraphClient = chainId => {
  const uri = getTwabControllerSubgraphUri(chainId);

  return new GraphQLClient(uri, {
    timeout: 20000
  });
};

/**
 * Pulls from the subgraph all of the vaults and their associated accounts
 *
 * @returns {Promise} Promise of an array of Vault objects
 */
export const getSubgraphVaults = async (chainId: number): Promise<Vault[]> => {
  const client = getTwabControllerSubgraphClient(chainId);

  const query = vaultsQuery();

  const vaultsResponse: any = await client.request(query).catch(e => {
    console.error(e.message);
    throw e;
  });

  // const { vaults } = vaultsResponse || {};
  const vaults = vaultsResponse?.vaults;

  return vaults;
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
