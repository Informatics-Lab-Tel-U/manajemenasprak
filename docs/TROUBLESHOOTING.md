# Troubleshooting Guide - Sistem Manajemen Asprak

**Document Type**: Troubleshooting & FAQ  
**Last Updated**: March 16, 2026  
**Status**: Active

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Setup Issues](#setup-issues)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [Data Import/Export Issues](#dataimportexport-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)
8. [FAQ](#faq)

---

## Quick Diagnostics

### Health Check

Run this command to verify system health:

```bash
# Test database connection
npx tsx scripts/test_fetch.ts

# Expected output:
# ✅ Connected to Supabase
# ✅ Tables: asprak, jadwal, pelanggaran, ...
```

### Check Environment

```bash
# Verify environment variables
cat .env.local | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

### Browser Console

Open DevTools (F12) and check:

1. **Console tab**: Any red error messages?
2. **Network tab**: Any failed HTTP requests (red status)?
3. **Storage tab**: Are cookies/tokens present?

---

## Setup Issues

### Issue: "npm install" fails

**Symptoms**: Error messages during `npm install`

**Common Causes**:

- Node/npm version too old
- Network connection issue
- Corrupted node_modules

**Solutions**:

```bash
# 1. Check versions
node --version   # Should be 18+
npm --version    # Should be 8+

# 2. Update npm if needed
npm install -g npm@latest

# 3. Clear cache
npm cache clean --force

# 4. Remove and reinstall
rm -rf node_modules package-lock.json
npm install

# 5. Try with different speed
npm install --no-optional
```

---

### Issue: "Cannot find module" error

**Symptoms**: `Error: Cannot find module '@/lib/supabase'`

**Causes**: Missing dependencies or TypeScript resolution issues

**Solutions**:

```bash
# 1. Verify file exists
ls -la src/lib/supabase/

# 2. Reinstall dependencies
npm install

# 3. Check TypeScript config
cat tsconfig.json | grep paths

# 4. Clear Next.js cache
rm -rf .next

# 5. Restart dev server
npm run dev
```

---

### Issue: "NEXT_PUBLIC_SUPABASE_URL not found"

**Symptoms**: Error: "Supabase URL is not set"

**Causes**: Missing `.env.local` file or empty values

**Solutions**:

```bash
# 1. Check if .env.local exists
ls -la .env.local

# 2. If missing, copy from example
cp .env.example .env.local

# 3. Edit and add your values
nano .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# 4. Verify file
cat .env.local

# 5. Restart server
npm run dev
```

---

### Issue: "Port 3000 already in use"

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:

```bash
# 1. Use different port
npm run dev -- -p 3001

# 2. Or find and kill process using port 3000
# On macOS/Linux:
lsof -i :3000           # Find PID
kill -9 <PID>           # Kill process

# On Windows:
netstat -ano | findstr :3000    # Find PID
taskkill /PID <PID> /F         # Kill process
```

---

## Database Issues

### Issue: "Connection timeout" or "Cannot connect to database"

**Symptoms**: Page loading forever, API response timeout

**Common Causes**:

- Supabase project paused/disabled
- Invalid credentials
- Network firewall issue

**Solutions**:

```bash
# 1. Test connection
npx tsx scripts/test_fetch.ts

# 2. Check Supabase status
# Visit https://status.supabase.com

# 3. Verify credentials in .env.local
cat .env.local | grep SUPABASE

# 4. Check Supabase dashboard
# Login to https://supabase.com
# → Select your project
# → Verify project is not paused

# 5. Test with curl (advanced)
curl "https://your-project.supabase.co/rest/v1/asprak" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "apikey: <ANON_KEY>"
```

---

### Issue: "No data showing in tables"

**Symptoms**: Database pages show empty tables

**Common Causes**:

- Tables truly empty
- User lacks permissions (RLS policy)
- Data in different academic term

**Solutions**:

```bash
# 1. Check if data exists
npx tsx scripts/seed.ts

# 2. Verify RLS policies aren't blocking
# Check Supabase → SQL Editor:
SELECT * FROM asprak LIMIT 10;

# 3. Check if filtering by term
# Look for filter dropdowns on page
# Select different academic term

# 4. Check browser console for errors
# F12 → Console tab

# 5. Verify user role has access
# Admin dashboard → Check user role
```

---

### Issue: "Foreign key constraint violation"

**Symptoms**: Error: "violates foreign key constraint"

**Causes**: Trying to create record without valid reference

**Example**: Creating pelanggaran with non-existent asprak_id

**Solutions**:

```bash
# 1. Verify referenced data exists
# If creating pelanggaran, check asprak exists:
SELECT id FROM asprak WHERE id = '...';

# 2. In UI, verify dropdown selections
# Make sure all required fields are selected

# 3. Check data in Supabase dashboard
# Go to Table Editor
# Verify referenced records exist
```

---

### Issue: "Duplicate key violation"

**Symptoms**: Error: "violates unique constraint"

**Causes**: Trying to insert duplicate NIM or kode_asprak

**Solutions**:

```bash
# 1. Check if record already exists
SELECT * FROM asprak WHERE nim = '12345678';

# 2. Try different NIM or code
# UI should generate unique codes automatically

# 3. If importing data, deduplicate CSV
# Remove duplicate rows before import

# 4. Contact admin to reset/clean data
```

---

### Issue: "No query results returned"

**Symptoms**: Empty select dropdown or missing data

**Common Causes**:

- Filter too restrictive
- Bug in query
- Data in different view/table

**Solutions**:

```bash
# 1. Clear all filters
# In UI, reset any category/term filters

# 2. Check SQL directly
SELECT COUNT(*) FROM praktikum
WHERE tahun_ajaran = '2024/1';

# 3. Verify academic term
# Make sure term matches your data

# 4. Check date values
# Some tables filter by date ranges
```

---

## 🔐 Authentication Issues

### Issue: "Can't login / Invalid email or password"

**Symptoms**: Login page doesn't accept credentials

**Common Causes**:

- Wrong email/password
- User doesn't exist
- User account inactive

**Solutions**:

```bash
# 1. Try admin credentials from seed
# Email: admin@lab.id
# (Check scripts/seed.ts for password)

# 2. Verify user exists
# Supabase Dashboard → Auth → Users
# Look for your email in list

# 3. Check if user is active
# Some accounts are deactivated

# 4. Reset password via email
# Click "Forgot password" link

# 5. Admin can create new user
# Admin → User Management → Add New User
```

---

### Issue: "Session/JWT token expired"

**Symptoms**: Page redirects to login unexpectedly

**Causes**: Token lifetime (24 hours) exceeded

**Solutions**:

```bash
# 1. Log in again
# Browser storage is cleared, new token issued

# 2. Don't leave browser open for >24 hours
# Sessions are intentionally short-lived

# 3. For CI/CD, use service role key
# Never use JWT token for automated tasks
```

---

### Issue: "Unauthorized / Access Denied"

**Symptoms**: "403 Forbidden" or "You don't have permission"

**Common Causes**:

- User role too low for action
- RLS policy blocks access
- Row-level security issue

**Solutions**:

```bash
# 1. Check user role
# Admin panel → check your role is set correctly

# 2. Verify RBAC permissions
# See docs/SECURITY.md for role permissions

# 3. Check RLS policies
# Supabase → Policies tab
# Verify policy allows your role

# 4. Admin can grant access
# Ask admin to update your role

# 5. Check specific resource
# Some coordinators can only see their courses
```

---

### Issue: "Lost session / Logged out unexpectedly"

**Symptoms**: Redirected to login page randomly

**Common Causes**:

- Token expired
- Supabase connection lost
- Browser storage cleared

**Solutions**:

```bash
# 1. Log in again
# Should be seamless

# 2. Check browser storage
# F12 → Application → Storage → LocalStorage
# Look for supabase auth key

# 3. Check if using incognito/private mode
# Private browsing blocks localStorage
# Use normal mode instead

# 4. Check network connection
# System should reconnect automatically

# 5. Check Supabase status
# https://status.supabase.com
```

---

## 📥 Data Import/Export Issues

### Issue: "CSV import fails with error"

**Symptoms**: Error on import, data not inserted

**Common Causes**:

- Invalid CSV format
- Missing or incorrect columns
- Data validation failure

**Solutions**:

```bash
# 1. Verify CSV format
# Check header row matches expected fields
# Expected: nim, nama_lengkap, angkatan, no_hp

# 2. Check data types
# num should be numeric
# Text fields shouldn't have special characters

# 3. Look for validation errors in response
# UI should show specific error: "NIM sudah ada"

# 4. Test with single row
# Try importing one row to isolate issue

# 5. Sample CSV format:
# nim,nama_lengkap,angkatan,no_hp
# 12345678,John Doe,2024,081234567890
# 87654321,Jane Smith,2024,087654321098
```

---

### Issue: "Export doesn't download / Empty file"

**Symptoms**: Download doesn't work or file is empty

**Common Causes**:

- No data to export
- Browser blocked download
- Filter hidden all data

**Solutions**:

```bash
# 1. Check if data exists
# Table should show rows before exporting

# 2. Clear filters
# Remove category/term filters
# Retry export

# 3. Check browser download settings
# Some browsers block automatic downloads
# Allow downloads for site in popup

# 4. Check file manually
# Downloaded file might be 0 bytes
# Try re-exporting

# 5. Try different format
# Some browsers prefer different download method
```

---

### Issue: "After import, data looks wrong"

**Symptoms**: Imported data has issues (truncated, wrong format)

**Common Causes**:

- CSV encoding issue (UTF-8 vs others)
- Date format mismatch
- Column mapping error

**Solutions**:

```bash
# 1. Re-export to check format
# Download existing export to see expected format

# 2. Check file encoding
# Save CSV as UTF-8 (not ANSI)
# Excel: Save As → CSV UTF-8 format

# 3. Check date format
# Use ISO format: YYYY-MM-DD

# 4. Trim whitespace
# Remove leading/trailing spaces from cells
# Some spreadsheet apps add extra spaces

# 5. Delete and re-import
# Delete imported records
# Fix CSV and try again
```

---

## ⚡ Performance Issues

### Issue: "Page loads slowly"

**Symptoms**: Taking >5 seconds to load page

**Common Causes**:

- Large data set
- Slow network
- Slow database query

**Solutions**:

```bash
# 1. Check network tab
# F12 → Network → See which requests are slow

# 2. Check Supabase CPU usage
# Supabase Dashboard → Monitoring → CPU
# See if database is overloaded

# 3. Enable pagination
# If showing large tables, implement pagination
# Reduces data transferred

# 4. Check for full table scans
# Ensure queries use indexes
# See docs/DATABASE.md for index info

# 5. Upgrade Supabase plan
# Free tier has limited resources
# Consider upgrading for production use
```

---

### Issue: "Large import times out"

**Symptoms**: Importing 1000+ rows takes forever or fails

**Causes**: Too much data in single transaction

**Solutions**:

```bash
# 1. Split CSV into chunks
# Import 500 rows at a time instead of 5000

# 2. Increase timeout (if possible)
# Some systems timeout at 30s
# Try different upload method

# 3. Use API directly (advanced)
# curl with multiple POST requests
# Batch insert 100 rows at a time

# 4. Use service role key for bulk operations
# More privileges = better performance
# Ask admin to upgrade import method

# 5. Off-peak import
# Import when system has less load
# Might be faster outside business hours
```

---

## 🚀 Deployment Issues

### Issue: "Environment variables missing in production"

**Symptoms**: Errors in production but not local

**Causes**: `.env.local` not pushed to server

**Solutions**:

```bash
# 1. Never commit .env.local to git
# Should be in .gitignore

# 2. Set variables on host manually
# If using Vercel:
#   → Project Settings → Environment Variables
# If using Docker:
#   → Pass as docker-compose environment

# 3. Verify variables set
# If SSH access: env | grep SUPABASE
# If platform UI: Check settings page

# 4. Restart application after setting vars
# Changes don't take effect until restart
```

---

### Issue: "CORS error in production"

**Symptoms**: "Cross-Origin Request Blocked" error

**Causes**: API domain not allowed

**Solutions**:

```bash
# 1. Supabase CORS configuration
# Supabase Dashboard → Settings → CORS
# Add production domain to allowed origins

# 2. Verify API URL
# Check that NEXT_PUBLIC_SUPABASE_URL is correct
# Format: https://project-id.supabase.co

# 3. Check browser console
# See exact error message
# Usually shows what domain is blocked

# 4. Check network tab
# Preflight request (OPTIONS) should succeed
# If fails, CORS not configured correctly
```

---

## ❓ FAQ

### Q: How do I backup my data?

**A**: Supabase handles automatic backups. To export:

```bash
# Export via Supabase dashboard
# Settings → Backups → Download CSV
# Or use API to query and export data
```

### Q: How do I reset everything to start fresh?

**A**:

```bash
# Delete all tables via Supabase SQL editor
# Or run seed script with reset flag
npx tsx scripts/seed.ts --reset
```

### Q: How do I change someone's password?

**A**: Users must use "Forgot Password" link. Admins cannot reset directly. (Supabase limitation for security)

### Q: Can I use this system offline?

**A**: No. System requires internet connection. Supabase is cloud-only. Consider alternative architecture if offline access needed.

### Q: How often should I update dependencies?

**A**:

- Security patches: Immediately
- Minor updates: Monthly
- Major updates: Quarterly with testing

Run:

```bash
npm outdated    # See what's outdated
npm update      # Update minor versions
npm install next@latest  # Update major version
```

### Q: How do I add a new user?

**A**:

```
Admin Dashboard → Manajemen Akun → Add New User
OR
API: POST /api/admin/users
Requires email, password, name, role
```

### Q: How do I delete all violations for someone?

**A**:

```bash
# Via Supabase SQL editor
DELETE FROM pelanggaran WHERE id_asprak = 'asprak-uuid';

# Via API if admin
API: DELETE /api/pelanggaran (multiple times, one per violation)
```

### Q: How do I export violation reports?

**A**:
Navigateto Pelanggaran Rekap (Violation Summary) page, click Export button. This gives CSV with violation summary.

### Q: Can I customize the violation types?

**A**:
Current types: Tidak Hadir, Terlambat, Tidak Lengkap, Lainnya. To add more, modify database enum or use "Lainnya" with description.

### Q: How do I monitor system health?

**A**:

- Check Supabase Dashboard → Monitoring
- Check audit logs for errors
- Monitor response times
- Watch database CPU usage
- Set up alerts (if using premium plan)

---

## 🆘 Still Having Issues?

### Escalation Path

1. **Check this guide**: Search for your issue above
2. **Check logs**:
   - Browser console (F12 → Console)
   - Terminal output (where npm run dev runs)
   - Supabase logs (Dashboard → Logs)
3. **Search documentation**: Check [ARCHITECTURE](./ARCHITECTURE.md), [API_REFERENCE](./API_REFERENCE.md)
4. **Contact team**:
   - Email: support@lab.id
   - Slack: #asprak-support
   - On-call: [PagerDuty link]
5. **Create GitHub issue**: Include:
   - Steps to reproduce
   - Error message
   - Browser/OS info
   - What you already tried

### Information to Include in Support Request

```
**Issue**: [Describe problem]
**Error Message**: [Exact error text]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Environment**:
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.1]
- Node version: [e.g., 18.17.0]
- npm version: [e.g., 9.6.7]

**What I've Tried**:
- [Attempt 1]
- [Attempt 2]
```

---

## 🔗 Related Documents

- [Architecture Document](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)

---

**Last Updated**: March 16, 2026  
**Maintained By**: Support Team  
**Response Time**: 24 hours (business days)
