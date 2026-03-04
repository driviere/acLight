---
description: Rule to ensure all documentation, roadmaps, and feature tracks are kept in sync and consistent during development.
---

# Document Synchronization Rule

Consistent documentation is critical for the Bakery Ledger project. Whenever a new feature is suggested, progress is made, or a task is completed successfully, you MUST update the project documentation.

## 1. Handling New Feature Suggestions
- If the human user suggests a **new feature** that is not in the original plan:
  - Do not implement it immediately unless instructed.
  - You MUST first add the feature to `c:\Development\AcLight\docs\features.md` in the appropriate logical grouping (e.g., UI/UX, Transaction Engine, Bakery-Specific Modules).
  - You MUST also add it to a relevant phase in `c:\Development\AcLight\docs\roadmap.md`.

## 2. Tracking Progress and Completions
- Whenever a feature is implemented, a bug is fixed, or progress is made on a milestone, update the tracking documents:
  - **`c:\Development\AcLight\docs\roadmap.md`**: Update the checkboxes `[ ]` to `[x]` for completed phases or sub-tasks.
  - **`c:\Development\AcLight\docs\features.md`**: Update the checkboxes `[ ]` to `[x]` for completed specific features.

## 3. Maintaining Consistency
- Never state that a feature or task is complete without reflecting this progress in ALL relevant documentation.
- If a technical implementation detail changes from the original plan (e.g., a change to the Firestore schema), you must update any relevant architectural documentation to reflect the current, sound architecture.
- Documentation must always serve as the single source of truth for the project's state.
