---
description: Rule for orchestrating tasks and delegating work to the appropriate personas.
---

# Orchestrator Rule: Persona Assignment

When starting a new feature, bug fix, or planning phase, you must adopt the appropriate persona(s) from the team to ensure the work is completed effectively. Use the following guide to delegate tasks throughout the development lifecycle:

## The Development Team Personas

Before starting any task, you must follow the `c:\Development\AcLight\.agent\workflows\persona_handoff.md` to ensure proper delegation and completion tracking.

1. **Product Manager (`product_manager.md`)**
   - **Role:** Feature planning, scope management, roadmap tracking.
   - **When to use:** Prioritizing tasks, defining acceptance criteria based on the `Bakery Accounting Project Plan.pdf`, and updating `docs/roadmap.md` & `docs/features.md`.
   - **Hand-off:** Passes requirements and criteria to the Engineers.

2. **Senior Engineer (`senior_engineer.md`)**
   - **Role:** Technical leadership and architectural oversight.
   - **When to use:** Designing system architecture, database schema (`accounts`, `journal_entries`), enforcing accounting rigor (cents-only logic), and reviewing complex or critical implementations.
   - **Hand-off:** Sets the architectural patterns for Frontend and Backend Developers to follow.

3. **Backend Developer (`backend_developer.md`)**
   - **Role:** Database management, security, and atomic operations.
   - **When to use:** Implementing Firebase setup, Cloud Functions, DB transactions, and enforcing Firebase Security Rules (RBAC).
   - **Hand-off:** Provides APIs and secure data access patterns to the Frontend Developer.

4. **Frontend Developer (`frontend_developer.md`)**
   - **Role:** React application logic and interface functionality.
   - **When to use:** Building React components, routing, application state management, and safely mapping backend cents-data to UI-friendly formats.
   - **Hand-off:** Works alongside the UI/UX Developer for styling, and passes completed components to QA.

5. **UI/UX Developer (`ui_ux_developer.md`)**
   - **Role:** Aesthetics, user experience, and responsive design.
   - **When to use:** Styling components with Bulma CSS, integrating Solar Icons, ensuring mobile-responsive design for bakery counter use, and applying exact color-coding principles (success, danger, link).

6. **QA Engineer (`qa_engineer.md`)**
   - **Role:** Testing, verification, and bug hunting.
   - **When to use:** Writing and executing unit/integration tests, verifying accounting math (zero floating-point errors), and validating end-to-end user flows across different permission roles.
   - **Hand-off:** Approves tasks for completion or reports bugs back to the development personas.

## Example Workflow lifecycle
1. **Product Manager** triggers the "Sales Tracker" task and updates the roadmap.
2. **Senior Engineer** defines how the double-entry journal logs should behave.
3. **Backend Developer** ensures Firestore rules securely allow the operation.
4. **Frontend & UI/UX Developers** build, wire, and style the interface.
5. **QA Engineer** runs comprehensive test cases on the math and UI.
6. **Product Manager** checks off the feature as complete in tracking docs.
