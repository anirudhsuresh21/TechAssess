# TechAssess — Manual Verification & Testing Checklist

This checklist provides step-by-step test instructions for evaluating TechAssess across candidate laptops, mobile devices, and administrator workstations.

---

## Pre-Requisites
1. Ensure the backend API is running (`npm run dev:api` on `http://localhost:4000`).
2. Ensure the Next.js web application is running (`npm run dev:web` on `http://localhost:3000`).
3. Seed sample data: `npm run seed`.

---

## Test Scenarios

### 1. Landing Page & Examination Code Validation
- [ ] Open `http://localhost:3000` in browser.
- [ ] Enter an invalid examination code (e.g., `INVALID_CODE`) and click **Begin Examination**.
  - **Expected:** Red error message appears: *"Invalid examination code. Please check and try again."*
- [ ] Click the quick-fill sample link `MCA_RECRUIT_2026` or type it manually.
  - **Expected:** System verifies the code and transitions to `/exam/MCA_RECRUIT_2026`.

---

### 2. Candidate Registration & Duplicate Attempt Protection
- [ ] Enter Full Name, Roll Number (`MCA2026-TEST`), Division (`A`), and Email (`candidate@example.edu`).
- [ ] Click **Proceed to Instructions & Check**.
  - **Expected:** Navigates to `/exam/MCA_RECRUIT_2026/instructions`.
- [ ] Attempt registering a second candidate with the exact same roll number and access code.
  - **Expected:** Server associates the candidate record without creating duplicate attempts.

---

### 3. Device Compatibility & Instructions Check
- [ ] Verify that Display Resolution, Browser Visibility API, and Server Network Ping show **Compatible** / **Supported**.
- [ ] Click **Enable Fullscreen**.
  - **Expected:** Browser enters native fullscreen mode.
- [ ] Try clicking **Start Timed Examination** without checking the agreement box.
  - **Expected:** Button remains disabled or warning indicates acceptance is required.
- [ ] Check the acceptance box and click **Start Timed Examination**.
  - **Expected:** Authoritative start time is recorded on server; navigates to `/exam/MCA_RECRUIT_2026/take`.

---

### 4. Examination Interface, Autosave & Navigation
- [ ] Verify that the Countdown Timer displays remaining time (e.g., ~45 minutes).
- [ ] Click through section tabs (Quantitative Aptitude, Computer Fundamentals, etc.).
  - **Expected:** Section navigation jumps directly to questions in that section.
- [ ] Select an answer option for Question 1.
  - **Expected:** Status indicator at top right shows `Saving...` then quickly updates to `Autosaved` (green check).
- [ ] In the right-hand **Question Palette**, verify that Question 1 turns **Green (Answered)**.
- [ ] Click **Mark for Review**.
  - **Expected:** Question 1 chip in palette turns **Purple (Marked for Review)**.
- [ ] Click **Clear Selection**.
  - **Expected:** Answer is cleared and autosaved. Palette chip returns to gray.
- [ ] Select a new option and click **Next Question**.

---

### 5. Browser Refresh & Session Recovery
- [ ] While answering Question 3, refresh the browser page (F5 or Ctrl+R).
  - **Expected:** The examination screen reloads smoothly without redirecting to registration or creating a duplicate attempt.
  - **Expected:** Previously selected answers for Question 1 and Question 2 are preserved.
  - **Expected:** The countdown timer continues accurately from the server's authoritative deadline.

---

### 6. Anti-Cheating & Focus Loss Warning
- [ ] Open a new browser tab or switch to another desktop application (e.g., Notepad).
- [ ] Wait 3 seconds, then switch back to the examination window.
  - **Expected:** Focus Loss warning modal appears: *"Focus loss warning 1 of 3. Switching tabs or exiting fullscreen is monitored."*
  - **Expected:** Click *"I Understand & Return to Examination"* to dismiss.
  - **Expected:** In the database / admin dashboard, the attempt's focus loss count increments to 1.

---

### 7. Final Submission & Score Confirmation
- [ ] Click **Finish Examination** at the top right.
  - **Expected:** Confirmation modal appears displaying summary of Answered, Unanswered, and Marked for Review questions.
- [ ] Click **Yes, Submit Final Answers**.
  - **Expected:** Evaluates answers server-side, triggers celebratory confetti, and displays submission confirmation.
  - **Expected:** Total marks, percentage, and pass/fail qualification status are displayed.
- [ ] Try navigating back to the exam take URL.
  - **Expected:** Submission is finalized; modifying answers is strictly blocked.

---

### 8. Administrator Console & Evaluation
- [ ] Navigate to `http://localhost:3000/login`.
- [ ] Click **Super Admin** demo account (`admin@techassess.local` / `Admin@123456`) and sign in.
- [ ] Open **Assessments** -> click **Results & Ranks** on `MCA_RECRUIT_2026`.
  - **Expected:** Candidates table displays ranks, scores, time taken, and integrity warning badges.
  - **Expected:** Recharts analytics display the Score Distribution histogram and Section-wise performance chart.
- [ ] Click **Inspect Attempt** on a candidate.
  - **Expected:** Itemized question-by-question breakdown opens showing candidate response, correct answer, and awarded marks.
  - **Expected:** Manual review adjustment allows recruiter to modify marks and comments.
- [ ] Click **Export CSV**.
  - **Expected:** Downloads `assessment_<id>_results.csv` containing full formatted rankings.

---

### 9. Candidate Shortlisting & Cutoffs
- [ ] Navigate to **Shortlist** tab.
- [ ] Set Minimum Score to `15` Marks and click **Apply Cutoff & Shortlist Candidates**.
  - **Expected:** Automatically updates shortlist status for all qualifying candidates.
- [ ] Click **Export Shortlist CSV**.
  - **Expected:** Downloads the official shortlist spreadsheet.
