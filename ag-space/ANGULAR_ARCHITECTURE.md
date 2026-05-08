# Angular Enterprise Architecture Guide

A production-grade, feature-first, domain-driven Angular project structure using standalone architecture.

---

## 1. Recommended Folder Tree

```
src/
├── app/
│   ├── core/                              # App-wide singleton logic
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── error-handling.interceptor.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── http.service.ts
│   │   │   └── logger.service.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   └── api-response.model.ts
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   └── environment.service.ts
│   │   ├── handlers/
│   │   │   └── global-error.handler.ts
│   │   └── core.module.ts                # Optional, for DI setup
│   │
│   ├── shared/                            # Truly reusable code
│   │   ├── components/
│   │   │   ├── button/
│   │   │   │   ├── button.component.ts
│   │   │   │   └── button.component.html
│   │   │   ├── input/
│   │   │   ├── modal/
│   │   │   ├── table/
│   │   │   ├── spinner/
│   │   │   └── index.ts                  # Barrel export
│   │   ├── directives/
│   │   │   ├── permission.directive.ts
│   │   │   └── debounce.directive.ts
│   │   ├── pipes/
│   │   │   ├── safe-html.pipe.ts
│   │   │   └── truncate.pipe.ts
│   │   ├── models/
│   │   │   ├── pagination.model.ts
│   │   │   └── filter.model.ts
│   │   ├── utils/
│   │   │   ├── date.utils.ts
│   │   │   └── validation.utils.ts
│   │   ├── constants/
│   │   │   └── app.constants.ts
│   │   └── shared.module.ts              # Optional, for common imports
│   │
│   ├── features/                          # Business domains
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.page.ts
│   │   │   │   │   ├── login.page.html
│   │   │   │   │   └── login.page.scss
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── components/
│   │   │   │   ├── login-form/
│   │   │   │   └── auth-header/
│   │   │   ├── services/
│   │   │   │   └── auth-api.service.ts
│   │   │   ├── models/
│   │   │   │   ├── login-request.model.ts
│   │   │   │   └── auth-token.model.ts
│   │   │   ├── store/
│   │   │   │   ├── auth.state.ts
│   │   │   │   ├── auth.actions.ts
│   │   │   │   └── auth.facade.ts
│   │   │   ├── guards/
│   │   │   │   └── guest.guard.ts
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.ts
│   │   │   └── auth.routes.ts            # Feature routing config
│   │   │
│   │   ├── users/
│   │   │   ├── pages/
│   │   │   │   ├── user-list/
│   │   │   │   ├── user-detail/
│   │   │   │   └── user-profile/
│   │   │   ├── components/
│   │   │   │   ├── user-card/
│   │   │   │   └── user-form/
│   │   │   ├── services/
│   │   │   │   ├── user-api.service.ts
│   │   │   │   └── user.facade.ts
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts
│   │   │   │   └── user-filter.model.ts
│   │   │   ├── store/
│   │   │   ├── resolvers/
│   │   │   │   └── user-detail.resolver.ts
│   │   │   ├── routes/
│   │   │   │   └── user.routes.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   ├── products/
│   │   │   ├── pages/
│   │   │   │   ├── product-list/
│   │   │   │   ├── product-detail/
│   │   │   │   └── product-create/
│   │   │   ├── components/
│   │   │   │   ├── product-card/
│   │   │   │   ├── product-filter/
│   │   │   │   └── product-gallery/
│   │   │   ├── services/
│   │   │   │   └── product-api.service.ts
│   │   │   ├── models/
│   │   │   │   ├── product.model.ts
│   │   │   │   └── product-category.model.ts
│   │   │   ├── store/
│   │   │   │   ├── product.state.ts
│   │   │   │   └── product.facade.ts
│   │   │   ├── guards/
│   │   │   │   └── product-owner.guard.ts
│   │   │   ├── routes/
│   │   │   │   └── product.routes.ts
│   │   │   └── products.routes.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── store/
│   │   │   └── orders.routes.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   │   └── dashboard-main/
│   │   │   ├── components/
│   │   │   │   ├── stats-card/
│   │   │   │   └── revenue-chart/
│   │   │   ├── services/
│   │   │   │   └── dashboard-api.service.ts
│   │   │   ├── models/
│   │   │   │   └── dashboard-stats.model.ts
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   └── settings/
│   │       ├── pages/
│   │       │   ├── settings-general/
│   │       │   ├── settings-security/
│   │       │   └── settings-notifications/
│   │       ├── components/
│   │       ├── services/
│   │       └── settings.routes.ts
│   │
│   ├── layouts/                           # App shell layouts
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── main-layout.component.html
│   │   │   └── main-layout.component.scss
│   │   ├── auth-layout/
│   │   │   ├── auth-layout.component.ts
│   │   │   └── auth-layout.component.html
│   │   └── layouts.module.ts
│   │
│   ├── app.component.ts                   # Root component
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.config.ts                      # App configuration (standalone)
│   └── app.routes.ts                      # Root routing
│
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── i18n/
│       ├── en.json
│       └── ar.json
│
├── environments/
│   ├── environment.ts
│   ├── environment.development.ts
│   ├── environment.staging.ts
│   └── environment.production.ts
│
├── styles/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _reset.scss
│   ├── _themes/
│   │   ├── _light.scss
│   │   └── _dark.scss
│   └── styles.scss                       # Global styles entry
│
├── index.html
├── main.ts                               # Bootstrap entry
└── polyfills.ts
```

---

## 2. Top-Level Folder Explanations

### `core/`
**Purpose:** App-wide singleton services and logic that should only be instantiated once.

**Contains:**
- **interceptors/** - HTTP interceptors for auth tokens, logging, error handling
- **guards/** - Global route guards (auth, role-based)
- **services/** - Singleton services (auth, logger, configuration)
- **models/** - App-wide models (User, API response wrappers)
- **config/** - Application configuration and environment handling
- **handlers/** - Global error handlers

**Rules:**
- Only imported once in `app.config.ts`
- Never import core services into shared
- Contains app-wide cross-cutting concerns

---

### `shared/`
**Purpose:** Truly reusable, dumb UI components and utilities used across multiple features.

**Contains:**
- **components/** - Reusable presentational components (buttons, inputs, modals, tables)
- **directives/** - Reusable attribute directives (permission, debounce, click-outside)
- **pipes/** - Reusable transformation pipes
- **models/** - Shared data models (pagination, filters)
- **utils/** - Pure utility functions
- **constants/** - Application-wide constants

**Rules:**
- No business logic
- No dependency on core services
- Must be stateless and dumb
- Only include if used by 2+ features

---

### `features/`
**Purpose:** Self-contained business domains, each acting like a mini-application.

**Contains (per feature):**
- **pages/** - Container/smart components tied to routes
- **components/** - Feature-specific presentational components
- **services/** - Feature API services and facades
- **models/** - Feature-specific data models
- **store/** - State management (NgRx, NGXS, or SignalStore)
- **guards/** - Feature-specific route guards
- **resolvers/** - Route data resolvers
- **routes/** - Feature routing configuration

**Rules:**
- Each feature is self-contained
- Can be extracted to a library with minimal changes
- Lazy-loaded by default
- Owns its state, routes, and data

---

### `layouts/`
**Purpose:** App shell components that wrap feature pages.

**Contains:**
- **main-layout/** - Authenticated user layout (header, sidebar, footer)
- **auth-layout/** - Unauthenticated layout (centered card)
- **admin-layout/** - Admin-specific layout if needed

**Rules:**
- Layouts wrap router outlets
- Handle navigation and shell UI
- Can be reused across features

---

### `environments/`
**Purpose:** Environment-specific configuration.

**Contains:**
- `environment.ts` - Default/development
- `environment.production.ts` - Production settings
- `environment.staging.ts` - Staging settings

---

### `assets/`
**Purpose:** Static resources.

**Contains:**
- **images/** - Images and graphics
- **icons/** - SVG icons
- **fonts/** - Custom fonts
- **i18n/** - Translation files for localization

---

### `styles/`
**Purpose:** Global styling and theming.

**Contains:**
- `_variables.scss` - Design tokens
- `_mixins.scss` - Reusable SCSS mixins
- `_reset.scss` - CSS reset/normalize
- `_themes/**` - Theme variations
- `styles.scss` - Main entry point

---

## 3. Example Feature: Products (Detailed)

```
features/
└── products/
    ├── pages/                              # Container components (routes)
    │   ├── product-list/
    │   │   ├── product-list.page.ts        # Smart component
    │   │   ├── product-list.page.html
    │   │   └── product-list.page.scss
    │   ├── product-detail/
    │   │   ├── product-detail.page.ts
    │   │   ├── product-detail.page.html
    │   │   └── product-detail.page.scss
    │   └── product-create/
    │       ├── product-create.page.ts
    │       ├── product-create.page.html
    │       └── product-create.page.scss
    │
    ├── components/                         # Presentational components
    │   ├── product-card/
    │   │   ├── product-card.component.ts   # Dumb component
    │   │   ├── product-card.component.html
    │   │   └── product-card.component.scss
    │   ├── product-filter/
    │   │   └── product-filter.component.ts
    │   ├── product-gallery/
    │   │   └── product-gallery.component.ts
    │   └── product-review/
    │       └── product-review.component.ts
    │
    ├── services/                           # Data access layer
    │   ├── product-api.service.ts          # HTTP calls
    │   └── product.facade.ts               # Facade pattern for store
    │
    ├── models/                             # TypeScript interfaces
    │   ├── product.model.ts
    │   ├── product-category.model.ts
    │   ├── product-filter.model.ts
    │   └── product-review.model.ts
    │
    ├── store/                              # State management
    │   ├── product.state.ts                # Signals or NGXS state
    │   ├── product.actions.ts              # Action definitions
    │   ├── product.selectors.ts            # State selectors
    │   └── product.facade.ts              # Public API for store
    │
    ├── guards/                             # Route guards
    │   └── product-owner.guard.ts         # Can user edit this product?
    │
    ├── resolvers/                          # Route resolvers
    │   └── product-detail.resolver.ts     # Pre-fetch product data
    │
    ├── utils/                              # Feature utilities
    │   └── product.utils.ts
    │
    ├── constants/                          # Feature constants
    │   └── product.constants.ts
    │
    ├── routes/                             # Routing config
    │   └── product.routes.ts
    │
    └── products.routes.ts                  # Feature routing entry point
```

### Key Files Explained:

#### `product-list.page.ts` (Container/Smart Component)
```typescript
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, ProductFilterComponent, AsyncPipe],
  templateUrl: './product-list.page.html'
})
export class ProductListPage implements OnInit {
  products$ = this.productFacade.products$;
  loading$ = this.productFacade.loading$;
  
  constructor(private productFacade: ProductFacade) {}
  
  ngOnInit(): void {
    this.productFacade.loadProducts();
  }
  
  onFilterChange(filter: ProductFilter): void {
    this.productFacade.filterProducts(filter);
  }
}
```

#### `product-card.component.ts` (Presentational/Dumb Component)
```typescript
@Component({
  selector: 'app-product-card',
  standalone: true,
  inputs: ['product'],  // Signal inputs
  outputs: ['addToCart', 'viewDetails'],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  product = input.required<Product>();
  addToCart = output<Product>();
  viewDetails = output<string>();
}
```

#### `product-api.service.ts` (Data Access)
```typescript
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private api = inject(HttpClient);
  
  getProducts(filter: ProductFilter): Observable<Product[]> {
    return this.api.get<Product[]>('/products', { params: filter });
  }
  
  getProductById(id: string): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }
}
```

#### `products.routes.ts` (Feature Routes)
```typescript
export const PRODUCT_ROUTES: Route[] = [
  {
    path: '',
    component: ProductListPage,
    canActivate: [authGuard]
  },
  {
    path: ':id',
    component: ProductDetailPage,
    resolve: { product: ProductDetailResolver }
  },
  {
    path: 'create',
    component: ProductCreatePage,
    canActivate: [authGuard, productOwnerGuard]
  }
];
```

---

## 4. Nx Monorepo Version (Enterprise Scale)

For large enterprises, Nx provides a monorepo structure with proper library boundaries:

```
workspace/
├── apps/
│   ├── web-app/                           # Main Angular application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.component.ts
│   │   │   │   ├── app.config.ts
│   │   │   │   └── app.routes.ts
│   │   │   └── environments/
│   │   ├── project.json
│   │   └── tsconfig.json
│   │
│   └── admin-app/                         # Separate admin app
│       └── src/
│
├── libs/
│   ├── core/                              # Core library
│   │   ├── src/
│   │   │   ├── interceptors/
│   │   │   ├── guards/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── project.json
│   │
│   ├── shared/                            # Shared UI library
│   │   ├── ui/                            # Shared UI components
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   ├── utils/                         # Shared utilities
│   │   └── models/                        # Shared models
│   │
│   ├── features/
│   │   ├── auth/                          # Auth feature library
│   │   │   ├── feature/
│   │   │   │   ├── src/
│   │   │   │   │   ├── pages/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── models/
│   │   │   │   │   └── routes/
│   │   │   │   └── project.json
│   │   │   └── data-access/               # Auth API layer
│   │   │       ├── src/
│   │   │       └── project.json
│   │   │
│   │   ├── products/
│   │   │   ├── feature/
│   │   │   ├── data-access/
│   │   │   └── ui/                        # Product-specific UI
│   │   │
│   │   ├── orders/
│   │   │   ├── feature/
│   │   │   └── data-access/
│   │   │
│   │   ├── users/
│   │   ├── dashboard/
│   │   └── settings/
│   │
│   └── layouts/
│       ├── main-layout/
│       └── auth-layout/
│
├── tools/
│   └── generators/                        # Custom Nx generators
│
├── nx.json
├── workspace.json
└── tsconfig.base.json
```

### Nx Library Types:

| Library Type | Purpose | Scope |
|--------------|---------|-------|
| `feature` | Smart components, pages, routes | Feature-specific |
| `ui` | Dumb presentational components | Feature or shared |
| `data-access` | API services, state management | Feature-specific |
| `util` | Pure utility functions | Feature or shared |
| `model` | TypeScript interfaces | Feature or shared |

### Nx Dependency Constraints (`.eslintrc.json`):
```json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "type:app",
            "onlyDependOnLibsWithTags": ["type:feature", "type:ui", "type:data-access", "type:util"]
          },
          {
            "sourceTag": "type:feature",
            "onlyDependOnLibsWithTags": ["type:ui", "type:data-access", "type:util", "type:model"]
          },
          {
            "sourceTag": "type:ui",
            "onlyDependOnLibsWithTags": ["type:util", "type:model"]
          },
          {
            "sourceTag": "type:data-access",
            "onlyDependOnLibsWithTags": ["type:model", "type:util"]
          }
        ]
      }
    ]
  }
}
```

---

## 5. Best Practices & Anti-Patterns

### ✅ Best Practices

| Practice | Reason |
|----------|--------|
| **Feature-first structure** | Easier to navigate, scales with team size |
| **Lazy loading features** | Reduces initial bundle, faster load times |
| **Standalone components** | Modern Angular, no NgModule boilerplate |
| **Facade pattern for state** | Clean API, decouples components from store |
| **Barrel exports (`index.ts`)** | Clean imports, encapsulation |
| **Signal inputs/outputs** | Better performance, reactive by default |
| **Separate pages from components** | Clear separation of concerns |
| **One feature = one folder** | Easy to extract to library later |
| **Shared only for truly reusable code** | Prevents shared from becoming a junk drawer |
| **Core for singletons only** | Prevents duplicate instances |
| **Type-safe models** | Better IDE support, catch errors at compile time |
| **Consistent naming conventions** | `feature-name.type.ts` (e.g., `product-list.page.ts`) |

### ❌ Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **All services in one folder** | Hard to find, no domain ownership | Put services in their feature folder |
| **All components in one folder** | Becomes unmanageable quickly | Feature-specific components stay in feature |
| **Shared folder becomes a junk drawer** | Everything depends on everything | Only truly reusable code in shared |
| **Core services in features** | Multiple instances, tight coupling | Keep singletons in core |
| **Feature importing core services directly** | Tight coupling | Use dependency injection |
| **Deeply nested folder structures** | Hard to navigate | Max 3-4 levels deep |
| **No lazy loading** | Large initial bundle | Lazy load all features |
| **Business logic in components** | Hard to test, hard to reuse | Move to services/facades |
| **Global state for everything** | Complexity, hard to track | Feature-local state |
| **No barrel exports** | Messy imports | Use `index.ts` for clean exports |

---

## 6. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Component** | `kebab-case.component.ts` | `product-card.component.ts` |
| **Page** | `kebab-case.page.ts` | `product-list.page.ts` |
| **Service** | `kebab-case.service.ts` | `product-api.service.ts` |
| **Guard** | `kebab-case.guard.ts` | `auth.guard.ts` |
| **Resolver** | `kebab-case.resolver.ts` | `product-detail.resolver.ts` |
| **Model** | `kebab-case.model.ts` | `product.model.ts` |
| **Pipe** | `kebab-case.pipe.ts` | `truncate.pipe.ts` |
| **Directive** | `kebab-case.directive.ts` | `permission.directive.ts` |
| **Store** | `feature.state.ts` | `product.state.ts` |
| **Routes** | `feature.routes.ts` | `products.routes.ts` |
| **Module** | `feature.module.ts` | `shared.module.ts` |

---

## 7. App Configuration Example (Standalone)

### `app.config.ts`
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loggingInterceptor,
        errorInterceptor
      ])
    ),
    provideAnimations(),
    provideEnvironmentInitializer(() => {
      // Bootstrap logic
    }),
    // Core providers
    AuthService,
    LoggerService,
    EnvironmentService,
  ]
};
```

### `app.routes.ts`
```typescript
export const APP_ROUTES: Route[] = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes')
          .then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes')
          .then(m => m.PRODUCT_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes')
          .then(m => m.ORDER_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes')
          .then(m => m.USER_ROUTES)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes')
          .then(m => m.SETTINGS_ROUTES)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },
  { path: '**', component: NotFoundPage }
];
```

---

## Summary

This architecture provides:

1. **Scalability** - Features can grow independently
2. **Maintainability** - Clear separation of concerns
3. **Team efficiency** - Domain ownership, parallel development
4. **Testability** - Isolated units, easy mocking
5. **Reusability** - Shared code is truly reusable
6. **Lazy loading** - Optimized bundle sizes
7. **Library extraction** - Easy migration to Nx monorepo

For small teams/projects, use the single-app structure. For enterprise scale with multiple teams and apps, adopt the Nx monorepo approach with proper library boundaries.
