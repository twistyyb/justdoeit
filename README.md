# JustDoeIt - Study Session Tracker

A modern web application to track and analyze study sessions with location recommendations and analytics.

## Project Structure

```
justdoeit/
├── backend/              # Python Flask backend (legacy/placeholder)
│   ├── app.py
│   ├── requirements.txt
│   └── __init__.py
├── frontend/             # React + TypeScript frontend (Vite)
│   ├── client/          # React application code
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions & API client
│   │   └── pages/       # Page components
│   ├── shared/          # Shared types between client & server
│   │   └── api.ts       # API type definitions
│   ├── server/          # Express dev server
│   │   ├── index.ts     # Server setup
│   │   └── routes/      # API routes for development
│   ├── functions/       # Serverless function handlers (optional)
│   ├── public/          # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
└── README.md
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **UI Components**: Radix UI primitives
- **Styling**: TailwindCSS
- **State Management**: React hooks + TanStack Query (ready)
- **Forms**: React Hook Form
- **Dev Server**: Express (for API proxying during development)

### Backend (To Be Implemented)
- **Planned**: FastAPI + Supabase
- **Current**: Express dev server (development only)

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm (specified package manager)
- Git

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Create environment file (optional):**
   ```bash
   # Create .env.local file
   cat > .env.local << EOF
   VITE_API_BASE_URL=http://localhost:8000
   EOF
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```
   
   The application will be available at `http://localhost:8080`

5. **Build for production:**
   ```bash
   pnpm build
   ```
   
   This creates:
   - `dist/spa/` - Client-side React build
   - `dist/server/` - Server-side Express build

6. **Run production build:**
   ```bash
   pnpm start
   ```

### Available Scripts

```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Build both client and server for production
pnpm build:client     # Build client only
pnpm build:server     # Build server only
pnpm start            # Run production build
pnpm test             # Run tests
pnpm typecheck        # Check TypeScript types
pnpm format.fix       # Format code with Prettier
```

## Essential Files for Running Frontend

To run the frontend on your local computer, you need these files:

### Core Configuration Files
- `package.json` - Dependencies and scripts
- `pnpm-lock.yaml` - Lock file for consistent installs
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `vite.config.server.ts` - Server build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Application Code
- `client/` - All React application code
  - `components/` - UI components (modals, selectors, cards)
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities and API client
  - `pages/` - Page components (Index.tsx, NotFound.tsx)
- `shared/` - Shared TypeScript types
  - `api.ts` - API type definitions
- `server/` - Express development server
  - `index.ts` - Server entry point
  - `routes/` - API routes
- `public/` - Static assets (favicon, images, robots.txt)

### Optional Files
- `functions/api.ts` - For serverless deployment (Netlify/Vercel)
- `api-integration.md` - API documentation
- `.dockerignore` - Docker ignore rules (if using Docker)

## API Integration

The frontend is ready for backend integration. All API calls are centralized in `client/lib/api.ts` using the `ApiClient` class.

### Expected API Endpoints

```
GET  /api/locations      - Fetch all study locations
POST /api/locations      - Create new location
GET  /api/users          - Search users (for collaborators)
GET  /api/users/{id}     - Get specific user
GET  /api/sessions       - Get user's study sessions
GET  /api/sessions/{id}  - Get specific session
POST /api/create_sesh    - Create new study session
```

See `api-integration.md` for detailed API specifications.

## Development Workflow

1. **Frontend development** runs independently on port 8080
2. **Express dev server** handles `/api/*` routes during development
3. **Backend integration** point `VITE_API_BASE_URL` to your FastAPI server when ready
4. **Production deployment** builds static React app + optional server build

## Features

### Current Features (UI Ready)
- ✅ Dashboard with recommendations and analytics
- ✅ Log study session modal with form validation
- ✅ Recent sessions viewer
- ✅ Location selector with create new option
- ✅ Collaborator multi-select
- ✅ Modern, responsive design with gradient backgrounds
- ✅ Component library (Radix UI + custom components)

### Backend Integration Needed
- ⏳ User authentication
- ⏳ Session CRUD operations
- ⏳ Location management
- ⏳ User search and collaboration
- ⏳ Analytics data aggregation
- ⏳ Database (Supabase PostgreSQL)

## Project Status

- **Frontend**: ✅ Complete and ready for integration
- **Backend**: ⏳ To be implemented with FastAPI
- **Database**: ⏳ To be set up with Supabase
- **Authentication**: ⏳ To be implemented

## Contributing

1. Make changes in the `frontend/client/` directory
2. Test with `pnpm dev`
3. Type check with `pnpm typecheck`
4. Format code with `pnpm format.fix`
5. Build to ensure no errors: `pnpm build`

## License

[Add your license here]
