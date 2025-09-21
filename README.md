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
| `VITE_API_BASE_URL` | Base URL for API requests | `/api` | `http://localhost:3001/api` |

## Usage

The API utility functions in `src/utils/api.ts` automatically use the environment variable:

- `apiRequest(endpoint, options)` - Basic API request
- `apiRequestWithAuth(endpoint, options)` - API request with authentication token

## Development vs Production

- **Development**: Use `http://localhost:3001/api` (or your local backend URL)
- **Production**: Use your production API URL (e.g., `https://api.ynovamarketplace.com.br`)

## Docker Setup

### Building with Docker

To build the frontend application using Docker:

```bash
# Build the Docker image
docker build -t ynova-portal-frontend .

# Run the container with environment variable
docker run -p 8080:80 -e VITE_API_BASE_URL=http://localhost:3001/api ynova-portal-frontend

# AWS EC2
docker run -p 8080:80 -e VITE_API_BASE_URL=http://ec2-18-116-166-24.us-east-2.compute.amazonaws.com:3001/api ynova-portal-frontend
```

### Docker Build Arguments

You can also pass the API URL as a build argument:

```bash
# Build with build argument
docker build --build-arg VITE_API_BASE_URL=http://localhost:3001/api -t ynova-portal-frontend .

# Build with EC2 URL
docker build --build-arg VITE_API_BASE_URL=http://ec2-18-116-166-24.us-east-2.compute.amazonaws.com:3001/api -t ynova-portal-frontend .

# Run the container
docker run -p 8080:80 ynova-portal-frontend
```

### Production Build

For production deployment:

```bash
# Build for production
docker build --build-arg VITE_API_BASE_URL=https://api.ynovamarketplace.com.br -t ynova-portal-frontend:prod .

# Run in production
docker run -p 80:80 ynova-portal-frontend:prod
```

## AWS ECR Deployment

### Push to ECR

1. **Authenticate with ECR**:
   ```bash
   aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 646057971790.dkr.ecr.us-east-2.amazonaws.com
   ```

2. **Build and tag image**:
   ```bash
   docker build --build-arg VITE_API_BASE_URL=https://api.ynovamarketplace.com/api -t ynova-portal-frontend .
   docker tag ynova-portal-frontend:latest 646057971790.dkr.ecr.us-east-2.amazonaws.com/ynova-portal-frontend:latest
   ```

3. **Push to ECR**:
   ```bash
   docker push 646057971790.dkr.ecr.us-east-2.amazonaws.com/ynova-portal-frontend:latest
   ```

## Notes

- All environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend
- The API utility functions fall back to `/api` if no environment variable is set
- Authentication tokens are automatically included in requests when using `apiRequestWithAuth`
- The Dockerfile uses Node.js 22 and nginx for serving the built application
- The application will be available on port 80 inside the container
