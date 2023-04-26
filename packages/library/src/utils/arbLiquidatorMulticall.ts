import { ethers, Contract } from "ethers";
import { Provider } from "@ethersproject/providers";
import { ContractCallContext } from "ethereum-multicall";

import { ContractsBlob, ArbLiquidatorContext, Token, TokenWithRate } from "../types";
import { getComplexMulticallResults } from "../utils";
import { ERC20Abi } from "../abis/ERC20Abi";

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably POOL),
 * This gets complicated because `tokenOut` is the Vault/Yield token, not the underlying
 * asset which is likely the desired token (ie. DAI, USDC) - the desired
 * token is called `tokenOutUnderlyingAsset`
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param vaults vaults to query through
 * @returns
 */
export const arbLiquidatorMulticall = async (
  marketRate: Contract,
  vaults: Contract[],
  liquidationRouter: Contract,
  liquidationPair: Contract,
  contracts: ContractsBlob,
  readProvider: Provider,
  relayerAddress: string
  // ): Promise<ArbLiquidatorContext> => {
): Promise<any> => {
  // let context: ArbLiquidatorContext = {};

  const tokenInCalls: ContractCallContext["calls"] = [];

  // 1. IN TOKEN
  const tokenInAddress = await liquidationPair.tokenIn();
  // const tokenInContract = new ethers.Contract(tokenInAddress, ERC20Abi, readProvider);

  tokenInCalls.push({
    reference: `decimals`,
    methodName: "decimals",
    methodParameters: []
  });
  tokenInCalls.push({
    reference: `name`,
    methodName: "name",
    methodParameters: []
  });
  tokenInCalls.push({
    reference: `symbol`,
    methodName: "symbol",
    methodParameters: []
  });

  const tokenOutCalls: ContractCallContext["calls"] = [];

  // 2. OUT TOKEN
  const tokenOutAddress = await liquidationPair.tokenOut();
  // const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, readProvider);

  tokenOutCalls.push({
    reference: `decimals`,
    methodName: "decimals",
    methodParameters: []
  });
  tokenOutCalls.push({
    reference: `name`,
    methodName: "name",
    methodParameters: []
  });
  tokenOutCalls.push({
    reference: `symbol`,
    methodName: "symbol",
    methodParameters: []
  });

  // // 3. VAULT UNDERLYING ASSET TOKEN
  const tokenOutUnderlyingAssetCalls: ContractCallContext["calls"] = [];

  const vaultContract = contracts.contracts.find(
    contract => contract.type === "Vault" && contract.address === tokenOutAddress
  );
  const tokenOutUnderlyingAsset = vaultContract.tokens[0].extensions.underlyingAsset;
  const tokenOutUnderlyingAssetAddress = tokenOutUnderlyingAsset.address;

  // const tokenOutUnderlyingAssetContract = new ethers.Contract(
  //   tokenOutUnderlyingAsset.address,
  //   ERC20Abi,
  //   readProvider
  // );

  // const tokenOutUnderlyingAsset: Token = {
  //   address: vaultUnderlyingAsset.address,
  //   decimals: await tokenOutUnderlyingAssetContract.decimals(),
  //   name: vaultUnderlyingAsset.name,
  //   symbol: vaultUnderlyingAsset.symbol
  // };

  tokenOutUnderlyingAssetCalls.push({
    reference: `decimals`,
    methodName: "decimals",
    methodParameters: []
  });
  tokenOutUnderlyingAssetCalls.push({
    reference: `name`,
    methodName: "name",
    methodParameters: []
  });
  tokenOutUnderlyingAssetCalls.push({
    reference: `symbol`,
    methodName: "symbol",
    methodParameters: []
  });

  const queries: ContractCallContext[] = [
    {
      reference: tokenInAddress,
      contractAddress: tokenInAddress,
      abi: ERC20Abi,
      calls: tokenInCalls
    },
    {
      reference: tokenOutAddress,
      contractAddress: tokenOutAddress,
      abi: ERC20Abi,
      calls: tokenOutCalls
    },
    {
      reference: tokenOutUnderlyingAssetAddress,
      contractAddress: tokenOutUnderlyingAssetAddress,
      abi: ERC20Abi,
      calls: tokenOutUnderlyingAssetCalls
    }
  ];

  const multicallResults = await getComplexMulticallResults(readProvider, queries);

  const tokenInMulticallsResults = multicallResults[tokenInAddress];
  const tokenIn: Token = {
    address: tokenInAddress,
    decimals: tokenInMulticallsResults.decimals[0],
    name: tokenInMulticallsResults.name[0],
    symbol: tokenInMulticallsResults.symbol[0]
  };
  console.log("multicallResults");
  console.log(multicallResults);
  console.log("tokenIn");
  console.log(tokenIn);

  return {};
};
