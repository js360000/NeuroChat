# AGENTS.md - NeuroNest AI

## Commands
### Frontend (run from `app/` directory)
- **Dev server**: `npm run dev` (port 5173)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Backend (run from `neuronest-backend/` directory)
- **Dev server**: `npm run dev` (port 3001)
- **Build**: `npm run build`
- **Start**: `npm run start`

## Architecture
- **Frontend**: React 19 + TypeScript + Vite (`app/`)
- **Backend**: Express + TypeScript + Socket.io (`neuronest-backend/`)
- **Payments**: Stripe Checkout + Customer Portal + Webhooks
- **State**: Zustand stores in `app/src/lib/stores/`
- **API layer**: `app/src/lib/api/`
- **UI components**: shadcn/ui + Radix primitives in `app/src/components/ui/`
- **Routing**: react-router-dom with protected/public route wrappers
- **Styling**: Tailwind CSS + class-variance-authority for variants

## Environment Variables (Backend)
- `STRIPE_SECRET_KEY`: Stripe API secret key (required)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (required for webhooks)
- `FRONTEND_URL`: Frontend URL for Stripe redirects

## Code Style
- Use `cn()` from `@/lib/utils` for merging Tailwind classes
- Named exports for components (`export { Button }`)
- Path alias `@/` maps to `app/src/`
- Components use `function` declarations, not arrow functions
- Use shadcn/ui patterns: `cva` for variants, Radix primitives, `data-slot` attributes
- Forms: react-hook-form + zod validation
