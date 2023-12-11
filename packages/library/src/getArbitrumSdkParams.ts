import { BigNumber } from 'ethers';
import chalk from 'chalk';

import { getBaseFee } from '@arbitrum/sdk/dist/lib/utils/lib';
import { Interface } from '@ethersproject/abi';
import { L1ToL2MessageGasEstimator } from '@arbitrum/sdk';

import { printSpacer } from './utils';
import { DrawAuctionConfigParams, Relay } from './types';
import {
  ERC_5164_MESSAGE_DISPATCHER_ADDRESS,
  ERC_5164_MESSAGE_EXECUTOR_ADDRESS,
  RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS,
} from './constants';

// This is a fake message ID, used for estimating gas costs on Arbitrum
// const RANDOM_BYTES_32_STRING = '0x90344b8b6d0f5572c26c9897fd0170c6d4b3a435268062468c51261fbf8274e9';
const RANDOM_BYTES_32_STRING = '0x00000000000000000000000000000000000000000000000000000000000004e9';

export const getArbitrumSdkParams = async (relay: Relay, params: DrawAuctionConfigParams) => {
  const { readProvider: l2Provider, chainId } = relay;

  const l1Provider = params.rngReadProvider;

  const messageId = RANDOM_BYTES_32_STRING;

  // 1. Compute `listenerCalldata`:
  const listenerCalldata = new Interface([
    'function rngComplete(uint256,uint256,address,uint32,(address,uint64))',
  ]).encodeFunctionData('rngComplete', [
    relay.context.rngResults.randomNumber,
    relay.context.rngResults.rngCompletedAt,
    params.rewardRecipient,
    relay.context.rngRelayLastSequenceId,
    [
      relay.context.rngLastAuctionResult.recipient,
      relay.context.rngLastAuctionResult.rewardFraction,
    ],
  ]);

  // 2. Then compute `remoteOwnerCalldata`:
  const remoteRngAuctionRelayListenerAddress = relay.contracts.rngRelayAuctionContract.address;

  const remoteOwnerCalldata = new Interface([
    'function execute(address,uint256,bytes)',
  ]).encodeFunctionData('execute(address,uint256,bytes)', [
    remoteRngAuctionRelayListenerAddress,
    0,
    listenerCalldata,
  ]);

  // 3. Finally compute `executeMessageData`:
  const executeMessageData = new Interface([
    'function executeMessage(address,bytes,bytes32,uint256,address)',
  ]).encodeFunctionData('executeMessage', [
    relay.contracts.remoteOwnerContract.address,
    remoteOwnerCalldata,
    messageId,
    params.rngChainId,
    RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS[chainId],
  ]);

  const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(l2Provider);

  const baseFee = await getBaseFee(l1Provider);

  /**
   * The estimateAll method gives us the following values for sending an L1->L2 message
   * (1) maxSubmissionCost: The maximum cost to be paid for submitting the transaction
   * (2) gasLimit: The L2 gas limit
   * (3) deposit: The total amount to deposit on L1 to cover L2 gas and L2 message value
   */
  let { deposit, gasLimit, maxSubmissionCost } = await l1ToL2MessageGasEstimate.estimateAll(
    {
      from: ERC_5164_MESSAGE_DISPATCHER_ADDRESS[chainId],
      to: ERC_5164_MESSAGE_EXECUTOR_ADDRESS[chainId],
      l2CallValue: BigNumber.from(0),
      excessFeeRefundAddress: params.rngRelayerAddress,
      callValueRefundAddress: params.rngRelayerAddress,
      data: executeMessageData,
    },
    baseFee,
    l1Provider,
  );

  const gasPriceBid = await l2Provider.getGasPrice();
  printSpacer();
  console.log(chalk.yellow(`L2 gas price bid: ${gasPriceBid.toString()}`));
  printSpacer();

  gasLimit = gasLimit.mul(2);
  printSpacer();
  console.log(chalk.yellow(`L2 gas limit modified by 2x: ${gasLimit.toString()}`));
  printSpacer();

  return { deposit, gasLimit, maxSubmissionCost, gasPriceBid };
};
