# Admin Setup Guide

This guide explains how to set up the first system administrator for Share Stuff.

## 🚀 Quick Setup

### Step 1: Run Database Migration
First, you need to update the database schema to include the new user roles:

```bash
# Generate Prisma client with new schema
pnpm exec prisma generate

# Run database migration
pnpm exec prisma migrate dev --name add_user_roles
```

### Step 2: Register Your Account
1. Start the development server: `pnpm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign up" and create your account with your email
4. Complete the registration process

### Step 3: Make Yourself Admin
Run the admin setup script with your email:

```bash
pnpm exec ts-node scripts/make-admin.ts your-email@example.com
```

Replace `your-email@example.com` with the email you used to register.

### Step 4: Verify Admin Access
1. Log in to your account
2. Go to the Communities page
3. You should see an "Admin Dashboard" button in the sidebar
4. Click it to access the admin panel

## 🔑 Admin Roles

The system has three user roles:

- **USER**: Regular community members (default)
- **ADMIN**: Can access admin dashboard and manage reports
- **SUPER_ADMIN**: Full system access (recommended for first admin)

## 🛠️ Admin Features

Once you're an admin, you can:

### 📋 Reports Management
- View all community guideline violations
- Mark reports as under review, resolved, or dismissed
- See detailed information about each report

### 👥 User Management
- View all platform users
- Promote users to admin roles
- Manage user permissions

### 🏘️ Community Management
- Monitor all communities
- View community statistics
- Intervene in community issues if needed

### 📊 System Statistics
- View platform usage metrics
- Monitor community growth
- Track lending activity

## 🔧 Advanced Admin Setup

### Making Additional Admins
You can promote other users to admin roles through the admin dashboard or by running:

```bash
# Make someone an admin
pnpm exec ts-node scripts/make-admin.ts their-email@example.com
```

### Database Direct Access
If you need to make changes directly in the database:

```bash
# Connect to the database
pnpm exec prisma studio
```

Then find your user record and change the `role` field to `SUPER_ADMIN`.

### Environment Variables
For production, you might want to set up environment variables for admin emails:

```bash
# In your .env file
SUPER_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## 🚨 Security Notes

- **Admin Access**: The admin dashboard is protected and only accessible to users with admin roles
- **Role Verification**: All admin routes verify user permissions before allowing access
- **Audit Trail**: Admin actions are logged for accountability
- **Regular Users**: Regular users cannot see admin features or access admin routes

## 🆘 Troubleshooting

### "User not found" Error
- Make sure you've registered an account first
- Check that the email address is exactly correct
- Ensure the database migration has been run

### "Unauthorized" Error
- Verify your user role is set to ADMIN or SUPER_ADMIN
- Check that you're logged in with the correct account
- Try logging out and logging back in

### Admin Dashboard Not Showing
- Clear your browser cache
- Check that the database migration was successful
- Verify your user role in the database

## 📞 Support

If you run into issues:
1. Check the console for error messages
2. Verify all database migrations have been run
3. Ensure your user account exists and has the correct role
4. Check the Prisma schema matches the current database

## 🎯 Next Steps

Once you're set up as an admin:

1. **Review Community Guidelines**: Make sure they align with your platform's values
2. **Set Up Monitoring**: Keep an eye on community health and user reports
3. **Monitor Platform Growth**: Use the admin dashboard to track usage and engagement
4. **Train Additional Admins**: Promote trusted community members to help manage the platform

Remember: With great power comes great responsibility! Use your admin privileges to maintain a safe, respectful, and thriving community sharing platform.


