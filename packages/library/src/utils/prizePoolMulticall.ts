import { BigNumber, providers } from "ethers";
import { ContractCallContext } from "ethereum-multicall";

import { ContractsBlob, Vault } from "../types";
import { getComplexMulticallResults } from "../utils";

// TODO: Have this take into account the contractsVersion from getContract()?
// export const getPrizePoolEtherplexContract = (contracts) => {
//   const prizePoolContractBlob = contracts.contracts.find(
//     (contract) => contract.type === "PrizePool"
//   );

//   const prizePoolAddress = prizePoolContractBlob.address;
//   const abi = prizePoolContractBlob.abi;

//   return contract(prizePoolAddress, abi, prizePoolAddress);
// };

/**
 * Returns winners sorted by vault and tier
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param vaults vaults to query through
 * @param tiersArray an easily iterable range of numbers for each tier available (ie. [0, 1, 2])
 * @returns
 */
// TODO: canary tier
export const getWinners = async (
  readProvider: providers.Provider,
  contracts: ContractsBlob,
  vaults: Vault[],
  tiersArray: number[]
): Promise<string[]> => {
  const winners: string[] = [];

  const prizePoolContractBlob = contracts.contracts.find(
    (contract) => contract.type === "PrizePool"
  );

  // const queries: ContractCallContext[] = [];
  const calls: ContractCallContext["calls"] = [];

  vaults.forEach((vault) => {
    vault.accounts.forEach((account) => {
      const address = account.id.split("-")[1];

      tiersArray.forEach((tierNum) => {
        calls.push({
          reference: `${vault.id}-${address}-${tierNum}`,
          methodName: "isWinner",
          methodParameters: [vault.id, address, tierNum],
        });
      });
    });
  });

  const prizePoolAddress = prizePoolContractBlob.address;

  const queries: ContractCallContext[] = [
    {
      reference: prizePoolAddress,
      contractAddress: prizePoolAddress,
      abi: prizePoolContractBlob.abi,
      calls,
    },
  ];

  const multicallResults = await getComplexMulticallResults(readProvider, queries);
  console.log("multicallResults");
  console.log(multicallResults);

  console.log("filter");
  Object.entries(multicallResults[prizePoolAddress]).forEach((vaultUserTierResult) => {
    const key = vaultUserTierResult[0];
    const value = vaultUserTierResult[1];
    if (value[0]) {
      winners.push(key);
    }
  });

  // const winners = Object.entries(multicallResults[prizePoolAddress]).map((index, entry) => {
  //   const key = entry[0];
  //   const value = entry[1];
  //   console.log(index);
  //   console.log(entry);
  //   if (!!value[0]) {
  //     return key;
  //   }
  // });
  // const winners = Object.entries(multicallResults[prizePoolAddress]).filter(
  //   (key, vaultAccountTier) => {
  //     return vaultAccountTier[0] === true;
  //   }
  // );
  console.log("winners");
  console.log(winners);

  // filteredVaults.forEach((vault) => {
  //   const exchangeRate: string | undefined =
  //     multicallResults[vault.address]["convertToAssets"]?.[0];
  //   if (!!exchangeRate) {
  //     const vaultId = getVaultId(vault);
  //     vaultExchangeRates[vaultId] = BigNumber.from(exchangeRate);
  //   }
  // });

  return winners;
};
