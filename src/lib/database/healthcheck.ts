import { supabase } from '../../supabaseClient.js';

export interface HealthCheckReport {
  database: 'online' | 'warning' | 'offline';
  latencyMs: number;
  timestamp: string;
  tables: {
    Person: number | null;
    Household: number | null;
  };
  message?: string;
}

/**
 * Performs a detailed health assessment of the Supabase tables and endpoint connectivity.
 */
export async function runDetailedHealthCheck(): Promise<HealthCheckReport> {
  const timestamp = new Date().toISOString();
  const start = Date.now();
  let dbStatus: 'online' | 'warning' | 'offline' = 'online';
  let message = 'All systems operational';
  let personCount: number | null = null;
  let householdCount: number | null = null;

  try {
    // 1. Check Person table accessibility
    const { count: pCount, error: pError } = await supabase
      .from('Person')
      .select('id', { count: 'exact', head: true });
    
    if (pError) {
      dbStatus = 'warning';
      message = `Person query issue: ${pError.message}`;
    } else {
      personCount = pCount;
    }

    // 2. Check Household table accessibility
    const { count: hCount, error: hError } = await supabase
      .from('Household')
      .select('id', { count: 'exact', head: true });

    if (hError) {
      dbStatus = 'warning';
      message = hError.message;
    } else {
      householdCount = hCount;
    }
  } catch (err: any) {
    dbStatus = 'offline';
    message = err.message || String(err);
  }

  const latencyMs = Date.now() - start;

  return {
    database: dbStatus,
    latencyMs,
    timestamp,
    tables: {
      Person: personCount,
      Household: householdCount
    },
    message
  };
}
