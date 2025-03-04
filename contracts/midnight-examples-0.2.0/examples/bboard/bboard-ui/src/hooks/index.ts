import { useContext } from 'react';
import { DeployedBoardContext } from '../contexts/DeployedBoardContext';
import { type DeployedBoardAPIProvider } from '../contexts/BrowserDeployedBoardManager';

/**
 * Gets the deployed board context.
 *
 * @throws {Error} If the {@link DeployedBoardContext} is not available in the current React tree.
 */
export const useDeployedBoardContext = (): DeployedBoardAPIProvider => {
  const ctx = useContext(DeployedBoardContext);
  if (!ctx) {
    throw new Error('No deployed board context available. Ensure component is wrapped with DeployedBoardProvider');
  }
  return ctx;
};
