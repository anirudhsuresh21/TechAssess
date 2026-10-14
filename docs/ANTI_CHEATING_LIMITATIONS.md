# TechAssess — Examination Integrity & Anti-Cheating Architecture

This document provides a realistic, transparent analysis of the anti-cheating mechanisms implemented in **TechAssess**, how integrity signals are evaluated, and the inherent technical limitations of web-browser-based monitoring.

---

## 1. Philosophical Principle: Signals vs. Proof

In web-based assessment systems, browser events like tab switching or window blur are **diagnostic signals**, not incontrovertible proof of academic dishonesty. 

TechAssess is explicitly architected to avoid false-positive penalization:
- Focus loss events trigger real-time candidate warnings to discourage off-task browsing.
- Repeated violations flag the attempt for **administrative review** rather than automatically disqualifying or scoring zero.
- Reviewers are provided with an auditable event timeline (timestamps and durations) so decisions are grounded in context.

---

## 2. Implemented Integrity Controls

### A. Focus & Visibility Monitoring
- **Page Visibility API (`document.visibilitychange`):** Detects when the candidate switches tabs or minimizes the examination window.
- **Window Focus/Blur Events (`window.onblur`, `window.onfocus`):** Detects when focus leaves the browser window (e.g. clicking on an external application).
- **Duration Tracking:** Each event records the exact duration (in milliseconds) spent away from the examination screen.
- **Configurable Warning Thresholds:** Administrators configure `maxFocusLossCount` per examination (default: 3). If this threshold is breached, the attempt is marked `integrityFlagged: true`.

### B. Display & Fullscreen Monitoring
- Candidate browser compatibility check prompts candidates to enter Fullscreen mode before beginning.
- Detects when fullscreen mode is exited and logs a `FULLSCREEN_EXIT` event.

### C. Server-Authoritative Timing & Answer Secrecy
- **Authoritative Server Deadline:** Deadlines are calculated on the backend (`startTime + durationMinutes * 60 * 1000`). Candidate device clocks are never trusted.
- **Answer Key Sanitization:** Correct answer markers (`isCorrect`), option explanations, and hidden test cases are completely stripped from candidate-facing API payloads before transmission.
- **Idempotent Scoring:** Final evaluations cannot be submitted or calculated twice, preventing race conditions or double-scoring exploits.

### D. Session Recovery Without Duplicate Attempts
- If a candidate's browser refreshes, laptop reboots, or internet briefly drops, the server recognizes the candidate's active attempt and restores all previously autosaved answers without allowing duplicate attempts.

---

## 3. Inherent Limitations of Standard Web Browsers

A standard web application running inside Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari has clear, unavoidable sandboxing boundaries:

1. **Secondary Physical Devices:**
   No browser-based script can detect if a student is consulting a smartphone, tablet, textbook, or secondary computer next to their laptop.
2. **System Shortcuts & OS Popups:**
   Operating systems (Windows, macOS, Linux) intercept certain global hotkeys (e.g., Windows Key, Alt+Tab, Cmd+Tab, Task Manager, Spotlight) before the browser DOM can capture or prevent them.
3. **Accidental Background Focus Loss:**
   System updates, antivirus notifications, Bluetooth device connections, or battery low popups can trigger an OS-level focus blur that was not candidate-initiated.
4. **Virtual Machines & Screen Shares:**
   Web applications cannot reliably detect if the browser is running inside a virtual machine or whether an external video capture card is connected.

---

## 4. Privacy & Ethical Boundaries

By default, TechAssess adheres strictly to student privacy and institutional trust:
- **No Webcam Video Collection:** Avoids storing gigabytes of biometric video streams that pose GDPR/privacy liabilities.
- **No Microphone Audio Recording:** Avoids accidental recording of private home or dorm conversations.
- **No Invasive Device Scraping:** Does not scan student files, running processes, or browsing histories.

---

## 5. High-Stakes Institutional Lockdown Recommendations

If an assessment requires full hardware lockdown (e.g., end-of-semester proctored exams), TechAssess can be deployed alongside:
- **Safe Exam Browser (SEB):** Open-source lockdown browser that turns any laptop into a secure workstation by disabling third-party applications, utility menus, and second monitors.
- **On-Site In-Person Proctors:** For tech club induction, physical proctoring in a college computer lab remains the most effective deterrent against external assistance.
