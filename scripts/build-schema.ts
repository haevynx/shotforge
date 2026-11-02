// Generates schema.json from the zod config schema, so editors can validate
// and autocomplete shotforge.json via its "$schema" field.
import fs from 'node:fs';
import {z} from 'zod';
import {ConfigSchema} from '../src/config.js';

const schema = {
  ...z.toJSONSchema(ConfigSchema, {io: 'input'}),
  $id: 'https://unpkg.com/shotforge/schema.json',
  title: 'shotforge config',
};
fs.writeFileSync(new URL('../schema.json', import.meta.url), JSON.stringify(schema, null, 2) + '\n');
console.log('✓ schema.json');
