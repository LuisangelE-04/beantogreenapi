#!/usr/bin/env node
/**
 * Export current Neon database schema
 * Usage: node scripts/export_schema.js
 * 
 * This creates a complete schema dump that can be used as a baseline migration.
 * Requires pg_dump to be installed (comes with PostgreSQL client tools)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const connString = process.env.DB_URL;
if (!connString) {
  console.error('❌ Please set DB_URL environment variable');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupDir = path.join(__dirname, '../backups');
const outputFile = path.join(backupDir, `${timestamp}_schema_snapshot.sql`);

// Create backups directory if it doesn't exist
if (!require('fs').existsSync(backupDir)) {
  require('fs').mkdirSync(backupDir, { recursive: true });
}

console.log('📤 Exporting Neon database schema...');
console.log(`📍 Output file: ${outputFile}\n`);

try {
  // Export schema only (no data)
  const schema = execSync(`pg_dump --schema-only "${connString}"`, { encoding: 'utf8' });
  
  // Add header with instructions
  const header = `-- Database schema snapshot (REFERENCE ONLY - NOT A MIGRATION)
-- Generated: ${new Date().toISOString()}
-- This is a point-in-time snapshot of your database schema.
-- Use this as a reference, backup, or for documenting schema changes.
-- DO NOT run this as a migration — use actual migration files instead.

-- To use this to recreate a database from scratch:
--   psql -d <new_db> -f backups/${path.basename(outputFile)}

`;

  fs.writeFileSync(outputFile, header + '\n' + schema);
  
  console.log(`✅ Schema exported successfully!`);
  console.log(`📄 File: ${outputFile}`);
  console.log(`📊 Size: ${fs.statSync(outputFile).size} bytes\n`);
  
  // Show table summary
  const tables = schema.match(/CREATE TABLE[^;]+;/g) || [];
  console.log(`📋 Found ${tables.length} tables:`);
  tables.forEach(t => {
    const match = t.match(/CREATE TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(\w+)/i);
    if (match) console.log(`   - ${match[1]}`);
  });
  
} catch (err) {
  if (err.status === 127) {
    console.error('❌ pg_dump not found. Please install PostgreSQL client tools:');
    console.error('   macOS: brew install postgresql');
    console.error('   Linux: apt-get install postgresql-client');
    console.error('   Windows: https://www.postgresql.org/download/windows/');
  } else {
    console.error('❌ Export failed:', err.message);
  }
  process.exit(1);
}
