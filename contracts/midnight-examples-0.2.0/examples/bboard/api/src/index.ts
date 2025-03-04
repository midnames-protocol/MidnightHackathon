/**
 * Provides types and utilities for working with bulletin board contracts.
 *
 * @packageDocumentation
 */

import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import type { BBoardDerivedState, BBoardContract, BBoardProviders, DeployedBBoardContract } from './common-types.js';
import {
  type BBoardPrivateState,
  Contract,
  createBBoardPrivateState,
  ledger,
  witnesses,
  PassportDataPacket
} from '@midnight-ntwrk/bboard-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/** @internal */
const bboardContractInstance: BBoardContract = new Contract(witnesses);

/**
 * An API for a deployed bulletin board.
 */
export interface DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BBoardDerivedState>;

  validate_nationality: () => Promise<void>;
  validate_adulthood: () => Promise<void>;
  passport_is_unexpired: () => Promise<void>;
}

// Interface for passport data from the UI form
export interface PassportFormData {
  nationality: string;
  dateOfBirth: Date;
  dateOfEmission: Date;
  expirationDate: Date;
}

/**
 * Provides an implementation of {@link DeployedBBoardAPI} by adapting a deployed bulletin board
 * contract.
 */
export class BBoardAPI implements DeployedBBoardAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                },
              },
            }),
          ),
        ),
        // ...private state...
        from(providers.privateStateProvider.get('bboardPrivateState') as Promise<BBoardPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        return {
          adminAddress: ledgerState.adminAddress,
          passport_data: privateState.userPassportData
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<BBoardDerivedState>;

  /**
   * Validates that the user is argentine
   */
  async validate_nationality(): Promise<void> {
    this.logger?.info('Validating nationality');

    const txData = await this.deployedContract.callTx.validate_nationality();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'validate_nationality',
        txHash: txData.public.txHash,
        blockHeight: txData.public.txHash,
      },
    });
  }

  /**
   * Validates that the user is over 18
   */
  async validate_adulthood(): Promise<void> {
    this.logger?.info('Validating adulthood');

    const txData = await this.deployedContract.callTx.validate_adulthood();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'validate_adulthood',
        txHash: txData.public.txHash,
        blockHeight: txData.public.txHash,
      },
    });
  }

  /**
   * Validates passport is unexpired
   */
  async passport_is_unexpired(): Promise<void> {
    this.logger?.info('Validating passport expiration');

    const txData = await this.deployedContract.callTx.passport_is_unexpired();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'passport_is_unexpired',
        txHash: txData.public.txHash,
        blockHeight: txData.public.txHash,
      },
    });
  }

  /**
   * Deploys a new bulletin board contract to the network.
   */
  static async deploy(providers: BBoardProviders, passportData?: PassportFormData, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    const deployedBBoardContract = await deployContract(providers, {
      privateStateKey: 'bboardPrivateState',
      contract: bboardContractInstance,
      initialPrivateState: await BBoardAPI.getPrivateState(providers, passportData),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  /**
   * Finds an already deployed bulletin board contract on the network, and joins it.
   */
  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedBBoardContract = await findDeployedContract(providers, {
      contractAddress,
      contract: bboardContractInstance,
      privateStateKey: 'bboardPrivateState',
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(providers: BBoardProviders, passportData?: PassportFormData): Promise<BBoardPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get('bboardPrivateState');
    
    // If we have existing private state with valid passport data, use it
    if (existingPrivateState && existingPrivateState.userPassportData) {
      return existingPrivateState;
    }
    
    // Create passport data - either from form or default values
    let examplePassportData: PassportDataPacket;
    
    if (passportData) {
      // Convert form data to PassportDataPacket
      examplePassportData = {
        nationality: new TextEncoder().encode(passportData.nationality),
        date_of_birth: BigInt(Math.floor(passportData.dateOfBirth.getTime() / 1000)),
        date_of_emision: BigInt(Math.floor(passportData.dateOfEmission.getTime() / 1000)),
        expiration_date: BigInt(Math.floor(passportData.expirationDate.getTime() / 1000)),
        country_signature: crypto.getRandomValues(new Uint8Array(32)),
        midnames_signature: crypto.getRandomValues(new Uint8Array(32))
      };
    } else {
      // Use default passport data if none provided
      examplePassportData = {
        nationality: new TextEncoder().encode("000000AR"),  // Argentine nationality
        date_of_birth: BigInt(915148800),  // January 1, 1999 (over 21 years old)
        date_of_emision: BigInt(1577836800),  // January 1, 2020
        expiration_date: BigInt(1893456000),  // January 1, 2030
        country_signature: crypto.getRandomValues(new Uint8Array(32)),
        midnames_signature: crypto.getRandomValues(new Uint8Array(32))
      };
    }
    
    // We need a secretKey as well as userPassportData
    const secretKey = crypto.getRandomValues(new Uint8Array(32));
    
    // Create new private state with passport data
    return createBBoardPrivateState(secretKey, examplePassportData);
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
