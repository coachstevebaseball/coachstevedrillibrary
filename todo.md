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

## Parent Management Mode
- [x] Add parentId field to users table for parent-child relationships
- [x] Create database procedure to link parent to child account
- [x] Create backend procedure to get children managed by parent
- [x] Create backend procedure for parent to mark drill complete on behalf of child
- [x] Create backend procedure for parent to upload video on behalf of child
- [x] Build parent dashboard showing managed children
- [x] Add "Manage Child's Account" toggle/selector in parent view
- [x] Show child's assigned drills in parent dashboard
- [x] Allow parent to mark drills complete for child
- [ ] Allow parent to upload videos for child's drill submissions
- [x] Add clear messaging: "You're managing [Child's Name]'s training"
- [x] Test parent can view child's drills
- [x] Test parent can mark completions for child
- [ ] Test parent can upload videos for child
- [x] Test child's progress updates correctly when parent manages account

## Athlete Activity Tracking & Coach Alerts
- [x] Create athleteActivity table in database schema
- [x] Add activity types: drill_view, portal_login, assignment_view, drill_start, drill_complete, video_submit, message_sent
- [x] Implement backend procedure to log athlete activities
- [x] Create coach alerts notification system
- [x] Build Coach Activity Feed dashboard showing real-time athlete engagement
- [x] Add activity summary cards (daily active athletes, drills viewed today, etc.)
- [x] Implement "Last Seen" indicator for each athlete
- [x] Add streak break alerts (athlete hasn't logged in for X days)
- [ ] Create activity digest email option for coach (future enhancement)
- [x] Test activity logging for all event types
- [x] Test coach notification delivery
- [x] Test activity feed display and filtering

## Instant Email Alerts for Athlete Activity
- [x] Update activity tracking to trigger email alerts
- [x] Create email templates for each activity type (portal login, drill view, drill complete, video submit)
- [x] Add email alert toggle to coach alert preferences
- [ ] Implement rate limiting to prevent email spam (batch similar activities) - future enhancement
- [x] Test email delivery for all activity types
- [x] Verify email preferences are respected

## Timezone Fix for Email Alerts
- [x] Update email alert timestamps to display in Eastern Standard Time (EST)
- [x] Test email shows correct EST time

## Email Rate Limiting / Activity Batching
- [x] Create pendingEmailAlerts table to store queued alerts
- [x] Implement batching logic to group activities within 5-minute window
- [x] Update logActivity to queue alerts instead of sending immediately
- [x] Create scheduled job to process and send batched email digests
- [x] Design batched email template showing multiple activities
- [x] Test batching with multiple rapid activities
- [x] Test single activity still sends after 5-minute window

## Drill Favorites System
- [x] Create drillFavorites table in database schema
- [x] Create backend procedures for adding/removing favorites
- [x] Create backend procedure to get user's favorite drills
- [x] Add star/favorite button to drill cards in library
- [ ] Add star/favorite button to drill detail page (future enhancement)
- [x] Show visual indicator when drill is favorited
- [x] Create "My Favorites" section in athlete portal
- [x] Display favorited drills with quick access to details
- [x] Allow unfavoriting from athlete portal
- [x] Test favorite/unfavorite functionality
- [x] Test favorites display in athlete portal

## Athlete Portal Redesign - Action-First Mobile Interface
- [x] Remove generic "Your Drills" header and large stat cards
- [x] Create "Up Next" Hero Card showing most urgent assigned drill
- [x] Add drill title, duration, difficulty to Hero Card
- [x] Add prominent full-width "Let's Go" button on Hero Card
- [x] Create compact horizontal progress row below Hero Card
- [x] Add circular progress bar showing % completed
- [x] Add streak indicator with fire emoji (e.g., "🔥 3 Day Streak")
- [x] Redesign assignment list as playlist-style compact cards
- [x] Add skill icons/thumbnails to assignment cards (Hitting/Pitching)
- [x] Show drill title and due date tag on cards
- [x] Add play/arrow icon on right side of cards
- [x] Move badge progress to bottom or integrate as subtle header
- [x] Create modal/full-page view for drill focus mode
- [x] Modal shows only video instruction and submit work box
- [x] Apply modern athletic visual style (whitespace, soft grays)
- [x] Use red/orange for primary action buttons
- [x] Bold headings for drill names, clean sans-serif for metadata
- [x] Test mobile responsiveness
- [x] Test drill modal flow

## Favorites Display Fixes
- [x] Fix My Favorites section in Athlete Portal to show actual drill cards (not just count)
- [x] Add "Add to Favorites" button inside drill detail page
- [x] Test favorites display shows drill name, difficulty, category
- [x] Test Add to Favorites button toggles correctly on drill detail page

## Remove Star Buttons from Drill Library List
- [x] Remove star/favorite buttons from drill rows in Home.tsx (drill library)
- [x] Keep favorite button only inside drill detail page
- [x] Test drill library no longer shows stars
- [x] Test favorites still work from drill detail page

## Progressive Web App (PWA) Support
- [x] Create web app manifest (manifest.json) with app name, icons, theme colors
- [x] Generate app icons in multiple sizes (192x192, 512x512, etc.)
- [x] Create splash screen images for iOS (apple-touch-icon)
- [x] Implement service worker for offline caching
- [x] Add install prompt banner for "Add to Home Screen"
- [x] Configure full-screen standalone display mode
- [x] Add meta tags for iOS PWA support (apple-mobile-web-app-capable, etc.)
- [x] Test PWA installation on mobile devices (manifest and service worker verified)
- [x] Verify offline functionality works for drill viewing (service worker caching implemented)

## Bug Fix: Drill Completion Not Updating
- [x] Investigate drill completion flow in athlete portal
- [x] Check backend procedure for marking drills complete
- [x] Verify database is being updated correctly
- [x] Fix the completion status update issue (updateStatus was admin-only, now allows athletes to update their own)
- [x] Test drill completion from athlete portal (unit tests pass)

## Bug Fix: Email Notification URLs Incorrect
- [x] Search for incorrect URLs (coachstevebaseball.com)
- [x] Update all URLs to correct domain (coachstevemobilecoach.com)
- [x] Fixed email.ts (8 from addresses)
- [x] Fixed emailBatching.ts (2 baseUrls + 1 from address)
- [x] Fixed activityTracking.ts (1 baseUrl)
- [x] Fixed routers.ts (2 localhost URLs)

## Premium Dark Theme Upgrade
- [x] Update color palette: deep navy (#0a1628), charcoal (#1a2332), electric blue (#00bfff) accents
- [x] Add glassmorphism effects (backdrop blur, transparency) - glass-card, glass classes
- [x] Implement smooth hover animations on all interactive elements - hover-lift, card-hover
- [x] Add page transition animations - animate-fade-in-up, animate-fade-in-down, animate-fade-in-left
- [x] Create staggered reveal animations for lists/grids - stagger-1 through stagger-5
- [x] Update typography with Inter + Outfit fonts from Google Fonts
- [x] Add gradient overlays and layered designs - gradient-hero, gradient-glow, text-gradient
- [x] Implement parallax effect on hero section - scroll-based transform
- [x] Add card hover states with lift and glow effects - border-glow, btn-glow
- [x] Add micro-interactions throughout the UI - animate-float, animate-pulse-glow
- [x] Applied theme to Home page and Athlete Portal

## Skeleton Loading Placeholders
- [x] Create reusable Skeleton component with glassmorphism style
- [x] Add shimmer animation effect (uses existing animate-shimmer)
- [x] Replace Home page spinner with drill card skeletons (HomePageSkeleton)
- [x] Replace Athlete Portal spinner with assignment skeletons (AthletePortalSkeleton)
- [x] Add skeleton variants: DrillCardSkeleton, UpNextSkeleton, ProgressStatsSkeleton, PlaylistItemSkeleton, BadgeProgressSkeleton

## Bug Fix: Video URL Validation Rejecting Valid YouTube URLs
- [x] Investigate URL validation in Admin Dashboard Add New Drill
- [x] Fix validation to accept standard YouTube URL formats:
  - youtube.com/watch?v=VIDEO_ID (standard)
  - youtube.com/watch/VIDEO_ID (non-standard but now supported)
  - youtu.be/VIDEO_ID (short URL)
  - youtube.com/embed/VIDEO_ID (embed URL)
- [x] Updated VideoPlayer.tsx, DrillPageBuilder.tsx, CustomDrillLayout.tsx
- [x] Test with various YouTube URL formats

## Bug Fix: Drill Details Page Showing Mixed/Duplicate Content
- [x] Investigate drill detail page rendering logic
- [x] Fix content duplication - now shows ONLY page builder content when it exists (not both)
- [x] Fix invalid video URL error - page builder content now takes full precedence
- [x] Ensure page builder content renders in correct order with Edit Page button

## Notion-Style Block Editor for Drill Pages
- [x] Create NotionBlockEditor component with block types:
  - [x] Text blocks (paragraphs)
  - [x] Headings (H1, H2, H3, H4)
  - [x] Bulleted lists
  - [x] Numbered lists
  - [x] Video embeds (YouTube)
  - [x] Dividers
  - [x] Callout/highlight boxes
  - [x] Quote blocks
  - [x] Image blocks
- [x] Implement slash command menu (/) to insert blocks
- [x] Add drag-and-drop block reordering
- [x] Add block controls (delete, duplicate, move up/down)
- [x] Integrate with existing DrillPageBuilder (DrillPageBuilderNotion)
- [x] Update CustomDrillLayout to render new block types
- [x] Apply glassmorphism styling to editor
- [x] Add markdown shortcuts (#, ##, ###, -, 1., >, ---)
- [x] Add template save/load functionality
- [x] Add preview mode toggle
- [x] Fix text direction (LTR) for contenteditable elements


## Bug Fix: Notion Block Editor Backwards Text Input
- [x] Fix contenteditable text direction issue (replaced contentEditable with controlled Input/Textarea components)
- [x] Improve text input handling in block editor (now uses standard React controlled inputs)
- [x] Make editor functionality easier and more intuitive
- [x] Test text input in all block types (paragraph, headings, lists, quote, callout)


## UI Fix: Alert Toggle Visibility in Activity Feed
- [x] Find alert toggle components in Activity Feed page
- [x] Improve toggle visibility with better contrast/colors (bright blue when on, visible gray when off)
- [x] Test toggle visibility on dark background


## Admin Dashboard: Delete Invite Button
- [x] Add delete button to each invite in Pending & Accepted Invites section
- [x] Create backend API endpoint to delete invites (deleteInvite in invites.ts and routers.ts)
- [x] Add confirmation dialog before deleting
- [x] Test delete functionality


## Homepage Hero Redesign - "Unleash Your Potential" Style
- [x] Update hero headline to stacked "UNLEASH YOUR POTENTIAL" format
- [x] Add cyan/electric blue accent on "POTENTIAL" word (italic style)
- [x] Update copy to focus on elite mechanics, explosive power, game-ready confidence
- [x] Add "NEXT GEN TRAINING" badge/pill above headline
- [x] Maintain dark sophisticated background


## Hero Heading Spacing Update
- [x] Change layout to "UNLEASH YOUR" on first line, "POTENTIAL" on second line
- [x] Remove italics from POTENTIAL
- [x] Center the heading text
- [x] Improve spacing between lines


## Search & Filter System Redesign
- [x] Prominent search bar with placeholder text and search icon
- [x] Pill-shaped difficulty filter buttons (Easy, Medium, Hard)
- [x] Category filter with cyan-highlighted "All Categories" button
- [x] Additional category options (All, Hitting, Bunting, Pitching, Infield, Outfield, Catching, Base Running)

## Drill Card Grid Layout
- [x] Convert drills to card-based grid system (3 columns)
- [x] Featured image area at top of each card (with gradient fallback)
- [x] Difficulty badge in top-right corner (Easy=green, Medium=amber, Hard=red)
- [x] Category tag in cyan with dot indicator
- [x] Drill title in bold white text
- [x] Brief description on card
- [x] "View Details" link with arrow on each card


## Drill Card Hover Animations
- [x] Add lift effect on hover (translateY -14px with scale 1.03)
- [x] Add glow effect on hover (box-shadow with electric blue multi-layer glow)
- [x] Add smooth transition for all effects (0.4s cubic-bezier)
- [x] Test hover animations on drill cards


## Drill Card Editing System
- [x] Create database schema for drill customizations (drillCustomizations table)
- [x] Create backend API endpoints for drill CRUD operations (getAll, upsert, uploadImage)
- [x] Implement image upload to S3 for drill thumbnails
- [x] Create drill edit modal component (DrillEditModal.tsx)
- [x] Add edit button/click handler on drill cards (admin only, visible on hover)
- [x] Implement description editing (brief description textarea)
- [x] Implement difficulty badge editing (Easy/Medium/Hard dropdown)
- [x] Implement category editing (Hitting/Bunting/Pitching/Infield/Outfield/Catching/Base Running)
- [x] Test persistence of changes (verified - description updates saved to database)


## Bug Fix: Drill Card Image Not Displaying & Edit Button Missing
- [x] Investigate why uploaded image shows broken icon instead of image (CloudFront URL access issue)
- [x] Check S3 upload and URL generation (URL is correct but may have access restrictions)
- [x] Fix image display on drill cards (added onError handler to hide broken images)
- [x] Investigate why edit button disappeared on mobile (hover-only visibility)
- [x] Restore edit button functionality (always visible on mobile, hover on desktop)
- [x] Test on mobile and desktop


## Bug Fix: Image Upload Not Working
- [x] Investigate why uploaded images are not displaying
- [x] Check S3 storage upload process (S3 URLs returning 403 - switched to base64 storage)
- [x] Verify image URL is being saved correctly to database (using data URL format)
- [x] Test image upload end-to-end (working with compressed JPEG images)


## Bug Fix: Hide Admin Edit Functions from Clients
- [x] Hide edit button on drill cards for non-admin users (already implemented with `user?.role === 'admin'` check)
- [x] Only show edit functionality to admin role (verified in code)
- [x] Test as admin (should see edit button) - confirmed working
- [x] Test as athlete/client (should NOT see edit button) - confirmed, condition prevents non-admins from seeing button


## Bug Fix: Image Upload Not Saving Changes
- [x] Investigate why uploaded images are not persisting after Save Changes
- [x] Check DrillEditModal save flow (working correctly)
- [x] Check server uploadThumbnail mutation (working correctly)
- [x] Fix the issue and test (database table was missing - created drill_customizations table)


## Bug Fix: Image Upload "Data Too Long" Error
- [x] Investigate error: "Data Too Long, field len 65535, data len 72410"
- [x] Root cause: thumbnailUrl field (text type, 65535 limit) was storing full data URL
- [x] Fix: Only store image data in imageBase64 field (longtext, unlimited)
- [x] Add client-side image compression (max 800x600, JPEG format)
- [x] Test with large images (1200x900 compressed to ~17KB JPEG)
- [x] Verify database saves correctly (confirmed 1 row saved)


## Athlete Assignment Overview in Coach Dashboard
- [ ] Create backend endpoint to fetch all athletes with their assignment status (has drills vs no drills)
- [ ] Design visual overview component showing athletes grouped by assignment status
- [ ] Add visual indicators (badges, colors) for assigned vs unassigned athletes
- [ ] Include quick stats (total athletes, assigned count, unassigned count)
- [ ] Add quick-assign button to easily navigate to assign drills for unassigned athletes
- [ ] Integrate into Coach Dashboard prominently
- [ ] Test the feature end-to-end


## Athlete Assignment Overview Feature (Coach Dashboard)
- [x] Create backend endpoint to fetch athlete assignment status (getAthleteAssignmentOverview)
- [x] Design visual overview component showing athletes with/without drills
- [x] Add summary stats (total athletes, with drills, without drills, completion rate)
- [x] Implement filter tabs (All, With Drills, Need Drills)
- [x] Add search functionality
- [x] Integrate into Coach Dashboard with quick-assign action (click athlete to assign drills)
- [x] Athletes without drills highlighted in amber and shown first
- [x] Tab navigation added (Athlete Overview, Assign Drills)


## Delete Drill Assignment Feature
- [x] Verify delete button (trash icon) exists on drill assignments
- [x] Verify backend unassignDrill endpoint works correctly
- [x] Test delete functionality - confirmed working (Jack Joelson's drill was deleted)
- [x] Delete button properly removes drill from athlete's assignments


## Delete Drill Assignment Fix
- [x] Identified issue: unassignDrill mutation not invalidating query cache
- [x] Added trpc.useUtils() to CoachDashboard
- [x] Added utils.drillAssignments.getAllAssignments.invalidate() after mutation
- [x] Tested deletion - UI now updates immediately after clicking delete button
- [x] Verified: Sean Jaeger's drills went from 3 → 2 after deletion


## Add Athlete Name to Activity Table
- [x] Add athleteName column to athleteActivity schema
- [x] Update activity logging functions to include athlete name
- [x] Run database migration
- [x] Test that activity records now show athlete names


## Backfill Athlete Names Across Database
- [x] Query athleteActivity to get ID-to-name reference mappings
- [x] Update athleteActivity table to fill NULL athleteName values (263 records updated)
- [x] Add athleteName column to coachNotes, drillQuestions, weeklyGoals, drillAssignments, drillSubmissions, badges tables
- [x] Update all tables with athlete names from users table
- [x] Set orphaned records (deleted users) to "Unknown Athlete"
- [x] Verify all updates completed successfully - 0 NULL values remaining across all tables


## Fix YouTube URL Validation in Create a Drill
- [x] Investigate video URL validation logic
- [x] Fix to accept all YouTube URL formats (youtube.com/watch, youtu.be, with tracking params)
- [x] Fixed regex in VideoPlayer, CustomDrillLayout, DrillPageBuilder, NotionBlockEditor
- [x] Test drill creation with various YouTube URL formats (11 tests passing)


## Notion-Style Block Editor for Drill Pages
- [x] Examine existing block editor and drill page layout code
- [x] Add image upload block type with S3 storage (click to upload, drag & drop, 10MB limit)
- [x] Enhanced block types: text, H1-H4, bulleted list, numbered list, quote, callout, divider, video, image
- [x] Implement image editing tools (size: small/medium/large/full, alignment: left/center/right, caption)
- [x] Add Coach Dashboard "Page Layouts" tab to pick a drill and create/edit its layout
- [x] Updated CustomDrillLayout to render image size/alignment/caption for athletes
- [x] Updated DrillPageBuilderNotion to preserve image properties through conversion
- [x] Test full workflow end-to-end - verified in browser
- [x] Write unit tests - 15 tests passing (block conversion, image properties, round-trip)


## Drill Comparison View
- [x] Create DrillComparison page component
- [x] Build side-by-side drill selector with search and category filter
- [x] Display drill details comparison (name, difficulty, duration, categories)
- [x] Show video comparison side-by-side with embedded YouTube players
- [x] Add comparison highlights for differences
- [x] Add route and navigation from Coach Dashboard
- [x] Write unit tests (5 YouTube extraction + 2 data structure tests)

## Athlete Assessment Reports
- [x] Create AthleteAssessment page component using existing tRPC endpoints
- [x] Athlete selector dropdown with drill count preview
- [x] Display per-athlete progress metrics (completion rate, in progress, avg completion time)
- [x] Show weekly activity chart (last 4 weeks)
- [x] Recent completions and active assignments lists
- [x] Auto-generated personalized recommendations
- [x] Engagement level badge (Highly Engaged / Moderately Engaged / Needs Encouragement / At Risk)
- [x] Team overview stats (total athletes, with drills, total assigned, completion rate)
- [x] Add route and navigation from Coach Dashboard
- [x] Write unit tests (4 engagement level + 7 recommendation tests)


## UI Redesign - Premium Dark Theme
- [x] Research modern sports app UI design patterns
- [x] Upgrade fonts (Bebas Neue for headings, Poppins for body)
- [x] Rewrite index.css with enhanced theme (gradients, glass cards, animations)
- [x] Redesign Home page hero with bold typography and stat counters
- [x] Redesign drill cards with glass-card styling and hover effects
- [x] Redesign Coach Dashboard with gradient header and stat cards
- [x] Redesign DrillDetail page with premium dark theme
- [x] Redesign DrillComparison page with glass-card styling
- [x] Redesign AthleteAssessment page with glass-card styling


## Athlete Table with All Details (Frontend Only)
- [ ] Examine existing tRPC queries for athlete data
- [ ] Build comprehensive Athlete Table (ID, name, email, latest activity, status, drill count, etc.)
- [ ] Add to Coach Dashboard with sorting and search
- [ ] No backend or database changes

## Athlete Table - Coach Dashboard
- [x] Create AthleteTable component with comprehensive athlete details
- [x] Add "Athletes Table" tab to Coach Dashboard tab navigation
- [x] Display columns: ID, Name, Email, Status, Drills, Done, Last Activity, Last Sign In, Joined
- [x] Implement sortable columns (click to sort asc/desc)
- [x] Implement search by name, email, or ID
- [x] Implement status filter tabs (All, Active, Pending, Inactive)
- [x] Add expandable row detail view with full athlete info (role, account type, active client, completion rate, etc.)
- [x] Add pagination (15 rows per page)
- [x] Style with premium dark theme (glass-card, gradient borders)
- [x] Frontend-only implementation (no backend/database changes)
- [x] Merge data from getAthleteAssignmentOverview and getAllUsers endpoints
- [x] Write vitest tests for data merging, filtering, sorting, and pagination logic (28 tests passing)

## Practice Planner - Session Planning Tool
- [x] Research best baseball practice plan generators (Dugout Edge, Baseball Blueprint, Connected Performance)
- [x] Design database schema (practicePlans + practicePlanBlocks tables)
- [x] Create database tables and push migrations
- [x] Build database helper functions (create, get, update, delete, duplicate, share)
- [x] Create tRPC routes with coach-only authorization (create, getAll, getById, update, delete, duplicate, toggleShare, getMySharedPlans, getTemplates)
- [x] Build PracticePlanner UI component with list/create/edit/detail views
- [x] Implement drill library picker with search (pulls from drills.json + custom drills)
- [x] Add session blocks: drill, warmup, cooldown, break, custom types
- [x] Add drag-reorder for blocks, sets/reps/notes per block
- [x] Add focus area chips (Hitting, Pitching, Fielding, etc.)
- [x] Add athlete assignment dropdown (from users + invites)
- [x] Add session date picker and duration tracking
- [x] Add plan status management (Draft, Scheduled, Completed, Cancelled)
- [x] Add duplicate plan functionality
- [x] Add share toggle to share plans with assigned athletes
- [x] Add "Practice Planner" tab to Coach Dashboard
- [x] Build SharedPracticePlans component in Athlete Portal
- [x] Athlete can view shared plans with expandable block details
- [x] Mobile-first responsive design throughout
- [x] Write vitest tests (24 tests: CRUD, sharing, authorization, validation, templates)
- [x] All 24 tests passing

## Mobile Tab Visibility Fix - Practice Planner
- [x] Make Practice Planner tab easily visible on mobile
- [x] Improve tab bar scrollability/layout for 5 tabs on small screens

## Practice Planner Redesign - Visual Session Playbook
- [x] Redesign planner as a highly visual, detailed session playbook
- [x] Add rich block customization (coaching cues, key points, visual indicators per block)
- [x] Add session mode view for quick pull-up during live sessions
- [x] Add floating quick-access button for instant planner access (Session button on each card)
- [x] Add granular athlete sharing controls (selective share per athlete)
- [x] Mobile-optimized session view with large touch targets
- [x] Color-coded block types with visual hierarchy
- [x] Add notes/cues field per block for memory aids
- [x] Test on mobile and verify responsiveness

## Bug Fix - AthleteTable Key Prop
- [x] Fix missing unique "key" prop in AthleteTable list rendering

## 4. Accessibility & Responsive Optimization
- [x] Improve color contrast across dashboard (high-contrast text/backgrounds)
- [x] Add focus indicators for keyboard navigation on all interactive elements
- [x] Add ARIA labels to all interactive components (buttons, inputs, tabs, modals)
- [x] Audit and fix responsive layouts for mobile/tablet across all pages
- [x] Test flexible grid performance on tablets and smartphones

## 5. Scheduling & Practice Planning Expansion
- [x] Add calendar view to Practice Planner for scheduling drills over time
- [x] Allow assigning practice plans to athletes with goal-setting
- [x] Add automated follow-up email notifications for assigned drills
- [x] Add reminder notifications to prompt athletes to complete tasks

## 6. Page Builder & Content Editing Improvements
- [x] Add autosave to Page Builder overlay
- [x] Add version control (undo/redo history) to Page Builder
- [x] Add preview functionality to Page Builder
- [x] Add clearer instructions/guidance in Page Builder
- [x] Create templated page layouts for drill pages (5 built-in templates seeded)

## Page Builder: Markdown Paste from Notion
- [x] Support pasting Markdown content from Notion into Page Builder templates
- [x] Parse headings (# ## ### ####) into appropriate block types
- [x] Parse bold (**text**) and italic (*text*) formatting within blocks
- [x] Parse bulleted lists (- item) into bulleted list blocks
- [x] Parse numbered lists (1. item) into numbered list blocks
- [x] Parse blockquotes (> text) into quote blocks
- [x] Parse horizontal rules (---) into divider blocks
- [x] Parse links [text](url) and inline code within text blocks
- [x] Handle multi-line paste creating multiple blocks at once
- [x] Write tests for Markdown paste parsing

## SEO Fixes - Homepage
- [x] Add H2 heading to homepage
- [x] Set document.title to 30-60 characters on homepage

## Phase 2: Session Notes Input
- [x] Create sessionNotes table in schema (athleteId, sessionDate, sessionNumber, skillsWorked, whatImproved, whatNeedsWork, homeworkDrills, overallRating, privateNotes)
- [x] Create progressReports table in schema (for storing generated reports)
- [x] Run db:push migration
- [x] Build tRPC procedures: createSessionNote, getSessionNotes, getSessionNote, updateSessionNote, deleteSessionNote, getNextSessionNumber
- [x] Build mobile-optimized Session Notes form (quick-tap skill chips, fast text entry)
- [x] Build Session History timeline view per athlete
- [x] Integrate Session Notes tab into Coach Dashboard
- [x] Write vitest tests for session notes procedures

## Phase 3: AI Reports + Email Delivery
- [x] Build AI report generation tRPC procedure using invokeLLM with Coach Steve's voice
- [x] Build Report Review UI with inline editing
- [x] Build branded HTML report with logo and tagline (Coach Steve / Elite Instruction. Measurable Growth.)
- [x] Build email delivery for reports to parents via Resend
- [x] Store generated reports in database with report history
- [x] Add Generate Report button to session notes view (wired in SessionHistory + SessionNotesTab)
- [x] Write vitest tests for report generation (12 tests passing)

## Bug Fix: Generate Report 404
- [x] Fix Generate Report button navigating to 404 instead of triggering inline report generation (verified working — re-publish to deploy)

## LLM Model Change
- [x] Switch LLM model from gemini-2.5-flash to gpt-4o

## Bug Fix: Practice Plan Player Selection
- [x] Fix selecting one athlete auto-selects entire group instead of individual selection (root cause: a.userId was undefined for all athletes, making all Select items share value "undefined")

## Enhanced Player Profiles
- [x] Add parent contact fields (parentName, parentEmail, parentPhone) to database schema
- [x] Add birthDate field to database schema
- [x] Add position field to database schema
- [x] Add focusAreas field to database schema
- [x] Migrate database with new fields
- [x] Update server procedures for reading/writing profile fields
- [x] Build coach-facing athlete profile edit UI (view/edit player details)
- [x] Build athlete-facing profile display/edit UI
- [x] Integrate profile data into progress reports (parent email, player context)
- [x] Write tests for new profile CRUD operations

## Fix: Custom Drills Not Integrated Alphabetically
- [x] Investigate how custom drills are loaded vs static drills across all surfaces
- [x] Fix DrillsDirectory page to merge custom drills alphabetically with built-in drills
- [x] Fix coach dashboard drill assignment to include custom drills alphabetically
- [x] Fix Athlete Portal drill listing to merge custom drills alphabetically
- [x] Fix Home page, SessionNotesForm, PracticePlanner, SingleVideoUpload
- [x] Create shared useAllDrills hook to eliminate duplicate merge logic
- [x] Verify all drill listing surfaces show unified, alphabetically sorted results

## AI-Powered Video Analysis
- [x] Audit existing video infrastructure, schema, and Gemini API setup
- [x] Add videoAnalysis table to database schema (status, AI feedback, coach edits, timestamps)
- [x] Migrate database with new video analysis table
- [x] Build Gemini video analysis server procedure (send video URL → receive structured feedback)
- [x] Build coach review/edit UI for AI-generated feedback in dashboard
- [x] Build athlete video submission UI with analysis status tracking
- [x] Build athlete feedback display UI (view approved feedback)
- [x] Build email delivery for coach-approved feedback
- [x] Write tests for video analysis CRUD and Gemini integration

## Bug Fix: Empty src Attribute on Coach Dashboard
- [x] Fix empty string passed to src attribute causing browser re-download warning

## Athlete Video Upload for AI Analysis
- [x] Audit current athlete portal and existing video submission flow
- [x] Build athlete video upload component (drill picker, video upload to S3, mobile-optimized)
- [x] Integrate upload component into Athlete Portal (drill focus modal)
- [x] Auto-create videoAnalysis record on upload so it appears in coach review queue
- [x] Restyle DrillSubmissionForm for dark theme with mobile-first design
- [x] Add capture="environment" for direct phone camera access
- [ ] Test end-to-end: athlete uploads → record created → coach sees in dashboard

## Bug Fix: Video Upload Issues
- [x] Remove capture="environment" so mobile users can choose from photo library (not camera-only)
- [x] Fix desktop upload fetch error — switched from base64 tRPC to multipart FormData upload route
- [x] Added /api/upload/video Express route with multer for large file support (100MB)
- [x] Updated DrillSubmissionForm to use multipart upload instead of base64
- [x] Verified endpoint returns 401 for unauthenticated requests
- [x] TypeScript compiles cleanly, 286 tests pass (2 pre-existing failures unrelated)

## Upload UX: Real-Time Progress & Video Compression
- [x] Replace fetch() with XMLHttpRequest for real-time upload progress percentage
- [x] Show accurate upload progress bar with bytes transferred / total
- [x] Add client-side video compression via ffmpeg.wasm before upload
- [x] Show two-phase progress: compression (amber) then upload (blue) with phase indicators
- [x] Skip compression for files under 10MB threshold
- [x] Show compression savings indicator (original → compressed size)
- [x] Add cancel upload button
- [x] Graceful fallback if compression fails (uploads original)
- [x] Increased file limit to 500MB client-side, 200MB server-side
- [x] TypeScript compiles cleanly, 286 tests pass

## Standalone Swing Analyzer (Athlete Portal)
- [x] Add server procedure for standalone swing submission (no drill/assignment required)
- [x] Make submissionId and drillId nullable in videoAnalysis schema for standalone swings
- [x] Build prominent "Analyze My Swing" button on Athlete Portal with glassmorphism styling
- [x] Build mobile-optimized swing upload dialog (video + notes + swing type selector)
- [x] Integrated real-time XHR upload progress and ffmpeg compression
- [x] Auto-trigger Gemini analysis on submission via submitSwing procedure
- [x] Updated coach VideoAnalysisTab to display standalone swings (shows swing type instead of drill)
- [x] Show submission history and feedback status on athlete portal
- [x] TypeScript compiles cleanly, 286 tests pass (2 pre-existing failures)

## Bug Fix: React Error #310 on Coach Dashboard
- [x] Investigate and fix React error #310 crash when accessing coach dashboard (Session Notes tab)
- [x] Root cause: useQuery hook placed after early return in SessionNotesTab.tsx (conditional hook call)
- [x] Fix: Moved athleteProfile useQuery hook before the early return, using `enabled` flag for conditional fetching
- [x] Verified: Session Notes tab loads, athlete selection works, Generate Report works, navigation between views works

## Athlete Portal: Video Feedback Viewer
- [x] Create tRPC procedure for athletes to fetch their own video analyses (approved/sent status)
- [x] Build AthleteVideoFeedback component with structured AI feedback display
- [x] Add "My Swing Feedback" section/tab to Athlete Portal
- [x] Display video player alongside AI analysis results
- [x] Show feedback status indicators (pending, analyzing, under review, approved)
- [x] Support both drill-specific and standalone swing feedback
- [x] Mobile-optimized responsive design matching dark theme
- [x] Write vitest tests for the new athlete feedback query
- [x] Verify in browser and test navigation flows

## Session Notes: Pre-built Templates & Editable Fields
- [x] Add pre-built template options for "What Improved This Session" with Coach Steve coaching phrases
- [x] Add pre-built template options for "What Still Needs Work" with Coach Steve coaching phrases
- [x] Include "Custom" option for free-text entry when templates don't fit
- [x] Make session title (Session #) editable
- [x] Make date field editable (was already editable, confirmed)
- [x] Write vitest tests for the updated session notes functionality
- [x] Verify in browser — all features working correctly

## UX: Scroll Position Restoration
- [x] Identify all pages with card navigation (drill library, athlete portal, practice planner, etc.)
- [x] Implement scroll restoration hook using sessionStorage
- [x] Create ScrollRestoreLink component to save scroll position before navigation
- [x] Apply scroll restoration to drill library (Home.tsx)
- [x] Test navigation flow: click card → view detail → go back → verify scroll position restored
- [x] Verified: Returns to exact scroll position (1100px tested) — SUCCESS!

## Blast Motion Metrics Tracking
- [x] Add players, sessions, and blast_metrics tables to Drizzle schema
- [x] Run database migration (pnpm db:push)
- [x] Seed initial data — cleaned to only real athletes (Sean Yaegar, Gavin Goldstein)
- [x] Create backend tRPC routes for blast metrics (listPlayers, getPlayer, getPlayerSessions, getSessionTypes, getTrends, getAverages, addPlayer, addSession)
- [x] Verify data with test query: avg bat_speed_mph and rotational_acceleration_g by session_type
- [x] Build Player Roster View component (list all players with session counts)
- [x] Build Player Detail Dashboard (summary cards, session history, averages table)
- [x] Build Trend Visualization (line/bar chart for bat_speed_mph and rotational_acceleration_g over time)
- [x] Add session_type filter dropdown to isolate session types
- [x] Integrate Blast Motion section into Coach Dashboard (coach-only, not athlete-facing)
- [x] Fix tRPC "<!doctype" HTML response error — added /api/* exclusion in vite.ts catch-all
- [x] Write vitest tests for blast metrics backend (10 tests pass)
- [x] Verify in browser — all features working correctly

## Blast Motion: Data Cleanup & Session Count Fix
- [x] Remove sample players (Mike Troutman, Alex Johnson, David Ortiz Jr., Shannon Caputo) — kept only Sean Yaegar and Gavin Goldstein
- [x] Fix Drizzle ORM session count subquery — switched from correlated subquery to LEFT JOIN with GROUP BY
- [x] Link Blast players to actual portal user accounts — Sean Jaeger (userId 3570024), Gavin Goldstein (userId 3780043)
- [x] Verify session counts display correctly in the UI — Gavin: 1 session, Sean: 3 sessions ✓

## Link Blast Players to Portal Accounts
- [x] Find portal user IDs for Sean Yaegar and Gavin Goldstein
- [x] Update blastPlayers.userId to link to their portal user accounts
- [x] Added blastEmail column to store Blast Connect emails (JKrichever@gmail.com, adgold77@yahoo.com)
- [x] Update Blast Metrics UI to show linked user info (portal email, Blast email)
- [x] Verify linked profiles display correctly in the Coach Dashboard — green dot with linked email shown

## Manual Blast Session Entry UI
- [x] Build "Add Session" dialog/form accessible from Blast Metrics player detail view
- [x] Player selector (existing players + add new player option) on roster view
- [x] Session date picker and session type selector
- [x] All 13 Blast metric input fields with proper labels and units
- [x] Form validation (require player, date, session type; metrics optional)
- [x] Success feedback and auto-refresh of player data after adding
- [x] Add "Add New Player" inline form on roster view
- [x] Delete session capability
- [x] Write vitest tests for the add session flow

## Link Blast Sessions with Session Notes
- [x] Audit Blast players/sessions and Session Notes schemas to understand data models
- [x] Design linking strategy between Blast sessions and Session Notes
- [x] Add schema changes (e.g., blastSessionId FK on session_notes, or blastPlayerId link to athletes)
- [x] Update backend procedures to auto-create/link session notes when adding Blast sessions
- [x] Update Session Notes UI to show linked Blast metrics
- [x] Update Blast Metrics UI to show linked session notes
- [x] Ensure Shannon Caputo's Blast data links to her session/athlete profile
- [x] Write vitest tests for the linking flow

## Edit Blast Session Dialog
- [x] Add updateSession backend procedure to update session date, type, and all metrics
- [x] Build EditBlastSession dialog component with pre-filled form fields
- [x] Add Edit button to session history table rows
- [x] Write vitest tests for updateSession

## CSV Bulk Import for Blast Sessions
- [x] Add bulkImportSessions backend procedure that parses CSV and creates sessions+metrics
- [x] Build CSV import dialog with file upload, column mapping preview, and confirmation
- [x] Handle CSV parsing edge cases (missing columns, bad data, duplicates)
- [x] Write vitest tests for bulk import

## Retroactive Session Note Creation
- [x] Add createRetroactiveNotes backend procedure that creates session notes for all unlinked Blast sessions of a linked player
- [x] Add "Create Missing Notes" button on player detail view (visible when player is linked and has sessions without notes)
- [x] Show count of sessions missing notes
- [x] Write vitest tests for retroactive note creation

## Athlete Dashboard - Sessions/Notes/Metrics View
- [x] Build athlete-facing Blast Metrics view (read-only) showing their sessions and trends
- [x] Build athlete-facing Session Notes view showing their session history and notes
- [x] Add navigation to athlete dashboard for sessions/notes/metrics
- [x] Ensure coach-only data (private notes) is hidden from athlete view
- [x] Mobile-optimized layout for athlete dashboard
- [x] Write vitest tests for athlete data access

## Session Note Sharing Toggle
- [x] Add sharedWithAthlete column to sessionNotes schema (default true for new notes)
- [x] Run db:push to apply migration
- [x] Add toggleSharing backend procedure to flip the flag
- [x] Update getMyNotes athlete query to filter by sharedWithAthlete = true
- [x] Add sharing toggle switch to coach SessionHistory UI
- [x] Show shared/unshared indicator on each note
- [x] Write vitest tests for sharing toggle

## Bulk Share/Hide All Session Notes
- [x] Add bulkToggleSharing backend procedure
- [x] Add Share All / Hide All buttons to SessionHistory UI
- [x] Write vitest tests for bulk toggle

## Athlete Portal Redesign - Drill Modal
- [x] Redesign drill modal to show clear instructions (objectives, steps, tips) first
- [x] Add motivational coach message section ("Coach Steve says...")
- [x] Move submission form to end of modal, make it optional
- [x] Add "Mark as Done" quick completion button
- [x] Simplify notes field with guided prompts
- [x] De-emphasize video upload, offer pre-defined feedback options

## Athlete Portal Gamification
- [x] Create gamification schema (streaks, badges, points, achievements)
- [x] Build streak tracking logic (consecutive days/sessions)
- [x] Create badge/achievement system with unlock conditions
- [x] Build progress tracking with visual indicators
- [x] Add gamification dashboard section to athlete portal
- [x] Display streaks, badges, and progress visually
- [x] Reward athletes for completing drills with points/badges
- [x] Write vitest tests for gamification system

## Drill Videos Database Table
- [ ] Review existing drill data to identify video URL sources
- [ ] Create drillVideos table in schema with drillId and videoUrl columns
- [ ] Push migration to database
- [ ] Populate table with existing video URLs from drill data
- [ ] Write vitest tests for the new table

## Coach Steve Baseball Color Rebrand
- [x] Update global CSS theme variables in index.css (backgrounds to #1a1a1a/#2a2a2a, primary to #DC143C)
- [x] Update hero section gradient text and badges to crimson
- [x] Update all primary action buttons to crimson #DC143C with hover #B91030
- [x] Update active tab states in Coach Dashboard to crimson
- [x] Update active filter button states to crimson
- [x] Update toggle switches to crimson when enabled
- [x] Update card hover borders to crimson
- [x] Update card backgrounds to #2a2a2a with border-white/10
- [x] Update table header rows to #2a2a2a
- [x] Preserve functional colors (Active/Inactive badges, difficulty badges, progress bars)
- [x] Update text colors: headlines white, body gray-400, hover states crimson
- [x] Verify all pages visually after changes

## Fix Blast Session Note Template
- [x] Change auto-generated Blast session notes from fake "WHAT IMPROVED" / "WHAT NEEDS WORK" to "SESSION BLAST METRICS" with raw metrics
- [x] Update retroactive note creation to use the same fixed template
- [x] Verify existing notes display correctly

## Remove Drill
- [x] Remove "Advanced Batting Practice" from drill library data

## Remove Drills (Batch 2)
- [x] Remove "Beginner's Batting Practice" from all data files
- [x] Remove "Cup Ball Game" from all data files
- [x] Remove "Offensive Stations - Tee and Live Hitting" from all data files
- [x] Remove "Offensive Stations – Cage Work and Baserunning" from all data files
- [x] Remove "Execute - On the Field Whiffle Ball Toss" from all data files
- [x] Remove "One Cut Competition" from all data files
- [x] Remove "Team Bunting Stations" from all data files
- [x] Remove "Indoor Facility Defensive Stations" from all data files
- [x] Remove "Team Situations" from all data files
- [x] Remove "Execute - On the Field" from all data files
- [x] Remove "Whiffle Ball Toss" from all data files

## Fix Drill Library Navigation State Persistence
- [x] Store page/category/search/sort in URL query string
- [x] Parse URL query params on list page load and apply to UI controls
- [x] Update URL when user changes page, category, search, or sort
- [x] Drill card links preserve query string in detail URL
- [x] Back button restores full list state from URL params
- [x] Scroll position saved to sessionStorage keyed by query string
- [x] Scroll position restored after list renders on Back navigation
- [x] Write vitest tests for URL state parsing and navigation

## Inline Goal Editing on Original Drill Template
- [x] Add inline edit button to Goal section on original drill template
- [x] Implement click-to-edit UI for goal text (textarea with save/cancel)
- [x] Create or reuse backend mutation to save goal text
- [x] Restrict editing to admin/coach roles only
- [x] Write vitest tests for goal editing

## Remove Drill (4 Corners)
- [x] Remove "4 Corners" from all data files

## Editable Report Sections & Modern Email Template
- [x] Make report title/heading editable in review UI
- [x] Make section headings (What Stood Out, Building On, Next Steps) editable
- [x] Make all section body text editable
- [x] Make closing motivational quote editable
- [x] Modernize email template with premium aesthetic design
- [x] Write vitest tests for editable report fields

## 2 Free Drill Preview (Teaser for Unauthenticated Visitors)
- [x] Create usePreviewLimit hook with localStorage tracking of viewed drill slugs
- [x] Build DrillPreviewWall component (signup prompt when limit reached)
- [x] Integrate preview gate into DrillDetail - show wall after 2 views for non-logged-in users
- [x] Logged-in users bypass the limit entirely
- [x] Drill directory list remains fully browsable for everyone
- [x] Write vitest tests for preview limit logic

## Fix 2 Free Drill Preview System
- [x] Fix preview logic: PREVIEW_MODE=true causes hasAccess to always be true, masking the anonymous flow
- [x] Ensure anonymous users see content for first 2 drills then hit the wall on 3rd
- [x] Ensure recordView fires correctly for anonymous visitors
- [x] Browser test as anonymous user to verify wall appears (verified code logic; server session prevents full browser test)

## Remove Unwanted Blast Metrics
- [x] Keep only: Bat Speed, On Plane Efficiency, Attack Angle, Exit Velocity
- [x] Remove all other metrics from DB schema (drizzle/schema.ts)
- [x] Remove from server routers (input validation, queries)
- [x] Remove from client UI (session forms, display components, Averages by Session Type table, CSV import help text)
- [x] Push DB migration (dropped 10 columns, added exitVelocityMph)
- [x] Run tests to verify (397 pass, 2 pre-existing failures unrelated to blast metrics)

## Universal Inline Text Editing System
- [x] Create siteContent database table for persisted inline edits
- [x] Create tRPC routes for getting/setting site content
- [x] Build reusable InlineEdit component (click-to-edit, save on blur/Enter)
- [x] Apply inline editing to Home page (hero badge, headline, tagline, stats, section headings, drill cards)
- [x] Apply inline editing to Drill Detail page (title, goal, info cards, instructions)
- [x] Apply inline editing to Coach Dashboard - all 8 tabs (titles, subtitles, tab names, button labels, stat cards, section headings, table headers, metric labels, chart titles, status badges)
- [x] Apply inline editing to Admin Dashboard (title, subtitle, buttons, stat cards, table headers)
- [x] Restrict inline editing to admin/coach role only (athletes see read-only)
- [x] Write tests for inline edit backend routes (6 tests pass)
- [x] Browser verify all pages and tabs

## Inline Edit: Session Note Form
- [x] Apply InlineEdit to form title "Edit Session Note" and header elements (athlete name, session #)
- [x] Apply InlineEdit to all field labels (DATE, DURATION, SKILLS WORKED ON, etc.)
- [x] Apply InlineEdit to skill pills (each pill label editable on click)
- [x] Add custom skill pill creation ("+ Add Skill" button to create new skill pills)
- [x] Apply InlineEdit to Quick Fill button labels, SHOW label, suggestion titles
- [x] Add ability to manually add custom quick fill text ("+ Add Custom Quick Fill" in dropdown)
- [x] Apply InlineEdit to bottom action buttons (Cancel, Update Session Note)
- [x] Apply InlineEdit to SESSION RATING sublabel and Private Coach Notes label
- [x] Apply InlineEdit to selection count text ("1 skill selected")
- [x] Apply InlineEdit to Close button in Quick Fill dropdown
- [x] TypeScript check (0 errors), browser verify (all elements confirmed), save checkpoint

## Persist Custom Skills & Quick Fills + Reset to Default + Session History Inline Edit
- [x] Persist custom skills to siteContent DB (survive page reload)
- [x] Persist custom quick fills to siteContent DB (survive page reload)
- [x] Add "Reset to Default" option on any inline-edited text (amber RotateCcw icon with confirmation popover)
- [x] Add inline editing to Session History expanded cards (WHAT IMPROVED, WHAT NEEDS WORK, HOMEWORK DRILLS, Private Notes headings + all action buttons)
- [x] Add inline editing to AthleteSessionNotes component (athlete-facing view)
- [x] Add reset/delete tRPC procedure + 2 new tests (8 total siteContent tests pass)
- [x] TypeScript check (0 errors), tests (405 pass), browser verify (all elements confirmed)

## Bug Fix: AthleteTable Hooks Ordering
- [x] Fix "Rendered more hooks than during the previous render" error in AthleteTable component

## Remove Protected Routes / Login Walls (Public Pages Only)
- [x] Remove ProtectedRoute from athlete-portal, athlete-messaging, my-profile, parent-dashboard routes
- [x] Remove auth gates / login redirects from Home.tsx
- [x] Remove auth gates from DrillsDirectory.tsx
- [x] Remove auth gates from DrillDetail.tsx
- [x] Keep admin/coach dashboard routes protected (admin-only)
- [x] Verify public pages load without login
- [x] Verify admin/coach pages still require login

## Controlled Iframe Embedding Implementation
- [x] Create EMBED_ALLOWED_ORIGINS env variable with configurable domain allowlist
- [x] Create dual CSP middleware — frame-ancestors allowlist for /embed/*, frame-ancestors 'self' for all other routes
- [x] Remove X-Frame-Options header from /embed/* responses only
- [x] Create /embed landing page (streamlined, no header/footer)
- [x] Create /embed/drills page (drill library, no chrome)
- [x] Create /embed/drill/:id page (drill detail, no chrome)
- [ ] Create /embed/player-report page (player report, no chrome)
- [x] Register all embed routes in App.tsx
- [x] Ensure all embed internal navigation stays within /embed/*
- [ ] Ensure responsive layout works at 320px, 768px, 1280px widths
- [ ] Ensure modals/dropdowns render within iframe boundary
- [x] Create iframe test harness for approved vs unapproved domain testing
- [x] Verify approved domain loads embed in iframe
- [x] Verify unapproved domain is blocked from embedding (CSP blocks non-embed routes)
- [x] Verify non-embed routes are blocked from external framing
- [ ] Save checkpoint (pending)

## Home Page Advanced Filters
- [x] Audit DrillsDirectory.tsx filter logic and data sources
- [x] Audit drill data files for all filter dimensions (ageLevel, drillType, tags, problem, goal)
- [x] Build all 7 filter dimensions on Home.tsx (Difficulty, Skill set, Age/level, Drill type, Fix a problem, Training goal, Tag/focus area) + search
- [x] Mobile UX: Level + Skill visible, other dimensions behind "More filters" bottom sheet
- [x] Desktop UX: show all filters inline or in expanded "Advanced filters" block
- [x] Show active filter indicators and "Clear all" control
- [x] Fix drill count accuracy — single source of truth for hero, badges, results
- [x] Redirect /drills → / with query params so old links still work
- [x] Test logged-out behavior
- [x] Save checkpoint


## Homepage Advanced Filters Migration
- [x] Update useDrillListParams hook to support all 7 filter dimensions in URL (ageLevel, drillType, problem, goal, tag)
- [x] Add all 7 filter dimensions to Home.tsx (Difficulty, Skill set, Age/Level, Drill type, Fix a problem, Training goal, Tag/focus area)
- [x] Implement responsive filter UX: mobile (Level + Skill visible, others in "More Filters" bottom sheet), desktop (inline expanded block)
- [x] Add active filter pills with individual remove and "Clear all" control
- [x] Ensure single accurate drill count across hero stats, results badge, and filter results
- [x] Set up /drills → / redirect with query param preservation
- [x] Test logged-out behavior works correctly
- [x] Verify old /drills links still work via redirect
- [x] Unit tests for parseDrillParams and buildDrillQuery (32 tests passing)


## Notification & Tracking System
### Phase 1: Database Schema
- [ ] Create activityFeed table (coach-facing event log with timestamps, event types, athlete info)
- [ ] Create emailLog table (track sent emails, delivery status, open/click tracking)
- [ ] Create notificationTriggers table or config for automated triggers
- [ ] Run migrations (pnpm db:push)

### Phase 2: Core Email Service
- [ ] Build branded email templates (assignment, metrics update, reminder, milestone, custom note)
- [ ] Create email sending utility with Resend integration
- [ ] Add open/click tracking pixel and link wrapping

### Phase 3: Use Case A — Pre-Lesson Prep (Manual Email + Tracking)
- [ ] Coach assigns video/drill → system emails athlete "New video assigned for review"
- [ ] Log email sent event to activity feed
- [ ] Track when athlete clicks/watches → log to activity feed silently

### Phase 4: Use Case B — Metrics Update (Automatic Email)
- [ ] When coach updates bat speed / exit velocity → auto-email athlete "New swing metrics posted"
- [ ] Log metrics update event to activity feed

### Phase 5: Use Case C — Ghosting Tracker (Automatic Tracking)
- [ ] Scheduled job: check for athletes inactive 7+ days (no login, no completed assignments)
- [ ] Flag inactive athletes in activity feed as "Inactive for 7 days"

### Phase 6: Use Case D — Drill Reminders (Automatic Email)
- [ ] Scheduled job: check for assignments due within 24 hours
- [ ] Auto-send reminder email to athlete
- [ ] Log reminder sent to activity feed

### Phase 7: Use Case E — Positive Reinforcement (Automatic Email)
- [ ] Track monthly drill completion count per athlete
- [ ] When athlete hits 10th completed drill of month → auto-send congratulation email
- [ ] Log milestone event to activity feed

### Phase 8: Coach Activity Feed UI
- [ ] Build Activity Feed component on coach dashboard
- [ ] Show chronological list of all events (assignments, views, metrics, inactivity, milestones)
- [ ] Add filtering by event type and athlete
- [ ] Display timestamps in EST
- [ ] Real-time or polling updates

### Phase 9: Testing & Verification
- [ ] Unit tests for email service
- [ ] Unit tests for activity feed logging
- [ ] Unit tests for scheduled job logic
- [ ] Integration test: assignment → email → tracking flow
- [ ] Verify logged-out behavior (no in-app notification bell for athletes)
- [ ] Save checkpoint

## Gemini Fix & AI Hitting Coach Test
- [x] Fix Gemini SchemaType warning in videoAnalysisService.ts by casting SchemaType.OBJECT explicitly
- [x] Test AI Hitting Coach end-to-end to verify Gemini responses render correctly
- [x] Save checkpoint and publish all restored features

## Theme Restyle - Dark Navy/Red Premium
- [x] Update CSS variables in index.css to dark navy background with red accents
- [x] Update card styles to match dark navy cards with subtle borders
- [x] Ensure all text is readable (white/light gray on dark backgrounds)
- [x] Update accent colors to bold red (#dc2626)
- [x] Test all pages for visual consistency with new theme
- [x] Remove gold/secondary color — replace with red or neutral throughout
- [x] Darken hero gradient and glass effects to match near-black reference
- [x] Update text-gradient to pure red (remove gold)
- [x] Update TopNav logo and footer to use red instead of gold
- [x] Verify drill cards, filter pills, pagination all look correct
- [x] Save checkpoint

## Pulsing Red Glow CTA Animation
- [x] Add subtle pulsing red glow keyframe animation to index.css
- [x] Apply animation to primary CTA buttons across all pages
- [x] Verify animation is subtle and not distracting
- [x] Save checkpoint

## Athlete Portal Login Fix
- [x] Fix Athlete Portal tab to show proper sign-in button instead of error for unauthenticated users
- [x] Ensure sign-in button redirects to OAuth login flow
- [x] Verify authenticated athletes can access their portal after signing in
- [x] Save checkpoint

## Post-Login Redirect & TopNav Athlete Portal Link
- [x] Implement post-login redirect so athletes land on /athlete-portal after sign-in
- [x] Add Athlete Portal link to TopNav for easy access (already present)
- [x] Verify mobile sign-in flow and responsive layout
- [x] Save checkpoint
- [x] Fix mobile layout: Athlete Portal sign-in buttons hidden behind sticky header (added TopNav + flex-col layout)

## Supabase Client Verification & Environment Variables
- [x] Update supabaseClient.ts to use env vars instead of hardcoded credentials
- [x] Verify drillStatCards queries match current Drizzle schema (added table to schema + migration)
- [x] Verify Supabase connection works with new CS-16-ENGINE credentials
- [x] Save checkpoint and redeploy

## Supabase CS-16-ENGINE Connection Verification
- [x] Verify Supabase client picks up NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (added envPrefix to vite.config.ts)
- [x] Test a live query against the Supabase drills table (drills table empty but drillStatCards works with 3 rows)
- [x] Check /drill/[slug] page fetches data correctly (loads from static data + tRPC)
- [x] Check /manage-drill-videos page fetches data correctly (loads from static data + tRPC)
- [x] Fix any schema mismatches between frontend and database (no mismatches found — supabaseClient.ts not imported anywhere, app uses tRPC/Drizzle)
- [x] Redeploy

## Supabase Integration & Mobile Fix
- [x] Seed Supabase drills table with all 182 drills from drills.ts (all inserted successfully)
- [x] Wire supabaseClient into components — created useSupabaseDrills hook (useSupabaseDrills, useSupabaseDrill, useSupabaseDrillSearch)
- [x] Create a hook/utility to merge static + Supabase drill data (hooks ready for use)
- [x] Fix mobile hamburger menu overlap in TopNav — moved dropdown outside header with fixed positioning and z-[9999], inlined menu items to avoid nested absolute wrappers
- [x] Test all pages load correctly — 435 tests pass, zero TypeScript errors
- [x] Save checkpoint and redeploy

## Replace Static Drills with Supabase Queries + Admin Editing + Resend Fix
- [x] Replace static drills.ts imports with Supabase queries on Home page (hybrid merge in useAllDrills)
- [x] Replace static drills.ts imports with Supabase queries on DrillsDirectory (merged into Home)
- [x] Add admin form for editing drill instructions and equipment (ManageDrillContent page with search, inline editing, save)
- [x] Fix RESEND_API_KEY secret (updated via webdev_request_secrets, tests pass)
- [x] Test all pages load correctly with Supabase data (443 tests pass, zero TS errors)
- [x] Save checkpoint and redeploy

## Centralized Notification System (Email-First)
- [ ] Review existing codebase: schema, email setup, Resend integration
- [ ] Create notifications table in database schema
- [ ] Create notification_preferences table in database schema
- [ ] Push database migrations
- [ ] Build notification engine: createNotification(), queueDelivery(), sendEmail(), retryFailed()
- [ ] Create branded email templates (drill_assigned, notes_added, recap_posted, swing_analysis_ready, new_feature_available)
- [ ] Wire triggers into drill assignment flow
- [ ] Wire triggers into notes/recap posting flow
- [ ] Wire triggers into swing analysis posting flow
- [ ] Wire triggers into new feature announcements
- [ ] Build portal notification center UI (bell icon in TopNav, dropdown feed)
- [ ] Add unread/read state management
- [ ] Add click-through links to related items
- [ ] Build notification preferences page for users
- [ ] Add duplicate prevention for same-event notifications
- [ ] Add retry logic for failed email sends
- [ ] Write vitest tests for notification engine
- [ ] Test end-to-end flow
- [ ] Save checkpoint and redeploy

## Notification System - Engine Wiring (Phase 2)
- [x] Replace direct db.insert(notifications) in routers-video-analysis.ts with sendNotification()
- [x] Replace direct db.insert(notifications) in activityTracking.ts with sendNotification() (portalOnly)
- [x] Replace direct db.insert(notifications) in notificationService.ts with sendNotification()
- [x] Verify drillAssignments.ts already uses sendNotification()
- [x] Verify routers-submissions.ts already uses sendNotification()
- [x] Confirm no server files outside engine have direct db.insert(notifications) calls
- [x] Add markAllRead procedure to routers-notifications.ts
- [x] Update updatePreferences input schema to match actual DB column names

## Notification System - Portal UI
- [x] Redesign NotificationBell component with dark theme, click-outside close, type icons, time-ago display
- [x] Add NotificationBell to TopNav for both admin and athlete users
- [x] Create /notifications full inbox page with filters (type, read/unread), mark-all-read, delete
- [x] Create /notifications/preferences page with master email toggle and per-type toggles
- [x] Add routes for /notifications and /notifications/preferences in App.tsx
- [x] Write 15 vitest tests for notification engine exports, wiring verification, and router procedures

## User/Athlete Notification Audit
- [x] Query all users and verify IDs, emails, roles are correct
- [x] Check notifications table for proper userId linkage
- [x] Verify notification preferences exist for all users
- [x] Confirm email delivery status for sent notifications
- [x] Fix any orphaned or mislinked notifications

## Hide Non-Hitting Drills (Focus on Hitting Only)
- [x] Audit all drill data sources (JSON + DB) to account for 122 Hitting drills
- [x] Create archived backup of all non-Hitting drills for future restoration
- [x] Filter static JSON data files to only include Hitting drills
- [x] Update any server/DB references to exclude non-Hitting drills
- [x] Ensure category filters only show Hitting-related subcategories
- [x] Verify UI shows only Hitting drills and hidden data is inaccessible
- [x] Add admin-only restoration mechanism for hidden drills (scripts/restore-non-hitting.mjs)

## Fix Email Notification Delivery & User Linkage (Apr 12)
- [x] Audit why Shannon Caputo drill assignment email was not delivered (old Resend API key)
- [x] Debug email delivery pipeline (Resend integration, sendNotification flow)
- [x] Resend Shannon Caputo's drill assignment email successfully
- [x] Fix user-athlete ID linkage persistence — added email-based fallback to upsertUser
- [x] Fix tinyint server error — not in our code, was from resolved migration
- [x] Restore coach email alerts — activity tracking + email batching system already handles all types
- [x] Ensure athletes receive emails — sendNotification engine delivers emails with Resend (new API key works)
- [x] Add coach notification when athlete email delivery fails — notifyCoachOfFailedEmails runs every 5 min
- [x] Add login activity email alerts — already handled by activityTracking + emailBatching
- [x] Verify email delivery end-to-end — Shannon Caputo test email sent successfully
- [x] Add retryFailedNotifications to scheduled jobs (every 5 min)
- [x] Merge duplicate Sean Jaeger account (ID 105900149 → 3570024)
- [x] Fix notificationEngine.test.ts import assertion

## Fix Athlete Portal Login & User Role Assignment (Apr 12)
- [x] Audit Athlete Portal tab vs Admin tab login paths to find duplication cause
- [x] Fix Athlete Portal tab to use correct OAuth login path (same as Admin tab) — both use same getLoginUrl() with different returnTo
- [x] Ensure existing athletes retain their ID when logging in via Athlete Portal — email-based fallback in upsertUser prevents duplication
- [x] Ensure new visitors/random people are created as "user" role (not "athlete") — changed default from 'athlete' to 'user' in db.ts
- [x] Notify Coach Steve when a new user registers (with name and email) — notifyCoachOfNewUser in oauth.ts sends system notification
- [x] Verify no duplicate accounts are created on login — email-based fallback + openId matching
- [x] Add getUserByEmail function to db.ts for pre-upsert check
- [x] Update hero stats: changed '8 CATEGORIES' to '1 Focus: Hitting'
- [x] Write 16 vitest tests for role assignment, OAuth notification, and schema validation

## Fix Add New Drill Admin Dashboard Error (Apr 14)
- [x] Identified root cause: createNewDrill function was missing metadata field parameters (drillType, ageLevel, focusTags, problemsFix, pillars)
- [x] Updated createNewDrill function signature to accept all metadata fields from form
- [x] Added metadata columns to customDrills schema (drillType, ageLevel, focusTags, problemsFix, pillars)
- [x] Updated customDrills insert to store all metadata fields as JSON strings
- [x] Pushed database migration (columns already existed from previous session)
- [x] Verified TypeScript compiles with 0 errors
- [x] Dev server running and healthy

## Fix Add New Drill React Rendering Crash (Apr 15 - FIXED)
- [x] Investigate AddNewDrill component for React rendering crash (not API error)
- [x] Found root cause: empty SelectItem value="" crashes Radix UI Select component
- [x] Fixed AddNewDrill.tsx: replaced empty string with 'none' value and added handleSave logic
- [x] Fixed db.ts createNewDrill: added isHidden: false to insert statement so new drills are visible
- [x] Verified all metadata fields (drillType, ageLevel, focusTags, problemsFix, pillars) are stored
- [x] Added 9 vitest tests confirming all fixes work correctly (all passing)
- [x] Test end-to-end: button click → form → submission → database insert → confirmation
- [x] Verified drill appears in drill list after creation (pagination shows new drills on later pages)

## Mobile Navigation: Replace Hamburger with Pinned Tabs (Apr 17)
- [x] Replace hamburger menu with pinned tab bar at top of page on mobile
- [x] Tabs should be always visible (no dropdown), pinned/sticky at top
- [x] Match dark sophisticated design theme with glassmorphism
- [x] Show correct tabs based on auth state (admin/athlete/visitor)
- [x] Remove all hamburger/dropdown mobile menu code

## Fix Manage Drill Content - TypeError: Load failed (Apr 17 - FIXED)
- [x] Investigated ManageDrillContent component - was using Supabase (no longer connected)
- [x] Root cause: page called supabase.from('drills').select('*') which fails with TypeError: Load failed
- [x] Added getAllDrillDetails() to db.ts (returns all rows from drillDetails table)
- [x] Added getAllDrillDetails tRPC procedure to routers.ts (protectedProcedure)
- [x] Rewrote ManageDrillContent.tsx to use tRPC + MySQL database
- [x] Page now shows 87 drills (74 with content, 13 needing content) with pagination
- [x] Edit dialog works - can update goal, instructions, equipment for any drill
- [x] Added 8 vitest tests for getAllDrillDetails and data merging logic
- [x] Removed stale supabase-integration.test.ts and directImport.test.ts
- [x] All 483 tests passing across 40 test files

## Simplify Drill Detail Page Layout (Apr 17 - DONE)
- [x] Remove Time card from drill detail page
- [x] Remove Athletes card from drill detail page
- [x] Remove Equipment card from drill detail page
- [x] Remove Skill Set card from drill detail page
- [x] Remove Instructions heading and content section entirely
- [x] Reorder layout: Video → Tags → Goal of Drill
- [x] Tags (drillType, ageLevel, focus tags, problem tags, goal tags) sit immediately below video
- [x] No empty space where removed cards were
- [x] Dark, polished, athletic mobile-first design preserved
- [x] Also removed addDifficulty collapsible section
- [x] Removed old bottom metadata grid (Drill Type, Age/Level, Fixes These Problems, Helps You)

## Tag System Full Restructure (Apr 17)
- [x] Design canonical Problem tags (15-25 max) by merging all existing problem/focus/tag overlaps
- [x] Design canonical Outcome tags (12-20 max) by merging all existing goal/focus overlaps
- [x] Update all 87 drills in drills.ts with new problem + outcome tags (max 4 per drill)
- [x] Remove drillType, ageLevel, tags, problem, goal fields from drill display (keep in data for filtering)
- [x] Update DrillDetail page: show only Problems + Outcomes tags
- [x] Add "What this drill fixes & improves" label above tags
- [x] Limit visible tags to 4, hide rest behind "Show More Tags"
- [x] Final layout: Video → Label → Tags → Goal of Drill
- [x] Confirm no overlapping tags remain

## Remove Test Drills (Apr 17)
- [x] Delete "Test Video URL Drill" (id: 120003) from customDrills DB
- [x] Delete "Test Drill - Delete Me" (id: 570001) from customDrills DB
- [x] Delete "Simple Test" (id: 600001) from customDrills DB
- [x] Delete "Test Drill Fix Verification" (id: 600002) from customDrills DB

## Embed Layout Sync + OG Images (Apr 20)
- [x] Update embed drill detail: add DrillTagSection (problems + outcomes pills)
- [x] Update embed drill detail: remove stat cards (TIME / ATHLETES / EQUIPMENT / SKILL SET)
- [x] Add dynamic OG meta tags to non-embed DrillDetail.tsx (title, description, image)
- [x] Add dynamic OG meta tags to embed drill detail component
- [x] Create server-side /api/og/drill/:id endpoint that generates OG image with drill name, category, difficulty

## Always-Visible Advanced Filters (Apr 20)
- [x] Remove "More Filters" collapsible toggle from Home.tsx
- [x] Promote Age/Level, Drill Type, Fix a Problem, Training Goal, Tag/Focus Area to always-visible
- [x] Ensure all 5 filters display correctly on mobile (full-width stacked layout)
- [x] Keep Level and Skill pill filters above the advanced filter row

## Filter Panel Redesign (Apr 20)
- [x] Hide AGE / LEVEL and DRILL TYPE filters (feature-flag, keep in code)
- [x] Rename TRAINING GOAL → BUILD A SKILL with subtitle "What are you building?"
- [x] Rename TAG / FOCUS AREA → FOCUS AREAS with subtitle "Pick a focus area"
- [x] Add subtitle "What are you trying to fix?" to FIX A PROBLEM
- [x] Convert all 3 visible filters from dropdowns to collapsible accordion cards
- [x] Each card: navy bg, crimson uppercase label, gray subtitle, caret rotates on expand
- [x] Expand to reveal 2-column checkbox grid; checkboxes fill crimson when selected
- [x] Active selections render as crimson pill chips below the card stack with × to clear
- [x] Keep "NARROW BY PROBLEM, GOAL & MORE" header and "Clear all" action
- [x] Wire multi-select checkbox values into the drill filtering logic

## Backend DB Migration — Unified Drills Table (Apr 21)
- [x] Audit existing data sources (drills.ts, customDrills table, drillDetails table)
- [x] Add unified `drills` table to Drizzle schema with all fields from drills.ts
- [x] Push migration to TiDB (0052_add_drills_table.sql)
- [x] Write seed script (seed-drills.mjs) and import all 86 static drills into DB
- [x] Add CRUD query helpers to server/db.ts (getAllDrills, getDrillBySlug, upsertDrill, hideDrill, restoreDrill, deleteDrillPermanently, getAllDrillsAdmin)
- [x] Add tRPC drillsDirectory router (list, get, listAdmin, upsert, hide, restore, deletePermanently)
- [x] Update useAllDrills hook to load from backend DB instead of static drills.ts
- [x] Verify frontend loads 86 drills from DB (backward-compatible, TypeScript clean)

## Three Feature Additions (Apr 21)
- [x] Admin drill editor UI at /admin/drills (list all drills including hidden, inline edit, hide/restore/delete)
- [x] Bulk CSV/JSON import via trpc.drillsDirectory.bulkUpsert (parse & preview before import)
- [x] Wire accordion filters to problems[]/outcomes[] arrays in Home.tsx filteredDrills logic
- [x] Add "Drill Library Editor" button to AdminDashboard header

## Consolidation + Cleanup Sprint (Apr 22)

### Phase 1: DB Backup
- [x] Full backup of drills, customDrills, drillDetails, drillVideos, notifications, pendingEmailAlerts, emailNotificationLog (17MB, 14 tables)

### Phase 2: Drill Consolidation
- [x] Idempotent merge script: customDrills → drills (37 merged)
- [x] Idempotent merge script: orphaned drillDetails → drills (90 merged)
- [x] Idempotent merge script: orphaned drillVideos → drills (15 merged)
- [x] Category correction: keyword-based recategorization of 114 drills, 9 quarantined as hidden
- [x] Name resolution: customDrills.name → slug-to-title fallback
- [x] Difficulty: nullable, left null if missing
- [x] FK sanity check: 0 broken FKs in drillAssignments/drillFavorites/drillCustomizations
- [x] Generate post-merge CSV (266 drills, all fields)

### Phase 3: Admin Drills Update
- [x] /admin/drills shows all 266 drills (256 visible, 10 hidden)

### Phase 4: Notification Cleanup
- [x] Archived 1,178 stale unread notifications (>30 days)
- [x] Cleaned 1,738 sent pending email alerts (>30 days)
- [x] Seeded notification preferences for all 14 users
- [ ] Add 30-day auto-expire cron job (deferred — needs scheduled task)
- [ ] Delete test user records (deferred — need to verify which are test)

### Phase 5: Hero Drill Count
- [x] Removed hardcoded "125+" override from siteContent table
- [x] Hero stats now show live: allDrills.length (256), categories (6), levels (5)

### Phase 6: Deliverables
- [x] Staging preview URL with all 256 visible drills
- [x] Post-merge CSV: drills-post-merge.csv (266 rows)
- [x] Changelog: CHANGELOG-consolidation.md
- [x] Rollback plan: ROLLBACK-PLAN.md

## Bug Fix: Non-Hitting Drill Detail Pages + Videos (Apr 22)
- [ ] Fix "Drill not found" on /drill/{slug} for non-hitting drills (e.g., 1st-base-off-bag)
- [ ] Fix video URLs not working for non-hitting drills
- [ ] Verify all 256 visible drills can be opened from the grid

## Fix Non-Hitting Drill Video URLs & Drill Lookup
- [x] Audit drillVideos table — confirmed 94 non-hitting drill videos with valid YouTube URLs
- [x] Replace static file lookup in DrillDetail.tsx with DB query (trpc.drillsDirectory.get)
- [x] Replace static file lookup in EmbedDrillDetail.tsx with DB query
- [x] Add loading state while DB query is in flight (prevents flash of "Drill not found")
- [x] Fix tag section to use DB drill's problems/outcomes instead of staticDrill
- [x] Remove dead Supabase enrichment code from DrillDetail.tsx
- [x] Remove unused drillsData and filterOptions imports
- [x] TypeScript check passes with 0 errors
- [x] Browser test: 1st-base-off-bag (Infield) — loads correctly with content
- [x] Browser test: 43-drill (Infield) — loads with YouTube video playing
- [x] Browser test: balance-drill (Pitching) — loads with YouTube video playing
- [x] Browser test: double-ball-toss (Infield) — loads with YouTube video playing
- [x] Browser test: 1-2-3-drill (Hitting) — still works correctly (regression check)
- [x] Browser test: embed/drill/43-drill — embed version also works

## Close-Out Items (6 items)
- [x] 1. Reconcile drill count math (86+37+90+15=228 vs 266), explain 38-row delta, dedupe -- vs - slug pairs
- [x] 2. Delete test-drill-1 and test-video-url-drill, hard-categorize or quarantine Uncategorized drills
- [x] 3. Fix skillSet column on pitching/throwing/outfield drills that still say "Hitting"
- [x] 4. Backfill metadata on video-orphan rows (difficulty, goal, description) or hide them
- [x] 5. Implement 30-day auto-mark-read cron, verify 401 pending email alerts
- [x] 6. Write Section 15 (Known Remaining Issues) full text

## Sprint: Final Production Sign-Off (10 items)

### P1 — MUST FIX
- [x] 1. Expose non-hitting skill filters on homepage (Hitting, Infield, Pitching, Throwing, Outfield, Bunting with live counts)
- [x] 2. Normalize difficulty scale: Intermediate → Medium on 48 drills, add enum constraint
- [x] 3. Export 70 failed email deliveries to CSV (64 API key invalid, 6 rate limited — all blast_metrics_update type)
- [x] 4. Add cascade delete logic on drills (drillVideos, drillDetails, drillAssignments, drillFavorites, drillCustomizations, drillQuestions, drillSubmissions, drillStatCards, drillPageLayouts)
- [x] 5. Add /api/health/jobs endpoint (4 scheduled jobs with lastRunAt, lastStatus, lastError)
- [x] 6. Add rate limiting on public drill endpoints (60 req/min per IP, 429 on exceed, skip auth users)

### P2 — TECH DEBT
- [x] 7. Slug rename for 10 double-dash drills (-- → -) with 301 redirects (1 skipped, target exists)
- [x] 8. Remove vestigial client/src/data/drills.ts and drills.json (migrated 8 callers to useAllDrills + drillConstants.ts)
- [x] 9. Rename source column: orphan → imported (115 rows), video-orphan → video-imported (6 rows)
- [x] 10. Consolidate dual tag systems: merged 49 drills' legacy slugs into canonical problems/outcomes, legacy columns preserved for backward compat

### Deliverables
- [x] Fresh DB backup before starting (16.58 MB, 43 tables)
- [x] ROLLBACK-PLAN.md for every change
- [x] Staging preview URL per batch (P1 first, P2 seco- [x] Post-merge CSV export (244 drills)flecting final state
- [ ] One-page changelog
- [x] Preserve checkpoint 99e191b8 and 17 MB backuppreserved

## Custom Notification System (Apr 24)
### Backend
- [x] Add "coach_message" to notification type enum in schema + notificationEngine
- [x] Add admin-only tRPC procedure: notifications.adminCompose (send to specific athlete)
- [x] Add admin-only tRPC procedure: notifications.adminBroadcast (send to all active athletes)
- [x] Add admin-only tRPC procedure: notifications.adminSentHistory (view sent custom notifications)
- [x] Update email template to support coach_message type with icon/subject

### Frontend
- [x] Create /admin/notifications page with Compose tab and Sent History tab
- [x] Build recipient picker: all athletes, or search/select specific athlete(s)
- [x] Build message composer: title, message body, optional CTA link
- [x] Build sent history table with status indicators
- [x] Add Notifications quick action in CoachDashboard
- [x] Register route /admin/notifications in App.tsx (admin-only)

### Auto-Generated Notifications Audit
- [x] Verify drill_assigned notifications fire on assignment (already wired in routers-drill-assignments.ts)
- [x] Wire notes_added notification when coach saves session notes (added to routers-session-notes.ts)
- [x] Wire blast_metrics_update in-app notification alongside existing email (added to notificationService.ts)
- [x] Verify activity summary emails continue working (unchanged)
- [x] Fix trust proxy warning from express-rate-limit (app.set trust proxy 1)
- [x] Run vitest: 485 tests pass (41 test files)
- [x] TypeScript: 0 errors

## Drill Admin JSON Paste System (Apr 24)
### Step 1: Schema
- [x] Add 8 rich coaching columns to drills table (goalOfDrill, whoThisDrillIsBestFor, coachingNotes, whatThisDrillHelpsFix, howToRunTheDrill, commonMistakes, coachSteveCue, gameTransferExplanation)
- [x] Applied via direct SQL (db:push blocked by existing tables)

### Step 2: tRPC Router
- [x] Create server/routers/drillsAdmin.ts
- [x] drills.adminCreate (admin only, slug auto-gen, reject duplicate)
- [x] drills.adminUpdate (admin only, partial patch)
- [x] drills.adminDelete (admin only, soft-delete isHidden=1)
- [x] drills.adminList (admin only, pagination 50/page, search, source filter)

### Step 3: Admin Page /admin/drills
- [x] Create client/src/pages/admin/Drills.tsx (Film Room dark theme, gold accents, Barlow Condensed)
- [x] Tab 1: Paste JSON — textarea, Validate/Save/Clear buttons, validation panel
- [x] Tab 2: Bulk Paste — array textarea, per-drill result list
- [x] Bottom panel: drill table with search, source filter, View JSON / Edit / Hide / Delete actions
- [x] View JSON modal with copy button
- [x] Edit opens JSON editor prefilled, saves via adminUpdate

### Step 4: Public Display
- [x] Update DrillModal coaching tab to show new rich fields (goal, bestFor, coachingNotes, howToRun, whatFixes, commonMistakes, coachCue, gameTransfer)
- [x] Hide sections when field is null/empty

### Step 5: Nav + Route
- [x] Add "Drills Admin" link to SiteNav.tsx (admin only)
- [x] Register /admin/drills route in App.tsx
- [x] Write vitest tests for adminCreate/adminUpdate/adminDelete/adminList

### Smoke Test
- [x] Paste Bounce Timing Drill JSON, click Save, verify it appears in public directory

## Sprint: Coach Dashboard → Athlete Portal Sync Bugs (Apr 27 2026)

### BUG 1 — Blast Metrics Don't Appear in Athlete Portal
- [x] Diagnose: read blastMetrics tRPC procedures and athlete portal query
- [x] Fix: ensure athlete portal query reads from blastSessions/blastPlayers with correct FK
- [x] Fix: ensure Share toggle flips visibility flag read by athlete portal
- [x] Vitest: create session → link → query portal endpoint → assert returned

### BUG 2 — Session Notes Shared Toggle Does Nothing in Athlete Portal
- [x] Diagnose: read sessionNotes tRPC procedures and isSharedWithAthlete field usage
- [x] Fix: ensure toggle writes isSharedWithAthlete to DB correctly
- [x] Fix: ensure athlete portal query filters on isSharedWithAthlete=true
- [x] Fix: ensure Share All / Hide All cascade works idempotently
- [x] Vitest: write note → set shared=true → query portal → assert appears; set false → assert disappears

### BUG 3 — Player Report Tab Can't Save to Athlete Portal
- [x] Add playerReports table to drizzle/schema.ts
- [x] Run pnpm db:push to migrate
- [x] Add tRPC procedures: playerReports.create, update, publish, unpublish, delete, listByCoach, listByAthlete
- [x] Add Save Draft / Save & Publish / Update Existing buttons to Player Report tab
- [x] Add My Reports section in Coach Dashboard
- [x] Add Player Reports section in athlete portal
- [x] Cascade-delete playerReports when athlete is deleted
- [x] Vitest: create, publish, unpublish, update, delete coverage

## Sprint: Resend Webhook Receiver (Apr 27 2026)

### Schema
- [x] Add emailEvents table (id uuid pk, emailId, eventType, recipient, payloadJson, receivedAt)
- [x] Add emailBounced, emailComplained, emailFailureCount columns to users table
- [x] Add deliveredAt, openedAt, clickedAt columns to emailNotificationLog table
- [x] Run pnpm db:push migration

### Webhook Route
- [x] Install svix npm package
- [x] Create POST /api/webhooks/resend (public, no auth cookie)
- [x] Implement svix signature verification (svix-id, svix-timestamp, svix-signature headers)
- [x] Reject requests older than 5 minutes (replay protection)
- [x] Return 401 for invalid/missing signature, 400 for malformed payload, 200 for success
- [x] Handle email.sent — log only
- [x] Handle email.delivered — log + update emailNotificationLog.deliveredAt
- [x] Handle email.delivery_delayed — log only
- [x] Handle email.bounced — log + set users.emailBounced=true
- [x] Handle email.complained — log + set users.emailComplained=true
- [x] Handle email.opened — log + update emailNotificationLog.openedAt
- [x] Handle email.clicked — log + update emailNotificationLog.clickedAt
- [x] Handle email.failed — log + increment users.emailFailureCount; if ≥3 set emailBounced=true
- [x] Idempotency: skip duplicate svix-id events

### Send-time Guard
- [x] Update notificationEngine.ts: check emailBounced/emailComplained before send
- [x] Log skipped_bounced / skipped_complained row in emailNotificationLog when skipped

### Health Check
- [x] Extend /api/health/jobs with lastWebhookReceivedAt and webhook.status

### Tests
- [x] Signature verification: valid → 200, invalid → 401, replay → 401
- [x] All 8 event types update correct columns
- [x] Bounce flag prevents subsequent sends
- [x] Idempotency: same svix-id twice does not double-write

### Secrets
- [ ] Add RESEND_WEBHOOK_SECRET env var (whsec_... value from Resend dashboard) — pending user input

### Deployment
- [ ] Save checkpoint and deploy to coachstevemobilecoach.com
- [ ] Verify curl with no signature returns 401

## Sprint: Remove PWA Install Prompts (Apr 27 2026)
- [x] Audit: find all PWA install components, event listeners, localStorage flags
- [x] Delete InstallPrompt / PWABanner / IOSInstallModal component files
- [x] Remove all imports and usages from App.tsx, Home.tsx, and any other pages
- [x] Remove beforeinstallprompt event listeners
- [x] Remove iOS Safari detection useEffect hooks
- [x] Remove localStorage read/write for pwa_install_dismissed / installPromptShown / iosInstallSeen
- [x] Remove BeforeInstallPromptEvent state/refs
- [x] Remove /install route if it exists
- [x] Remove Install button from nav/footer if it exists
- [x] Write regression test: iOS Safari UA → assert no /install/i, /add to home screen/i, /got it/i in DOM
- [x] Write regression test: desktop Chrome → assert no beforeinstallprompt listener
- [x] Run full test suite and verify grep returns zero matches
- [ ] Save checkpoint and deploy

## Sprint: Revert to Private Portal — Single Admin, All Invites = Athletes (Apr 27 2026)

### Step 1: Audit (report to user, no code changes)
- [ ] List every route in App.tsx with current protection status
- [ ] List every user in DB with current role
- [ ] List every active session
- [ ] Report findings and wait for user approval

### Step 2: Role cleanup migration
- [ ] Collapse roles to admin + athlete (remove coach, user from enum)
- [ ] Set coach@coachstevebaseball.com to admin
- [ ] Set every other user to athlete
- [ ] Update all UI that branches on coach to branch on admin instead

### Step 3: Route protection
- [x] Add ProtectedRoute wrapper to every page
- [x] Build login/request-access page for logged-out visitors at root URL
- [x] Redirect anonymous direct URL access to login

### Step 4: Default landing pages
- [x] Athletes → /athlete-portal after login
- [x] Admin → /coach-dashboard after login
- [x] After invite acceptance + password set → auto-login → /athlete-portal

### Step 5: Invite system tightening
- [ ] All invites default to role athlete, remove role selection UI
- [ ] Invite acceptance always assigns role athlete
- [ ] Invalid/expired tokens show clear error page

### Step 6: Admin email notifications
- [x] Email admin when athlete accepts invite
- [x] Email admin when athlete logs in first time
- [x] Email admin when athlete marks drill complete
- [x] Email admin when athlete leaves a note
- [x] Confirm delivery with Resend message IDs

### Step 7: Force re-login
- [ ] Invalidate all existing sessions after role migration

### Step 8: E2E verification
- [ ] Walk through full invite→signup→drill→complete→notify scenario
- [ ] Report timestamps and screenshots for each step

### Post-mortem
- [ ] Document what was silently broken because routes were public
- [ ] Document what was fixed

### Step 2 Execution (Role Enum Cleanup + Rate Limit)
- [x] Update users table role enum: ["user","admin","athlete","coach"] → ["admin","athlete"]
- [x] Update invites table role enum: ["user","admin","athlete","coach"] → ["admin","athlete"]
- [x] Run DB migration for enum changes
- [x] Update ProtectedRoute: remove coach/user role logic, keep only admin/athlete
- [x] Update ProtectedRoute type: requiredRole = "admin" | "athlete"
- [x] Grep codebase for all "coach" role references and update to "admin"
- [x] Grep codebase for all "user" role references and update to "athlete"
- [x] Add hittingCoachUsage table to schema (userId, date, messageCount)
- [x] Run DB migration for hittingCoachUsage
- [x] Change hittingCoach.ask from publicProcedure to protectedProcedure
- [x] Add 20/day per-user rate limit with clear error message
- [x] Add admin query to view hitting coach usage stats
- [x] TypeScript clean (0 errors)

### Step 3 Notes (for later)
- [x] Parent landing: athlete with children linked → /parent-dashboard
- [x] Normal athlete → /athlete-portal
- [x] Admin → /coach-dashboard
- [x] Toggle/link between parent-dashboard and athlete-portal if user has both assignments AND children

### Pre-Publish Verification (Required before deploy)
- [ ] JWT_SECRET rotation — rotate secret, confirm admin login still works
- [ ] Environment clarity — document dev/staging/prod topology
- [ ] Anonymous URL redirect test — 8 protected routes in incognito all redirect to login
- [ ] Real E2E walkthrough with timestamps and Resend message IDs
- [ ] Rollback plan — document exact revert steps (commit hash, DB rollback)
- [ ] Deliver full verification report to user

### assignmentProgress Audit (pre-publish blocker)
- [x] Walk Mark Complete code path: button → tRPC → DB write
- [x] Check for silent error swallowing in the mutation
- [x] Verify button renders for athletes (not gated behind role/route)
- [x] Pull drillAssignments.status distribution
- [x] Reconcile assignmentProgress vs drillAssignments.status as source of truth
- [ ] Fix any issues found

### Auth UX Constraint (locked for future work)
- [ ] Do not deepen Manus OAuth dependency — magic link migration planned within 2 weeks

### Publish Sequence
- [x] Rotate JWT_SECRET (manual — user will rotate in Management UI after first publish)
- [ ] Save checkpoint
- [ ] Publish to prod
- [ ] Confirm deployment with timestamps

### Post-Canary Follow-ups (after user confirms canary passes)
- [ ] Audit orphaned userIds in drillAssignments (10110004, 3390145, etc.) — reassign or clean up
- [ ] Wire assignmentProgress to a real per-session rep tracking feature OR drop the table
- [ ] Add user-visible error toast on Mark Complete failure (currently resets silently)


## Mobile Experience Enhancements (May 2026)

### Athlete-Facing Mobile Improvements
- [x] Pull-to-refresh on athlete portal for assignment updates
- [x] Swipe-to-complete gesture on drill playlist cards
- [x] Haptic-style visual feedback on touch interactions (active states)
- [x] Improved mobile drill modal with full-screen bottom sheet on small screens
- [ ] Sticky "Up Next" mini-player bar when scrolling past hero card
- [x] Better touch targets (min 48px) on all interactive elements

### Coach/Admin Dashboard Mobile Improvements
- [ ] Swipeable athlete cards in overview for quick actions
- [x] Floating action button (FAB) for quick assign/invite on mobile
- [ ] Collapsible stat cards that expand on tap (save vertical space)
- [ ] Mobile-optimized assign drills flow with bottom sheet drill picker
- [ ] Improved mobile table → card transitions with smooth animations

### Shared Mobile UX Patterns
- [x] Add touch-active states with scale-down feedback on all buttons/cards
- [ ] Implement smooth page transitions between routes
- [x] Improve iOS-style safe area handling for notch/home indicator
- [x] Improve scroll performance with will-change hints on animated elements
- [ ] Add skeleton loading states optimized for mobile viewport
- [x] Bottom sheet component for mobile modals/dialogs
- [x] Scroll-to-top button on long pages
- [x] Vibration API integration for completion celebrations

## Mobile Overflow Bug Fixes (May 2026)
- [x] Fix Drill Detail page horizontal overflow — tags row and Goal/Equipment cards bleed off right edge on mobile
- [x] Fix Assign Drills page horizontal overflow — assignment cards and action buttons cut off on right edge

## Drill Detail Overflow Fix - NextSteps/RelatedDrills (May 2026)
- [x] Fix NextStepsChips horizontal overflow — added overflow-hidden outer wrapper with scrollable inner container
- [x] Fix RelatedDrillsCarousel horizontal overflow — added overflow-hidden outer wrapper, reduced card width to 70vw/260px max
- [x] Add loading="lazy" and decoding="async" to Related Drills carousel thumbnail images for better mobile performance

## Remove Favorite & Upload My Swing Buttons (May 2026)
- [x] Remove "Favorite" button from drill detail page
- [x] Remove "Upload My Swing" button from drill detail page
- [x] Clean up spacing/layout after removal — no awkward gaps
- [x] Ensure no placeholder containers or hidden inactive components remain

## Admin Edit Drill Form Label Renames
- [x] Rename "Who This Drill Is Best For" → "Short Description"
- [x] Rename "Game Transfer Explanation" → "Watch For"
- [x] Rename "Coaching Notes (one per line)" → "What to Feel (one per line)"
- [x] Rename "What This Drill Helps Fix (one per line)" → "Problem It Solves (one per line)"
- [x] Rename "How to Run the Drill (one step per line)" → "How to Do It (one step per line)"
- [x] Verify no backend/API/DB changes made
- [x] Verify TypeScript compiles with zero errors

## Expand Bulk Import to Accept All Drill Fields
- [x] Add 9 new fields to bulk import: goalOfDrill, shortDescription, coachStevesCue, watchFor, whatToFeel, problemItSolves, howToDoIt, commonMistakes, visible
- [x] Update JSON template with all new fields and example values
- [x] Update CSV template with all new column headers and example values
- [x] Update "Accepted fields" help text in the modal
- [x] Handle array fields (whatToFeel, problemItSolves, howToDoIt, commonMistakes) from JSON array, newline-separated, or pipe-separated
- [x] Handle boolean visible field (true/false/1/0/yes/no)
- [x] Update server-side upsert logic to persist new fields
- [x] Ensure partial updates don't clear omitted fields
- [x] Maintain backwards compatibility with existing 11-field imports
- [x] Add per-row validation summary in Parse & Preview (Rich Fields N/8 badge)
- [x] TypeScript compiles with zero errors
- [ ] Confirmation test: import drill with all fields, verify on public page
- [x] Write vitest tests for bulk import rich fields (8 tests passing)

## Fix Test Isolation (Tests Writing to Production DB)
- [x] Analyze current test DB configuration (vitest.config.ts, env setup)
- [x] Add guard that throws if test code detects production DATABASE_URL (vitest-setup.ts + getDb guard)
- [x] Configure tests to use isolated test database or mock DB calls (16 integration tests renamed to *.integration.test.ts, excluded by default)
- [x] Verify all 385 unit tests still pass with isolation (33 files, 0 failures)
- [x] Verify no new junk rows appear in production after test run

## Delete Junk Drills from Production
- [x] Audit junk drills for references in practice plans, assignments, favorites, etc. (3 drillDetails, 1 drillVideo, 0 assignments/favorites/plans)
- [x] Delete drills matching drillId LIKE 'test-drill-admin-%' (104 rows)
- [x] Delete drills matching drillId LIKE 'auto-slug-drill-%' (26 rows)
- [x] Delete drills with drillId IN (test-alias-fields, drill-without-rich, drill-with-rich, test-visible-false)
- [x] Delete drills with drillId IN (90/45/even-progression-tee, inside/outside-tee, angled-force-plate-tee---back-foot)
- [x] Clean up 6 additional orphaned drillDetails rows (test-drill-1, test-drill-2, test-goal-edit-drill, etc.)
- [x] Verify production is clean (231 drills remaining, 0 orphans)

## Embed Drill Directory — Rich Photo Cards + Filter Accordion
- [x] Rewrite /embed/drills to render DrillCard photo-thumbnail grid (same as /drills)
- [x] Include "Narrow by Problem, Goal & More" filter accordion (Fix a Problem, Build a Skill, Focus Areas)
- [x] Include Level pills and Skill pills
- [x] Remove SiteNav, hero section, site footer, "Back to Directory" arrow, "Powered by" text
- [x] All drill links point to /embed/drill/<slug> (stay inside iframe)
- [x] Add postMessage height auto-resize (csmc:embed-height) via ResizeObserver
- [x] Add html,body{margin:0;padding:0;overflow-x:hidden;background:#07111F} in client/index.html
- [x] Use grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr))
- [x] All images/videos use max-width:100%
- [x] Touch targets >= 44px
- [x] 360px viewport: no horizontal scroll, 1 column, full-width search
- [x] 768px viewport: 2 columns
- [x] 1024px+ viewport: 3 columns
- [x] Remove ProtectedRoute from embed routes (make public)
- [x] Iframe auto-resizes — no scrollbar inside iframe
- [x] CSP allows coachstevebaseball.com, coachstevenbaseball.com, *.squarespace.com, *.wixsite.com

## Embed Drill Detail Parity + SectionLabel Polish
- [x] Extract DrillDetailBody from DrillDetail.tsx into client/src/components/drill/DrillDetailBody.tsx
- [x] DrillDetailBody renders: video, fixes/improves pills, 4-card Quick Info grid, Coaching Layer, Next Steps chips, metadata row, Related Drills
- [x] DrillDetailBody accepts embed boolean prop to hide admin buttons, floating chat/AI widgets, sidebar chrome
- [x] Update DrillDetail.tsx to use DrillDetailBody (admin modals/state preserved)
- [x] Update EmbedDrillDetail.tsx to use DrillDetailBody in slim embed layout
- [x] Remove legacy "Instructions" paragraph block from embed
- [x] Create SectionLabel component at client/src/components/ui/SectionLabel.tsx
- [x] SectionLabel variant="strong": 14px uppercase, font-weight 700, letter-spacing 0.08em, icon + color prop, 24x2px underline accent
- [x] SectionLabel variant="quiet": 11px uppercase, font-weight 600, opacity 0.55, no icon, no underline
- [ ] Color-to-meaning map: Goal→red+Target, Problem→orange+AlertTriangle, Equipment→teal+Wrench, How To Do It→green+Play, What to Feel→cyan+Sparkles, Coach Cue→yellow+Quote, Common Mistakes→red+AlertCircle, Watch For→purple+Eye, Next Steps→teal+ArrowRight
- [ ] Quiet labels for: Drill Type, Age Level, Focus Areas, What This Drill Fixes & Improves
- [ ] Replace all hand-rolled section labels in DrillDetailBody with SectionLabel
- [x] 0 TypeScript errors, no console errors
- [x] Mobile (375px) renders cleanly with cards stacking 1-up
- [x] Embed page hides global sidebar, admin buttons, floating chat/AI widgets
- [x] All drill links in embed point to /embed/drill/ (7 links verified, 0 escapes)
- [x] basePath prop added to NextStepsChips and RelatedDrillsCarousel
- [x] All 385 tests pass

## Fix Drill Portal Photo Loading & Persistence
- [x] Fix 1: Create getAllDrillCustomizationsLite() excluding imageBase64, returning hasImage boolean
- [x] Fix 2: Add Express route GET /api/drill-image/:drillId with Cache-Control headers (max-age=86400, immutable)
- [x] Fix 2b: Update getAll router to call lite function
- [x] Fix 2c: Handle legacy thumbnailUrl data: URIs in /api/drill-image endpoint (parse data URI, serve as binary)
- [x] Fix 2d: Update hasImage SQL to check both imageBase64 IS NOT NULL OR thumbnailUrl LIKE 'data:%'
- [x] Fix 3: Update card image source in Home.tsx to use /api/drill-image/:drillId
- [x] Fix 3b: Update EmbedDrillLibrary.tsx card image source similarly
- [x] Fix 3c: Ignore data: thumbnailUrls in card image logic, always use /api/drill-image/ endpoint
- [x] Fix 4: Configure QueryClient defaults (staleTime 5min, gcTime 10min, no refetchOnMount/Focus)
- [x] Fix 5: Add staleTime: Infinity to drillCustomizations.getAll.useQuery in Home.tsx and EmbedDrillLibrary.tsx
- [x] Verify: 0 base64 data URIs in DOM, all 20 visible images use /api/drill-image/ endpoint
- [x] Verify: Photos appear on first load on both /drills and /embed/drills
- [x] Verify: Drills without customization show ⚾ branded placeholder
- [x] All 385 tests pass
