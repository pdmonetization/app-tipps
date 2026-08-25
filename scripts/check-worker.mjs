import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'worker', 'wrangler.jsonc');
const schemaPath = join(root, 'node_modules', 'wrangler', 'config-schema.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(config)) {
  throw new Error(
    `Worker check failed: invalid Wrangler configuration:\n${JSON.stringify(validate.errors, null, 2)}`,
  );
}

if (config.workers_dev !== false || config.routes?.[0]?.pattern !== 'app-tipps.com/*') {
  throw new Error('Worker check failed: the production app-tipps.com route is not configured.');
}

await build({
  entryPoints: [join(root, 'worker', config.main)],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  write: false,
  logLevel: 'silent',
});

console.log('Worker check passed: Wrangler configuration is valid and the Worker bundles successfully.');
