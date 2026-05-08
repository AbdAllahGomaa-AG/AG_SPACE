# Always-On Rules

## Critical Rules — Never Violate

1. **Angular 21 Standalone Only**
   - Always use `standalone: true` in @Component
   - Never use NgModule
   - Always use `inject()` instead of constructor injection

2. **Signals for State**
   - Use signals for local state, not plain class properties
   - Use computed() for derived state
   - Use effect() for side effects

3. **File Organization**
   - No inline templates — always use templateUrl (.html file)
   - No inline styles — always use styleUrl (.scss file)

4. **Template Control Flow**
   - Use @if, @for, @switch (never *ngIf, *ngFor)
   - Always use track in @for: `@for (item of items; track item.id)`

5. **OnPush Change Detection**
   - Always use OnPush for all components

6. **No Inline Logic**
   - No inline logic in templates — extract to methods or computed signals

7. **Modification Discipline**
   - Only modify what was explicitly requested
   - Never rewrite an entire file to fix one thing
   - Never add unrequested features, refactoring, or renaming

8. **Type Safety**
   - Never use `any` type
   - Always type request and response for API calls
   - Use typed FormGroup<{...}> always

9. **Error Handling**
   - All HTTP calls must handle errors — never silent failures
   - Never expose raw API error messages to the UI

10. **Security**
    - No hardcoded API keys or secrets in source code
    - Never use innerHTML without DomSanitizer
    - No sensitive data in localStorage
