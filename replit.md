# SyncFlow - Freshdesk & Azure DevOps Integration

## Overview

SyncFlow is a web application that bridges the gap between customer support (Freshdesk) and engineering (Azure DevOps). It synchronizes tickets between both platforms, automates acceptance criteria generation, and enables seamless cross-team communication. The application features a dashboard, live simulation mode for testing integrations, and comprehensive settings for configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Development**: Hot module replacement via Vite middleware
- **Production**: Static file serving from compiled dist folder

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **IntegrationConfig**: Stores Freshdesk and Azure DevOps credentials
- **FieldMapping**: Maps Freshdesk fields to Azure DevOps fields
- **StatusMapping**: Maps ticket statuses between platforms
- **PriorityMapping**: Maps priority levels between platforms
- **TeamRouting**: Routes tickets to specific teams
- **SyncLog**: Tracks synchronization history
- **WebhookTrigger**: Configures webhook automation rules

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   └── pages/        # Route components
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── sync-service.ts   # Integration sync logic
├── shared/           # Shared code between client/server
│   └── schema.ts     # Database schema and types
```

## External Dependencies

### Third-Party Services
- **Freshdesk API**: Customer support ticket management
- **Azure DevOps API**: Work item and project management
- **PostgreSQL**: Primary database (via DATABASE_URL environment variable)

### Key Libraries
- **drizzle-orm**: Type-safe database queries
- **@tanstack/react-query**: Data fetching and caching
- **zod**: Schema validation
- **express-session** with **connect-pg-simple**: Session management
- **date-fns**: Date formatting utilities

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- Freshdesk and Azure DevOps credentials are stored in the database after configuration

### Azure DevOps Custom Fields Required
The following custom fields must exist in Azure DevOps for full functionality:
- **Custom.Support** (Boolean): Automatically set to `true` for support tickets
- **Custom.TicketID** (String): Stores the Freshdesk ticket number
- **Custom.EstimatedDeliveryDate** (DateTime): Maps to Freshdesk due_by field

### Sync Features
- **Ticket → Work Item**: Creates Azure DevOps work items from Freshdesk tickets based on team routing
- **Comment Sync**: Bi-directional using @DevOps and @Freshdesk mentions
- **Status Sync**: Freshdesk status changes sync to Azure DevOps
- **Closure Notification**: When Azure DevOps work items are closed, a note is added to the linked Freshdesk ticket