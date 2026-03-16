# Changelog

**Format**: Semantic Versioning (MAJOR.MINOR.PATCH)  
**Last Updated**: March 16, 2026

---

## v1.0.0

### Added or Changed

**Core Features**:

- Asprak Management: Full CRUD operations with automatic code generation (JD2024001 format), bulk import/export, NIM validation, and cohort tracking
- Schedule Management: Weekly practicum scheduling with course-to-room mapping, module-based scheduling, multi-term support, and replacement schedule handling
- Assignment System (Plotting): Dynamic asprak-to-course assignment with bulk import, real-time conflict detection, and validation system
- Violation Tracking: Disciplinary record keeping with four violation types (Tidak Hadir, Terlambat, Tidak Lengkap, Lainnya), module-specific recording, and immutable finalized records
- Role-Based Access Control (RBAC): Three roles (Admin, Aslab, Asprak Coordinator) with row-level security policies and permission-based UI rendering
- Audit Logging: Complete audit trail with automatic logging of all data changes, user identification, timestamps, and audit log viewer
- Dashboard & Analytics: Key statistics, violation summaries, schedule overview, and system health indicators

**Technical Stack**:

- TypeScript end-to-end type safety
- Next.js 16.1 with React Server Components
- Supabase PostgreSQL database
- Shadcn UI component library with Tailwind CSS 4.x
- TanStack Table for data grids and Recharts for data visualization
- JWT-based authentication with HTTPS/SSL encryption
- Automatic backups and database management

**Infrastructure & Documentation**:

- Development environment setup with npm scripts for development, building, linting, and formatting
- Production-ready configuration with Docker, Vercel, PM2, and Nginx support
- Complete API reference, architecture documentation, database schema with ERD, development guide, deployment guide, security documentation, troubleshooting guide, and service layer documentation
- Sample data (seed script), connection testing utility, and manual test procedures

**Security Implementation**:

- Strict input validation on all endpoints with SQL injection prevention through parameterized queries
- CSRF protection via Next.js built-in mechanisms
- JWT token validation on every request
- Environment variable separation with .env.local for secrets
- Security headers configured (X-Frame-Options, X-Content-Type-Options, etc)
- HTTPS/TLS encryption required
- Rate limiting support ready for implementation

### Known Limitations

- Single-region deployment (Supabase)
- No real-time collaboration (Supabase Realtime not fully integrated)
- Maintenance window requires manual trigger
- Password reset requires email verification (Supabase limitation)

---

## v1.1.0 (Planned)

### Added or Changed

- Advanced reporting and visualization capabilities
- Export to PDF functionality for reports and data
- Email notifications system for violation alerts
- Data import from Excel with template support
- Multi-language support (English, Indonesian)
- Mobile-responsive UI optimization
- Advanced search and filtering capabilities
- Batch operations interface for administrators
- Performance optimization for large datasets
- Caching layer implementation
- GraphQL API option alongside REST
- WebSocket real-time updates integration
- Two-factor authentication (2FA)
- OAuth integration (LDAP, SSO)

---

## Version History

| Version | Release Date | Status   | Description                                                             |
| ------- | ------------ | -------- | ----------------------------------------------------------------------- |
| 1.0.0   | 2026-03-16   | Released | First production-ready version with core features, RBAC, and audit logs |
| 1.1.0   | TBD          | Planned  | Advanced features, reporting, and integrations                          |
| 2.0.0   | TBD          | Future   | Mobile app, GraphQL, advanced analytics                                 |

---

## Upgrade Guide

### Upgrading from 1.0.0 → 1.1.0

```bash
# 1. Backup database
# Via Supabase Dashboard → Settings → Backups

# 2. Pull latest code
git pull origin main

# 3. Install dependencies (if changed)
npm install

# 4. Build
npm run build

# 5. Test locally
npm run test

# 6. Deploy
# Vercel: Auto-deploys on push
# Manual: npm run build && npm start

# 7. Verify all features work and review audit logs
```

---

## Support

- Bug Reports: [GitHub Issues](https://github.com/your-org/manajemen-asprak/issues)
- Feature Requests: [GitHub Discussions](https://github.com/your-org/manajemen-asprak/discussions)
- Security Issues: security@lab.id
- General Questions: Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: March 16, 2026  
**Maintained By**: Development Team  
**Next Review**: June 16, 2026
