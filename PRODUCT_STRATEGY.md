# Nudge: Complete Market Research, Product Alignment & Milestone Roadmap

---

## SECTION 1: MARKET RESEARCH

### 1.1 The Problem Space

Software teams are failing not because developers lack skill, but because **project visibility breaks down between the Product Owner and the development team**. The Product Owner, who is responsible for delivery, often has no reliable real-time signal about what is stalling, who is blocked, or whether the project will ship on time — until it is too late.

**The core tension in the market:**
> *"The people who most need to know what's happening have the least convenient way to find out."*

---

### 1.2 Competitor Analysis

| Tool | Primary Target | Core Strength | Critical Weakness |
|---|---|---|---|
| **Jira** | Enterprise Engineering Teams | Deeply customizable workflows | Bloated, complex setup; AI (Rovo) feels bolted-on; expensive per-seat at scale |
| **Asana** | Cross-functional PMs | Great for visual planning & timelines | No predictive intelligence; manual status updates only; no AI engine |
| **Linear** | Engineering-led Startups | Extremely fast, beautiful UX | No AI proactivity; no built-in communication; limited PM oversight tools |
| **Monday.com** | Business teams (non-eng) | Flexible & visual | Too generic; weak for software-specific workflows (PRs, commits, deploys) |
| **ClickUp** | All-in-one teams | Feature-rich | Feature bloat creates noise; poor AI integration; slow performance |
| **Notion** | Documentation-first teams | Excellent knowledge base | Not a PM tool; no real-time alerts or AI proactivity |

### 1.3 The Gap Nudge Fills

No existing tool combines:
1. ✅ **Real-time AI monitoring** that detects stalls and proactively sends nudges
2. ✅ **Built-in team communication** (not a 3rd party like Slack)
3. ✅ **GitHub-aware** — reads commits, PRs, and task status from the codebase itself
4. ✅ **A Product Owner-first UX** where executives get portfolio health instantly
5. ✅ **Per-project pricing** that doesn't penalize growing teams

**Nudge's Positioning Statement:**
> *Nudge is the autonomous project intelligence layer for Product Owners who maintain software teams — combining real-time chat, AI-driven task oversight, GitHub telemetry, and predictive nudges in a single workspace, priced per project, not per seat.*

---

### 1.4 Target Market & ICP (Ideal Customer Profile)

**Primary ICP (The Buyer):**
*   Software Agency Owners managing 2–10 client projects simultaneously
*   Startup CTOs / Product Managers overseeing an internal product team
*   Indie SaaS founders who contract external development teams
*   Enterprise team leads managing a specific product pod

**What makes them choose Nudge over competitors:**
1. They are frustrated with manual status meetings and daily standup overhead
2. They want AI that works in the background — not a chatbot they have to prompt
3. They value per-project pricing because their dev team size fluctuates
4. They already use GitHub and want it to inform their PM workflow automatically

---

## SECTION 2: PRODUCT ALIGNMENT

### 2.1 The Nudge User Hierarchy

```
WORKSPACE  (Account Level — owned by the Product Owner)
│
├── PROJECT A  (e.g., "E-commerce Platform")
│   ├── Channels (Chat, Announcements, GitHub Feed)
│   ├── Tasks  (AI-monitored, stall detection active)
│   ├── Team  (Developer team A — access isolated to this project)
│   └── GitHub Integration (Repo A)
│
├── PROJECT B  (e.g., "Mobile App v2")
│   ├── Channels
│   ├── Tasks
│   ├── Team  (Different developer team — zero access to Project A)
│   └── GitHub Integration (Repo B)
│
└── [Future] BILLING DASHBOARD
    ├── Plan per project (Monthly / Yearly)
    └── Subscription management
```

### 2.2 Feature Pillars

| Pillar | Feature | Status |
|---|---|---|
| **Communication** | Real-time chat with threads, reactions, file sharing | ✅ Built |
| **Communication** | Video calls via LiveKit | ✅ Built |
| **Communication** | Push notifications (VAPID web push) | ✅ Built |
| **Intelligence** | AI Nudge Engine — stall detection | ✅ Built |
| **Intelligence** | AI posts system messages & MOM summaries to chat | ✅ Built |
| **Intelligence** | Predictive velocity risk (early warning before stalls) | 🔴 Not Built |
| **Intelligence** | Sentiment analysis on chat messages | 🔴 Not Built |
| **Code Awareness** | GitHub repo link & activity feed (commits, PRs, issues) | ✅ Built |
| **Code Awareness** | Auto task status updates from PR merges | 🔴 Not Built |
| **Task Management** | Task CRUD with assignments | ✅ Built |
| **Task Management** | Dependency tracking (blocks_task_id) | 🔴 Not Built |
| **Analytics** | Workspace-level analytics dashboard | ✅ Built |
| **Owner UX** | Portfolio view (all projects health at a glance) | ✅ Built |
| **Owner UX** | Per-project team isolation & RBAC | ✅ Built |
| **Monetization** | Stripe billing integration | 🔴 Not Built |
| **Monetization** | Monthly / Yearly plan per project | 🔴 Not Built |
| **Platform** | PWA installability | ✅ Built |
| **Platform** | Desktop Electron app | ✅ Built |
| **Platform** | Public Landing page | ✅ Built |

---

## SECTION 3: CURRENT STATUS (Where We Are Right Now)

### 🟢 Phase 1 — Foundation (COMPLETE)

The product's core infrastructure and MVP features are fully operational:

- [x] Authentication (Supabase Auth, middleware protection)
- [x] Workspace & Project CRUD
- [x] Real-time team chat (channels, threads, reactions, @mentions)
- [x] Task management (create, assign, update status)
- [x] Nudge Engine (Python/FastAPI backend with LangChain agents)
- [x] AI posts automated nudges & system alerts to chat channels
- [x] GitHub integration (OAuth + PAT, activity feed: commits/PRs/issues/releases)
- [x] LiveKit video calling within the workspace
- [x] Analytics dashboard (workspace-level metrics)
- [x] Web push notifications (VAPID)
- [x] PWA (installable on mobile and desktop)
- [x] Electron desktop app build
- [x] Public landing & product pages
- [x] Supabase Realtime presence (online users)

**Verdict: A fully functional v1 product exists. This is demo-ready and can acquire early customers.**

---

## SECTION 4: MILESTONE ROADMAP

### 📍 MILESTONE 2 — "The Intelligence Layer" *(Next — 4-6 weeks)*
**Goal:** Make the AI engine smarter, more proactive, and more trustworthy.

- [ ] **Explainable Nudges:** AI messages include *why* a task is flagged ("Blocking Task Z which is on the critical path for Friday's sprint")
- [ ] **Predictive Stall Detection:** Alert the PM *before* a task is late, based on assignee's historical velocity
- [ ] **Sentiment Analysis:** Detect frustration or confusion in chat and flag the related task for PM review
- [ ] **Dependency Tracking:** Add `blocks_task_id` to database; AI understands blast radius of stalls
- [ ] **Fix AI `user_id` problem:** Create a dedicated `system_bot` user in Supabase so AI messages don't use a random team member's ID

---

### 📍 MILESTONE 3 — "Code-Aware Project Management" *(6-8 weeks)*
**Goal:** Close the loop between the codebase and the task board automatically.

- [ ] **Fine-Grained GitHub Access:** Switch from full-repo OAuth to GitHub App (per-repo selection, like Vercel)
- [ ] **Auto Task Status from PRs:** When a linked PR is merged, automatically move the related task to "In Review" or "Done"
- [ ] **Meeting-to-Tasks Pipeline:** After a LiveKit meeting, AI generates a MOM summary and auto-drafts task tickets from conversation
- [ ] **GitHub Webhook Alerts:** Real-time chat messages when PRs are opened, failed CI/CD runs, or new releases are published

---

### 📍 MILESTONE 4 — "Monetization & Growth" *(8-12 weeks)*
**Goal:** Convert free users into paying customers with a per-project subscription model.

- [ ] **Stripe Integration:** Implement payment processing for project subscriptions
- [ ] **Plan Architecture:** Define Free (1 project, limited AI nudges), Pro (per project monthly), Business (per project yearly + priority AI)
- [ ] **Billing Dashboard:** Product Owner UI to manage subscriptions, upgrade/downgrade, view invoices
- [ ] **Paywall Logic:** Enforce active subscription check before allowing new project creation beyond the free tier
- [ ] **Trial Periods:** 14-day free trial on first paid project

---

### 📍 MILESTONE 5 — "Scale & Enterprise" *(12-20 weeks)*
**Goal:** Attract larger clients with enterprise-grade features.

- [ ] **Advanced RBAC:** Role-based permissions (Owner, Admin, Member, Viewer) with granular feature access
- [ ] **Audit Logs:** Full activity trail for compliance-conscious clients
- [ ] **Team Health Scores:** Per-developer workload and burnout risk scoring, visible to the PM
- [ ] **SSO / SAML Integration:** Enterprise login via company identity providers
- [ ] **Custom Domains:** Whitelabel Nudge under a client's own domain for agency use cases
- [ ] **API Access:** Allow clients to build on top of the Nudge data layer

---

## SECTION 5: PRICING MODEL

### Per-Project Subscription

| Plan | Price | Projects | AI Nudges/month | Team Members | GitHub |
|---|---|---|---|---|---|
| **Free** | $0 | 1 project | 50 nudges | Up to 3 | Public repos only |
| **Pro Monthly** | $29/project/mo | Unlimited | Unlimited | Unlimited | Public + Private |
| **Pro Yearly** | $19/project/mo | Unlimited | Unlimited | Unlimited | Public + Private |
| **Business Yearly** | $49/project/mo | Unlimited | Unlimited + Priority | Unlimited | Full GitHub App access |

**Key pricing principles:**
1. **Free tier** exists to get developers and small teams in the door — they become champions who sell it to their Product Owner
2. **Per-project** (not per-seat) removes the biggest objection for agencies who work with fluctuating team sizes
3. **Yearly discount** is substantial (~35%) to lock in annual revenue and reduce churn

---

## SECTION 6: 90-DAY EXECUTION PLAN

| Week | Focus | Deliverable |
|---|---|---|
| 1–2 | Fix AI Bot User ID (system_bot) | AI messages attributed to a "Nudge Bot" user |
| 3–4 | Explainable nudges | Nudge messages include impact/reason |
| 5–6 | Dependency tracking + predictive stalls | `blocks_task_id` in DB, early warning alerts |
| 7–8 | GitHub App (fine-grained repo access) | Single-repo OAuth like Vercel |
| 9–10 | Auto task status from PR events | Webhook → task board sync |
| 11–12 | Stripe billing foundations | Subscription model live, first paying customers |
