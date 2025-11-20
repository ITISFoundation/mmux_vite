# GitHub Copilot Instructions for MMUX Vite

## Project Overview
This repository contains MMUX Vite, a meta-modeling application that provides interactive, user-friendly, step-by-step functionality. The project uses a modern full-stack architecture with React/TypeScript frontend, Python Flask backend, and integration with the oSPARC platform via API.

## Technology Stack & Architecture

### Frontend (72.1% TypeScript)
- **Framework**: Vite + React + TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **API Client**: Custom TypeScript client generated from OpenAPI specs (`node/src/osparc-api-ts-client/`)
- **Development**: Hot reload and modern ES modules support

### Backend (25% Python)
- **Framework**: Flask
- **API Integration**: osparc Python package for oSPARC platform communication
- **Containerization**: Docker-based development and deployment
- **Package Management**: Requirements-based Python dependencies

### Infrastructure (1.5% Makefile + 0.3% Dockerfile + 0.3% Shell)
- **Containerization**: Docker containers for both frontend and backend
- **Development Workflow**: Make-based automation
- **Environment**: Environment variable configuration via `.env`

## Development Patterns & Conventions

### Project Structure
```
mmux_vite/
├── node/                    # Frontend TypeScript/React application
│   └── src/
│       └── osparc-api-ts-client/  # Generated TypeScript API client
├── flaskapi/               # Python Flask backend
├── Makefile               # Development automation
├── docker-compose.*.yml   # Container orchestration
└── .env                   # Environment configuration
```

### Code Generation & API Integration
- TypeScript API client is auto-generated from OpenAPI specifications
- Backend uses `osparc` Python package (version managed in `flaskapi/Dockerfile`)
- API specs are updated from osparc-simcore-clients repository

## Development Guidelines

### Environment Setup
```bash
# Initial setup - create environment file
make .env

# Build Docker images
make build

# Start development mode
make run-develop

# Production validation (always run before committing)
make run-prod-local
```

### Code Style & Patterns
- **TypeScript**: Use strict typing, prefer interfaces over types for object shapes
- **React**: Functional components with hooks, follow React best practices
- **Python**: Flask patterns, use type hints where possible
- **API Integration**: Leverage generated clients, don't write manual API calls

### Docker-First Development
- All development happens inside Docker containers
- Source code is mounted as volumes for live reloading
- Separate development and production configurations
- Always validate with production build before merging

### API Client Management
When oSPARC API changes:
1. Fork and update osparc-simcore-clients repository
2. Run `make openapi-osparc-simcore-master-branch` in api/ directory
3. Update osparc package version in `flaskapi/Dockerfile`
4. Test integration thoroughly

## Coding Assistance Preferences

### For TypeScript/React Frontend:
- Prioritize type safety and use proper TypeScript patterns
- Generate React functional components with appropriate hooks
- Use the generated API client types for all oSPARC interactions
- Follow Vite best practices for imports and bundling
- Implement responsive and accessible UI components

### For Python/Flask Backend:
- Use Flask patterns and decorators appropriately
- Integrate with osparc package methods correctly
- Implement proper error handling for API responses
- Follow Python naming conventions and type hints
- Structure endpoints logically and RESTfully

### For Configuration & Infrastructure:
- Maintain Docker containerization patterns
- Update Makefile targets for new workflows
- Handle environment variables securely
- Follow the existing build and deployment patterns

## Testing & Validation
- Always run `make run-prod-local` before submitting changes
- Test both development and production Docker builds
- Validate API integrations with actual oSPARC endpoints
- Ensure TypeScript compilation passes without errors

## Dependencies & Updates
- **Frontend**: Managed via npm/package.json in node/ directory
- **Backend**: Python requirements and osparc package versions
- **API Client**: Auto-generated, update when oSPARC specs change
- **Infrastructure**: Docker images and Make targets

## Integration Points
- oSPARC platform API integration is central to functionality
- Environment configuration drives API connectivity
- Generated TypeScript client must stay synchronized with backend API
- Meta-modeling workflows depend on oSPARC service availability

This project emphasizes:
1. **Interactive Development**: Fast feedback loops via Vite and Docker volumes
2. **API-First Design**: Generated clients and structured API integration
3. **Production Validation**: Mandatory production build testing
4. **Container Consistency**: Docker-based development and deployment
5. **Meta-Modeling Focus**: User-friendly, guided step-by-step workflows