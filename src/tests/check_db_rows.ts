import "dotenv/config";
import { supabase } from "../supabaseClient";

async function check() {
  console.log("=== CHECKING SUPABASE TABLES DATA ===");
  console.log("ENV URL:", process.env.VITE_SUPABASE_URL);
  console.log("ENV KEY LEN:", process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY.length : 0);
  console.log("ENV KEY START:", process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY.substring(0, 15) : "none");
  try {
    const { data: persons, error: perr } = await supabase.from('Person').select('id, name');
    console.log("PERSONS COUNT:", perr ? `Error: ${perr.message}` : (persons ? persons.length : 0));
    if (persons && persons.length > 0) {
      console.log("SAMPLE PERSONS:", persons.slice(0, 3));
    }
    
    const { data: households, error: herr } = await supabase.from('Household').select('id, household_code');
    console.log("HOUSEHOLDS COUNT:", herr ? `Error: ${herr.message}` : (households ? households.length : 0));
  } catch(e: any) {
    console.log("ERROR:", e.message || e);
  }
}

check();
