import { randomBytes, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${flag} needs a value.`);
  return args[index + 1];
};
for (let i = 0; i < args.length; i += 2) {
  if (!['--url', '--port', '--project', '--output', '--studio-port'].includes(args[i])) {
    throw new Error(`Unknown argument: ${args[i]}`);
  }
}
const publicUrl = new URL(value('--url', 'http://localhost:8080'));
if (!['http:', 'https:'].includes(publicUrl.protocol) || publicUrl.username || publicUrl.password ||
    publicUrl.pathname !== '/' || publicUrl.search || publicUrl.hash) {
  throw new Error('--url must be an HTTP(S) origin, without credentials, a path or query parameters.');
}
const project = value('--project', 'linea3d');
if (!/^[a-z0-9][a-z0-9_-]*$/.test(project)) throw new Error('Invalid Compose project name.');
const port = value('--port', publicUrl.protocol === 'http:' ? publicUrl.port || '80' : '8080');
const studioPort = value('--studio-port', '8000');
for (const p of [port, studioPort]) {
  if (!/^\d+$/.test(p) || Number(p) < 1 || Number(p) > 65535) throw new Error('Port must be between 1 and 65535.');
}
const hex = (bytes) => randomBytes(bytes).toString('hex');
const jwtSecret = hex(32);
const now = Math.floor(Date.now() / 1000);
const signKey = (role) => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase', iat: now, exp: now + 315360000 })}`;
  return `${data}.${createHmac('sha256', jwtSecret).update(data).digest('base64url')}`;
};
const url = publicUrl.origin;
const settings = {
  COMPOSE_FILE: 'compose.yaml',
  COMPOSE_PROJECT_NAME: project,
  WEB_BIND: '0.0.0.0',
  WEB_PORT: port,
  STUDIO_PORT: studioPort,
  POSTGRES_PASSWORD: hex(24),
  JWT_SECRET: jwtSecret,
  ANON_KEY: signKey('anon'),
  SERVICE_ROLE_KEY: signKey('service_role'),
  DASHBOARD_USERNAME: 'admin',
  DASHBOARD_PASSWORD: `A${hex(20)}`,
  SECRET_KEY_BASE: hex(48),
  REALTIME_DB_ENC_KEY: hex(8),
  VAULT_ENC_KEY: hex(16),
  PG_META_CRYPTO_KEY: hex(24),
  LOGFLARE_PUBLIC_ACCESS_TOKEN: hex(24),
  LOGFLARE_PRIVATE_ACCESS_TOKEN: hex(24),
  S3_PROTOCOL_ACCESS_KEY_ID: hex(16),
  S3_PROTOCOL_ACCESS_KEY_SECRET: hex(32),
  SUPABASE_PUBLIC_URL: url,
  API_EXTERNAL_URL: `${url}/auth/v1`,
  SITE_URL: url,
  ADDITIONAL_REDIRECT_URLS: `${url}/**`,
  POOLER_TENANT_ID: project,
  STUDIO_DEFAULT_ORGANIZATION: 'WIN-CYC',
  STUDIO_DEFAULT_PROJECT: '3D Editor',
  OPENAI_API_KEY: '',
  DISABLE_SIGNUP: 'true',
  ENABLE_PHONE_SIGNUP: 'false',
  ENABLE_PHONE_AUTOCONFIRM: 'false',
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_SENDER_NAME: 'WIN-CYC',
  FUNCTIONS_VERIFY_JWT: 'true',
  PGRST_DB_SCHEMAS: 'public',
  STORAGE_FILE_SIZE_LIMIT: '104857600',
  VITE_SUPABASE_IMAGE_TRANSFORMS: 'true',
  LOVABLE_API_KEY: '',
};
let template = readFileSync(resolve(root, 'deploy/supabase/upstream/.env.example'), 'utf8');
for (const [key, val] of Object.entries(settings)) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${JSON.stringify(val)}`;
  template = pattern.test(template) ? template.replace(pattern, () => line) : `${template}\n${line}\n`;
}
const output = resolve(root, value('--output', 'deploy/compose.env'));
try {
  writeFileSync(output, `# Generated for ${url}. Keep this file private and back it up.\n${template}`, { flag: 'wx', mode: 0o600 });
} catch (error) {
  if (error.code === 'EEXIST') throw new Error(`${output} already exists. Edit it in place; setup never rotates an existing database's secrets.`);
  throw error;
}
console.log(`Created ${output} (permissions 0600). Secrets are not printed.`);
console.log(`Website: ${url}`);
console.log('Next: make rebuild');
console.log('Existing cloud data is not imported automatically. See deploy/README.md.');
