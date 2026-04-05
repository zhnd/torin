import fs from 'node:fs';
import { printSchema } from 'graphql';
import { schema } from '../src/infrastructure/graphql/schema';

const sdl = printSchema(schema);
fs.writeFileSync('../../packages/graphql-schema/schema.graphql', sdl);
console.log('✅ schema.graphql written successfully');
