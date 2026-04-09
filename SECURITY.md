# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub Issue for security vulnerabilities.
2. Send an email to: **jsoftsolutions1@gmail.com**
3. Include a detailed description of the vulnerability and steps to reproduce it.
4. Allow 24-48 hours for an initial response.

## Security Best Practices

### Backend
- All passwords are hashed with bcrypt (cost factor 12)
- JWT tokens with configurable expiration (default: 1h)
- Multi-tenant isolation via `tenant_id` in every database query
- RBAC dynamic permissions stored in database
- All sensitive operations are audited

### API
- Tenant resolution via subdomains (public routes) or JWT (authenticated routes)
- No `tenant_id` accepted from frontend — always resolved server-side
- Input validation on all endpoints (Zod + express-openapi-validator)

### Infrastructure
- PostgreSQL with connection pooling
- Non-root Docker containers
- Environment variables for all secrets (never committed to repo)
- Docker user with UID 1001 for production deployments

## Security Checklist (Development)

- [ ] All environment variables are in `.env.example`, never real values
- [ ] `.env` is in `.gitignore`
- [ ] Database credentials are rotated in production
- [ ] JWT secret is a long random string (min 32 characters)
- [ ] HTTPS enforced in production
- [ ] CORS configured for specific origins only
- [ ] Rate limiting enabled in production
- [ ] Secrets scanning enabled in GitHub repository
