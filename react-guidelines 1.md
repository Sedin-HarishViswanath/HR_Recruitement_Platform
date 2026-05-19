# React Coding Guidelines

These guidelines define **standards, patterns, and conventions** for building scalable React applications using a **feature-based architecture** and a curated set of libraries.

The goals are:

* Consistency across features
* High maintainability and testability
* Clear separation of concerns
* Predictable state and data flow

---

## 1. Tech Stack

The following libraries and tools are **standard and approved**:

### Runtime Libraries

* **UI**: shadcn/ui
* **Styling**: Tailwind CSS
* **Routing**: react-router-dom
* **State Management (Client State)**: Redux Toolkit
* **Server State**: React Query
* **Forms**: React Hook Form
* **Validation**: Zod
* **HTTP Client**: Axios
* **Icons**: lucide-react
* **Notifications**: Sonner (toast)
* **Theme Management**: next-themes
* **Error Handling**: react-error-boundary

### Tooling (Mandatory)

* **Language**: TypeScript (strict mode enabled)
* **Linting**: ESLint
* **Formatting**: Prettier

Introducing alternatives requires explicit approval.

---

## 2. Architectural Principles

* Prefer **composition over inheritance**
* Keep components **small and focused**
* Separate **UI, state, and side effects**
* Business logic must be testable outside the UI
* Data flows **top-down**

---

## 3. Feature-Based Folder Structure

The application uses a **feature-based architecture**. Each feature owns its UI, logic, and **route entry points**.

Pages are **feature-local** and imported by the central router.

### Example: Landing Page Feature

```text
src/
├── app/
│   └── router.tsx            # Central route registration
├── shared/                   # Reusable cross-feature code
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
├── features/
│   └── landing/
│       ├── pages/            # Route entry points (thin)
│       │   └── landing.page.tsx
│       ├── components/       # Dumb / presentational UI (Hero, FAQ, CTA)
│       ├── containers/       # Smart orchestration (data, state)
│       ├── hooks/            # Feature-specific hooks
│       ├── services/         # API + React Query
│       ├── schemas/          # Zod schemas
│       ├── types/            # TypeScript types
│       ├── tests/
│       └── index.ts          # Public feature exports
```

### Dependency Rules

* Router MAY import feature pages
* Features MUST NOT import the router
* Pages MAY import containers
* Containers MUST NOT import pages
* Components MUST NOT import containers or pages

---

## 4. Components (Dumb / Presentational)

Components are **pure UI**.

### Rules

* Function components only
* Props in, JSX out
* No Redux
* No React Query
* No Axios
* No routing
* No side effects

Allowed hooks:

* `useMemo`
* `useCallback`
* `useId`

```tsx
type HeroSectionProps = {
  title: string;
};

export function HeroSection({ title }: HeroSectionProps) {
  return <h1>{title}</h1>;
}
```

---

## 5. Containers (Smart / Feature Logic)

Containers orchestrate **data, state, and behavior** for a feature.

### Responsibilities

* Call React Query hooks
* Read/write Redux state
* Handle derived state
* Pass prepared props to components

### Rules

* No routing logic
* Minimal JSX (composition only)
* No direct DOM manipulation

```tsx
export function LandingContainer() {
  const { data } = useLandingQuery();

  return <HeroSection title={data.title} />;
}
```

---

## 6. Pages (Routing Glue)

Pages are **thin route entry points**.

### Responsibilities

* Act as router targets
* Select layout if needed
* Render containers

### Rules

* No business logic
* No data fetching
* No Redux or React Query

```tsx
import { LandingContainer } from '../containers/LandingContainer';

export default function LandingPage() {
  return <LandingContainer />;
}
```

---

## 7. Styling (Tailwind + shadcn)

* Tailwind CSS is the default styling approach
* shadcn components MUST NOT be modified directly
* Extend via composition

Rules:

* No inline styles
* No CSS-in-JS
* Use `cn()` helper for conditional classes

```tsx
<Button className="w-full">Submit</Button>
```

---

## 8. HTTP Layer (Axios)

* Single Axios instance
* Interceptors for auth and errors

```ts
export const api = axios.create({ baseURL: '/api' });
```

Rules:

* No fetch API
* No Axios usage outside `services/`

---

## 9. Forms & Validation

### React Hook Form + Zod

* Zod schemas define the source of truth
* Forms derive types from schemas

```ts
const schema = z.object({
  email: z.string().email()
});
```

Rules:

* No manual validation logic
* Always use `zodResolver`

---

## 10. Icons & Notifications

### Icons

* Use `lucide-react` only
* No inline SVGs

### Notifications

* Use Sonner for toasts

```ts
toast.success('Saved successfully');
```

---

## 11. Theming (Dark / Light)

* Use `next-themes`
* Theme logic belongs in app-level providers

Rules:

* Components must be theme-agnostic
* No manual theme toggling logic inside features

---

## 12. Testing

* **Testing Framework**: Vitest or Jest
* **Component Testing**: React Testing Library
* **API Mocking**: MSW (Mock Service Worker)

Rules:

* Test behavior, not implementation
* Prefer user-centric queries (`getByRole`, `getByText`)
* Mock network calls using MSW, not Axios mocks

---

## 13. Naming Conventions

* Files: `kebab-case.tsx`
* Components: `PascalCase`
* Hooks: `useSomething`
* Types: `PascalCase`

---

## 14. Anti-Patterns (Avoid)

* God components
* Cross-feature imports
* Redux for server state
* Logic inside JSX
* Unvalidated API responses
* Routing logic inside presentational components
* Catching errors in components instead of using error boundaries

---

## Guiding Principles

> **Features are the unit of scale.**
> **UI is replaceable; logic is not.**
