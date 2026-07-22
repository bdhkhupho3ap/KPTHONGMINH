import 'dotenv/config';
import { supabase } from '../supabaseClient';

async function fetchAll(tableName: string) {
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .range(from, to);

    if (error) {
      console.error(`Error querying ${tableName}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      page++;
      if (data.length < pageSize) {
        keepFetching = false;
      }
    } else {
      keepFetching = false;
    }
  }
  return allData.length;
}

async function run() {
  console.log("=== COUNTING TOTAL ROWS IN SUPABASE ===");
  const pCount = await fetchAll('Person');
  console.log("Person Count:", pCount);

  const hhCount = await fetchAll('Household');
  console.log("Household Count:", hhCount);

  const resCount = await fetchAll('residents');
  console.log("residents (raw) Count:", resCount);

  const rawHhCount = await fetchAll('households');
  console.log("households (raw) Count:", rawHhCount);
}

run();
