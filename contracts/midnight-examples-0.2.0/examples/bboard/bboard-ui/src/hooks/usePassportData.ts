import { useState, useEffect } from 'react';
import { useDeployedBoardContext } from './index';
import { firstValueFrom, filter, map } from 'rxjs';

/**
 * Hook to fetch and handle passport data 
 */
export const usePassportData = () => {
  const [passportData, setPassportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const boardContext = useDeployedBoardContext();
  
  useEffect(() => {
    const fetchPassportData = async () => {
      try {
        setLoading(true);
        // First get the latest deployed board
        const deployments = await firstValueFrom(boardContext.boardDeployments$);
        
        // Find the first deployed board (if any)
        if (deployments.length > 0) {
          const deployment = await firstValueFrom(
            deployments[0].pipe(
              filter(d => d.status === 'deployed'),
              map(d => d.status === 'deployed' ? d : null)
            )
          );
          
          if (deployment && deployment.api) {
            // Now we can access the state$ from the deployed API
            const state = await firstValueFrom(deployment.api.state$);
            setPassportData(state.passport_data);
          } else {
            setError(new Error("No deployed board available"));
          }
        } else {
          setError(new Error("No board deployments found"));
        }
        
      } catch (err) {
        console.error("Error fetching passport data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPassportData();
  }, [boardContext]);
  
  return { passportData, loading, error };
};
