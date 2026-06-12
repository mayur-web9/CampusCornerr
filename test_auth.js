import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse the .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  console.log('Attempting login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: '835751511'
  });

  if (error) {
    console.error('Login Error details:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.log('Login Succeeded!', data);
  }
}

testSignIn();
