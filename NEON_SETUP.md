# Neon Setup Checklist

Complete these steps on Neon to set up migrations. These are the **only** things you need to do manually in Neon.

## ✅ What You Need to Do on Neon

### 1. **Get Your Connection String**
   - Go to Neon Console: https://console.neon.tech
   - Select your project → your database
   - Copy the connection string (the full URI including password)
   - It looks like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&channel_binding=require`
   - **Keep this secret** — never commit it to git

### 2. **Initial Schema Migration (If Starting Fresh)**
   - If your database is empty, run this in VS Code to create the tracking table:
     ```bash
     export DB_URL='your-connection-string'
     npm run db:migrate
     ```
   - This will initialize `schema_migrations` table and apply all pending migrations

### 3. **Verify in Neon SQL Editor** (Optional)
   - Open Neon Console → SQL Editor
   - Run this query to see executed migrations:
     ```sql
     SELECT version, executed_at, execution_time_ms, status FROM schema_migrations ORDER BY executed_at DESC;
     ```

---

## 📌 What You DON'T Need to Do

❌ Don't manually create tables in Neon SQL Editor — use migrations instead
❌ Don't manually change schema — use `.sql` files
❌ Don't share your DB_URL publicly

---

## 🔄 Ongoing Workflow

After initial setup, everything happens in VS Code:

```bash
# Your new migrations go here
migrations/
  ├── 00_init_migrations_table.sql       (already created)
  ├── 20260518_create_surveys.sql        (already created)
  └── 20260519_new_feature.sql           (you'll create these)

# Run migrations from local machine against Neon
npm run db:migrate

# Check what's been applied
npm run db:migrate:status
```

---

## 🚀 Production Deployment

When deploying to production:

```bash
# In your CI/CD pipeline
export NEON_DB_URL="${{ secrets.NEON_DB_URL }}"
npm run db:migrate
# Then deploy your application
```

---

## 💡 Tips

- **Test migrations locally first** against your Neon DB before committing
- **Always use `IF NOT EXISTS` / `IF NOT FOUND`** for idempotency
- **Check migration status** with `npm run db:migrate:status` before pushing
- **Version your migrations** with date: `YYYYMMDD_description.sql`

---

## Need Help?

- Read [MIGRATIONS.md](./MIGRATIONS.md) for detailed documentation
- Check if your DB_URL is set: `echo $DB_URL`
- View tables in Neon Console → Tables section
- See execution logs: `npm run db:migrate:status`
