# Fixing Migration Issues in Production

## Quick Fix: Run Migrations Manually

If you're seeing "table does not exist" errors, the migrations likely didn't run. Here's how to fix it:

### 1. Check Migration Status

SSH into your Fly.io app and check the migration status:

```bash
fly ssh console -C "npx prisma migrate status"
```

This will show you which migrations have been applied and which are pending.

### 2. Run Migrations Manually

If migrations are pending, run them:

```bash
fly ssh console -C "npx prisma migrate deploy"
```

### 3. Verify Tables Exist

Check if the Notification table exists:

```bash
fly ssh console -C "sqlite3 /data/sqlite.db '.tables'"
```

You should see `Notification` in the list.

### 4. Check Release Command Logs

The release command should run migrations automatically. Check if it's working:

```bash
fly releases
```

Look for the latest release and check if the release command succeeded. If it failed, you'll see an error.

### 5. Verify Release Command Configuration

Make sure your `fly.toml` has:

```toml
[deploy]
  release_command = "prisma migrate deploy"
```

### 6. If Release Command Isn't Running

Sometimes the release command doesn't run. You can:

1. **Run migrations in start.sh** (already added as a safety check)
2. **Manually trigger a release**:
   ```bash
   fly releases run "prisma migrate deploy"
   ```

## Why Migrations Might Not Run

1. **Release command fails silently** - Check `fly releases` for errors
2. **DATABASE_URL not set during release** - Ensure it's set as a secret
3. **Database file doesn't exist** - The volume might not be mounted correctly
4. **Prisma CLI not available** - Should be installed globally in Dockerfile

## Prevention

The updated `start.sh` now includes a migration check before starting the server. This ensures migrations run even if the release command fails.
