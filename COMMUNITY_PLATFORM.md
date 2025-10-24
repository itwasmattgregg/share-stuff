# Share Stuff - Community Sharing Platform

A community-driven platform for sharing items within closed groups. Built with Remix v2, Prisma, and SQLite.

## 🎯 What It Does

Share Stuff allows people to create and join communities where they can share their belongings with others. Think of it as a neighborhood library for tools, books, DVDs, and more.

## ✨ Key Features

### Community Management
- **Create Communities**: Start your own sharing community with custom rules
- **Join Communities**: Browse and request to join existing communities
- **Approval System**: Community owners approve new members
- **Privacy Controls**: Only approved members can see community content

### Item Sharing
- **Add Items**: Share your belongings with the community
- **Browse Items**: See what's available to borrow
- **Categories**: Organize items by type (books, tools, DVDs, etc.)
- **Condition Tracking**: Note the condition of your items

### Lending System
- **Request to Borrow**: Request items with optional messages
- **Queue System**: Multiple people can request the same item
- **Status Tracking**: Track items through PENDING → APPROVED → BORROWED → RETURNED
- **Owner Controls**: Approve/reject requests and track returns

### Privacy Features
- **Item Owner Visibility**: Only you can see who has your items
- **Community Privacy**: Others see items are borrowed but not by whom
- **Access Control**: Only community members can see items

## 🏗️ Technical Architecture

### Database Schema
```prisma
User {
  id, email, name
  ownedCommunities, communityMemberships, items, lendingRequests
}

Community {
  id, name, description, rules, ownerId
  memberships, items
}

CommunityMembership {
  id, status (PENDING/APPROVED/REJECTED), userId, communityId
}

Item {
  id, name, description, category, condition, isAvailable
  ownerId, communityId, lendingRequests
}

LendingRequest {
  id, status (PENDING/APPROVED/REJECTED/BORROWED/RETURNED)
  requesterId, itemOwnerId, itemId, requestNote, responseNote
}
```

### Route Structure
```
/communities                    # Main dashboard
/communities/new               # Create community
/communities/browse            # Browse all communities
/communities/$id               # Individual community
/communities/$id/items         # Community items
/communities/$id/items/new     # Add item
/communities/$id/items/$itemId # Item details
/communities/$id/items/$itemId/request    # Request to borrow
/communities/$id/items/$itemId/requests   # Manage requests
/communities/$id/manage        # Community management (owners)
/lending                       # Lending dashboard
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Set up database
pnpm exec prisma migrate dev

# Generate Prisma client
pnpm exec prisma generate

# Seed database (optional)
pnpm exec prisma db seed

# Start development server
pnpm run dev
```

### Database Setup
The app uses SQLite with Prisma ORM. The schema includes:
- User authentication and profiles
- Community management with membership approval
- Item cataloging with categories and conditions
- Lending request system with full lifecycle tracking

## 🎮 How to Use

### For Community Creators
1. **Create a Community**: Set name, description, and rules
2. **Approve Members**: Review and approve membership requests
3. **Add Items**: Share your belongings with the community
4. **Manage Requests**: Approve/reject lending requests

### For Community Members
1. **Join Communities**: Browse and request to join communities
2. **Add Items**: Share your own items with the community
3. **Browse Items**: See what's available to borrow
4. **Request Items**: Request to borrow items (even if currently borrowed)
5. **Track Requests**: Monitor your borrowing activity

### Queue System
- **Multiple Requests**: Several people can request the same item
- **Queue Management**: Owners approve requests in order
- **Status Tracking**: Full lifecycle from request to return
- **Fair System**: First-come, first-served queue

## 🔧 Development

### Key Technologies
- **Remix v2**: Full-stack React framework
- **Prisma**: Database ORM with SQLite
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety throughout

### Project Structure
```
app/
├── models/           # Server-side data models
├── routes/          # Remix routes and pages
├── session.server.ts # Authentication
└── utils.ts         # Shared utilities

prisma/
├── schema.prisma    # Database schema
├── migrations/      # Database migrations
└── seed.ts         # Database seeding
```

### Testing
```bash
# Run unit tests
pnpm run test

# Run E2E tests
pnpm run test:e2e:dev

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

## 🎯 Use Cases

### Neighborhood Tool Sharing
- Share power tools, gardening equipment
- Set community rules for tool care
- Track who has what and when it's due back

### Book Clubs
- Share books within reading groups
- Track who's reading what
- Organize book discussions

### Hobby Communities
- Share specialized equipment
- Connect people with similar interests
- Build community around shared resources

### Family/Close Friends
- Share items within trusted groups
- Coordinate borrowing within social circles
- Keep track of shared belongings

## 🔒 Privacy & Security

- **Community Privacy**: Only members can see community content
- **Item Privacy**: Only item owners can see who has their items
- **Approval System**: Community owners control membership
- **Secure Authentication**: Email/password with bcrypt hashing
- **Session Management**: Secure cookie-based sessions

## 🚀 Deployment

The app is configured for deployment on Fly.io with:
- Docker containerization
- SQLite database with persistent volumes
- GitHub Actions for CI/CD
- Health check endpoints

## 🤝 Contributing

This is a community sharing platform built with modern web technologies. The codebase is structured for easy extension and customization.

## 📝 License

Built with the Remix Indie Stack template, now transformed into a community sharing platform.
