# React Best Practices

**Version 1.0.0**  
Vercel Engineering  
January 2026

> **Note:**  
> This document is mainly for agents and LLMs to follow when maintaining,  
> generating, or refactoring React and Next.js codebases at Vercel. Humans  
> may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Comprehensive performance optimization guide for React and Next.js applications, designed for AI agents and LLMs. Contains 40+ rules across 8 categories, prioritized by impact from critical (eliminating waterfalls, reducing bundle size) to incremental (advanced patterns). Each rule includes detailed explanations, real-world examples comparing incorrect vs. correct implementations, and specific impact metrics to guide automated refactoring and code generation.

---

## Table of Contents

1. [Eliminating Waterfalls](#1-eliminating-waterfalls) — **CRITICAL**
2. [Bundle Size Optimization](#2-bundle-size-optimization) — **CRITICAL**
3. [Server-Side Performance](#3-server-side-performance) — **HIGH**
4. [Client-Side Data Fetching](#4-client-side-data-fetching) — **MEDIUM-HIGH**
5. [Re-render Optimization](#5-re-render-optimization) — **MEDIUM**
6. [Rendering Performance](#6-rendering-performance) — **MEDIUM**
7. [JavaScript Performance](#7-javascript-performance) — **LOW-MEDIUM**
8. [Advanced Patterns](#8-advanced-patterns) — **LOW**

---

## 1. Eliminating Waterfalls

**Impact: CRITICAL**

Waterfalls are the #1 performance killer. Each sequential await adds full network latency. Eliminating them yields the largest gains.

### 1.1 Defer Await Until Needed

**Impact: HIGH (avoids blocking unused code paths)**

Move `await` operations into the branches where they're actually used to avoid blocking code paths that don't need them.

**Incorrect: blocks both branches**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)
  
  if (skipProcessing) {
    // Returns immediately but still waited for userData
    return { skipped: true }
  }
  
  // Only this branch uses userData
  return processUserData(userData)
}
```

**Correct: only blocks when needed**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // Returns immediately without waiting
    return { skipped: true }
  }
  
  // Fetch only when needed
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

### 1.2 Dependency-Based Parallelization

**Impact: CRITICAL (2-10× improvement)**

For operations with partial dependencies, use `better-all` to maximize parallelism.

**Incorrect: profile waits for config unnecessarily**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**Correct: config and profile run in parallel**

```typescript
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() {
    return fetchProfile((await this.$.user).id)
  }
})
```

### 1.3 Prevent Waterfall Chains in API Routes

**Impact: CRITICAL (2-10× improvement)**

Start independent operations immediately, even if you don't await them yet.

**Incorrect: config waits for auth, data waits for both**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**Correct: auth and config start immediately**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

### 1.4 Promise.all() for Independent Operations

**Impact: CRITICAL (2-10× improvement)**

When async operations have no interdependencies, execute them concurrently.

**Incorrect: sequential execution, 3 round trips**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**Correct: parallel execution, 1 round trip**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### 1.5 Strategic Suspense Boundaries

**Impact: HIGH (faster initial paint)**

Use Suspense boundaries to show wrapper UI faster while data loads.

**Incorrect: wrapper blocked by data fetching**

```tsx
async function Page() {
  const data = await fetchData() // Blocks entire page
  
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <DataDisplay data={data} />
      <div>Footer</div>
    </div>
  )
}
```

**Correct: wrapper shows immediately, data streams in**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // Only blocks this component
  return <div>{data.content}</div>
}
```

---

## 2. Bundle Size Optimization

**Impact: CRITICAL**

Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

### 2.1 Avoid Barrel File Imports

**Impact: CRITICAL (200-800ms import cost, slow builds)**

Import directly from source files instead of barrel files.

**Incorrect: imports entire library**

```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, takes ~2.8s extra in dev
```

**Correct: imports only what you need**

```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// Loads only 3 modules (~2KB vs ~1MB)
```

Libraries commonly affected: `lucide-react`, `@mui/material`, `@radix-ui/react-*`, `lodash`, `date-fns`.

### 2.2 Conditional Module Loading

**Impact: HIGH (loads large data only when needed)**

Load large data or modules only when a feature is activated.

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

### 2.3 Defer Non-Critical Third-Party Libraries

**Impact: MEDIUM (loads after hydration)**

Load analytics, logging after hydration.

**Incorrect: blocks initial bundle**

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Correct: loads after hydration**

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2.4 Dynamic Imports for Heavy Components

**Impact: CRITICAL (directly affects TTI and LCP)**

Use dynamic imports to lazy-load large components.

**Incorrect: Monaco bundles with main chunk ~300KB**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**Correct: Monaco loads on demand**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

### 2.5 Preload Based on User Intent

**Impact: MEDIUM (reduces perceived latency)**

Preload heavy bundles on hover/focus.

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== 'undefined') {
      void import('./monaco-editor')
    }
  }

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={onClick}
    >
      Open Editor
    </button>
  )
}
```

---

## 3. Server-Side Performance

**Impact: HIGH**

### 3.1 Cross-Request LRU Caching

**Impact: HIGH (caches across requests)**

Use LRU cache for data shared across sequential requests.

```typescript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000  // 5 minutes
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}
```

### 3.2 Minimize Serialization at RSC Boundaries

**Impact: HIGH (reduces data transfer size)**

Only pass fields that the client actually uses.

**Incorrect: serializes all 50 fields**

```tsx
async function Page() {
  const user = await fetchUser()  // 50 fields
  return <Profile user={user} />
}

'use client'
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div>  // uses 1 field
}
```

**Correct: serializes only 1 field**

```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}

'use client'
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```

### 3.3 Parallel Data Fetching with Component Composition

**Impact: CRITICAL (eliminates server-side waterfalls)**

Restructure components to parallelize data fetching.

**Incorrect: Sidebar waits for Page's fetch**

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}
```

**Correct: both fetch simultaneously**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

### 3.4 Per-Request Deduplication with React.cache()

**Impact: MEDIUM (deduplicates within request)**

```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id }
  })
})
```

### 3.5 Use after() for Non-Blocking Operations

**Impact: MEDIUM (faster response times)**

```tsx
import { after } from 'next/server'

export async function POST(request: Request) {
  await updateDatabase(request)
  
  // Log after response is sent
  after(async () => {
    const userAgent = (await headers()).get('user-agent') || 'unknown'
    logUserAction({ userAgent })
  })
  
  return Response.json({ status: 'success' })
}
```

---

## 4. Client-Side Data Fetching

**Impact: MEDIUM-HIGH**

### 4.1 Deduplicate Global Event Listeners

**Impact: LOW (single listener for N components)**

Use `useSWRSubscription()` to share global event listeners.

### 4.2 Use Passive Event Listeners for Scrolling Performance

**Impact: MEDIUM (eliminates scroll delay)**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  
  document.addEventListener('touchstart', handleTouch, { passive: true })
  
  return () => document.removeEventListener('touchstart', handleTouch)
}, [])
```

### 4.3 Use SWR for Automatic Deduplication

**Impact: MEDIUM-HIGH (automatic deduplication)**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('/api/users', fetcher)
}
```

### 4.4 Version and Minimize localStorage Data

**Impact: MEDIUM (prevents schema conflicts)**

```typescript
const VERSION = 'v2'

function saveConfig(config: { theme: string; language: string }) {
  try {
    localStorage.setItem(`userConfig:${VERSION}`, JSON.stringify(config))
  } catch {
    // Throws in incognito/private browsing
  }
}
```

---

## 5. Re-render Optimization

**Impact: MEDIUM**

### 5.1 Defer State Reads to Usage Point

**Impact: MEDIUM (avoids unnecessary subscriptions)**

**Incorrect: subscribes to all searchParams changes**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const searchParams = useSearchParams()

  const handleShare = () => {
    const ref = searchParams.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```

**Correct: reads on demand, no subscription**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const handleShare = () => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```

### 5.2 Extract to Memoized Components

**Impact: MEDIUM (enables early returns)**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return <div><UserAvatar user={user} /></div>
}
```

### 5.3 Narrow Effect Dependencies

**Impact: LOW (minimizes effect re-runs)**

**Incorrect: re-runs on any user field change**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user])
```

**Correct: re-runs only when id changes**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user.id])
```

### 5.4 Subscribe to Derived State

**Impact: MEDIUM (reduces re-render frequency)**

**Incorrect: re-renders on every pixel change**

```tsx
function Sidebar() {
  const width = useWindowWidth()  // updates continuously
  const isMobile = width < 768
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

**Correct: re-renders only when boolean changes**

```tsx
function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

### 5.5 Use Functional setState Updates

**Impact: MEDIUM (prevents stale closures)**

**Incorrect: requires state as dependency**

```tsx
const addItems = useCallback((newItems: Item[]) => {
  setItems([...items, ...newItems])
}, [items])  // items dependency causes recreations
```

**Correct: stable callbacks, no stale closures**

```tsx
const addItems = useCallback((newItems: Item[]) => {
  setItems(curr => [...curr, ...newItems])
}, [])  // No dependencies needed
```

### 5.6 Use Lazy State Initialization

**Impact: MEDIUM (wasted computation on every render)**

**Incorrect: runs on every render**

```tsx
const [searchIndex, setSearchIndex] = useState(buildSearchIndex(items))
```

**Correct: runs only once**

```tsx
const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(items))
```

### 5.7 Use Transitions for Non-Urgent Updates

**Impact: MEDIUM (maintains UI responsiveness)**

```tsx
import { startTransition } from 'react'

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => {
      startTransition(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
```

---

## 6. Rendering Performance

**Impact: MEDIUM**

### 6.1 Animate SVG Wrapper Instead of SVG Element

**Impact: LOW (enables hardware acceleration)**

**Incorrect: animating SVG directly**

```tsx
<svg className="animate-spin" width="24" height="24">...</svg>
```

**Correct: animating wrapper div**

```tsx
<div className="animate-spin">
  <svg width="24" height="24">...</svg>
</div>
```

### 6.2 CSS content-visibility for Long Lists

**Impact: HIGH (faster initial render)**

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### 6.3 Hoist Static JSX Elements

**Impact: LOW (avoids re-creation)**

**Incorrect: recreates element every render**

```tsx
function LoadingSkeleton() {
  return <div className="animate-pulse h-20 bg-gray-200" />
}
```

**Correct: reuses same element**

```tsx
const loadingSkeleton = (
  <div className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return <div>{loading && loadingSkeleton}</div>
}
```

### 6.4 Optimize SVG Precision

**Impact: LOW (reduces file size)**

**Incorrect: excessive precision**

```svg
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />
```

**Correct: 1 decimal place**

```svg
<path d="M 10.3 20.8 L 30.9 40.2" />
```

### 6.5 Prevent Hydration Mismatch Without Flickering

**Impact: MEDIUM (avoids visual flicker)**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div id="theme-wrapper">{children}</div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'light';
                var el = document.getElementById('theme-wrapper');
                if (el) el.className = theme;
              } catch (e) {}
            })();
          `,
        }}
      />
    </>
  )
}
```

### 6.6 Use Activity Component for Show/Hide

**Impact: MEDIUM (preserves state/DOM)**

```tsx
import { Activity } from 'react'

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <ExpensiveMenu />
    </Activity>
  )
}
```

### 6.7 Use Explicit Conditional Rendering

**Impact: LOW (prevents rendering 0 or NaN)**

**Incorrect: renders "0" when count is 0**

```tsx
{count && <span className="badge">{count}</span>}
```

**Correct: renders nothing when count is 0**

```tsx
{count > 0 ? <span className="badge">{count}</span> : null}
```

---

## 7. JavaScript Performance

**Impact: LOW-MEDIUM**

### 7.1 Batch DOM CSS Changes

**Impact: MEDIUM (reduces reflows/repaints)**

**Incorrect: multiple reflows**

```typescript
element.style.width = '100px'
element.style.height = '200px'
element.style.backgroundColor = 'blue'
```

**Correct: single reflow**

```typescript
element.classList.add('highlighted-box')
// or
element.style.cssText = `width: 100px; height: 200px; background-color: blue;`
```

### 7.2 Build Index Maps for Repeated Lookups

**Impact: LOW-MEDIUM (1M ops to 2K ops)**

**Incorrect (O(n) per lookup):**

```typescript
return orders.map(order => ({
  ...order,
  user: users.find(u => u.id === order.userId)
}))
```

**Correct (O(1) per lookup):**

```typescript
const userById = new Map(users.map(u => [u.id, u]))
return orders.map(order => ({
  ...order,
  user: userById.get(order.userId)
}))
```

### 7.3 Cache Property Access in Loops

**Impact: LOW-MEDIUM (reduces lookups)**

```typescript
const value = obj.config.settings.value
const len = arr.length
for (let i = 0; i < len; i++) {
  process(value)
}
```

### 7.4 Cache Repeated Function Calls

**Impact: MEDIUM (avoid redundant computation)**

```typescript
const resultCache = new Map<string, Result>()

function expensiveOperation(input: string): Result {
  if (resultCache.has(input)) {
    return resultCache.get(input)!
  }
  const result = compute(input)
  resultCache.set(input, result)
  return result
}
```

### 7.5 Cache Storage API Calls

**Impact: LOW (reduces I/O operations)**

```typescript
let cachedSettings: Settings | null = null

function getSettings(): Settings {
  if (!cachedSettings) {
    const stored = localStorage.getItem('settings')
    cachedSettings = stored ? JSON.parse(stored) : defaultSettings
  }
  return cachedSettings
}
```

### 7.6 Combine Multiple Array Iterations

**Impact: LOW-MEDIUM (reduces iterations)**

**Incorrect: 3 iterations**

```typescript
const active = items.filter(i => i.active)
const names = active.map(i => i.name)
const sorted = names.sort()
```

**Correct: 1 iteration + sort**

```typescript
const names: string[] = []
for (const item of items) {
  if (item.active) names.push(item.name)
}
names.sort()
```

### 7.7 Early Length Check for Array Comparisons

**Impact: LOW (fast rejection)**

```typescript
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
```

### 7.8 Early Return from Functions

**Impact: LOW (reduces unnecessary work)**

```typescript
function processUser(user: User | null) {
  if (!user) return null
  if (!user.active) return null
  
  // Main logic only runs for active users
  return transform(user)
}
```

### 7.9 Hoist RegExp Creation

**Impact: LOW (avoids recreation)**

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmails(emails: string[]): boolean[] {
  return emails.map(email => EMAIL_REGEX.test(email))
}
```

### 7.10 Use Loop for Min/Max Instead of Sort

**Impact: LOW-MEDIUM (O(n) vs O(n log n))**

**Incorrect: O(n log n)**

```typescript
const max = [...numbers].sort((a, b) => b - a)[0]
```

**Correct: O(n)**

```typescript
const max = Math.max(...numbers)
// or for large arrays:
let max = numbers[0]
for (let i = 1; i < numbers.length; i++) {
  if (numbers[i] > max) max = numbers[i]
}
```

### 7.11 Use Set/Map for O(1) Lookups

**Impact: MEDIUM (O(1) vs O(n))**

```typescript
const allowedIds = new Set(allowList.map(item => item.id))

function isAllowed(id: string): boolean {
  return allowedIds.has(id)  // O(1) instead of O(n)
}
```

### 7.12 Use toSorted() Instead of sort() for Immutability

**Impact: LOW (preserves original array)**

```typescript
// Mutates original
const sorted = items.sort((a, b) => a.name.localeCompare(b.name))

// Immutable
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name))
```

---

## 8. Advanced Patterns

**Impact: LOW**

### 8.1 Store Event Handlers in Refs

**Impact: LOW (stable references)**

```tsx
function useEventCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef<T>(callback)
  
  useLayoutEffect(() => {
    ref.current = callback
  })
  
  return useCallback(
    ((...args) => ref.current(...args)) as T,
    []
  )
}
```

### 8.2 useLatest for Stable Callback Refs

**Impact: LOW (always latest value)**

```tsx
function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value)
  ref.current = value
  return ref
}

function Component({ onSubmit }: { onSubmit: () => void }) {
  const onSubmitRef = useLatest(onSubmit)
  
  useEffect(() => {
    const handler = () => onSubmitRef.current()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])  // No onSubmit dependency needed
}
```

---

## Summary

Priority order for optimization:

1. **CRITICAL**: Eliminate waterfalls (Promise.all, Suspense)
2. **CRITICAL**: Reduce bundle size (direct imports, dynamic loading)
3. **HIGH**: Server-side optimization (caching, minimal serialization)
4. **MEDIUM-HIGH**: Client-side data fetching (SWR, deduplication)
5. **MEDIUM**: Re-render optimization (memo, functional setState)
6. **MEDIUM**: Rendering performance (content-visibility, hoisting)
7. **LOW-MEDIUM**: JavaScript micro-optimizations (Maps, caching)
8. **LOW**: Advanced patterns (refs, callbacks)

Focus on higher-impact categories first. The cumulative effect of multiple small optimizations can be significant.
