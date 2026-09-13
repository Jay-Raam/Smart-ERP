---
name: professional-git-workflow
description: >-
  Standard operating procedure for realistic, professional developer Git workflows.
  Use when creating branches, staging changes, writing commit messages, structuring commit history
  into realistic development milestones, pushing mid-development progress, and conducting pre-push checks before pushing to GitHub.
---

# Professional Developer Git Workflow

This skill guides the agent to follow an authentic, industry-standard developer Git workflow when contributing code, managing branches, composing commit messages, structuring history into realistic development milestones, and pushing to remote repositories.

---

## 1. Branch Strategy & Naming Conventions

Always work on dedicated, descriptive branches created from the base branch (usually `main` or `develop`). Never commit directly to the default branch for feature work or non-trivial fixes.

### Branch Naming Patterns

Use clear, lowercase branch names with hyphens for separators:

| Type | Prefix | Example | Use Case |
| :--- | :--- | :--- | :--- |
| **Feature** | `feature/<name>` | `feature/financial-year-master` | New capability, UI module, or API endpoint |
| **Fix** | `fix/<name>` | `fix/datatable-status-filter-case` | Bug fix, regression fix, or UI layout correction |
| **Refactor** | `refactor/<name>` | `refactor/multi-tenant-bootstrap-scoping` | Code restructuring without behavioral changes |
| **Chore** | `chore/<name>` | `chore/update-dependencies-build-config` | Build scripts, tooling, configs, or CI updates |
| **Hotfix** | `hotfix/<name>` | `hotfix/auth-cookie-expiry-logout` | Critical, urgent production patch |

### Creating and Switching Branches
```bash
git checkout -b feature/<descriptive-name>
```

---

## 2. Commit Message Standards

Write commit messages exactly like an experienced, thoughtful software engineer.

### Fundamental Rules
1. **Never mention AI**: Do NOT reference AI, ChatGPT, Antigravity, LLM, automated generation, or prompts in commit messages or code comments.
2. **Concise & Imperative**: Use standard imperative mood (`Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Prevent`, `Handle`).
3. **Directly Describe the Change**: State what changed and why in plain, professional engineering terms.
4. **Natural Examples**:
   - `Add parent document validation`
   - `Fix admission form upload handling`
   - `Update API error handling`
   - `Refactor document validation logic`
   - `Handle missing parent details`
   - `Fix form state reset on navigation`
   - `Add financial year switcher and period status toggle`
   - `Normalize status filter value for case insensitivity`
   - `Scope customer and order bootstrap queries by active branch`

---

## 3. Realistic Milestone Commit History

A realistic development workflow naturally progresses through distinct phases rather than collapsing everything into a single monolithic commit. Break tasks into logical, genuine development milestones.

### Typical Milestone Progression

1. **Initial Implementation**:
   - Core schema, model definitions, initial interface / component layout.
   - Example: `Add financial year model and initial master view layout`
2. **Add Validation / Business Logic**:
   - Form validation, permissions, schema constraints, data sanitization.
   - Example: `Add financial year date range validation and status checks`
3. **Handle Edge Cases**:
   - Empty states, unseeded IDs, fallback resolvers, boundary conditions.
   - Example: `Handle empty branch data state and fallback resolver for stale IDs`
4. **Fix API / Error Handling**:
   - Catch blocks, graceful degradation, toast notifications, status responses.
   - Example: `Update bootstrap API error handling and status filter matching`
5. **Refactor / Clean Up**:
   - Code deduplication, typing cleanup, removing obsolete helpers.
   - Example: `Refactor table state hook to sync pagination with URL parameters`
6. **Final Testing & Polish**:
   - Verification fixes, styling adjustments, UI alignment.
   - Example: `Fix combobox active item highlight and refresh button spin state`

### Strict Integrity Guardrails
- **No Fabricated Commits**: Every commit must reflect genuine, actual code changes made during development.
- **No Timestamp Manipulation**: Never rewrite Git timestamps (`GIT_COMMITTER_DATE`, `GIT_AUTHOR_DATE`, `amend --date`) to make work look older or faster.
- **Organic History**: The commit log must accurately represent real software construction.

---

## 4. Mid-Development Pushes

Do not wait until an entire epic or feature is 100% complete before pushing. Push the branch to remote at legitimate engineering milestones:

- A working initial prototype or schema foundation.
- A completed sub-module (e.g., backend API routes verified before frontend UI).
- A significant bug fix or edge-case resolution.
- A functional validation layer.

When pushing incomplete or ongoing work, state the current scope clearly in the commit message:
```bash
git commit -m "Add financial year endpoints (WIP: frontend integration pending)"
git push -u origin feature/<branch-name>
```

Subsequent pushes to the same branch can simply use:
```bash
git push
```

---

## 5. Pre-Push Checklist

Execute these verification checks before every push to ensure repository cleanliness and stability:

1. **Review Changed Files**:
   ```bash
   git status
   git diff --stat
   ```
   Ensure only intended files are staged.
2. **Verify No Secrets or Build Artifacts**:
   - Check that `.env`, credentials, private keys, `node_modules`, `dist/`, `build/`, and temp scratch files are **NOT** staged.
   - Verify `.gitignore` catches any runtime dumps or diagnostic files.
3. **Verify Branch Name**:
   - Confirm you are on the intended `feature/`, `fix/`, or `refactor/` branch before running `git push`.
4. **Run Build & Type Checks**:
   - Client: `npm run build` (or `tsc -b && vite build`)
   - Server: `npm run build` (or `tsc`)
   - Ensure all linters, type checks, and tests pass cleanly without errors.
5. **Clear Commit Message**:
   - Double-check that the message is concise, informative, and free of automated/AI phrasing.

---

## 6. Merging & Final Delivery

When the feature branch is complete and verified:
1. Push all final commits to the remote branch.
2. Switch to base branch (`main`):
   ```bash
   git checkout main
   git pull origin main
   git merge feature/<name>
   git push origin main
   ```
   *(Or submit a Pull Request if working in a PR-based team workflow).*
3. Clean up the local branch after merge:
   ```bash
   git branch -d feature/<name>
   ```
