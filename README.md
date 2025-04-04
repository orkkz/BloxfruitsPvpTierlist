# Blox Fruits PVP Tier List

A dynamic Blox Fruits PVP tier list website that provides comprehensive player rankings across multiple categories. The platform offers deep Roblox integration, allowing players to explore and compare performance metrics with intuitive search and filtering capabilities.

## Features

- Player rankings with tier classifications (SS, S, A, B, C, D, E)
- Multiple category support (Overall, Melee, Fruit, Sword, Gun, Bounty)
- Admin dashboard for managing players and tier assignments
- Discord webhook integration for real-time notifications
- Database connection management (supports SQLite and PostgreSQL)
- Responsive design for all devices

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: SQLite (default), PostgreSQL (optional)
- **ORM**: Drizzle ORM with Zod schema validation
- **Authentication**: Passport.js with session-based auth
- **Form Management**: React Hook Form
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS with theming support

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at http://localhost:5000

## Default Admin Credentials

- Username: `lucifer`
- Password: `mephist`

## Discord Webhook Integration

The application supports sending real-time notifications to Discord when player tiers are updated. Configure the webhook URL in the player's profile to enable this feature.

## Database Management

The application supports both SQLite and PostgreSQL databases:

- SQLite is used by default with data stored in `./data/bloxfruits_pvp.db`
- PostgreSQL can be configured through the admin interface

## License

MIT