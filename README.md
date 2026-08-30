# TECHNOVA

**AI-Powered Digital Business Ecosystem for MSMEs**

## Overview

TECHNOVA is a comprehensive platform that digitizes and empowers Micro, Small, and Medium Enterprises (MSMEs) through AI-driven tools for business management, communication, and growth.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) + PostgreSQL
- **Design**: Modular Monolith (domain-driven)

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Seller Profile | ✅ Implemented | Business profile management & verification |
| Product Listing | 🔜 Planned | Product catalog & inventory |
| Buyer Discovery | 🔜 Planned | Search & buyer matching |
| Unified Inbox | 🔜 Planned | Email & messaging integration |
| AI Communication | 🔜 Planned | AI-powered drafting & insights |
| Human Approval | 🔜 Planned | Review workflows |
| Analytics | 🔜 Planned | Sales insights & metrics |
| API Integration | 🔜 Planned | External marketplace sync |
| Admin | 🔜 Planned | System administration |
| Authentication | 🔜 Planned | JWT, OAuth2, RBAC |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 16+

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
cd backend
alembic upgrade head
```

### API Docs
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
technova/
├── frontend/          # React SPA
│   └── src/
│       ├── modules/   # Business domain modules
│       ├── components/# Shared UI components
│       ├── layouts/   # Page layouts
│       ├── services/  # API client
│       ├── hooks/     # React hooks
│       ├── store/     # State management
│       ├── types/     # Type definitions
│       └── utils/     # Utility functions
│
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── core/      # Config, security, exceptions
│   │   ├── infrastructure/ # Database clients
│   │   ├── modules/   # Business domain modules
│   │   └── shared/    # Shared enums, schemas, utils
│   ├── alembic/       # Database migrations
│   └── tests/         # Unit & integration tests
│
├── docs/              # Documentation
└── docker-compose.yml # Development environment
```

## Development

- Frontend runs on http://localhost:5173
- Backend runs on http://localhost:8000
- PostgreSQL runs on localhost:5432

## License

Proprietary — TECHNOVA Team
