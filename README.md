# DespensaBoy

A family pantry management web application for tracking food items, expiration dates, and consumption. Supports real-time multi-device synchronization through shared family codes.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Security](#security)
- [External Providers](#external-providers)
- [Compatibility](#compatibility)
- [Features](#features)
- [Deployment](#deployment)
- [License](#license)

---

## Tech Stack

### Frontend

| Technology | Detail | Purpose |
|---|---|---|
| HTML5 | Semantic markup, `lang="es"` | Application structure |
| CSS3 | Gradients, Flexbox, Grid, Media Queries | Responsive styling |
| Vanilla JavaScript | ES6+ modules, async/await, template literals | Business logic, rendering, state management |
| LocalStorage API | Web Storage API | Offline data persistence |

### Backend / Cloud

| Technology | Detail | Purpose |
|---|---|---|
| Supabase | PostgreSQL + Realtime + Edge Functions | Managed database, real-time subscriptions, serverless functions |
| Deno Runtime | TypeScript execution | Edge Function runtime |
| PostgreSQL | Via Supabase | Persistent data storage (JSONB) |

### External Libraries (CDN)

| Library | Source | Purpose |
|---|---|---|
| Supabase JS SDK v2 | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | Database client and realtime subscriptions |
| Cloudflare Turnstile | `challenges.cloudflare.com/turnstile/v0/api.js` | CAPTCHA bot verification |

---

## Architecture

### High-Level Overview

DespensaBoy follows an **offline-first architecture with cloud sync**. All operations work locally via LocalStorage, and data is synchronized to Supabase in the background when online. Real-time subscriptions push updates to all connected devices.

```
+-----------------------------------------------------------+
|                     CLIENT (Browser)                      |
|                                                           |
|   +-----------+   +------------+   +-----------+          |
|   |  screens  |<--|  handlers  |-->|   state   |          |
|   |   (view)  |   |  (events)  |   | (central) |          |
|   +-----------+   +------------+   +-----+-----+          |
|                                          |                |
|   +-----------+   +------------+   +-----v-----+          |
|   |   utils   |   | constants  |   |LocalStorage|          |
|   | (security)|   |  (config)  |   +-----+-----+          |
|   +-----------+   +------------+         |                |
|                                    +-----v-----+          |
|                                    |supabase.js |          |
|                                    |  (sync)    |          |
|                                    +-----+-----+          |
+------------------------------------------+----------------+
                                           | HTTPS
                          +----------------v-----------------+
                          |          SUPABASE CLOUD           |
                          |                                   |
                          |   +---------------------------+   |
                          |   |      Edge Functions       |   |
                          |   |  +---------------------+  |   |
                          |   |  | crear-despensa      |  |   |
                          |   |  | actualizar-despensa |  |   |
                          |   |  +----------+----------+  |   |
                          |   +-------------|-------------+   |
                          |                 |                 |
                          |   +-------------v-------------+   |
                          |   |    PostgreSQL (RLS)       |   |
                          |   |    Table: despensas       |   |
                          |   +-------------+-------------+   |
                          |                 |                 |
                          |   +-------------v-------------+   |
                          |   |  Realtime (WebSocket)     |   |
                          |   +---------------------------+   |
                          +-----------------------------------+
                                           |
                          +----------------v-----------------+
                          |      CLOUDFLARE TURNSTILE        |
                          |     (CAPTCHA Verification)       |
                          +----------------------------------+
```

### Data Flow

```
User Action --> Handler --> State Update --> Save to LocalStorage
                                                    |
                                                    v
                                            Sync to Supabase
                                          (via Edge Function)
                                                    |
                                                    v
                                          CAPTCHA Verification
                                          (Cloudflare Turnstile)
                                                    |
                                                    v
                                          Write to PostgreSQL
                                            (SERVICE_ROLE_KEY)
                                                    |
                                                    v
                                          Realtime Broadcast
                                            (WebSocket push)
                                                    |
                                                    v
                                          Other devices receive
                                     --> Update state --> Re-render
```

### Sync Conflict Resolution

1. Each sync operation records an `updated_at` timestamp
2. When a Realtime update arrives, the client compares the incoming timestamp with the last known sync timestamp
3. If the incoming timestamp matches the one the client just wrote, the update is ignored (prevents sync loops)
4. Otherwise, the local state is updated with the incoming data

### Separation of Concerns

```
index.html           Structure & module loading
css/styles.css       Presentation (responsive, gradients, grid)
js/main.js           App bootstrap (3 lines)
js/state.js          Centralized state management & data loading
js/screens.js        Pure view rendering functions (all UI)
js/handlers.js       Event handlers & business logic
js/utils.js          Security utilities (escapeHtml, sanitizeId)
js/constants.js      Configuration constants (food categories, limits)
js/supabase.js       Supabase client, sync logic, realtime subscriptions
```

### State Management

The application uses a centralized state object pattern (no external library):

```javascript
{
  screen: string,           // Current active screen
  raciones: Array,          // Current pantry items
  racionesHistorico: Array, // Activity log entries
  syncEnabled: boolean,     // Whether cloud sync is active
  syncCode: string,         // Family sharing code
  editingIndex: number,     // Index of item being edited
  editingNombre: string,    // Edited item name
  editingCaducidad: string, // Edited expiration date
  sortBy: string,           // Current sort criteria
  filterType: string,       // Current category filter
  lastSyncTimestamp: string, // Last sync timestamp (loop prevention)
}
```

State changes trigger a full re-render of the active screen. LocalStorage is updated on every state mutation.

### Rendering Pipeline

Each screen is a pure function that reads state and returns an HTML string injected into the root `#app` element via `innerHTML`. All user-generated content passes through `escapeHtml()` before injection.

```
State --> Screen Function --> HTML String --> innerHTML --> DOM
                                  ^
                                  |
                          escapeHtml() applied
                          to all user content
```

---

## Database Schema

### Table: `despensas`

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK) | Auto-generated primary key |
| `codigo` | `TEXT UNIQUE` | Shared family code |
| `raciones` | `JSONB` | Array of current pantry items |
| `historico` | `JSONB` | Array of activity log entries |
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last update timestamp |

### Index

- `idx_despensas_codigo` on column `codigo` for fast lookups by family code

### Edge Functions

| Function | Method | Purpose | Auth |
|---|---|---|---|
| `crear-despensa` | POST | Create a new pantry with a unique code | Turnstile CAPTCHA |
| `actualizar-despensa` | POST | Sync pantry data (items + history) | Turnstile CAPTCHA |

Both functions use `SUPABASE_SERVICE_ROLE_KEY` (server-side only) to bypass RLS and write to the database, after verifying the Turnstile CAPTCHA token.

---

## Security

### XSS Prevention

| Function | Purpose | Coverage |
|---|---|---|
| `escapeHtml()` | Escapes `&`, `<`, `>`, `"`, `'` in user content | All rendered user-generated strings |
| `sanitizeId()` | Strips unsafe characters from IDs (allows only `[a-zA-Z0-9._-]`) | All dynamically generated element IDs and onclick attributes |

### CORS Protection

Edge Functions restrict the allowed origin to the production domain only:

```
Access-Control-Allow-Origin: https://ajimenezc.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### Authentication & Authorization

| Layer | Mechanism | Detail |
|---|---|---|
| Bot prevention | Cloudflare Turnstile | Required for all write operations (create/update pantry) |
| Database RLS | Supabase Row Level Security | `SELECT`: public. `INSERT`/`UPDATE`/`DELETE`: blocked for anonymous key |
| Server-side writes | Service Role Key | Only Edge Functions can write; key is never exposed to the client |

### Key Separation

| Key | Location | Scope |
|---|---|---|
| `SUPABASE_ANON_KEY` | Frontend (public) | Read-only access, restricted by RLS policies |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions (secret) | Full read/write access, server-side only |
| `TURNSTILE_SITE_KEY` | Frontend (public) | Render CAPTCHA widget |
| `TURNSTILE_SECRET_KEY` | Edge Functions (secret) | Server-side CAPTCHA token verification |

### Write Protection Flow

```
Client Request
      |
      v
Edge Function receives request
      |
      v
Extract Turnstile token from body
      |
      v
Verify token with Cloudflare API  ---> FAIL --> 403 Forbidden
      |
      v (SUCCESS)
Create Supabase client with SERVICE_ROLE_KEY
      |
      v
Execute database operation (bypasses RLS)
      |
      v
Return result to client
```

### Security Test Suite

The project includes automated tests (`tests/index.html`) validating:

- XSS escaping with multiple attack payloads (`<script>`, event handlers, encoded entities)
- ID sanitization against injection vectors
- Date parsing and formatting edge cases
- History cleanup logic boundaries

---

## External Providers

| Provider | Service | Purpose | Tier |
|---|---|---|---|
| **Supabase** | PostgreSQL + Realtime + Edge Functions | Backend-as-a-Service (database, serverless, WebSockets) | Free |
| **Cloudflare** | Turnstile CAPTCHA | Bot prevention and abuse protection | Free |
| **GitHub** | Pages (static hosting) | Frontend hosting and CDN | Free |
| **jsDelivr** | CDN | Supabase SDK distribution | Free |

### Supabase Usage

- **Database**: PostgreSQL with JSONB columns for flexible data storage
- **Row Level Security**: Enforced policies controlling read/write access
- **Edge Functions**: Two Deno-based serverless functions for secure writes
- **Realtime**: WebSocket-based subscriptions for live multi-device sync

### Cloudflare Turnstile Usage

- Invisible/managed CAPTCHA challenge
- Verified server-side via Cloudflare's `siteverify` API endpoint
- Required before every write operation (create or update pantry)

---

## Compatibility

### Browser Support

| Required Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| ES6 Modules | 61+ | 60+ | 11+ | 16+ |
| LocalStorage | All | All | All | All |
| Fetch API | 42+ | 39+ | 10.1+ | 14+ |
| CSS Grid | 57+ | 52+ | 10.1+ | 16+ |
| CSS Flexbox | 29+ | 28+ | 9+ | 12+ |
| WebSocket (Realtime) | 16+ | 11+ | 6+ | 12+ |
| Async/Await | 55+ | 52+ | 10.1+ | 15+ |

**Effective minimum**: Chrome 61+, Firefox 60+, Safari 11+, Edge 16+

### Responsive Design

- **Viewport**: `width=device-width, initial-scale=1.0`
- **Mobile-first**: Default layout optimized for small screens
- **Breakpoint**: `@media (max-width: 600px)` for mobile adjustments
- **Adaptive grid**: `grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))`
- **Touch-friendly**: Minimum button size of 32px
- **Scrollable charts**: Horizontal bar charts scroll on small screens

### System Font Stack

```css
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```

### PWA Status

| Feature | Status |
|---|---|
| Offline operation | Partial (LocalStorage, no Service Worker) |
| Responsive | Full |
| Favicon | SVG (emoji-based) |
| Service Worker | Not implemented |
| Web App Manifest | Not implemented |
| Installable | No |

---

## Features

### Pantry Management

- Register items with name, category, quantity, and expiration date
- Consume items (partial or full)
- Edit item name and expiration date
- Delete items
- Sort and filter by category
- Visual warnings for items expiring within 2 days
- Expired items highlighting

### Dashboard

- Total items count
- Items expiring soon
- Expired items count
- Category distribution bar chart

### Multi-Device Sync

- Unique family codes for shared pantries
- Real-time updates via WebSocket
- Merge or replace options when connecting
- Full offline mode with sync on reconnect

### Activity History

- Complete log of all actions (add, consume, modify, delete)
- Grouped by date with timestamps
- Shows before/after values for edits
- Automatic cleanup beyond 150 entries

### Supported Product Categories (13)

| # | Category | Shelf Life | Storage |
|---|---|---|---|
| 1 | Fresh | 1-3 days | Refrigerator |
| 2 | Refrigerated | 3-14 days | Refrigerator |
| 3 | Frozen | 90-365 days | Freezer |
| 4 | Canned | 365-1825 days | Pantry |
| 5 | Cold preserved | 30-180 days | Refrigerator |
| 6 | Cereal/Grain | 180-730 days | Pantry |
| 7 | Cured meats | 30-365 days | Pantry/Refrigerator |
| 8 | Pre-cooked | 3-30 days | Refrigerator |
| 9 | Ready-to-eat | 1-4 days | Refrigerator |
| 10 | Pastries/Snacks | 90-365 days | Pantry |
| 11 | Bakery | 1-5 days | Pantry |
| 12 | Hygiene/Cosmetics | 365-1095 days | Bathroom/Pantry |
| 13 | Cleaning supplies | 365-1825 days | Pantry/Laundry |

---

## Deployment

### Infrastructure

```
Source Code (GitHub)
      |
      +---> GitHub Pages -----> Static Frontend (HTML/CSS/JS)
      |
      +---> Supabase CLI -----> Edge Functions (Deno/TypeScript)
      |
      +---> Supabase Dashboard -> Database Schema + RLS Policies
```

### Cost

| Component | Provider | Cost |
|---|---|---|
| Frontend hosting | GitHub Pages | Free |
| Database | Supabase Free Tier | Free (within limits) |
| Edge Functions | Supabase Free Tier | Free (500K invocations/month) |
| CAPTCHA | Cloudflare Turnstile | Free |
| CDN | jsDelivr | Free |

---

## License

[Apache License 2.0](LICENSE) - Permits commercial use, modification, and distribution with attribution.
