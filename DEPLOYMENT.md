# ShareStuff Deployment Guide

## Fly.io Deployment

This project is configured for deployment on Fly.io with the following setup:

### Prerequisites

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up for a Fly.io account: `fly auth signup`
3. Login to Fly.io: `fly auth login`
4. Ensure you have Node.js 20+ installed locally (for development)

### Database Setup

Since we're using PostgreSQL, you'll need to create a managed PostgreSQL database on Fly.io:

```bash
# Create a managed PostgreSQL database
fly postgres create --name share-stuff-db --region sjc

# Attach the database to your app (this automatically sets DATABASE_URL)
fly postgres attach share-stuff-db --app share-stuff

# Verify the database is attached
fly secrets list
```

### Environment Variables

Set the required environment variables:

```bash
# Set a secure session secret (DATABASE_URL is automatically set by fly postgres attach)
fly secrets set SESSION_SECRET="your-super-secret-session-key-here"

# Generate a secure session secret (optional - you can use this command)
openssl rand -base64 32
```

### Deployment

1. **First deployment:**

   ```bash
   fly deploy
   ```

2. **Run database migrations:**

   ```bash
   # Migrations run automatically via the release_command in fly.toml
   # If you need to run them manually:
   fly ssh console
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Open your app:**

   ```bash
   fly open
   ```

### Configuration Details

The `fly.toml` file includes:

- **App name**: `share-stuff`
- **Primary region**: San Jose, California (`sjc`)
- **Port**: 8080 (internal)
- **Memory**: 1GB RAM
- **CPU**: 1 shared CPU
- **Auto-scaling**: Enabled (machines start/stop based on traffic)
- **Health checks**: Configured for `/healthcheck` endpoint
- **HTTPS**: Force enabled
- **Release command**: Automatically runs database migrations

### Monitoring

- View logs: `fly logs`
- SSH into app: `fly ssh console`
- Check status: `fly status`
- Scale app: `fly scale count 2`

### Security Notes

- The `robots.txt` file blocks all search engines from indexing your site
- Environment variables are encrypted using Fly secrets
- HTTPS is enforced for all connections
- Database connections are secured with connection strings

### Troubleshooting

- If deployment fails, check logs: `fly logs`
- If database connection fails, verify `DATABASE_URL` secret
- If health checks fail, ensure the `/healthcheck` route is working
- For performance issues, consider scaling: `fly scale count 2`
