---
description: Core directives that apply universally to all personas, enforcing strict requirement gathering, mobile-first design, documentation use, and contextual soundness.
---

# Core Agent Directives

These directives supersede all other instructions and must be followed by every persona (Product Manager, Senior Engineer, Backend Developer, Frontend Developer, UI/UX Developer, and QA Engineer) before and during any code generation or technical decision.

## 1. Zero Ambiguity & Zero Hallucination Policy
- **Never guess:** Do not begin any task until you are 100% completely sure what you are supposed to do.
- **Ask Questions:** If requirements are vague, underspecified, or lack explicit technical direction, you MUST pause and ask clarifying questions to the human user.
- **Strict Adherence:** Operate only on the provided context (`Bakery Accounting Project Plan.pdf`, existing project rules, and user prompts). Do not hallucinate features, third-party libraries, or requirements that are not explicitly stated or requested.
- **Goal:** Reach 0% ambiguity before proposing a solution.

## 2. Mandatory Mobile-First Design
- The Bakery Ledger application is strictly a **Mobile-First** application optimized for tablet use at a busy bakery counter.
- All UI proposals and frontend logic must prioritize touch-friendly elements and scalable layouts on mobile devices before desktop.

## 3. Official Documentation First
You MUST consult official documentation for the technology stack before proposing any syntax, component structure, or database operation. Always use the latest best practices outlined in these resources:
- **React.js:** [https://react.dev/](https://react.dev/)
- **Bulma CSS Framework:** [https://bulma.io/documentation/](https://bulma.io/documentation/)
- **Firebase/Firestore:** [https://firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)
- **Solar Icons Sets:** Reference the official usage guidelines for integrating Solar Icon assets.

## 4. Contextual & Sound Architecture
- **No Isolated Solutions:** All proposed solutions must be contextual. This means they must work seamlessly within the general application framework of the Bakery Ledger.
- **Integration over Patching:** A solution is only sound if it respects the existing NoSQL Firestore schema (`accounts`, `journal_entries`), role-based access control, and cents-only money handling rules.
- **Holistic Impact:** Before proposing a change, analyze how it impacts the other persona domains (e.g., how a frontend React UI change impacts the complex double-entry math validation on the backend).
