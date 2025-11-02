# TODO: Implement Authentication-Based Redirects and Dashboard Protection

## Tasks
- [ ] Fix route inconsistency in App.jsx: Change "/dashboard" to "/resident-dashboard"
- [ ] Update Navbar.jsx to conditionally show dashboard links based on authentication state
- [ ] Ensure Login.jsx redirects residents to "/resident-dashboard"
- [ ] Verify admin and resident dashboard protections are working
- [ ] Test login flows for admin and resident

## Notes
- Admin secret key input is already implemented in Login.jsx
- Dashboards already have auth checks, but navbar needs updates
- Use localStorage for admin check and Firebase auth for residents
