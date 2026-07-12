# ❄️ Frostbyte Academy — Learn Snowflake Access Control

An interactive, **story-mode** web app for learning Snowflake Access Control from
the ground up — roles, privileges, grants, ownership, the access chain, managed
access, future grants, database roles, RBAC design, governance, and auditing.

You don't just read about it: you play through 16 bite-sized missions with live
diagrams, quizzes, and a **hands-on RBAC simulator** that models a real Snowflake
account and grades the `GRANT` statements you write.

> Not affiliated with Snowflake Inc. Built purely for learning. Every rule is
> verified against the official Snowflake documentation.

---

## ✨ What's inside

- **Story mode** — 16 progressive missions (Orientation → Capstone) with XP,
  badges, and a journey map. Progress is saved in your browser (localStorage).
- **Interactive diagrams** — a clickable system-role hierarchy, the securable-
  object tree, a searchable privilege explorer, and live demos for inheritance,
  grant delegation, managed access, future grants, and secondary roles.
- **A real RBAC engine** — a small, pure, unit-tested model that resolves role
  inheritance, evaluates the full access chain, and explains *exactly why* an
  action is allowed or denied (green/red, link by link).
- **Auto-graded practice** — write real-ish `GRANT` SQL (or use the point-and-
  click builder); the simulator checks your goals and flags over-granting so you
  learn **least privilege**.
- **A free-play sandbox** and an always-available **reference** section.

## 🧱 Curriculum

| # | Mission | # | Mission |
|---|---------|---|---------|
| 0 | Orientation: the mental model | 8 | Ownership & DAC |
| 1 | The securable object hierarchy | 9 | Managed access schemas |
| 2 | Roles, users & activation | 10 | Future grants |
| 3 | System-defined roles | 11 | Database roles |
| 4 | The privilege catalog | 12 | RBAC design best practices |
| 5 | Granting & revoking | 13 | Governance: masking & row access |
| 6 | Role hierarchy & inheritance | 14 | Auditing & introspection |
| 7 | The access chain ⭐ | 15 | Capstone: the boss mission 🏆 |

## 🚀 Run it locally

Requires Node 18+.

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
npm test           # run the RBAC engine unit tests (Vitest)
```

## 🌐 Deploy to GitHub Pages

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the site and publishes it to GitHub Pages on every push.

**One-time setup:** in your repository, go to **Settings → Pages** and set
**Source** to **“GitHub Actions.”** After the next push, the workflow will build
and deploy automatically, and your site will be live at:

```
https://<your-username>.github.io/Snowflake-Access-Control-Learning/
```

The Vite `base` path is already configured to match the repository name, so
assets and hash-based routes resolve correctly on Pages.

## 🛠️ Tech

React + TypeScript + Vite, zero UI dependencies beyond React Router. Diagrams are
hand-rolled inline SVG. The access-control engine lives in
[`src/engine/`](src/engine/) and is covered by unit tests in
[`src/engine/engine.test.ts`](src/engine/engine.test.ts).

## 📚 Sources

Content is verified against the official Snowflake documentation, including the
[Overview of Access Control](https://docs.snowflake.com/en/user-guide/security-access-control-overview),
[Access control privileges](https://docs.snowflake.com/en/user-guide/security-access-control-privileges),
[Access control considerations](https://docs.snowflake.com/en/user-guide/security-access-control-considerations),
and the `GRANT` / `CREATE DATABASE ROLE` / `USE SECONDARY ROLES` SQL references.

## License

[MIT](LICENSE).
