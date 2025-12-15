# SyncFlow - Freshdesk & Azure DevOps Integration

SyncFlow is a web application that bridges the gap between customer support (Freshdesk) and engineering (Azure DevOps). It synchronizes tickets between both platforms, automates acceptance criteria generation, and enables seamless cross-team communication.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (automatically provided in Replit)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the application:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Configuration

### Environment Variables

The following environment variable is required:
- `DATABASE_URL` - PostgreSQL connection string (automatically set in Replit)

### Integration Setup

1. Navigate to Settings in the application
2. Configure your Freshdesk credentials:
   - Freshdesk Domain (e.g., `yourcompany.freshdesk.com`)
   - API Key
3. Configure your Azure DevOps credentials:
   - Organization URL (e.g., `https://dev.azure.com/yourorg`)
   - Personal Access Token (PAT)
   - Default Project name

### Webhook Configuration

After configuring credentials, set up webhooks:

**Freshdesk:**
1. Go to Freshdesk Admin → Automations → Webhooks
2. Add the Freshdesk Webhook URL shown in Settings

**Azure DevOps:**
1. Go to Project Settings → Service Hooks → Web Hooks
2. Add the Azure DevOps Webhook URL shown in Settings

### Azure DevOps Custom Fields

For full functionality, create these custom fields in Azure DevOps:
- `Custom.Support` (Boolean) - Marks work items as support tickets
- `Custom.TicketID` (String) - Stores the Freshdesk ticket number
- `Custom.EstimatedDeliveryDate` (DateTime) - Maps to Freshdesk due date

## Features

- **Ticket Sync**: Automatically create Azure DevOps work items from Freshdesk tickets
- **Comment Sync**: Bi-directional comment syncing using @DevOps and @Freshdesk mentions
- **Status Sync**: Freshdesk status changes sync to Azure DevOps
- **Field Mappings**: Configure which Freshdesk fields map to Azure DevOps fields
- **Value Mappings**: Convert field values between platforms (e.g., priority levels)
- **Team Routing**: Route tickets to specific teams based on tags
- **AI Summarization**: Generate acceptance criteria from ticket descriptions

## Project Structure

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
├── shared/           # Shared code
│   └── schema.ts     # Database schema and types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm start` - Start production server

## License

MIT
