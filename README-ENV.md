# Environment Variables Setup

## API Configuration

To configure the API base URL, create a `.env` file in the root of the frontend project with the following content:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

## Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE_URL` | Base URL for API requests | `/api` | `http://localhost:3000/api` |

## Usage

The API utility functions in `src/utils/api.ts` automatically use the environment variable:

- `apiRequest(endpoint, options)` - Basic API request
- `apiRequestWithAuth(endpoint, options)` - API request with authentication token

## Development vs Production

- **Development**: Use `http://localhost:3000/api` (or your local backend URL)
- **Production**: Use your production API URL (e.g., `https://api.yourapp.com/api`)

## Notes

- All environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend
- The API utility functions fall back to `/api` if no environment variable is set
- Authentication tokens are automatically included in requests when using `apiRequestWithAuth`
