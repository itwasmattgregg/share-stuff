# Routes Organization

This directory contains all application routes organized by feature area using consistent naming prefixes.

## Structure

### Root Routes
- `_index.tsx` - Home page
- `healthcheck.tsx` - Health check endpoint

### Authentication Routes (auth prefix)
- `login.tsx` - Login page (`/login`)
- `logout.tsx` - Logout action (`/logout`)
- `join.tsx` - Sign up page (`/join`)

### Admin Routes (admin prefix)
- `admin.tsx` - Admin dashboard (`/admin`)
- `admin.admins.tsx` - Admin management (`/admin/admins`)
- `admin.communities.tsx` - Community management (`/admin/communities`)
- `admin.reports.tsx` - Report management (`/admin/reports`)
- `admin.settings.tsx` - Settings (`/admin/settings`)
- `admin.stats.tsx` - Statistics (`/admin/stats`)
- `admin.users.tsx` - User management (`/admin/users`)

### Community Routes (communities prefix)
- `communities.tsx` - Communities list page (`/communities`)
- `communities._index.tsx` - Communities index - redirects to first (`/communities`)
- `communities.browse.tsx` - Browse communities - redirects (`/communities/browse`)
- `communities.new.tsx` - Create community (`/communities/new`)
- `communities.$communityId.tsx` - Community detail page (`/communities/:id`)
- `communities.$communityId._index.tsx` - Community items index (`/communities/:id`)
- `communities.$communityId.items.tsx` - Community items list (`/communities/:id/items`)
- `communities.$communityId.items.new.tsx` - Add item to community (`/communities/:id/items/new`)
- `communities.$communityId.items.$itemId.tsx` - Community item detail (`/communities/:id/items/:itemId`)
- `communities.$communityId.items.$itemId.request.tsx` - Request item (`/communities/:id/items/:itemId/request`)
- `communities.$communityId.items.$itemId.requests.tsx` - View requests (`/communities/:id/items/:itemId/requests`)
- `communities.$communityId.manage.tsx` - Manage community (`/communities/:id/manage`)

### Item Routes (items prefix)
- `items.tsx` - User's items list (`/items`)
- `items._index.tsx` - Items index - redirects to first (`/items`)
- `items.new.tsx` - Create new item (`/items/new`)
- `items.$itemId.tsx` - Item detail page (`/items/:id`)
- `items.$itemId.edit.tsx` - Edit item (`/items/:id/edit`)

### Messaging Routes (messages prefix)
- `messages.tsx` - Messages list (`/messages`)
- `messages.new.tsx` - Start new conversation (`/messages/new`)
- `messages.$conversationId.tsx` - Conversation detail (`/messages/:id`)

### Feature Routes (standalone)
- `lending.tsx` - Lending dashboard (`/lending`)
- `notifications.tsx` - Notifications page (`/notifications`)
- `profile.tsx` - User profile (`/profile`)
- `guidelines.tsx` - Community guidelines (`/guidelines`)
- `report.tsx` - Report an issue (`/report`)
- `report.success.tsx` - Report success page (`/report/success`)

## Naming Convention

Routes are organized by prefix:
- **admin.*** - Admin functionality
- **communities.*** - Community-related routes
- **items.*** - Item management
- **messages.*** - Messaging system
- Standalone routes for other features

This flat structure keeps routes easy to find while maintaining clear organization through naming conventions.
