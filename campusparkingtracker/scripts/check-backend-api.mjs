import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key.trim()]) process.env[key.trim()] = value;
  }
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function callApi(apiBase, path, token, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });
  const data = await readJson(response);
  return { ok: response.ok, status: response.status, data };
}

loadDotEnv();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npm run api:test -- your-email@example.com Password123');
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5001';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend .env');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('API base:', apiBase);
console.log('Email:', email);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.session?.access_token) {
  console.error('Supabase login failed:', error?.message ?? 'No access token returned.');
  process.exit(1);
}

const token = data.session.access_token;
console.log('Supabase login worked. User id:', data.user?.id);
console.log('Access token starts:', token.slice(0, 20) + '...');

console.log('\nTesting Flask /debug/auth...');
const debugAuth = await callApi(apiBase, '/debug/auth', token);
console.log(JSON.stringify(debugAuth, null, 2));
if (!debugAuth.ok) process.exit(1);

console.log('\nSubmitting one test report to earn points...');
const report = await callApi(apiBase, '/report', token, {
  method: 'POST',
  body: JSON.stringify({ campus: 'SDSU', lot_name: 'Parking Lot 1', status: 'LIMITED' }),
});
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);

console.log('\nTesting /lots after earning points...');
const lots = await callApi(apiBase, '/lots?campus=SDSU', token);
console.log(JSON.stringify(lots, null, 2));
if (!lots.ok) process.exit(1);

console.log('\nEND-TO-END TEST WORKED. Supabase login, Flask auth, report, and lots all worked.');
