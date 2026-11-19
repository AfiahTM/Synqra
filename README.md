# Synqra

Synqra - “Keep work moving. Even when plans change.” — is an interactive humanAI workforce coordination prototype for the fictional Northstar Learning Studio.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

Deploy the generated `dist` directory to Vite-compatible static hosting.

## Included capabilities

- Command Center dashboard derived from persisted task and workforce state
- Goal-to-execution demo planning engine
- Human and AI workforce allocation recommendations
- Lead-trainer disruption and recovery approval flow
- Local decision and activity history
- Local Storage persistence across refreshes
- Repeatable guided demo and scenario reset

## Architecture

- `src/App.tsx`: application state, seeded demo data, and feature modules
- `src/App.css`: responsive B2B application styling
- `src/index.css`: global base styles

The planner is explicitly a rule-based **Demo Planning Engine**. AI-agent actions are simulated. No API credentials are required or exposed.

## Current limitations

- Data is stored in browser Local Storage, not Supabase
- AI agents demonstrate capabilities but do not call external services
- There is no authentication or server-side multi-user synchronization
- Slack, Teams, Jira, Asana, and live AI integrations are future work
