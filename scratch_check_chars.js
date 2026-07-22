const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olmexwouxzqtdkuuthzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWV4d291eHpxdGRrdXV0aHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjEyNDIsImV4cCI6MjA5Nzc5NzI0Mn0.hmaq-WPMR4bRZK_GWDS5iNEsCPm2V1wd-Jqrn4hXqUQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Person')
    .select('note')
    .ilike('name', '%Y LAT%');
  
  if (data && data.length > 0) {
    const note = data[0].note || '';
    console.log("Note string:", JSON.stringify(note));
    console.log("Char codes:");
    for (let i = 0; i < note.length; i++) {
      console.log(`${note[i]} -> ${note.charCodeAt(i)}`);
    }
  }
}

check();
