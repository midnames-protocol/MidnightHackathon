/**
 * Bulletin board common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { 
  BBoardPrivateState, 
  Contract, 
  Witnesses,
  PassportDataPacket 
} from '@midnight-ntwrk/bboard-contract';

/**
 * The private states consumed throughout the application.
 */
export type PrivateStates = {
  /**
   * Key used to provide the private state for passport verification contract deployments.
   */
  readonly bboardPrivateState: BBoardPrivateState;
};

/**
 * Represents a passport verification contract and its private state.
 */
export type BBoardContract = Contract<BBoardPrivateState, Witnesses<BBoardPrivateState>>;

/**
 * The keys of the circuits exported from passport verification contract.
 */
export type BBoardCircuitKeys = 'create_user' | 'validate_nationality' | 'validate_adulthood' | 'passport_is_unexpired';

/**
 * The providers required by the passport verification contract.
 */
export type BBoardProviders = MidnightProviders<BBoardCircuitKeys, PrivateStates>;

/**
 * A passport verification contract that has been deployed to the network.
 */
export type DeployedBBoardContract = FoundContract<BBoardPrivateState, BBoardContract>;

/**
 * Custom Map type matching the contract's map structure
 */
export interface ContractMap<K, V> {
  isEmpty(): boolean;
  size(): bigint;
  member(key: K): boolean;
  lookup(key: K): V;
  [Symbol.iterator](): Iterator<[K, V]>;
}

/**
 * A type that represents the derived combination of public (or ledger), and private state.
 */
export type BBoardDerivedState = {
  readonly userPassportMap: ContractMap<Uint8Array, Uint8Array>;
  readonly adminAddress: Uint8Array;
  readonly passport_data: PassportDataPacket;
};