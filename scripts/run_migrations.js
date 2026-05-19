#!/usr/bin/env node
/**
 * Enhanced Migration Runner with Tracking
 * Usage: node scripts/run_migrations.js [--list] [--status] [<file>]
 * 
 * Examples:
 *   node scripts/run_migrations.js --list         # List all pending migrations
 *   node scripts/run_migrations.js --status       # Show migration status
 *   node scripts/run_migrations.js migrations/20260518_create_surveys.sql  # Run specific migration
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connString = process.env.DB_URL;
if (!connString) {
  console.error('❌ Please set DB_URL environment variable');
  process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0];

async function getClient() {
  const client = new Client({ connectionString: connString });
  await client.connect();
  return client;
}

async function initMigrationsTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        execution_time_ms INT,
        status TEXT DEFAULT 'success'
      );
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at DESC);
    `);
  } catch (err) {
    console.error('Error initializing migrations table:', err.message);
  }
}

async function getExecutedMigrations(client) {
  try {
    const result = await client.query('SELECT version FROM schema_migrations ORDER BY executed_at ASC');
    return result.rows.map(r => r.version);
  } catch {
    return [];
  }
}

async function getMigrationFiles() {
  const migrationDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql') && f !== '00_init_migrations_table.sql')
    .sort();
  return files;
}

async function runMigration(client, filePath, version) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const startTime = Date.now();
  
  try {
    console.log(`⏳ Running migration: ${version}`);
    await client.query(sql);
    const executionTime = Date.now() - startTime;
    
    // Record in migrations table
    await client.query(
      'INSERT INTO schema_migrations (version, execution_time_ms, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [version, executionTime, 'success']
    );
    
    console.log(`✅ Migration ${version} completed (${executionTime}ms)`);
    return true;
  } catch (err) {
    console.error(`❌ Migration ${version} failed:`, err.message);
    
    // Record failure
    try {
      await client.query(
        'INSERT INTO schema_migrations (version, status) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [version, 'failed']
      );
    } catch {}
    
    return false;
  }
}

async function main() {
  let client;
  
  try {
    client = await getClient();
    await initMigrationsTable(client);
    
    // Show status
    if (command === '--status' || command === '--list') {
      const executed = await getExecutedMigrations(client);
      const allFiles = await getMigrationFiles();
      const pending = allFiles.filter(f => !executed.includes(f));
      
      console.log('\n📋 Migration Status:\n');
      console.log('Executed Migrations:');
      if (executed.length === 0) {
        console.log('  (none)');
      } else {
        executed.forEach(v => console.log(`  ✅ ${v}`));
      }
      
      console.log('\nPending Migrations:');
      if (pending.length === 0) {
        console.log('  (none - database is up to date)');
      } else {
        pending.forEach(v => console.log(`  ⏳ ${v}`));
      }
      console.log('');
      return;
    }
    
    // Run specific file or all pending
    if (command && !command.startsWith('--')) {
      const filePath = command;
      const version = path.basename(filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }
      
      const executed = await getExecutedMigrations(client);
      if (executed.includes(version)) {
        console.log(`⚠️  Migration ${version} already executed. Skipping.`);
        return;
      }
      
      await runMigration(client, filePath, version);
    } else {
      // Run all pending migrations
      const executed = await getExecutedMigrations(client);
      const allFiles = await getMigrationFiles();
      const pending = allFiles.filter(f => !executed.includes(f));
      
      if (pending.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }
      
      console.log(`Running ${pending.length} pending migration(s)...\n`);
      for (const file of pending) {
        const filePath = path.join(__dirname, '../migrations', file);
        await runMigration(client, filePath, file);
      }
      console.log('\n✅ All pending migrations completed');
    }
  } catch (err) {
    console.error('❌ Migration runner error:', err.message);
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

main();
