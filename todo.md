# Project TODO

## Completed Features
- [x] Basic homepage layout
- [x] Drills directory with search and filtering
- [x] Individual drill detail page (1-2-3 Drill prototype)
- [x] Video embedding for drills
- [x] Streamlined drill detail layout

## New Features - User Authentication & Access Control
- [x] Resolve merge conflicts from template upgrade
- [x] Update database schema for client access management
- [x] Implement user authentication (Login/Signup)
- [x] Create Admin Dashboard for managing client access
- [x] Implement access control middleware for drills
- [x] Add "Active Client" status toggle in admin panel
- [x] Test access control workflows (active vs inactive clients)

## Quick Fix - Preview Mode
- [x] Add development bypass mode for drill content access
- [x] Test preview mode functionality

## Demo Accounts
- [x] Create seed script for demo client accounts
- [x] Add active client demo account
- [x] Add inactive client demo account
- [x] Verify demo accounts in admin dashboard

## Add More Drill Details
- [x] Extract Angle Flips drill content and video
- [x] Extract Change-Up Front Toss drill content and video
- [x] Update drills.json with correct URLs
- [x] Add drill details to DrillDetail component
- [x] Test new drill pages

## Extract All Hitting Drills
- [ ] Identify all hitting drills from drills.json
- [ ] Scrape content and videos for all hitting drills
- [ ] Update DrillDetail component with all hitting drill data
- [ ] Update drills.json with correct URLs for all hitting drills
- [ ] Test all hitting drill pages

## Add User-Provided Drills
- [x] Extract content from Double Tee drill
- [x] Extract content from Front Hip Toss and Color Front Toss drills
- [x] Update drills.json with correct URLs
- [x] Add drill details to DrillDetail component
- [x] Test new drill pages


## Coach Dashboard - Drill Assignment System
- [x] Add drillAssignments table to schema
- [x] Add assignmentProgress table to schema
- [x] Create database helper functions for assignments
- [x] Create tRPC routes for drill assignments
- [x] Create CoachDashboard page component
- [x] Build user list view
- [x] Build drill assignment interface
- [x] Add assignment status tracking
- [x] Implement assign/unassign drill functionality
- [x] Track completion status
- [x] Add coaching notes to assignments
- [x] Filter and search assignments
- [ ] Test assignment creation/deletion
- [ ] Test status tracking
- [ ] Mobile responsiveness testing


## Athlete Portal - Player Drill Tracking
- [x] Create AthletePortal page component
- [x] Display assigned drills for current user
- [x] Show drill status (Assigned, In Progress, Completed)
- [x] Create drill detail modal/view for athletes
- [x] Implement progress tracking interface
- [x] Add ability to mark drills as complete
- [x] Show completion dates and coach notes
- [x] Add filter by status
- [x] Mobile-optimized athlete portal
- [ ] Test athlete access and permissions


## Invite-Only Access System
- [x] Add invites table to database schema
- [x] Create invite generation API routes
- [x] Build invite management in Admin Dashboard
- [ ] Create invite acceptance page
- [ ] Implement account setup flow
- [ ] Add route protection middleware
- [ ] Protect all pages with authentication
- [ ] Test invite expiration (7 days)
- [ ] Test invite resend functionality
- [ ] Test role-based access (admin vs athlete)


## Invite Acceptance Page - Account Setup
- [x] Create AcceptInvite page component
- [x] Validate invite token on page load
- [x] Display invite details (email, expiration)
- [x] Create password setup form
- [x] Add password validation (strength requirements)
- [x] Implement account creation flow
- [x] Set user role to "athlete" on creation
- [x] Mark invite as accepted
- [x] Auto-login user after account creation
- [x] Redirect to athlete portal after setup
- [x] Handle expired/invalid invite errors
- [x] Add loading and error states
- [x] Mobile-responsive design


## Route Protection & Authentication
- [x] Create ProtectedRoute wrapper component
- [x] Implement authentication check middleware
- [x] Add role-based access control (admin, athlete, coach)
- [x] Protect Coach Dashboard (admin only)
- [x] Protect Admin Dashboard (admin only)
- [x] Protect Athlete Portal (athlete only)
- [x] Redirect unauthenticated users to login
- [x] Redirect unauthorized users to home
- [x] Add loading state during auth check
- [ ] Test access control for each role
- [ ] Test redirect behavior


## Athlete Portal Fixes
- [x] Fix redirect after account creation (should go to /athlete-portal)
- [x] Fix AthletePortal to display assigned drills
- [x] Verify drills load correctly
- [x] Test athlete can see their assigned drills


## Athlete Navigation Fix
- [x] Add "Athlete Portal" button to home page for logged-in athletes
- [x] Show appropriate buttons based on user role (coach/athlete)
- [x] Update database schema to include athlete and coach roles
- [x] Test athlete can navigate to portal from home page
- [x] Test coach buttons still show correctly

## React Hooks Error Fix
- [x] Fix ProtectedRoute setState during render error
- [x] Move navigation logic to useEffect hook
- [x] Verify no TypeScript errors after fix

## Athlete Navigation & Role Assignment Fix
- [x] Fix missing useAuth import in Home.tsx
- [x] Add convertToAthlete admin procedure to convert users to athlete role
- [x] Create convertUserToAthlete database function
- [ ] Test athlete can see "My Drills" button after role conversion
- [ ] Test athlete can access athlete portal and see assigned drills

## Athlete Portal Drill Display
- [ ] Build athlete portal drill cards showing assigned drills
- [ ] Add status badges (assigned, in-progress, completed)
- [ ] Display drill details (name, difficulty, duration, coach notes)
- [ ] Add ability to update drill status from athlete portal
- [ ] Test athlete can see all assigned drills

## Email Notifications for Drill Assignments
- [x] Set up email service integration (Resend)
- [x] Create email template for drill assignment notifications
- [x] Add email trigger when coach assigns drill to athlete
- [x] Include drill details and link to athlete portal in email
- [ ] Test email delivery on drill assignment

## AI Drill Generator
- [x] Set up OpenAI API key and backend endpoint
- [x] Create secure API route for drill generation
- [x] Build AI Drill Generator UI component
- [x] Add drill generator to coach dashboard
- [x] Allow saving generated drills to database
- [x] Test AI drill generation with various issues
- [x] Display generated drills with proper formatting
- [x] Fix cache issues and verify OpenAI integration works

## Drill Categorization Fix
- [x] Move all "tee" skill set drills to "hitting" skill set
- [x] Verify drills appear under hitting filter
- [x] Test filtering works correctly

## Video Embedding for Drills
- [x] Update drill data schema to include videoUrl field
- [x] Create video player component for YouTube/Vimeo
- [x] Add video URL input field to drill management
- [x] Display video player on drill detail page
- [x] Test with YouTube and Vimeo links
- [x] Add video thumbnail preview

## Database-Backed Video Persistence
- [x] Create drillVideos table in database schema
- [x] Create database helper functions for video CRUD operations
- [x] Create tRPC routes for video management (save, get, delete)
- [x] Update ManageDrillVideos to use database API instead of localStorage
- [x] Update DrillDetail to load videos from database
- [x] Test video persistence across browsers and sessions
- [x] Verify videos display correctly on drill detail pages

## Fix tRPC Query Errors - Undefined Video Data
- [x] Fix getDrillVideo to return null instead of undefined
- [x] Update getVideo tRPC route to explicitly return null
- [x] Test video queries on drills with videos
- [x] Test video queries on drills without videos
- [x] Verify no console errors on home page
- [x] Verify no console errors on drill detail pages

## Add Missing Drill Details for Video Display
- [x] Add Ball in the Sun drill details to DrillDetail component
- [ ] Identify other drills without internal details that need to be added
- [ ] Add remaining drills to enable video display across all drills

## Auto-Generate Drill Details Script
- [x] Create script to identify all drills without internal details
- [x] Generate basic detail templates for missing drills
- [x] Tested auto-generation - 211 missing drills identified
- [x] Auto-generation script ready for bulk deployment

## Drill Detail Template System for Coaches (Database-Backed)
- [x] Create database schema for coach-created drill details
- [x] Build form UI in Coach Dashboard for creating drill details
- [x] Implement tRPC routes for drill detail CRUD operations
- [x] Add ability to edit existing drill details
- [x] Add ability to delete drill details
- [x] Integrate coach-created details with drill display
- [x] Test template system with sample drills
- [x] Verified: Coach can create drill details through form and they display on drill pages


## Drill Details Edit/Delete UI
- [x] Create edit drill details modal component
- [x] Add edit and delete buttons to drill detail page
- [x] Implement edit functionality with form pre-population
- [x] Implement delete functionality with confirmation dialog
- [x] Test edit workflow (modify and save changes)
- [x] Test delete workflow (confirm and remove)
- [x] Verify edit/delete UI displays correctly on drill pages


## Home Page Pagination
- [x] Add pagination logic to Home component (20 drills per page)
- [x] Add pagination controls (Previous/Next buttons, page indicator)
- [x] Test pagination with filters applied
- [x] Test pagination with search results
- [x] Verify page resets when filters change
- [x] Verified: 262 drills now paginated at 20 per page (14 pages total)


## Remove Excluded Drill Categories
- [x] Remove all Catching drills (30 removed)
- [x] Remove all Team Skill Development drills (19 removed)
- [x] Remove all Base Running drills (11 removed)
- [x] Remove all Batting Practice drills (3 removed)
- [x] Verify excluded drills no longer appear in directory
- [x] Update drill count on home page (262 → 200 drills)
- [x] Verified: Skill Set filter shows only Bunting, Hitting, Infield, Outfield, Pitching


## Mobile Optimization
- [x] Optimize home page layout for mobile (search, filters, drill cards)
- [x] Optimize drill detail pages for mobile (video, cards, instructions)
- [x] Optimize navigation and header for mobile
- [x] Optimize coach/admin dashboards for mobile
- [x] Test mobile experience across all pages
- [x] Verify touch-friendly buttons and spacing

## Bug Fixes
- [x] Fix React duplicate key warnings in pagination buttons
- [x] Verify pagination renders without console errors
- [x] Fixed remaining duplicate key warnings using index-based keys with prefixes
