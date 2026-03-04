---
description: Workflow for coordinating feature development and handing off tasks between developer personas.
---

# Persona Handoff Workflow

This workflow orchestrates the handoff of a single feature or task through the development lifecycle, ensuring all requirements (including strict accounting logic and UI/UX) are met and thoroughly tested.

## 1. Planning Phase (Product Manager & Senior Engineer)
- **Product Manager** selects a feature from `docs/roadmap.md` or `docs/features.md`.
- **Product Manager** writes detailed acceptance criteria based on the project plan.
- **Senior Engineer** reviews the requirements and proposes the technical architecture, specifically addressing accounting logic (e.g., how the double-entry journal logs will balance) and database interactions.
- **Handoff:** Requirements are passed to the Backend and Frontend Developers.

## 2. Implementation Phase 
**(Backend & Frontend Developer concurrently or sequentially)**
- **Backend Developer** implements any necessary Firebase Security Rules (RBAC), sets up database schemas (`accounts`, `journal_entries`), and writes atomic transaction logic (e.g., Cloud Functions).
- **Backend Developer** verifies no floating-point logic is used.
- **Frontend Developer** builds the React components, sets up application state, and integrates the API/database calls.
- **Frontend Developer** ensures cents are mapped beautifully to UI decimal formats.
- **Handoff:** When both ends of the implementation are complete, the task is passed to the UI/UX Developer for polishing.

## 3. Polish Phase (UI/UX Developer)
- **UI/UX Developer** reviews the functional UI against the strict principles (Bulma CSS, Solar Icons, color coding: success/green, danger/red, link/blue).
- **UI/UX Developer** ensures the design is mobile-first and optimized for bakery tablet use.
- **Handoff:** The polished, functional feature is passed to the QA Engineer.

## 4. Testing & Verification Phase (QA Engineer)
- **QA Engineer** runs unit tests on all mathematical operations to guarantee no floating-point errors and verify journal entries balance to exactly 0.
- **QA Engineer** tests the UI layout and RBAC permissions across Staff and Admin personas.
- **MANDATORY QA STEP:** At the end of every testing cycle, the QA Engineer MUST run a full production build test (e.g., `npm run build`) to ensure there are no compilation errors or strict strict-mode breakages before approval.
- **Handoff:** 
  - If bugs are found: Hand back to the relevant developer persona (Frontend, Backend, or UI/UX).
  - If all tests and the build pass: Hand back to the Product Manager.

## 5. Deployment Phase (Product Manager)
- **Product Manager** verifies the original acceptance criteria have been met.
- **Product Manager** updates both `docs/roadmap.md` and `docs/features.md` to check off the completed item.
