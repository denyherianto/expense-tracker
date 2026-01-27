# Finance Tracker

A personal finance tracking application built with Next.js, featuring AI-powered invoice parsing, Google OAuth authentication, and beautiful charts for visualizing your financial data.

## Features

- Track income and expenses
- AI-powered invoice parsing (via OpenAI)
- Google OAuth authentication
- Monthly financial reports with charts
- PWA support for mobile devices
- Dark/light theme support
- Pocket sharing

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **AI**: OpenAI API for invoice parsing

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials (optional, for social login)
- OpenAI API key (optional, for AI features)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd finance-tracker
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Yes | Your application URL (e.g., `http://localhost:3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key for session signing (generate with `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `OPENAI_BASE_URL` | No | Custom OpenAI-compatible endpoint |
| `OPENAI_MODEL` | No | Model to use (defaults to gpt-4) |

### 4. Set up the database

Run database migrations:

```bash
npx drizzle-kit push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Docker

Build and run with Docker:

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

Note: For production, use proper environment variable injection instead of `--env-file`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── actions/      # Server actions
│   └── api/          # API routes
├── components/       # React components
│   └── ui/           # UI component library
├── db/               # Database schema and config
└── lib/              # Utility functions and config
```

## Security Notes

- Never commit `.env.local` or any file containing secrets
- The `.gitignore` is configured to exclude `.env*` files
- Rotate credentials immediately if accidentally exposed
- Use environment variables in production (via your hosting platform)

## License

MIT
