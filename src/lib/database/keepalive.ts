import { supabase } from '../../supabaseClient.js';

export interface KeepAliveResult {
  success: boolean;
  database: 'online' | 'warning' | 'offline';
  timestamp: string;
  latencyMs?: number;
  errorMessage?: string | null;
}

/**
 * Performs a keep-alive ping and updates the public.system_health table in Supabase.
 * Retries up to 3 times on failure.
 */
export async function performKeepAlive(retries = 3, timeoutMs = 5000): Promise<KeepAliveResult> {
  const timestamp = new Date().toISOString();
  let attempt = 0;
  let lastError: any = null;

  while (attempt < retries) {
    attempt++;
    const start = Date.now();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Perform database ping query via system_health table upsert
      const { error } = await supabase
        .from('system_health')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          last_ping: timestamp,
          status: 'online',
          updated_at: timestamp
        });

      clearTimeout(id);

      if (error) {
        throw error;
      }

      const latencyMs = Date.now() - start;
      return {
        success: true,
        database: 'online',
        timestamp,
        latencyMs
      };
    } catch (err: any) {
      clearTimeout(id);
      lastError = err;
      console.warn(`[KeepAlive] Ping attempt ${attempt}/${retries} failed:`, err.message || String(err));
      
      // Wait 1.5 seconds before retrying
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  // If all attempts failed
  const errorMsg = lastError?.message || String(lastError);
  
  // Try to write error/warning state to DB if possible (might fail if completely offline)
  try {
    await supabase.from('system_health').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      status: 'offline',
      updated_at: timestamp
    });
  } catch (e) {
    // Ignore secondary write failures
  }

  // Trigger admin alert notifications
  triggerAlertLog(errorMsg);

  return {
    success: false,
    database: 'offline',
    timestamp,
    errorMessage: errorMsg
  };
}

function triggerAlertLog(errorMsg: string) {
  console.error(`[ADMIN_ALERT] Keep Alive Service Failed consecutive retries! Error: ${errorMsg}`);
}
