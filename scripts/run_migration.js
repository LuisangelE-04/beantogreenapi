#!/usr/bin/env node
// Simple migration runner: node scripts/run_migration.js migrations/20260518_create_surveys.sql
import fs from 'fs';
import { query } from '../src/db/pool.ts';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run_migration.js <path-to-sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');

(async () => {
  try {
    console.log('Running migration', file);
    await query(sql);
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
})();
