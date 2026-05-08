# Workflow Rules

## Git & Commits — Conventional Commits
Format: `type(scope): description`
Types: feat | fix | refactor | style | test | chore | docs | perf

Examples:
  - `feat(auth): add Google login`
  - `fix(dashboard): correct filter total calculation`
  - `perf(table): add track to user list`

Rules:
- Scope = domain/feature name
- Description: imperative, lowercase, no period, max 72 chars

## Testing
- Test file: same folder, `{name}.spec.ts`
- Unit test all services, repositories, facades
- Mock all HTTP — never hit real API in tests
- Mock services: jasmine.createSpyObj
- Coverage targets: services 80%, components 60%
- Test name: `should` + expected behavior

## Technical Debt Management
Flag format — add this comment when applicable:
```
// TECH-DEBT: [reason] — [what needs to be done later]
```

Rules:
- Never do a workaround without flagging it as TECH-DEBT
- If a quick fix introduces debt, flag it before writing
- Never accumulate debt silently
- Priority levels:
  - `// TECH-DEBT[HIGH]:` affects scalability or security
  - `// TECH-DEBT[MED]:` affects maintainability
  - `// TECH-DEBT[LOW]:` nice to have improvement

## Modification Rules — CRITICAL
- Only modify what was explicitly requested
- Never rewrite an entire file to fix one thing
- Show only the changed function/block, not the whole file
- Never add unrequested features, refactoring, or renaming

## Output Rules
- No "// Added by AI", "// Updated", "// TODO" comments
- No placeholders like "// rest of code here"
- Show exact location: "// In ngOnInit:" or "// Replace submitForm:"

## Asking Before Acting
- Change affects multiple files → list and ask first
- Architectural decision → present 2 options and ask
- Ambiguous requirement → ask one focused question
- State level unclear → ask which level (local/service/facade)
- Never assume — always ask if touching structure or patterns
