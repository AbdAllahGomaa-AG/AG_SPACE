# Architecture Rules

## Clean Code
- Functions: single-purpose, max ~20 lines
- Names: meaningful, no abbreviations, no generic names (data, temp, item)
- No magic numbers — use named constants
- No dead code, no commented-out blocks
- Max component file: ~150 lines — extract if larger
- One level of abstraction per function

## Architecture Patterns
- Single Responsibility: each service/component does one thing
- Open/Closed: extend via new classes, not by modifying existing
- Smart/Dumb (Container/Presentational) pattern:
  - Smart: logic, data fetching, state management
  - Dumb: `@Input()` / `@Output()` only, zero business logic
- Facade pattern for complex features: one service as public API
- Repository pattern for data access: isolate all HTTP in repos
- Depend on abstractions (interfaces/tokens), not concrete classes

## State Management — Decision Rules
Hierarchy — never deviate without asking:
1. Local signal → UI-only state (isOpen, isLoading, activeTab)
2. Service + signal → shared state between sibling components
3. Facade + signal → complex feature with multiple services
4. Never NgRx/Akita → unless explicitly requested and justified

Rules:
- One source of truth: never duplicate state across services
- Derived state: always computed(), never recalculate manually
- Side effects: always in effect() or explicit methods, never in template
- If unsure which level → ask before implementing

## API Contract — REST
- Assume REST unless told otherwise — ask before using anything else
- All HTTP calls live in Repository classes only (never in components)
- Naming: `{Domain}Repository` (UserRepository, AuthRepository)
- Methods: `getAll()`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`
- Always type request and response — never use `any`
- Pagination: `{ data: T[], total: number, page: number, pageSize: number }`
- Loading states: signal isLoading in the calling service
- Base URL: always from environment.apiUrl — never hardcoded
- Interceptors: auth token + global error handling only

## Performance
- Lazy load all feature routes — no eager loading unless critical
- Always use track in @for: `@for (item of items; track item.id)`
- Avoid heavy computed() chains — keep derived signals simple
- No unnecessary subscriptions — use async pipe or takeUntilDestroyed()
- Images: use NgOptimizedImage directive always
- Avoid logic in template expressions — precompute in component
- No barrel files (index.ts) in large feature folders

## Error Handling
- All HTTP calls must handle errors — never silent failures
- Global HttpInterceptor for: 401 (redirect login), 500 (show toast)
- User-facing errors: PrimeNG Toast or inline Message component
- Never expose raw API error messages to the UI
- Log errors in dev only — use environment.production flag
- Forms: show validation errors inline next to the field

## Security
- No direct DOM manipulation — use Renderer2 if needed
- Never use innerHTML without DomSanitizer
- No sensitive data in localStorage
- No hardcoded API keys or secrets in source code
- Never bypass Angular's built-in XSS protection

## Folder Structure — Domain-Based
src/app/
├── core/              # interceptors, guards, singleton services
├── shared/            # reusable components, pipes, directives
├── features/
│   └── {domain}/
│       ├── components/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       └── {domain}.routes.ts
└── app.routes.ts

- Feature folders = lazy-loaded routes
- No cross-feature imports — go through core/ or shared/
