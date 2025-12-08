# AquaTrack QA Testing Plan
**Database & QA Lead: Chase Fisher**
**Date:** December 8, 2025

## Overview
This document outlines the comprehensive testing plan for the AquaTrack application, covering all user stories and functionality.

---

## Test Environment Setup

### Server Information
- **URL:** http://localhost:3000
- **Database:** PostgreSQL (aquatrack)
- **Server Status:** ✅ Running

### Test Accounts
1. **Manager Account:**
   - Email: `admin@aquatrack.com`
   - Password: `admin123`
   - Role: `manager`

2. **Manager Account (Chase):**
   - Email: `18chase.fisher@gmail.com`
   - Password: (your existing password)
   - Role: `manager`

3. **Regular User Account:**
   - Email: `user@aquatrack.com`
   - Role: `user`

---

## Testing Checklist

## 1. GUEST USER TESTING (No Authentication)

### 1.1 Home Page
- [ ] Navigate to http://localhost:3000
- [ ] Verify hero section displays correctly
- [ ] Verify "Get Started" button is visible
- [ ] Verify navigation menu shows: Home, Map, Register, Login
- [ ] Verify footer displays correctly
- [ ] Test responsive design on different screen sizes

### 1.2 Map Page (Guest)
- [ ] Click on "Map" in navigation
- [ ] Verify map loads correctly
- [ ] Verify all project markers appear on map
- [ ] Click on a marker to open popup
- [ ] Verify popup shows project title and partner
- [ ] Click "View Details" in popup
- [ ] Verify project detail page displays
- [ ] Verify "Save Project" button is NOT visible (guest user)
- [ ] Verify "Edit" and "Delete" buttons are NOT visible

### 1.3 Register Page (Guest)
- [ ] Click "Register" in navigation
- [ ] Verify registration form displays
- [ ] Verify form has fields: First Name, Last Name, Email, Password
- [ ] Test form validation (empty fields)
- [ ] Test form validation (invalid email format)

---

## 2. NEW USER REGISTRATION

### 2.1 Create New Account
- [ ] Navigate to Register page
- [ ] Fill in registration form:
  - First Name: Test
  - Last Name: User
  - Email: testuser@test.com
  - Password: test123
- [ ] Click "Register" button
- [ ] Verify success message appears
- [ ] Verify redirected to login page

### 2.2 Duplicate Registration
- [ ] Attempt to register with same email again
- [ ] Verify error message: "User with this email already exists"

---

## 3. REGISTERED USER TESTING (Non-Manager)

### 3.1 User Login
- [ ] Navigate to Login page
- [ ] Enter credentials:
  - Email: user@aquatrack.com
  - Password: (if known, otherwise use testuser@test.com)
- [ ] Click "Login" button
- [ ] Verify success message appears
- [ ] Verify navigation menu updates (Dashboard visible, no Register/Login)
- [ ] Verify user menu appears with logout button

### 3.2 Invalid Login
- [ ] Attempt login with wrong password
- [ ] Verify error message: "Invalid credentials"
- [ ] Attempt login with non-existent email
- [ ] Verify error message: "Invalid credentials"

### 3.3 Save Project Functionality
- [ ] Navigate to Map page
- [ ] Click on a project marker
- [ ] Click "View Details"
- [ ] Verify "Save Project" button is visible
- [ ] Click "Save Project" button
- [ ] Verify success message appears
- [ ] Verify button text changes to "Unsave Project"
- [ ] Verify button color changes (amber → yellow)

### 3.4 Dashboard - View Saved Projects
- [ ] Click "Dashboard" in navigation
- [ ] Verify saved project appears in grid
- [ ] Verify project card shows:
  - Project image (placeholder)
  - Project title
  - Partner name
  - Location (lat, lng)
  - "Unsave" button
- [ ] Save 2-3 more projects from the map
- [ ] Return to Dashboard
- [ ] Verify all saved projects display correctly
- [ ] Verify responsive grid layout (1 col on mobile, 2 on tablet, 3 on desktop)

### 3.5 Unsave Project from Dashboard
- [ ] Click "Unsave" button on a project card
- [ ] Verify confirmation dialog appears
- [ ] Click "OK" to confirm
- [ ] Verify success message appears
- [ ] Verify project card is removed from dashboard
- [ ] Verify "No saved projects" message if all projects unsaved

### 3.6 Unsave Project from Detail Page
- [ ] Navigate to a saved project detail page
- [ ] Verify "Unsave Project" button shows (yellow color)
- [ ] Click "Unsave Project"
- [ ] Verify confirmation dialog appears
- [ ] Click "OK" to confirm
- [ ] Verify button changes back to "Save Project"

### 3.7 Admin Controls NOT Visible
- [ ] Verify "New Project" button is NOT visible on Dashboard
- [ ] Navigate to project detail page
- [ ] Verify "Edit Project" button is NOT visible
- [ ] Verify "Delete Project" button is NOT visible

### 3.8 Session Persistence
- [ ] Refresh the page (F5)
- [ ] Verify user remains logged in
- [ ] Verify Dashboard still shows saved projects
- [ ] Close browser tab and reopen
- [ ] Navigate to http://localhost:3000
- [ ] Verify user remains logged in

### 3.9 Logout
- [ ] Click "Logout" button
- [ ] Verify success message appears
- [ ] Verify navigation menu updates (Register/Login visible)
- [ ] Verify Dashboard link is removed from navigation
- [ ] Verify redirected to home page

---

## 4. MANAGER USER TESTING (Admin Features)

### 4.1 Manager Login
- [ ] Navigate to Login page
- [ ] Enter credentials:
  - Email: admin@aquatrack.com
  - Password: admin123
- [ ] Click "Login" button
- [ ] Verify successful login
- [ ] Navigate to Dashboard

### 4.2 Admin Controls Visibility
- [ ] On Dashboard, verify "New Project" button is visible
- [ ] Navigate to Map page
- [ ] Click on any project marker and view details
- [ ] Verify "Edit Project" button is visible
- [ ] Verify "Delete Project" button is visible

### 4.3 Add New Project
- [ ] Navigate to Dashboard
- [ ] Click "New Project" button
- [ ] Verify modal opens with title "Add New Project"
- [ ] Verify form has fields:
  - Partner ID (number)
  - Project Title (text)
  - Latitude (decimal number)
  - Longitude (decimal number)
- [ ] Test form validation (empty required fields)
- [ ] Fill in new project data:
  - Partner ID: 1
  - Project Title: Test Project - Nigeria
  - Latitude: 9.082
  - Longitude: 8.675
- [ ] Click "Save Project" button
- [ ] Verify success message: "Project successfully created!"
- [ ] Verify modal closes
- [ ] Navigate to Map page
- [ ] Verify new project marker appears on map at correct location
- [ ] Click marker and verify project details

### 4.4 Add Project - Invalid Data
- [ ] Click "New Project" button
- [ ] Try to submit with empty fields
- [ ] Verify HTML5 validation prevents submission
- [ ] Try to submit with invalid Partner ID (non-existent)
- [ ] Verify project is created but partner name shows "N/A"

### 4.5 Edit Existing Project
- [ ] Navigate to Map page
- [ ] Click on the test project marker
- [ ] Click "View Details"
- [ ] Click "Edit Project" button
- [ ] Verify modal opens with title "Edit Project"
- [ ] Verify form is pre-populated with existing data:
  - Partner ID: 1
  - Title: Test Project - Nigeria
  - Latitude: 9.082
  - Longitude: 8.675
- [ ] Modify the title: "Updated Test Project - Nigeria"




Search IS 404 Fall 2025



- [ ] Modify the latitude: 9.100
- [ ] Click "Save Project" button
- [ ] Verify success message: "Project successfully updated!"
- [ ] Verify modal closes
- [ ] Verify project marker moves to new location on map
- [ ] Click marker and verify updated title displays

### 4.6 Edit Project - Form Cancellation
- [ ] Click "Edit Project" on any project
- [ ] Make changes to the form
- [ ] Click "Cancel" button
- [ ] Verify modal closes
- [ ] Verify no changes were saved
- [ ] Click outside modal (backdrop)
- [ ] Verify modal closes without saving

### 4.7 Delete Project
- [ ] Navigate to the test project detail page
- [ ] Click "Delete Project" button
- [ ] Verify confirmation dialog: "Are you sure you want to delete this project?"
- [ ] Click "Cancel" - verify project is NOT deleted
- [ ] Click "Delete Project" again
- [ ] Click "OK" to confirm
- [ ] Verify success message: "Project deleted successfully"
- [ ] Verify redirected to Map page
- [ ] Verify project marker is removed from map
- [ ] Navigate to Dashboard
- [ ] Verify deleted project removed from saved projects (if it was saved)

### 4.8 Manager Can Save Projects
- [ ] Verify manager can also save/unsave projects like regular users
- [ ] Save a project from Map page
- [ ] Navigate to Dashboard
- [ ] Verify saved project appears
- [ ] Verify both "New Project" button AND saved projects display correctly

---

## 5. API ENDPOINT TESTING

### 5.1 Public Endpoints
- [ ] GET /api/projects
  - Verify returns all projects with partnerId field
  - Verify response includes: id, partnerid, title, lat, lng, partnername, partnerwebsiteurl
  - Open browser DevTools → Network tab
  - Navigate to Map page
  - Verify API call succeeds (200 status)

### 5.2 Authentication Endpoints
- [ ] POST /api/register
  - Test with valid data → verify 201 status
  - Test with duplicate email → verify 409 status
  - Test with missing fields → verify 400 status

- [ ] POST /api/login
  - Test with valid credentials → verify 200 status and token
  - Test with invalid credentials → verify 401 status
  - Test with missing fields → verify 400 status

### 5.3 Protected User Endpoints (Require Authentication)
- [ ] GET /api/users/saved-projects
  - Login as user
  - Open DevTools → Network tab
  - Navigate to Dashboard
  - Verify Authorization header includes Bearer token
  - Verify 200 status and correct projects returned

- [ ] POST /api/users/saved-projects
  - Save a project
  - Verify 201 status
  - Verify returns project details

- [ ] DELETE /api/users/saved-projects/:projectId
  - Unsave a project
  - Verify 200 status
  - Verify success message

### 5.4 Protected Manager Endpoints (Require Manager Role)
- [ ] POST /api/projects
  - Login as manager
  - Create new project via UI
  - Verify Authorization header includes Bearer token
  - Verify 201 status
  - Try without token → verify 401 status
  - Try with regular user token → verify 403 status

- [ ] PUT /api/projects/:id
  - Edit project via UI
  - Verify 200 status
  - Verify returns updated project

- [ ] DELETE /api/projects/:id
  - Delete project via UI
  - Verify 200 status
  - Verify success message

---

## 6. ERROR HANDLING & EDGE CASES

### 6.1 Network Errors
- [ ] Stop the server
- [ ] Try to login
- [ ] Verify appropriate error message displays
- [ ] Try to load map
- [ ] Verify error message displays
- [ ] Restart server

### 6.2 Token Expiration
- [ ] Login as user
- [ ] Wait 1 hour (or modify JWT expiration to 1 minute for testing)
- [ ] Try to save a project
- [ ] Verify 403 Forbidden error
- [ ] Verify user is prompted to login again

### 6.3 Invalid Project IDs
- [ ] Manually navigate to: http://localhost:3000 (then click to project detail with invalid ID)
- [ ] Verify error handling (project not found message)

### 6.4 SQL Injection Prevention
- [ ] Try to register with email: `' OR '1'='1`
- [ ] Verify registration fails or is sanitized
- [ ] Try to create project with title: `'; DROP TABLE well_projects; --`
- [ ] Verify project is created safely (SQL injection prevented)

### 6.5 XSS Prevention
- [ ] Create project with title: `<script>alert('XSS')</script>`
- [ ] Verify script does NOT execute (HTML is escaped)
- [ ] Verify title displays as plain text

---

## 7. UI/UX & VISUAL TESTING

### 7.1 Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify navigation menu adapts (hamburger menu on mobile if applicable)
- [ ] Verify project cards stack properly on small screens
- [ ] Verify map is usable on all screen sizes

### 7.2 CSS & Styling
- [ ] Verify Tailwind CSS loads correctly
- [ ] Verify custom styles from style.css apply
- [ ] Verify Font Awesome icons display
- [ ] Verify Google Fonts load (Montserrat, Lato)
- [ ] Check for any overlapping elements
- [ ] Check for any unreadable text (contrast issues)

### 7.3 Interactive Elements
- [ ] Verify all buttons have hover effects
- [ ] Verify all links work
- [ ] Verify form inputs have focus states
- [ ] Verify modals have smooth transitions
- [ ] Verify message box appears and disappears correctly (3 second timeout)

### 7.4 Map Functionality
- [ ] Verify map can be dragged/panned
- [ ] Verify map can be zoomed in/out
- [ ] Verify zoom controls work
- [ ] Verify map boundaries are enforced (can't pan to infinite space)
- [ ] Verify markers are clickable
- [ ] Verify popups open/close correctly

### 7.5 Accessibility
- [ ] Test keyboard navigation (Tab key)
- [ ] Verify all interactive elements are reachable via keyboard
- [ ] Verify form labels are properly associated
- [ ] Check for proper ARIA attributes (if any)

---

## 8. BROWSER COMPATIBILITY

Test on multiple browsers:
- [ ] Google Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Microsoft Edge (latest)

For each browser, verify:
- [ ] All pages load correctly
- [ ] Map displays and functions properly
- [ ] Forms submit correctly
- [ ] Authentication works
- [ ] Modals open/close properly

---

## 9. PERFORMANCE TESTING

### 9.1 Load Times
- [ ] Measure initial page load time (should be < 3 seconds)
- [ ] Measure map load time with all markers
- [ ] Measure Dashboard load time with multiple saved projects

### 9.2 API Response Times
- [ ] Check GET /api/projects response time (should be < 500ms)
- [ ] Check login response time (should be < 1 second)
- [ ] Check save/unsave project response time

### 9.3 Database Performance
- [ ] Verify queries are optimized (check server logs)
- [ ] Verify indexes are being used

---

## BUG TRACKING

### Issues Found

#### FIXED BUGS:
1. **Bug:** Partner ID not returned in GET /api/projects response
   - **Severity:** High
   - **Impact:** Edit project form couldn't populate Partner ID field
   - **Status:** ✅ FIXED
   - **Fix:** Added `p.partnerid as partnerid` to all project SELECT queries in server.js
   - **Files Modified:** server.js (lines 77, 173, 212)

2. **Bug:** Frontend using camelCase `partnerId` but backend returns lowercase `partnerid`
   - **Severity:** High
   - **Impact:** Edit form couldn't read Partner ID from project data
   - **Status:** ✅ FIXED
   - **Fix:** Changed `project.partnerId` to `project.partnerid` in app.js:531
   - **Files Modified:** public/app.js (line 531)

#### OPEN BUGS:
(To be filled during testing)

---

## TEST EXECUTION LOG

**Tester:** Chase Fisher
**Date:** ___________
**Environment:** Local Development
**Server Version:** Node.js + Express
**Database:** PostgreSQL

### Session 1: [Date/Time]
- [ ] Tests 1.1 - 1.3 (Guest User)
- [ ] Tests 2.1 - 2.2 (Registration)
- **Notes:** ___________

### Session 2: [Date/Time]
- [ ] Tests 3.1 - 3.9 (Regular User)
- **Notes:** ___________

### Session 3: [Date/Time]
- [ ] Tests 4.1 - 4.8 (Manager/Admin)
- **Notes:** ___________

### Session 4: [Date/Time]
- [ ] Tests 5.1 - 5.4 (API Endpoints)
- **Notes:** ___________

### Session 5: [Date/Time]
- [ ] Tests 6.1 - 6.5 (Error Handling)
- **Notes:** ___________

### Session 6: [Date/Time]
- [ ] Tests 7.1 - 7.5 (UI/UX)
- [ ] Tests 8 (Browser Compatibility)
- [ ] Tests 9 (Performance)
- **Notes:** ___________

---

## SIGN-OFF

### Development Team Sign-off
- [ ] Frontend Developer: ___________
- [ ] Backend Developer: ___________
- [ ] Database Lead (Chase Fisher): ___________

### QA Sign-off
- [ ] All critical bugs fixed
- [ ] All user stories tested
- [ ] Documentation complete
- [ ] Ready for deployment

**QA Lead Signature:** ___________
**Date:** ___________

---

## NOTES & RECOMMENDATIONS

### Recommendations for Future Improvements:
1. Add email verification for new user registration
2. Add password reset functionality
3. Add project images (replace placeholder images)
4. Add project descriptions field
5. Add project status field (Active, Completed, etc.)
6. Add user profile page
7. Add admin dashboard with analytics
8. Add pagination for projects (if list grows large)
9. Add search/filter functionality on map
10. Add project updates timeline feature

### Security Recommendations:
1. ✅ Using bcrypt for password hashing
2. ✅ Using JWT for authentication
3. ✅ Using parameterized queries (Knex) to prevent SQL injection
4. ⚠️ Consider adding rate limiting for login attempts
5. ⚠️ Consider adding HTTPS in production
6. ⚠️ Consider adding CSRF protection
7. ⚠️ Store JWT secret in secure environment variable (already done)

---

## APPENDIX

### Test Data
- **Sample Partner IDs:** 1, 2, 3
- **Sample Projects:** 10 projects in database
- **Sample Coordinates:**
  - Kenya: -1.286389, 36.817223
  - Ethiopia: 9.145, 40.489673
  - Uganda: 1.373333, 32.290275

### API Documentation
See server.js for complete API endpoint documentation.

### Database Schema
See database.sql for complete schema and sample data.
