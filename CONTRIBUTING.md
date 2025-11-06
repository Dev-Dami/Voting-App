# Contributing to Voting-App

Thanks for your interest in contributing! This repository is maintained for Yeshua School — the goal of this document is to make it easy for you to contribute in a way that keeps the project stable and easy to review.

## How to contribute

- Report bugs by opening an issue with a descriptive title, steps to reproduce, expected vs actual behavior, and any relevant logs or screenshots.
- Suggest features by creating an issue describing the use case and a short proposal.
- For code contributions, open a pull request (PR) targeting the `main` branch.

## Branching & PRs

- Create a new branch from `main` named with a short prefix, e.g. `fix/login-bug` or `feat/candidate-images`.
- Keep PRs focused and small. Prefer multiple small PRs over one large change.
- Include a clear description, list of changes, and any manual testing steps in the PR body.

## Code style & tests

- Follow existing project style (ESLint/Prettier if present). Keep formatting consistent.
- Add tests for bug fixes and new features where practical. Use a test database or mocks for DB operations.

## Running the app locally (quick)

1. Clone the repo and install dependencies:

```powershell
git clone <repo-url>
cd Voting-App
npm install
```

1. Create a `.env` in project root (see `readme.md` for recommended variables).

1. Start the app in development:

```powershell
npm run dev
```
 
If you are part of Yeshua School IT and need admin access, deploy keys, or urgent support, contact the maintainer listed in `readme.md` and include your role and requested access level.

## Review checklist (what maintainers look for)

- Tests (if applicable) for new logic or bug fixes
- No sensitive data checked into the repo
- Clear commit messages and PR description
- Manual verification steps included when necessary

## Code of Conduct

Be respectful and constructive. If you’d like, we can add a formal `CODE_OF_CONDUCT.md`.

Thanks — contributions are welcome! If you prefer, open an issue first to discuss larger changes.
