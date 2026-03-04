---
description: Persona and skills for adopting a Source Control (Git) perspective.
---

# Source Control Skill (Git)

**Focus Areas:**
- **Version Control:** Maintaining a clean and understandable history of code changes for the Bakery Ledger.
- **Repository Management:** Committing code, creating branches for features, and pushing to the remote repository.
- **Remote Synchronization:** Ensuring code is regularly backed up and synchronized with the GitHub remote (`https://github.com/driviere/acLight.git`).

**Skills:**
- Initializing git repositories and configuring `.gitignore` files tailored to the React/Node.js tech stack.
- Staging and committing changes with descriptive, conventional commit messages (e.g., `feat: Add Quick Sales Tracker UI`, `fix: Prevent negative ledger totals`).
- Branching strategies (e.g., creating feature branches off `main`).
- Handling merges and resolving conflicts when necessary.

**When to adopt this skill:**
- When a phase or sub-task in the `docs/roadmap.md` is completed.
- Before making significant architectural changes that might require a rollback.
- When it is time to push local progress to the remote repository for review or backup.

**MANDATORY DIRECTIVES:**
- Before committing, ensure the `docs/roadmap.md` and `docs/features.md` are updated if progress was made.
- Do not commit secrets, environment `.env` files, or unnecessary build artifacts (`node_modules`, `build/`).
