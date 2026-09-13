# Repository Operating Guidelines & Rules

## Git Workflow Standards

Whenever interacting with Git (creating branches, staging files, committing, pushing), always follow these professional developer conventions:

1. **Branching**:
   - Always create and work on dedicated branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`).
   - Use clear, kebab-case identifiers reflecting the task (e.g. `feature/financial-year-master`).

2. **Commit Messages**:
   - Write commit messages like a real developer: concise, direct, imperative (`Add ...`, `Fix ...`, `Update ...`, `Refactor ...`).
   - **Never mention AI, ChatGPT, automation, or LLM-generated code.**
   - Accurately describe the change made in that step.

3. **Realistic Commit Milestones**:
   - Structure multi-step work into natural developer milestones (Initial implementation -> Validation -> Edge cases -> Error handling -> Refactor/Cleanup -> Final verification).
   - Never manufacture fake commits or manipulate Git timestamps.

4. **Mid-Development Pushes**:
   - Push the branch to remote at meaningful milestones (e.g., core model/backend verified, validation layer completed) rather than delaying everything until the end.
   - If work is in progress, note it appropriately (e.g., `Add financial year endpoints (WIP)`).

5. **Pre-Push Review**:
   - Verify `git status` and `git diff --stat` before committing.
   - Never commit secrets, `.env` files, or build artifacts (`dist/`, `build/`, `*.log`).
   - Run type checks and build scripts (`npm run build`) before pushing.
