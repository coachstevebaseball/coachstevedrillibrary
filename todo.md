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


## Instructions Editor with Formatting
- [x] Remove numbered Step-by-Step Instructions section
- [x] Add editable text area for custom instructions
- [x] Add formatting toolbar (Bold, Italic, Underline, Heading, Lists)
- [x] Add font size selector
- [x] Add live preview of formatted text
- [x] Hide editable editor from public users
- [x] Show read-only instructions to public users
- [x] Test conditional rendering for different user roles

## Bulk Instruction Import Feature
- [x] Design bulk import UI and format specification
- [x] Create bulk import component with paste area
- [x] Implement parsing logic for bulk instruction format
- [x] Add backend API endpoint for bulk instruction updates
- [x] Integrate bulk import into Coach Dashboard
- [x] Test bulk import functionality
- [x] Fixed instructions loading bug - changed saveDrillInstructions to save to instructions column instead of description
- [x] Verified instructions now persist and load correctly after page refresh
- [x] Tested both manual entry and bulk import - both now save and load properly


## Client Launch Readiness - Content Gap Analysis
- [ ] Audit database: count drills with videos vs total (200 drills)
- [ ] Audit database: count drills with details vs total (200 drills)
- [ ] Identify top 20 most popular drills (by skill set: Hitting, Infield, Outfield, Pitching, Bunting)
- [ ] Prioritize filling gaps for top 20 drills first
- [ ] Create video sourcing strategy (YouTube, USA Baseball Mobile Coach, etc.)
- [ ] Create drill details template for coaches to bulk-fill missing content
- [ ] Set up automated script to generate basic drill details for all 200 drills
- [ ] Test client experience with current data completeness
- [ ] Identify minimum viable content threshold for launch

## High-Priority Drill Content Completion (Top 20)
- [ ] Hitting skill set: Fill 5 most popular hitting drills with videos and details
- [ ] Infield skill set: Fill 5 most popular infield drills with videos and details
- [ ] Outfield skill set: Fill 5 most popular outfield drills with videos and details
- [ ] Pitching skill set: Fill 3 most popular pitching drills with videos and details
- [ ] Bunting skill set: Fill 2 most popular bunting drills with videos and details


## Bulk Goal Upload Feature
- [x] Create backend API endpoint for bulk goal updates
- [x] Build BulkGoalUpload component with paste area
- [x] Implement parsing logic for "Drill Name | Goal" format
- [x] Add validation to match drill names to database
- [x] Create success/error feedback for bulk upload
- [x] Integrate bulk goal upload into Coach Dashboard
- [x] Test bulk goal upload with sample data
- [x] Document bulk goal upload format for coaches


## Drill List Redesign - Horizontal Row Layout
- [x] Update Home page layout to horizontal row-based design
- [x] Implement colored pill badge system (Navy DRILL, Green/Orange/Red difficulty, Teal categories)
- [x] Add clean filter section with Add Filter button below hero
- [x] Remove card grid layout and time duration displays
- [x] Add divider lines between drill rows
- [x] Test responsive layout on mobile and desktop


## Final Launch Steps
- [x] Fixed database migration - drillAssignments table now exists
- [x] Verified drill assignment system is working end-to-end
- [x] Verified athlete portal loads assignments correctly
- [ ] Publish website to make it live (remove preview mode)
- [ ] Start inviting coaches via admin dashboard


## Invite System - Ensure Athlete Role
- [x] Verify invite creation defaults to "athlete" role
- [x] Verify account creation from invite sets "athlete" role
- [x] Fix any issues with role assignment - changed default role from "user" to "athlete"
- [ ] Test full invite → signup → athlete portal flow


## Athlete Portal - Progress Dashboard (Tier 1 #1)
- [x] Design progress dashboard component with stats cards
- [x] Calculate progress stats (total, completed, in-progress, assigned)
- [x] Build progress bar component
- [x] Create stats card components (total drills, completed, in-progress)
- [x] Add streak counter (consecutive days with activity)
- [x] Integrate dashboard into athlete portal header
- [x] Style dashboard to match USA Baseball branding
- [x] Test dashboard with multiple athlete scenarios


## Athlete Portal - Mark Complete Button (Tier 1 #2)
- [x] Create CompletionModal component with celebration animation
- [x] Add "Mark Complete" button to drill details panel
- [x] Implement confirmation dialog with drill name and completion date
- [ ] Add success toast notification after completion
- [x] Update drill status to "completed" in database
- [ ] Test mark complete flow with multiple drills

## Athlete Portal - Achievement Badges (Tier 2 #5)
- [x] Create badges table in database schema
- [x] Design badge icons and metadata (name, description, criteria)
- [ ] Build badge earning logic (first drill, 5-day streak, etc.)
- [x] Create BadgeDisplay component to show earned badges
- [ ] Add badge notifications when athlete earns one
- [ ] Display badges on athlete profile/portal
- [ ] Test badge earning with different scenarios

## Athlete Portal - Drill Notes Feature (Tier 2 #6)
- [x] Add notes column to drillAssignments table
- [x] Create DrillNotes component for athletes and coaches
- [ ] Allow athletes to add notes after completing drills
- [x] Display notes in drill details panel
- [ ] Show notes in coach dashboard for feedback
- [ ] Add coach ability to reply to athlete notes
- [ ] Test notes creation and coach feedback flow


## Email Invite Delivery (Resend)
- [x] Verify RESEND_API_KEY is configured
- [x] Create email sending function for invites
- [x] Integrate email into invite creation flow
- [ ] Test email delivery with test invite
- [ ] Verify emails arrive in inbox


## Email Template Customization
- [x] Update email header to "Coach Steve Baseball — Player Drill Library"
- [x] Personalize email copy with Coach Steve branding
- [x] Update footer with "Coach Steve" signature
- [x] Test updated email template with test invite


## Exclusive Access Control (Active Athletes Only)
- [ ] Add isActive status field to users table
- [ ] Protect drill viewing endpoints with athlete status checks
- [ ] Implement deactivation logic to immediately revoke access
- [ ] Update Home page to require authentication
- [ ] Hide drill list from non-authenticated users
- [ ] Test access control with active and inactive athletes


## Drill Submissions & Feedback System
- [x] Add drillSubmissions table to database schema (athlete notes, video URL, submission date)
- [x] Add coachFeedback table to database schema (coach feedback, created date)
- [x] Create database helper functions for submission CRUD operations
- [x] Create tRPC routes for submission management (create, read, update, delete)
- [x] Create tRPC routes for feedback management (create, read, update, delete)
- [x] Build athlete submission UI in drill detail page (text notes + video upload)
- [ ] Implement video upload to S3 storage
- [x] Build coach feedback interface in drill detail page
- [ ] Create submission timeline view for athletes
- [ ] Create submission review dashboard for coaches
- [ ] Test athlete can submit notes and videos
- [ ] Test coach can view and provide feedback
- [ ] Test athletes can only edit/delete their own submissions
- [ ] Test feedback is private to that athlete

## Mobile Interface Optimization (Phase 2)
- [x] Audit all pages for mobile responsiveness
- [x] Optimize touch targets (buttons, inputs) for mobile
- [x] Optimize video player for mobile (full-width, landscape support)
- [x] Optimize submission form for mobile (large input areas, easy video upload)
- [x] Optimize feedback interface for mobile (readable text, easy to scroll)
- [ ] Test on actual mobile devices (iOS and Android)
- [ ] Optimize images for mobile (lazy loading, responsive sizes)
- [ ] Test performance on 4G connection
- [ ] Verify fast load times on mobile


## S3 Video Storage for Athlete Submissions
- [x] Create server-side video upload endpoint using storagePut helper
- [x] Update DrillSubmissionForm to send video file to server endpoint
- [x] Store S3 URL in drillSubmissions table
- [x] Update submission queries to return S3 URLs
- [ ] Test video upload and persistence
- [ ] Verify videos load correctly in coach feedback panel

## Coach Submission Dashboard
- [x] Create SubmissionsDashboard page component
- [x] Add route to Coach Dashboard navigation
- [x] Display all athlete submissions with pagination
- [x] Add filters (by athlete, drill, date, status)
- [x] Show athlete name, drill name, submission date, notes preview
- [x] Add click to view full submission and provide feedback
- [x] Display coach feedback history for each submission
- [x] Optimize for mobile viewing
- [ ] Test filtering and sorting functionality

## Athlete Progress Badges System
- [x] Create badge achievement logic (submissions count, consistency, etc.)
- [x] Add badge display component
- [x] Integrate badges into athlete portal
- [x] Create badge unlock triggers (5 submissions, 10 submissions, etc.)
- [x] Add badge animations and celebrations
- [ ] Test badge unlocking on submission
- [x] Display badge progress/next milestone


## Email Notifications System
- [x] Create email notification service using Resend API
- [x] Create email template for coach submission notifications
- [x] Create email template for athlete feedback notifications
- [x] Add email trigger when athlete submits drill work
- [x] Add email trigger when coach provides feedback
- [x] Send coach email with athlete name, drill, and submission preview
- [x] Send athlete email with coach feedback and drill name
- [x] Add unsubscribe option to emails
- [x] Test email delivery for submissions
- [x] Test email delivery for feedback
- [x] Verify email templates render correctly


## In-App Notification System
- [x] Create notifications table in database schema
- [x] Create notification preferences table
- [x] Add tRPC endpoints for notification CRUD operations
- [x] Build toast notification component
- [x] Create notification context provider
- [x] Build notification bell icon with unread count
- [x] Build notification dropdown panel with history
- [x] Add mark as read/delete functionality
- [ ] Create notification preferences UI
- [x] Integrate notifications into drill submission events
- [x] Integrate notifications into feedback events
- [ ] Integrate notifications into badge unlock events
- [ ] Integrate notifications into drill assignment events
- [x] Test toast notifications on actions
- [ ] Test notification bell and history panel
- [ ] Test real-time notification updates
- [ ] Test notification preferences persistence


## Critical UX Fixes (Coach Feedback & Athlete Submissions)
- [x] Fix athlete submission form UX - clarify that video OR notes required (not optional)
- [x] Build functional coach submissions dashboard page with list view
- [x] Add submission filtering (by athlete, drill, date, status)
- [x] Integrate feedback form into submissions dashboard
- [x] Add navigation link to Submissions Dashboard in Coach Dashboard
- [ ] Test coach can view all athlete submissions
- [ ] Test coach can provide feedback on submissions
- [ ] Test athlete receives feedback notification
- [ ] Verify feedback appears in athlete's submission history


## Drill Q&A Messaging System
- [x] Create drillQuestions table in database schema (athleteId, drillId, question, createdAt)
- [x] Create drillAnswers table in database schema (questionId, coachId, answer, createdAt)
- [x] Add database helper functions for Q&A CRUD operations
- [x] Create tRPC endpoints for creating questions, getting questions, creating answers
- [x] Build drill Q&A form component on drill detail page
- [x] Show "Message sent successfully" after athlete submits question
- [x] Build coach messaging dashboard page with all athlete questions
- [x] Add reply interface to coach dashboard for answering questions
- [x] Build athlete messaging dashboard to view their questions and coach responses
- [x] Add email notification when athlete asks a question
- [x] Add in-app notification when athlete asks a question
- [x] Add email notification when coach replies to question
- [x] Add in-app notification when coach replies to question
- [x] Add "Messages" link to coach dashboard navigation
- [x] Add "Messages" link to athlete portal navigation
- [ ] Test athlete can ask question on drill detail page
- [ ] Test coach can see all questions in messaging dashboard
- [ ] Test coach can reply to questions
- [ ] Test athlete can see their questions and coach responses


## Email Notifications on Drill Assignment
- [x] Add email trigger to drill assignment endpoint
- [x] Create email template for drill assignment notification
- [x] Include drill name, difficulty, and athlete portal link in email
- [x] Send email to athlete when coach assigns drill
- [x] Add in-app notification when drill is assigned
- [ ] Test email delivery on drill assignment
- [ ] Verify email contains correct drill information

## Email Verification for Invited Athletes
- [x] Add emailVerified field to users table
- [x] Add emailVerificationToken to users table
- [x] Create email verification endpoint
- [x] Create email verification email template
- [x] Update AcceptInvite page to require email verification
- [x] Add email verification confirmation page
- [x] Send verification email after account creation
- [x] Test email verification flow end-to-end

## Invite Expiration Notifications
- [x] Create invite expiration notification email template
- [x] Add scheduled job to check for expiring invites
- [x] Send reminder emails 2 days before expiration
- [x] Track which invites have had reminders sent
- [x] Test expiration notification emails
- [x] Verify athletes receive notifications at correct time


## Bug Fix: Athlete Activation on Invite Acceptance
- [x] Fixed upsertUser to properly set athletes as active (isActiveClient=1) on both INSERT and UPDATE
- [x] Added logging to AcceptInvite page to debug the flow
- [x] Added logging to acceptInvite endpoint to track mutations
- [x] Ensured athletes are always activated when they first log in via OAuth


## Admin User Management UI
- [x] Create backend endpoints for user management (list, update role, toggle active status)
- [x] Build user management page component with table view
- [x] Add role selector dropdown (user, athlete, admin)
- [x] Add active/inactive toggle for each user
- [x] Add search/filter functionality for users
- [x] Add confirmation dialogs for role changes
- [x] Test user management UI end-to-end

## Welcome Email for Newly Activated Athletes
- [x] Create welcome email template
- [x] Add sendWelcomeEmail function to email.ts
- [x] Add backend endpoint to trigger welcome email
- [x] Integrate welcome email into user activation flow
- [x] Track if welcome email has been sent (add sentWelcomeEmail field to users table)
- [x] Test welcome email delivery


## Add User Management Link to Dashboard
- [x] Add User Management navigation link to admin dashboard
- [x] Test navigation link works correctly
- [x] Verify link only shows for admin users

## Auto-Send Welcome Email on Activation
- [x] Modify toggleClientAccess endpoint to send welcome email when activating
- [x] Update UserManagement component to show email sent status
- [x] Add confirmation before activating user
- [x] Test auto-send flow end-to-end


## CRITICAL: Rebuild Bulk Import System and Recover Lost Data
- [ ] Create backend endpoint for bulk importing drill descriptions
- [ ] Create backend endpoint for bulk importing drill goals
- [ ] Build bulk import UI component with file upload
- [ ] Parse drill descriptions from backup file format
- [ ] Parse drill goals from backup file format
- [ ] Save all imported data to database
- [ ] Test bulk import end-to-end
- [ ] Verify all 72 drills have descriptions and goals restored

## Add New Drill - 3-Plate Adjustment Drill
- [x] Add "3-Plate Adjustment Drill" with description, goal, and video link
- [x] Add "Stride & Separation Drill" with description, goal, and video link

## Fix Drill Editing Frontend
- [x] Fix TypeScript errors in CreateDrillDetails.tsx and DrillDetail.tsx
- [x] Restore drill editing functionality on frontend
- [x] Test saving drill details, goals, and videos from Admin Dashboard

## Single Video Upload Feature
- [x] Add single video upload option to Admin Dashboard

## Add New Drill Feature
- [x] Create "Add New Drill" form component with name, goal, instructions, video URL
- [x] Add backend procedure to create new drills in database and drills.json
- [x] Add button to Admin Dashboard

## Fix Custom Drills Display
- [x] Make custom drills appear in the drills directory

## Fix Custom Drill Detail Page
- [x] Make custom drills display on drill detail page

## Fix Custom Drill Assignment Integration
- [x] Make custom drills appear in drill assignment dropdown

## Athlete Progress Report Dashboard
- [x] Create backend procedure to fetch athlete progress stats
- [x] Build AthleteProgressReport component with metrics
- [x] Add progress report view to Coach Dashboard
- [x] Include drill breakdown by category and difficulty
- [x] Add activity timeline and completion trends

## Coach Notes Feature
- [ ] Create coachNotes database table
- [ ] Add backend procedures for saving and fetching notes
- [ ] Add notes UI component to Progress Report
- [ ] Display notes history with timestamps


## Weekly Goals Tracker Feature
- [x] Add database table for weekly goals
- [x] Create backend procedures for goals CRUD
- [x] Add goals tracker UI to Progress Report


## Athlete Progress Dashboard Enhancement
- [x] Create visual stats component for Athlete Portal top section
- [x] Add streak tracking to backend (consecutive days with activity)
- [x] Integrate progress dashboard at top of Athlete Portal with stats cards and progress bars


## Drill Page Builder System
- [ ] Design block schema (text, video, image, list, callout, etc.)
- [x] Add database table for drill page layouts
- [ ] Create backend procedures for saving/retrieving layouts
- [ ] Build Drill Page Builder UI with drag-and-drop
- [ ] Add block library (text, video, image, list, callout, divider)
- [ ] Implement block reordering and deletion
- [ ] Add instant preview mode
- [x] Update drill detail page to render custom layouts
- [ ] Add fallback to legacy fields if no custom layout exists


## Page Builder Enhancements
- [x] Add block styling options (font size, color, alignment)
- [ ] Create drill templates system (save/reuse layouts)
- [x] Implement image upload with S3 storage
- [ ] Update DrillPageBuilder UI with styling controls
- [ ] Add template selector to Page Builder


## Streak Reminders, This Week Summary, and PDF Export
- [ ] Implement email reminder system for streak protection
- [ ] Add "This Week" summary section to Coach Dashboard
- [ ] Implement PDF export for progress reports

## PDF Export for Progress Reports
- [x] Install jsPDF and jspdf-autotable packages
- [x] Create PDF export utility function
- [x] Add Export PDF button to Athlete Progress Report
- [x] Include core metrics in PDF
- [x] Include weekly progress chart in PDF
- [x] Include recent completions in PDF
- [x] Include weekly goals in PDF
- [x] Include coach notes in PDF
- [x] Test PDF export functionality
- [x] Verify PDF formatting and layout

## Email Reminders for Streak Protection
- [ ] Create streak monitoring logic
- [ ] Set up email service for reminders
- [ ] Create email template for streak reminders
- [ ] Implement daily check for athletes at risk
- [ ] Add notification trigger when streak is at risk
- [ ] Test email delivery for streak reminders

## "This Week" Summary in Coach Dashboard
- [ ] Add "This Week" section to Progress Report
- [ ] Calculate drills assigned this week
- [ ] Calculate drills completed this week
- [ ] Show comparison to previous week
- [ ] Add visual indicators for progress
- [ ] Test weekly summary calculations
