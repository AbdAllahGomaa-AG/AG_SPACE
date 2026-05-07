# Angular Rules

## Stack
- Angular 21+ with Standalone Components only
- Signals for state (signal, computed, effect)
- inject() pattern instead of constructor injection
- PrimeNG for UI components
- TailwindCSS for utility styling
- Reactive Forms (FormBuilder, FormGroup, FormControl)

## Component Patterns
- Always use `standalone: true` in @Component
- Use `inject()` not constructor injection
- Use signals for local state, not plain class properties
- Use FormBuilder via `inject(FormBuilder)`
- Use template control flow: `@if`, `@for`, `@switch` (never `*ngIf`, `*ngFor`)
- Use OnPush change detection for all components
- Services: `providedIn: 'root'` unless feature-scoped
- Use typed `FormGroup<{...}>` always

## File Organization
- No inline templates — always use `templateUrl` (.html file)
- No inline styles — always use `styleUrl` (.scss file)
- No inline logic in templates — extract to methods or computed signals

## Naming Conventions
Files (kebab-case):
  - user-profile.component.ts
  - auth.service.ts
  - user.repository.ts
  - admin.facade.ts
  - is-logged-in.guard.ts

Classes (PascalCase):
  - UserProfileComponent / AuthService / UserRepository / AdminFacade

Interfaces: descriptive noun
  - UserModel | UserResponse | IUser

Signals: camelCase
  - const isLoading = signal(false)
  - const currentUser = signal(null)

Constants: SCREAMING_SNAKE_CASE
  - const MAX_RETRY_COUNT = 3

Enums: PascalCase
  - enum UserRole { Admin, Editor, Viewer }

## Documentation
- Use JSDoc only if behavior is non-obvious
- No JSDoc on self-explanatory methods (getUsers, deleteItem)
- Comments only for "why a decision was made", not "what it does"
- No inline comments explaining what the code does
