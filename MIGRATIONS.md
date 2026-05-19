# Database Migrations Guide

This project uses versioned SQL migrations to manage database schema changes. Migrations are tracked in the `schema_migrations` table to prevent re-running.

## Quick Start

### 1. **Initial Setup (First Time Only)**

Before running any migrations, initialize the tracking table on Neon:

```bash
export DB_URL='your-neon-connection-string'
node scripts/run_migrations.js migrations/00_init_migrations_table.sql
```

Then run all pending migrations:

```bash
node scripts/run_migrations.js
```

### 2. **Check Migration Status**

```bash
node scripts/run_migrations.js --status
```

Output example:
```
📋 Migration Status:

Executed Migrations:
  ✅ 00_init_migrations_table.sql
  ✅ 20260518_create_surveys.sql

Pending Migrations:
  ⏳ 20260519_new_feature.sql
```

### 3. **Run Pending Migrations**

```bash
node scripts/run_migrations.js
```

All migrations not yet in `schema_migrations` table will run automatically.

### 4. **Run Specific Migration**

```bash
node scripts/run_migrations.js migrations/20260519_new_feature.sql
```

## Creating New Migrations

1. **Create a new SQL file** in `migrations/` following the naming convention:
   ```
   migrations/YYYYMMDD_description.sql
   ```
   Example: `20260519_add_user_roles.sql`

2. **Write your migration** (use `IF NOT EXISTS` for safety):
   ```sql
   CREATE TABLE IF NOT EXISTS user_roles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id),
     role TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
   ```

3. **Test locally** before committing:
   ```bash
   node scripts/run_migrations.js migrations/20260519_add_user_roles.sql
   ```

4. **Commit the .sql file** to git

## Working with Neon

### Environment Variable

Store your Neon connection string (includes password):

```bash
export DB_URL='postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&channel_binding=require'
```

For security, use `.env` file (add to `.gitignore`):
```bash
# .env
DB_URL=postgresql://...
```

Then load it:
```bash
source .env
node scripts/run_migrations.js --status
```

### Export Current Schema

To create a backup or baseline snapshot:

```bash
node scripts/export_schema.js
```

This requires `pg_dump` installed. Install it:
- **macOS**: `brew install postgresql`
- **Linux**: `apt-get install postgresql-client`
- **Windows**: Download from https://www.postgresql.org/download/windows/

## What Happens Where

### VS Code / Local
✅ You write migration `.sql` files here
✅ You test migrations locally against Neon
✅ You commit `.sql` files to git
✅ You review migration changes in pull requests

### Neon Console
⚠️ **Do NOT make manual schema changes here** — always use migrations
✅ You can view tables/data in the Neon SQL Editor
✅ You can view the `schema_migrations` table to verify what's been applied
✅ You run migrations via npm scripts (which connect to Neon)

## Migration Tracking

The `schema_migrations` table tracks:
- `version` - filename of the migration
- `executed_at` - when it ran
- `execution_time_ms` - how long it took
- `status` - 'success' or 'failed'

View executed migrations in Neon:
```sql
SELECT version, executed_at, execution_time_ms, status FROM schema_migrations ORDER BY executed_at DESC;
```

## Safety Features

✅ Migrations are **idempotent** (`IF NOT EXISTS`, `IF NOT FOUND`, etc.)
✅ Migrations are **tracked** to prevent re-running
✅ Failed migrations are **recorded** in the table
✅ Using `--force-with-lease` for git keeps branch history clean

## Troubleshooting

### "DB_URL environment variable is not set"
```bash
export DB_URL='your-neon-connection-string'
# or source .env
```

### "Migration already executed"
The migration is in the `schema_migrations` table. This is safe — it will be skipped.

### "Failed to connect to Neon"
- Check your connection string in Neon console
- Verify `sslmode=require` is set
- Try connecting with `psql` directly to test

### "pg_dump not found" (when exporting schema)
Install PostgreSQL client tools (see above)

## CI/CD Integration

In your deployment script:
```bash
export DB_URL="$NEON_DB_URL"  # from secrets
node scripts/run_migrations.js
# Then deploy your app
```

## References

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Migrations Best Practices](https://wiki.postgresql.org/wiki/Versioning)
- [Liquibase/Flyway Patterns](https://flywaydb.org/documentation/concepts/migrations)
