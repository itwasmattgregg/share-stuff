# ShareStuff Deployment Guide

## Fly.io Deployment

This project is configured for deployment on Fly.io with the following setup:

### Prerequisites

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up for a Fly.io account: `fly auth signup`
3. Login to Fly.io: `fly auth login`
4. Ensure you have Node.js 20+ installed locally (for development)

### Database Setup

This app is configured to use **SQLite** on Fly.io, backed by a **persistent volume** mounted at `/data`.

```bash
# Create a persistent volume for SQLite
fly volumes create data --size 1 --region sjc --app share-stuff
```

### Environment Variables

Set the required environment variables:

```bash
# Set a secure session secret
fly secrets set SESSION_SECRET="your-super-secret-session-key-here"

# Generate a secure session secret (optional - you can use this command)
openssl rand -base64 32

# Set DATABASE_URL to the mounted SQLite file
fly secrets set DATABASE_URL="file:/data/sqlite.db"

# Optional: Cloudflare R2 for item photo uploads
fly secrets set R2_ACCOUNT_ID="your-cloudflare-account-id"
fly secrets set R2_ACCESS_KEY_ID="your-r2-access-key-id"
fly secrets set R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
fly secrets set R2_BUCKET_NAME="share-stuff-photos"
```

Create an R2 bucket in the Cloudflare dashboard, then create an API token with read/write access to that bucket. Photos are served through authenticated app routes, so the bucket can stay private.

### Email (Resend)

ShareStuff sends transactional email for **signup verification** and **password reset**. The app uses [Resend](https://resend.com) via SMTP (no extra npm packages).

#### 1. Create a Resend account

Sign up at [resend.com](https://resend.com). The free tier includes 3,000 emails/month.

#### 2. Verify your sending domain

In the Resend dashboard, go to **Domains → Add domain** and add the domain you want to send from (e.g. `yourdomain.com`). Resend will give you DNS records (SPF, DKIM, etc.) to add at your DNS provider. Wait until the domain shows as verified.

For early testing only, Resend allows sending from `onboarding@resend.dev` to the email address you signed up with—before your domain is verified.

#### 3. Create an API key

Go to **API Keys → Create API Key**. Name it (e.g. `share-stuff-production`) and give it **Sending access**. Copy the key immediately—it starts with `re_` and is only shown once.

#### 4. Set Fly secrets

Use your verified domain in `EMAIL_FROM`:

```bash
fly secrets set \
  RESEND_API_KEY="re_your_api_key_here" \
  EMAIL_FROM="ShareStuff <noreply@yourdomain.com>"
```

Fly redeploys automatically after secrets change.

#### 5. Verify it works

1. Sign up on production with a real email address.
2. Check `fly logs` — you should **not** see `[email] To: ...` console output.
3. Confirm the verification email arrives (check spam if needed).
4. Test **Forgot password** as well.

#### Local development

Add the same values to your local `.env` (see `.env.example`). If neither `RESEND_API_KEY` nor `SMTP_HOST` is set, email links are printed to the terminal instead of sent.

#### Alternative: explicit SMTP env vars

If you prefer to set SMTP credentials directly instead of `RESEND_API_KEY`:

```bash
fly secrets set \
  SMTP_HOST="smtp.resend.com" \
  SMTP_PORT="587" \
  SMTP_SECURE="false" \
  SMTP_USER="resend" \
  SMTP_PASS="re_your_api_key_here" \
  EMAIL_FROM="ShareStuff <noreply@yourdomain.com>"
```

Use port `465` with `SMTP_SECURE="true"` only if port 587 is blocked by your host.

### Deployment

1. **First deployment:**

   ```bash
   fly deploy
   ```

2. **Run database migrations:**

   ```bash
   # Migrations run automatically via the release_command in fly.toml
   # If you need to run them manually:
   fly ssh console -C "npx prisma migrate deploy"
   fly ssh console -C "npx prisma db seed"
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
