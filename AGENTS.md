# OP Motors

This project is a standalone web application built with TanStack Start, React 19, Tailwind CSS v4, and Supabase.

## Architecture

- **Frontend & SSR**: TanStack Start + Vite + React 19
- **Routing**: TanStack Router (file-based routing in `src/routes/`)
- **Backend & Database**: Supabase (PostgreSQL with Row-Level Security, Supabase Auth, Storage)
- **Styling**: Tailwind CSS v4 + Radix UI primitives (`src/components/ui/`)
- **Data Access**: `@tanstack/react-query` + Supabase JS Client

## Environment Variables

Configure your credentials in `.env`:

```env
SUPABASE_PROJECT_ID="bnfxzhzqveczmyswoawu"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_nBwO9MlNLDb7r8I0bU-lXA_KB2-O8Mo"
SUPABASE_URL="https://bnfxzhzqveczmyswoawu.supabase.co"
VITE_SUPABASE_PROJECT_ID="bnfxzhzqveczmyswoawu"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_nBwO9MlNLDb7r8I0bU-lXA_KB2-O8Mo"
VITE_SUPABASE_URL="https://bnfxzhzqveczmyswoawu.supabase.co"
# Optional server-side service role key for bypassing RLS:
# SUPABASE_SERVICE_ROLE_KEY="..."
# Optional database connection string for Drizzle migrations:
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.bnfxzhzqveczmyswoawu.supabase.co:5432/postgres"
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   # or: bun install / pnpm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or: bun run dev / pnpm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
