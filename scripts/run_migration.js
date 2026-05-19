#!/usr/bin/env node
// Simple migration runner: node scripts/run_migration.js migrations/20260518_create_surveys.sql
const fs = require('fs');
const { Client } = require('pg');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run_migration.js <path-to-sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');
const connString = process.env.DB_URL;
if (!connString) {
  console.error('Please set DB_URL environment variable');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: connString });
  try {
    await client.connect();
    console.log('Running migration', file);
    await client.query(sql);
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  } finally {
    await client.end();
  }
})();
