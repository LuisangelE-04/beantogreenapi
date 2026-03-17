# Bean to Green Worker

A Cloudflare Workers API built with Express, TypeScript, and PostgreSQL via Neon Database.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Cloudflare account** (for deployment)
- **Neon Database account** (for PostgreSQL hosting)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs all required packages including:
   - Wrangler (Cloudflare Workers CLI)
   - TypeScript compiler
   - Vitest (testing framework)
   - Express and related dependencies

## Development

### Running the Development Server

Start the local development server with hot reload:

```bash
npm run dev
```

Or use the alias:

```bash
npm start
```

This command:
- Runs Wrangler in development mode
- Provides a local URL for testing (typically `http://localhost:8787`)
- Enables hot reload during development
- Simulates the Cloudflare Workers environment locally

### Generate Type Definitions

Generate TypeScript types from your Wrangler configuration:

```bash
npm run cf-typegen
```

This creates type definitions for environment variables, bindings, and other Worker-specific APIs. Run this after updating `wrangler.jsonc`.

## Testing

Run the test suite:

```bash
npm test
```

Or with watch mode:

```bash
npm test -- --watch
```

The project uses **Vitest** with the `@cloudflare/vitest-pool-workers` pool for testing in a Cloudflare Workers environment.

**Test location:** `test/` directory

## Deployment

### Deploy to Production

Deploy to your Cloudflare Workers account:

```bash
npm run deploy
```

Or directly with wrangler:

```bash
npx wrangler deploy
```

This uploads your Worker to Cloudflare and makes it live on your configured route.

### Deployment Prerequisites

Before deploying, ensure:
1. You're authenticated with Cloudflare (`npx wrangler login`)
2. Your environment variables and secrets are configured in Cloudflare dashboard or via `npx wrangler secret put`
3. Database connection strings are set as secrets, not in source code

```bash
# Example: Set a database connection secret
npx wrangler secret put DATABASE_URL
```

## Environment Variables & Secrets

### Local Development

Environment variables for local development should be handled through Wrangler's environment configuration in `wrangler.jsonc` or via environment variable files.

### Production Secrets

Store sensitive data (database credentials, API keys) using Wrangler secrets:

```bash
npx wrangler secret put SECRET_NAME
```

Access secrets in your Worker code via environment variables passed to the Worker context.

## Project Structure

```
src/
  ├── index.ts           # Main Worker entry point
  ├── routes/            # API route handlers
  ├── db/                # Database configuration
  ├── middleware/        # Express middleware
  ├── types/             # TypeScript type definitions
  └── utils/             # Utility functions
test/                   # Test files
schemas/                # JSON schemas for validation
```
<!--
## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm test` | Run test suite |
| `npm run cf-typegen` | Generate TypeScript types from wrangler config |
| `wrangler login` | Authenticate with Cloudflare account |
| `wrangler tail` | Stream live logs from deployed Worker |

## Key Dependencies

- **wrangler**: Cloudflare Workers CLI and runtime
- **express**: Web framework
- **@neondatabase/serverless**: Neon Database client for edge environments
- **pg**: PostgreSQL client
- **bcrypt**: Password hashing
- **typescript**: Type safety
- **vitest**: Testing framework

## Database Connection

This project connects to a PostgreSQL database via Neon Database.

**Connection:** Neon's serverless PostgreSQL driver is used for compatibility with Cloudflare Workers' edge environment.

Ensure your `DATABASE_URL` secret is set with the proper Neon connection string format.

## Troubleshooting

### Deployment fails
- Run `wrangler login` to ensure authentication
- Check `wrangler.jsonc` for valid configuration
- Verify all required secrets are set

### Development server won't start
- Ensure Node.js version is v18+
- Delete `node_modules/` and run `npm install` again
- Check port 8787 is not in use

### Database connection issues
- Verify `DATABASE_URL` secret is accessible
- Test the connection string locally
- Check Neon account and database status

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Neon Database Documentation](https://neon.tech/docs/introduction)
- [Express.js Guide](https://expressjs.com/)
-->
