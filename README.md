# Roadmapr — Product Management & Roadmap Platform

A multi-persona product management app to plan **portfolios → products / initiatives → epics → stories → tasks**, with releases, roadmaps, Kanban, calendar, Gantt, and timeline-shift detection.

Built on **Lovable Cloud** (Supabase: Postgres + Auth + RLS + Realtime), **TanStack Start** (React 19 + Vite 7), **Tailwind v4**, and **shadcn/ui**.

---

## ✨ Features

- **Hierarchy**: Portfolio → [Product, Initiative] → Epic → Story → Task
- **Releases / Milestones** spanning epics with M2M scope
- **Initiative types** (Customization, Variant, Demo, Event, PoV, Other) with admin-configurable custom fields per type
- **Roadmap swimlanes** (Week / Month / Quarter / Year) with drag-to-reschedule and **timeline-shift detection**
- **Kanban** (drag-and-drop status), **Calendar** (month grid), **Gantt** (with dependency arrows)
- **My Work** for assignees, **Leader Dashboard**, and **Reports** with CSV export
- **Comments + activity log** on every item
- **Notifications** (realtime bell) when you're assigned or @mentioned in comments
- **Roles**: Admin, Leader, PM, Member — enforced via Postgres RLS

---

## 🔐 How to Sign In

The app uses **Email/Password** + **Google** sign-in. Email verification is **enabled**, so check your inbox after signup.

### Option 1 — Create an account (recommended)
1. Open the app → you'll land on `/auth`.
2. Click the **Create account** tab.
3. Enter your full name, email, and a password (min. 8 characters).
4. Check your email for the confirmation link, then return and sign in.

### Option 2 — Continue with Google
1. On `/auth`, click **Continue with Google**.
2. Approve the consent screen — you'll be redirected back signed in.

### First-user / Admin access
New users are created with the **Member** role by default. To get **Admin / PM / Leader** access:
- Have an existing admin assign your role from **Settings → Users**, *or*
- If you're the first user, open **Lovable Cloud → Database → `user_roles`** and insert a row:
  ```sql
  insert into public.user_roles (user_id, role)
  values ('<your-auth-user-id>', 'admin');
  ```
  You can find your user id in **Cloud → Users**.

> Tip: Admins and PMs can create/edit portfolios, products, initiatives, releases, and manage settings. Leaders get dashboard + reporting views. Members can update status on items assigned to them.

---

## 🧭 Where to start once logged in

| Persona | Start here |
|---|---|
| **Leader** | `/dashboard` → roll-ups, then `/roadmap` for swimlanes |
| **Product Manager** | `/portfolios` → create a portfolio → add products & initiatives → plan in `/roadmap` |
| **Team Member** | `/my-work` → update status on assigned epics/stories/tasks |

---

## 🗂 Tech Stack

- **Frontend**: TanStack Start v1, React 19, Vite 7, Tailwind CSS v4, shadcn/ui, lucide-react
- **State / Data**: TanStack Query, Supabase JS client
- **Backend**: Lovable Cloud (Postgres, Auth, Storage, Realtime, Edge Functions)
- **DnD**: @dnd-kit
- **Dates**: date-fns

---

## 🔒 Security model

- All tables have **Row-Level Security** enabled.
- Roles live in a separate `user_roles` table (never on `profiles`) and are checked via the `has_role()` security-definer function to avoid RLS recursion.
- Write actions (create/update/delete on portfolios, products, initiatives, releases, dependencies) are gated by `is_admin_or_pm()`.
- Members can only update status/assignment on items assigned to them.

---

## 📦 Local development

This project runs inside Lovable. To work on it locally:

```bash
bun install
bun run dev
```

Environment variables (`.env`) are auto-managed by Lovable Cloud — do **not** edit `.env`, `src/integrations/supabase/client.ts`, or `src/integrations/supabase/types.ts` by hand.

---

## 📄 License

Internal project — all rights reserved.
