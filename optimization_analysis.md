# 🔍 FreightProxy.io — Full Codebase Optimization Analysis

> **Read-only analysis. Zero code changes made.**  
> Covers: `Project/` (Next.js App) + `Automation/` (Playwright Suite)  
> Goal: Identify all areas where UI, functionality, DB structure, and test architecture can be improved.

---

## 1. 🗄️ Database Layer — MongoDB / Mongoose

### 1.1 Missing Compound Indexes (HIGH IMPACT)

**File**: [`models/Order.js`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/models/Order.js)

Current indexes:
```js
OrderSchema.index({ userEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
```

**Problem**: The most common query pattern is `GET /api/orders?email=...&status=...` — filtering by BOTH `userEmail` AND `status` simultaneously. Three separate single-field indexes are slower than one compound index for this pattern. MongoDB must intersect two B-trees instead of hitting one.

**Suggestion**: Add a compound index:
```js
OrderSchema.index({ userEmail: 1, status: 1, createdAt: -1 });
```
This single index covers: user filtering, status filtering, and newest-first sort in one pass.

---

### 1.2 `joinedDate` Stored as String instead of Date (MEDIUM IMPACT)

**File**: [`models/User.js` L78](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/models/User.js#L78)

```js
joinedDate: {
  type: String,
  default: () => new Date().toISOString().split('T')[0],
},
```

**Problem**: `joinedDate` is stored as `"2026-08-19"` string. This breaks date sorting, range queries (`joinedDate > X`), and any future analytics on join date. Strings sort lexicographically, not chronologically (fine for `YYYY-MM-DD` format, but rigid).

**Suggestion**: Change type to `Date` and store as ISO Date object. Formatting can be done on the client side.

---

### 1.3 Dual `isAdmin` + `role` Fields — Redundant (LOW-MEDIUM IMPACT)

**File**: [`models/User.js` L34-L42](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/models/User.js#L34-L42)

```js
role: { type: String, enum: ['Admin', 'Manager', 'User'] },
isAdmin: { type: Boolean, default: false },
```

**Problem**: `isAdmin` is a redundant field that mirrors `role === 'Admin'`. Two sources of truth = risk of desync. A user could have `role: 'User'` and `isAdmin: true`, causing unpredictable auth behavior. The only use of `isAdmin` is to protect the SuperAdmin from modification — this can be achieved with a simple `email === superAdminEmail` check instead.

**Suggestion**: Eliminate `isAdmin` from the schema. Derive "is this the superadmin?" from the environment variable email comparison.

---

### 1.4 Pipeline Dates as Strings — No Temporal Indexing (LOW IMPACT)

**File**: [`models/Order.js` PipelineSchema L23-L34](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/models/Order.js#L23-L34)

All pipeline dates (e.g., `pickupScheduledDate`) default to the string `"Pending"` and store date-times as strings like `"2026-08-19 10:00"`. This is a mixed-type anti-pattern — the field holds either a string `"Pending"` or a date string. Future timeline queries (`"show all orders picked up in August"`) would be impossible without full collection scan.

**Suggestion**: Use `Date | null` type. `null` = pending, a real Date = actual timestamp.

---

## 2. 🔌 API Layer — Next.js Route Handlers

### 2.1 `lib/orders.js` is a Dead Dual-System (HIGH IMPACT)

**File**: [`lib/orders.js`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/lib/orders.js)

This file is a complete **in-memory order store** (120+ lines with seed data, create/update functions). It is **never imported by any live API route**. The API (`app/api/orders/route.js`) uses MongoDB exclusively. `lib/orders.js` is dead code.

**Problem**: 
- Seed data hardcodes `user@example.com` and `tomsmith` emails — these are not valid MongoDB users and would confuse developers
- The file creates a false impression of a dual-system (in-memory + DB)
- It increases cognitive overhead during onboarding or debugging

**Suggestion**: Delete `lib/orders.js`. The single source of truth is `models/Order.js` + `app/api/orders/route.js`.

---

### 2.2 `lib/users.js` — In-Memory Fallback Never Used (MEDIUM IMPACT)

**File**: [`lib/users.js`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/lib/users.js)

Similar problem: the entire `users` in-memory registry (`addUser`, `getUsers`, `updateUserRole`, etc.) is never imported by the live API routes. All user operations go through `models/User.js`. Only the `SUPER_ADMIN_EMAIL` env var reference is conceptually relevant here, but even that is handled separately in the login route directly.

**Problem**:
- `bcrypt.hashSync` is called **synchronously at module import time** — this is a blocking operation that costs ~100ms during server cold start
- The global `_userRegistry` pollutes the Node.js global namespace unnecessarily

**Suggestion**: Delete the in-memory user functions. If a SuperAdmin bootstrap is needed, create a separate `scripts/seed.js` instead.

---

### 2.3 `GET /api/orders` — No Auth Guard (HIGH SECURITY IMPACT)

**File**: [`app/api/orders/route.js` L36-L74](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/orders/route.js#L36-L74)

```js
export async function GET(request) {
  // No authentication check at all!
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const role  = searchParams.get('role');
  ...
  if (role === 'Admin' || role === 'Manager') {
    // returns ALL orders — no JWT validation
  }
```

**Problem**: Anyone can call `GET /api/orders?role=Admin` without a valid session cookie and receive ALL orders in the database. The `role` parameter is taken from the query string — completely unauthenticated. This is a major security vulnerability. An unauthenticated user can enumerate all shipment data.

**Suggestion**: Verify the `fp_session` JWT cookie at the start of the GET handler (same pattern already used in `PUT /api/users`). The role from the JWT should be used — not the query string.

---

### 2.4 `GET /api/users` — No Auth Guard (HIGH SECURITY IMPACT)

**File**: [`app/api/users/route.js` L22-L33](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/users/route.js#L22-L33)

```js
export async function GET() {
  // No auth check! Anyone can list all users
  const users = await User.find({}).sort({ createdAt: 1 }).lean();
  const safe = users.map(({ passwordHash, ...u }) => u);
  return NextResponse.json({ success: true, users: safe });
}
```

**Problem**: Any unauthenticated client can call `GET /api/users` and get a full list of all user names, emails, roles, statuses, departments, and join dates. This is a PII (Personally Identifiable Information) data leak.

**Suggestion**: Add the same `getCallerFromRequest()` check already written in the same file (used for POST/PUT) and require at minimum a valid session, ideally `Admin` role.

---

### 2.5 Pricing Logic is Duplicated 3 Times (MEDIUM IMPACT)

The same pricing formula (`volumetricWeight = L*W*H/5000`, etc.) exists identically in:
1. [`lib/orders.js` L72-92](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/lib/orders.js#L72-L92) — `calculatePrice()`
2. [`app/api/orders/route.js` L8-29](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/orders/route.js#L8-L29) — `calculatePricing()`
3. [`components/DashboardView.js` L44-50](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/components/DashboardView.js#L44-L50) — inline calculation
4. [`Automation/utils/testData.js` L72-93](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Automation/utils/testData.js#L72-L93) — `calculateExpectedPrice()`

**Problem**: If the pricing formula ever changes (e.g., base price from $25 to $30), you must update 4 places. One missed update = test failures or incorrect pricing.

**Suggestion**: Create a single `lib/pricing.js` utility and export it. The Automation suite's `testData.js` would import from a shared location or maintain its own copy clearly labeled as a "mirror for verification."

---

### 2.6 Tracking ID Collision Risk (MEDIUM IMPACT)

**File**: [`app/api/orders/route.js` L31-33](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/orders/route.js#L31-L33)

```js
function genTrackingId() {
  return 'TRK-' + Math.floor(1000 + Math.random() * 9000);
}
```

**Problem**: This generates only 9000 possible IDs (`TRK-1000` to `TRK-9999`). At scale, or in tests with many orders, a duplicate `trackingId` causes a MongoDB unique constraint violation and a 500 error. The `Order.create()` call would fail with `E11000 duplicate key error`.

**Suggestion**: Use `crypto.randomUUID()` or a timestamp-based composite like `TRK-${Date.now()}-${randomNum}` to make collisions statistically impossible.

---

### 2.7 Login Does Not Update `lastLoginAt` Atomically (LOW IMPACT)

**File**: [`app/api/login/route.js` L52](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/login/route.js#L52)

```js
// Two separate DB operations:
const user = await User.findOne({ email: ... }).select('+passwordHash');
await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
```

**Problem**: Two sequential DB round-trips for what could be one. If the server crashes between the `findOne` and `updateOne`, `lastLoginAt` is never updated.

**Suggestion**: Use `findOneAndUpdate` with `select('+passwordHash')` to fetch and update in a single atomic operation.

---

## 3. ⚛️ Frontend / React Layer

### 3.1 `Header.js` Makes a Network Call on Every Route Change (MEDIUM IMPACT)

**File**: [`components/Header.js` L29-47](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/components/Header.js#L29-L47)

```js
const checkSession = useCallback(async () => {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  ...
}, []);

useEffect(() => {
  checkSession();
}, [pathname, checkSession]); // fires on EVERY page navigation
```

**Problem**: Every internal navigation (e.g., clicking "Manager Hub" → "Admin Console") fires a fresh `GET /api/auth/me` HTTP request. Since the JWT is already verified server-side, the user data is already in the cookie — no re-fetch needed for navigations that stay within the same 8-hour session.

Meanwhile, `useAuth.js` also calls `GET /api/auth/me` independently. So navigating to the `/admin` page fires **two** parallel calls to `/api/auth/me`:
  - One from `Header.js` (reacts to `pathname` change)
  - One from `AdminPage.js → useAuth()` (fires on component mount)

**Suggestion**: Use React Context or a global state store (Zustand/Jotai/Context API) to share the authenticated user object. `useAuth()` fetches once and broadcasts. Header reads from context instead of fetching independently.

---

### 3.2 `DashboardView.js` — Live Pricing Recalculated on Every Render (LOW-MEDIUM)

**File**: [`components/DashboardView.js` L44-50](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/components/DashboardView.js#L44-L50)

```js
// This runs on EVERY render, including unrelated state changes
const actualW = parseFloat(weight) || 0;
const volumetricW = ((l * w * h) / 5000).toFixed(2);
const calculatedPrice = (25.00 + ...).toFixed(2);
```

**Problem**: These computations run on every re-render, even if `weight`, `length`, `width`, `height`, `fragile`, `express` haven't changed. While arithmetic is fast, the principle of unnecessary computation is a smell, especially as the form grows.

**Suggestion**: Wrap in `useMemo(() => ..., [weight, length, width, height, fragile, express])`.

---

### 3.3 `AdminPage.js` / `ManagerPage.js` — Inline `useState` for Every Form Field (LOW)

Both pages manage 10+ individual `useState` calls for form fields:
```js
const [newName, setNewName] = useState('');
const [newEmail, setNewEmail] = useState('');
const [newPassword, setNewPassword] = useState('');
const [newRole, setNewRole] = useState('User');
const [newDept, setNewDept] = useState('Operations');
```

**Suggestion**: Use a single `const [form, setForm] = useState({ name:'', email:'', ... })` pattern. Reduces boilerplate, makes form reset a single `setForm(initialState)` call.

---

### 3.4 Error States Not Shown to User on Data Fetch Failures (MEDIUM UX)

**File**: [`app/admin/AdminPage.js` L30-36](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/admin/AdminPage.js#L30-L36)

```js
const fetchUsersData = async () => {
  try {
    const res = await fetch('/api/users');
    ...
  } catch (e) {} // ← silently swallowed
};
```

All 4 fetch functions across `AdminPage.js` and `ManagerPage.js` silently catch errors with empty catch blocks. If MongoDB is down or the network fails, the user sees an empty table with no feedback.

**Suggestion**: Set an error state in the catch block and render a "Failed to load data — please retry" message in the UI.

---

### 3.5 `globals.css` Is 769 Lines — Has Dead/Unused CSS Classes (LOW)

**File**: [`app/globals.css`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/globals.css)

The file is 769 lines of custom CSS coexisting with Tailwind. There are likely many custom class definitions that are never used by any component (the project uses Tailwind utility classes throughout the JSX). Dead CSS increases load time and parse time.

**Suggestion**: Run PurgeCSS or use Tailwind's built-in content scanning to identify and remove unused class definitions. A smaller CSS bundle = faster First Contentful Paint.

---

## 4. 🔐 Security Layer

### 4.1 JWT Secret Has an Insecure Fallback (HIGH SECURITY)

**File**: [`lib/auth.js` L4](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/lib/auth.js#L4)

```js
const JWT_SECRET = process.env.JWT_SECRET || 'freightproxy_fallback_secret_change_me';
```

**Problem**: If the `.env.local` file is missing or the env var is not set (e.g., in CI, Docker, or a fresh clone), the app silently falls back to a **hardcoded, publicly known secret**. Any attacker who knows this fallback (it's in the source code) can forge valid JWTs.

**Suggestion**: Throw an error at startup if `JWT_SECRET` is not defined:
```js
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is not set!');
```

---

### 4.2 `sameSite: 'lax'` — CSRF Risk for State-Mutating Requests (MEDIUM)

**File**: [`lib/auth.js` L53-61](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/lib/auth.js#L53-L61)

`sameSite: 'lax'` allows the cookie to be sent on top-level navigations from external sites (e.g., a cross-site POST via form). For an API-first app where all mutations go through fetch(), `sameSite: 'strict'` is safer. Alternatively, add a CSRF token mechanism.

---

### 4.3 No Rate Limiting on Login Endpoint (MEDIUM)

**File**: [`app/api/login/route.js`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Project/app/api/login/route.js)

The login route has no rate limiting. An attacker can make thousands of login attempts per second without being blocked, enabling brute-force attacks. The timing-attack protection (dummy bcrypt compare) is good practice, but rate limiting is still needed.

**Suggestion**: Add middleware-level rate limiting (e.g., using `next-rate-limit` or Vercel's edge middleware).

---

## 5. 🎭 Automation Suite (Playwright)

### 5.1 `playwright.config.js` Uses `npm run start` (Production Mode) — Not Dev Mode (MEDIUM)

**File**: [`playwright.config.js` L53](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Automation/playwright.config.js#L53)

```js
webServer: {
  command: 'npm run start', // ← production build required first
  ...
  reuseExistingServer: true,
}
```

**Problem**: `npm run start` requires a prior `npm run build`. If a developer forgets to build after code changes, tests run against the **old compiled version** and may give false passes or false failures. `reuseExistingServer: true` compounds this — if a stale server is already running, the config reuses it without checking if the build is current.

**Suggestion**: For local dev runs, allow `npm run dev` with a clear env-var toggle: `command: process.env.CI ? 'npm run start' : 'npm run dev'`.

---

### 5.2 Test Isolation: Tests Share a Global Database — No Cleanup (HIGH IMPACT)

**Current behavior**: All tests write to the same live MongoDB database. A test that creates a user (`QA User 123`) and fails mid-way leaves orphan documents that affect subsequent runs.

**Problem areas**:
- `admin.spec.js`: creates users → if test crashes after creation but before verification, the user persists
- `e2e-flow.spec.js`: creates orders → accumulates across runs, slowing order list queries
- `register.spec.js`: registers new users every run — these pile up in MongoDB

**Suggestion**: Implement an `afterEach` / `afterAll` global teardown hook (or a dedicated `global-teardown.js`) that deletes test-generated data (emails matching pattern `testuser_*@freightproxy.io`).

---

### 5.3 No `beforeAll` Login State Reuse — Re-logging in Every Test (MEDIUM)

**Current behavior**: Every test spec re-navigates to the login page and logs in via the UI. Example pattern in `admin.spec.js`, `manager.spec.js`, `dashboard.spec.js`, etc.

**Problem**: 12 test files × 3 browsers = 36 login sequences, each taking ~2–3 seconds = ~72–108 seconds of login overhead per run.

**Suggestion**: Use Playwright's `storageState` feature to save the authenticated cookie once per role (`adminState.json`, `managerState.json`, `userState.json`) in a global `beforeAll`, then reuse across all tests using that role. This is the official Playwright recommendation for auth optimization.

---

### 5.4 `testData.js` — `generateUser()` Creates a New Timestamp-Based Email Each Call (LOW-MEDIUM)

**File**: [`Automation/utils/testData.js` L19-30](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Automation/utils/testData.js#L19-L30)

Every call to `TestDataGenerator.generateUser()` produces a unique email (`testuser_1724063000000_532@freightproxy.io`). This is good for isolation, but without cleanup (as noted above), the database accumulates thousands of test users over time.

**Suggestion**: Add a `cleanup()` static method or document clearly that test users should be cleaned up post-run.

---

### 5.5 Screenshot Diffing Config Is Permissive (LOW)

**File**: [`playwright.config.js` L16-20](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Automation/playwright.config.js#L16-L20)

```js
toHaveScreenshot: {
  maxDiffPixelRatio: 0.2, // 20% of pixels can differ!
  threshold: 0.2,
}
```

A 20% pixel diff ratio is very permissive — this means screenshot tests could pass even if a significant portion of the UI has changed. For a visual regression suite, this defeats the purpose.

**Suggestion**: Reduce to `maxDiffPixelRatio: 0.02` (2%) for meaningful visual regression detection.

---

### 5.6 `responsive.spec.js` — No Assertions on Layout, Only Navigation (LOW)

**File**: [`Automation/tests/responsive.spec.js`](file:///c:/Users/Abhishek%20Kr%20Mandal/Desktop/Playwright/Automation/tests/responsive.spec.js)

Responsive tests navigate to pages at mobile viewport but don't assert that specific elements are visible, hidden, or reflow correctly. They essentially confirm "page loads at mobile viewport" but not "hamburger menu appears" or "table is not horizontally overflowing."

**Suggestion**: Add layout-specific assertions: `expect(hamburgerMenu).toBeVisible()`, `expect(overflowContainer).not.toHaveCSS('overflow-x', 'scroll')`.

---

## 6. 📊 Summary Table

| # | Area | Issue | Severity | Impact |
|---|------|--------|----------|--------|
| 1 | DB | Missing compound index on `userEmail+status` | 🟡 Medium | Query performance |
| 2 | DB | `joinedDate` as String not Date | 🟡 Medium | Date query/sort |
| 3 | DB | Redundant `isAdmin` field | 🟡 Medium | Data integrity |
| 4 | DB | Pipeline dates stored as string | 🟡 Medium | Future analytics |
| 5 | API | `lib/orders.js` is dead code | 🔴 High | Developer confusion |
| 6 | API | `lib/users.js` blocking sync bcrypt at import | 🔴 High | Cold start perf |
| 7 | API | `GET /api/orders` has no auth guard | 🔴 Critical | **Security** |
| 8 | API | `GET /api/users` has no auth guard | 🔴 Critical | **Security / PII** |
| 9 | API | Pricing formula duplicated 4x | 🔴 High | Maintenance risk |
| 10 | API | Tracking ID collision risk (9000 values only) | 🟡 Medium | Data integrity |
| 11 | API | Non-atomic `lastLoginAt` update | 🟢 Low | Data accuracy |
| 12 | Frontend | Header fetches `/api/auth/me` on every route change | 🟡 Medium | Network overhead |
| 13 | Frontend | Pricing calc not memoized | 🟢 Low | CPU waste |
| 14 | Frontend | 10+ `useState` per form (no form object pattern) | 🟢 Low | Code quality |
| 15 | Frontend | Silent error swallowing on fetch failures | 🟡 Medium | UX / observability |
| 16 | Frontend | `globals.css` likely has dead classes (769 lines) | 🟢 Low | Bundle size |
| 17 | Security | JWT secret has hardcoded fallback | 🔴 Critical | **Security** |
| 18 | Security | `sameSite: lax` — CSRF exposure | 🟡 Medium | Security |
| 19 | Security | No rate limiting on login | 🟡 Medium | Brute force risk |
| 20 | Automation | `npm run start` in webServer config | 🟡 Medium | Stale build risk |
| 21 | Automation | No DB cleanup after test runs | 🔴 High | Data accumulation |
| 22 | Automation | Re-login on every test (no storageState) | 🟡 Medium | Speed (~90s waste) |
| 23 | Automation | Screenshot diff threshold too permissive (20%) | 🟢 Low | Visual regression |
| 24 | Automation | Responsive tests lack layout assertions | 🟢 Low | Test quality |

---

## 7. 🎯 Recommended Priority Order (if implementing)

### 🔴 Fix First (Critical Security + Correctness)
1. Add auth guard to `GET /api/orders` — prevents unauthenticated data dump
2. Add auth guard to `GET /api/users` — prevents PII exposure
3. Throw error if `JWT_SECRET` env var is missing — prevent weak token signing
4. Consolidate pricing logic into `lib/pricing.js` — prevent formula drift

### 🟡 Fix Second (Performance + Stability)
5. Add compound MongoDB index on `{ userEmail, status, createdAt }`
6. Add global Playwright teardown to clean test data from MongoDB
7. Use `storageState` in Playwright to reuse login sessions
8. Replace double `/api/auth/me` calls with React Context user store
9. Fix tracking ID collision risk (`crypto.randomUUID`)
10. Delete `lib/orders.js` (dead code)

### 🟢 Fix Third (Code Quality + Polish)
11. Remove `isAdmin` field — derive from role
12. Change `joinedDate` to Date type
13. Show error states in UI on fetch failures
14. Wrap pricing calculation in `useMemo`
15. Consolidate form state with object pattern
16. Tighten screenshot diff thresholds
17. Add layout assertions to responsive tests
