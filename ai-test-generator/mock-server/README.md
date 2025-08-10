# Mock Server for AI Test Case Generator

This mock server provides API endpoints that match the FastAPI backend structure, allowing independent frontend development.

## Setup

1. Install dependencies:

```bash
cd mock-server
npm install
```

2. Start the mock server:

```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Test Cases

- `GET /api/test-cases` - Get all test cases
- `GET /api/test-cases/:id` - Get specific test case
- `POST /api/test-cases/generate` - Generate new test case
- `POST /api/test-cases/generate/from-acceptance-criteria` - Generate from acceptance criteria
- `POST /api/test-cases/generate/from-jira` - Generate from Jira ticket
- `POST /api/test-cases/find-similar` - Find similar test cases
- `GET /api/test-cases/search` - Search test cases with filters
- `PUT /api/test-cases/:id` - Update test case
- `DELETE /api/test-cases/:id` - Delete test case

### Integrations

- `GET /api/integrations/jira/tickets` - Get all Jira tickets
- `GET /api/integrations/jira/tickets/:ticketId` - Get specific Jira ticket

### Health

- `GET /api/health` - Service health check

## Data Structure

The mock server uses FastAPI-compatible schema with snake_case properties:

- `test_cases` with `test_steps`
- `jira_tickets`
- `similar_cases`

## Development

To modify mock data, edit `db.json`. The middleware handles request transformations and response formatting to match FastAPI endpoints.

## Configuration

- Port: 5000 (configurable in package.json)
- CORS: Enabled for all origins
- Delay: Simulated API response delays for realistic testing
