# AI Nutrition Tracker — Implementation Plan

## 1. Executive Summary

Add a new AI Nutrition Tracker feature to the existing Angular 21 + Supabase application. Users can log meals via image upload or text description, receive AI-estimated nutrition data (calories, protein, carbs, fat, fiber, sugars, sodium) from Google Gemini, review/edit results before saving, and track daily progress against personalized nutrition targets.

---

## 2. Feature Breakdown

### 2.1 Must-Have Features (V1 Scope)

| # | Feature | Description |
|---|---------|-------------|
| F1 | **Auth & Profile Extension** | Add nutrition target fields (calories, protein, carbs, fat, fiber) to user profiles. Allow users to set and update targets. |
| F2 | **Meal Input (Image)** | User uploads one or more food images via file picker or camera. Preview, drag-and-drop support. |
| F3 | **Meal Input (Text)** | User types a natural-language meal description (e.g., "2 eggs, 2 slices toast, labneh"). |
| F4 | **AI Analysis (Gemini)** | Send image + prompt or text + prompt to Gemini via a secure backend proxy. Receive structured JSON with meal items, nutrient estimates, confidence, and assumptions. |
| F5 | **Meal Review & Edit** | Display AI analysis result. User can edit items, adjust quantities/grams, delete items, add notes, and trigger recalculation. Must manually confirm/save. |
| F6 | **Daily Dashboard** | Show today's consumed totals for calories, protein, carbs, fat, fiber, sugars, sodium. Show remaining values against targets. Progress bars for calories, protein, carbs, fat. Meal timeline with thumbnails. |
| F7 | **Meal History** | Browse past days, see daily totals, expand any day to view all meals and their line items. |
| F8 | **Supabase Persistence** | All meals, meal items, daily summaries, analysis events stored in Supabase with RLS. Images stored in Supabase Storage. |

### 2.2 Nice-to-Have (Post-V1)

- Daily streaks, water tracking, barcode scan, weekly charts, favorite meals, reuse recent meal templates.

---

## 3. Affected Files & Folders

### 3.1 Existing Files to Modify

| File | Change |
|------|--------|
| `src/environments/environment.ts` | Add `gemini.apiKey` placeholder and `supabase.functionsUrl` |
| `src/environments/environment.production.ts` | Same as above |
| `src/app/app.routes.ts` | Add lazy-loaded nutrition routes under dashboard shell |
| `src/app/app.config.ts` | May need to add providers (e.g., `provideHttpClient` — already present) |
| `src/app/core/auth/profile.interface.ts` | Extend `Profile` interface with nutrition target fields |
| `src/app/core/auth/auth.service.ts` | May need to update `loadProfile` or add profile update method |
| `src/app/layout/components/side-navigation/side-navigation.component.ts` | Add "Nutrition" nav link to `mainLinks` array |
| `src/app/layout/components/side-navigation/side-navigation.component.html` | No change needed (template already iterates `mainLinks`) |

### 3.2 New Files to Create

```
src/app/features/nutrition/
├── nutrition.routes.ts                        # Lazy-loaded routes for nutrition feature
├── models/
│   ├── meal.model.ts                          # Meal, MealItem, DailySummary interfaces
│   ├── nutrition-goal.model.ts                # NutritionGoal / Profile extension types
│   └── ai-analysis.model.ts                   # Gemini response schema types
├── services/
│   ├── nutrition-api.service.ts               # Supabase queries for meals, summaries, goals
│   ├── nutrition-analysis.service.ts          # HTTP calls to Edge Function for Gemini
│   └── nutrition.facade.ts                    # Signal-based state management
├── pages/
│   ├── nutrition-dashboard/
│   │   ├── nutrition-dashboard.page.ts
│   │   ├── nutrition-dashboard.page.html
│   │   └── nutrition-dashboard.page.scss
│   ├── add-meal/
│   │   ├── add-meal.page.ts
│   │   ├── add-meal.page.html
│   │   └── add-meal.page.scss
│   ├── meal-review/
│   │   ├── meal-review.page.ts
│   │   ├── meal-review.page.html
│   │   └── meal-review.page.scss
│   ├── meal-history/
│   │   ├── meal-history.page.ts
│   │   ├── meal-history.page.html
│   │   └── meal-history.page.scss
│   └── profile-goals/
│       ├── profile-goals.page.ts
│       ├── profile-goals.page.html
│       └── profile-goals.page.scss
├── components/
│   ├── meal-input/
│   │   ├── meal-input.component.ts
│   │   ├── meal-input.component.html
│   │   └── meal-input.component.scss
│   ├── nutrient-display/
│   │   ├── nutrient-display.component.ts
│   │   ├── nutrient-display.component.html
│   │   └── nutrient-display.component.scss
│   ├── progress-ring/
│   │   ├── progress-ring.component.ts
│   │   ├── progress-ring.component.html
│   │   └── progress-ring.component.scss
│   ├── meal-timeline/
│   │   ├── meal-timeline.component.ts
│   │   ├── meal-timeline.component.html
│   │   └── meal-timeline.component.scss
│   ├── meal-card/
│   │   ├── meal-card.component.ts
│   │   ├── meal-card.component.html
│   │   └── meal-card.component.scss
│   └── confidence-badge/
│       ├── confidence-badge.component.ts
│       ├── confidence-badge.component.html
│       └── confidence-badge.component.scss
└── index.ts                                    # Barrel exports (optional)

supabase/
├── functions/
│   └── analyze-meal/
│       ├── index.ts                            # Edge Function: receives image/text, calls Gemini, returns JSON
│       └── package.json                        # Dependencies: @google/generative-ai
└── migrations/
    ├── 008_extend_profiles.sql                  # Add nutrition target columns to profiles
    ├── 009_create_meals_table.sql               # meals table
    ├── 010_create_meal_items_table.sql           # meal_items table
    ├── 011_create_daily_summaries_table.sql      # daily_summaries table
    └── 012_create_analysis_events_table.sql      # analysis_events table
```

---

## 4. Database Schema Changes (SQL Migrations)

### Migration 008: Extend Profiles

Extend the existing `profiles` table (already created by Supabase or the todo setup) to add nutrition target columns.

```sql
-- 008_extend_profiles.sql
-- Add nutrition target columns to profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calorie_target numeric DEFAULT 2000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protein_target_g numeric DEFAULT 150;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carbs_target_g numeric DEFAULT 250;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fat_target_g numeric DEFAULT 65;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fiber_target_g numeric DEFAULT 25;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'maintain'
    CHECK (goal_type IN ('lose', 'maintain', 'gain'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('male', 'female', 'other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate'
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_system text DEFAULT 'metric'
    CHECK (unit_system IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

### Migration 009: Create meals table

```sql
-- 009_create_meals_table.sql
CREATE TABLE IF NOT EXISTS meals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_name text NOT NULL,
    meal_type text NOT NULL DEFAULT 'other'
        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    logged_at timestamptz NOT NULL DEFAULT now(),
    input_mode text NOT NULL CHECK (input_mode IN ('image', 'text')),
    source_text text,
    image_path text,
    analysis_confidence numeric(3,2),
    assumptions_json jsonb,
    ai_raw_response_json jsonb,
    is_confirmed boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON meals(logged_at);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
    ON meals FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
    ON meals FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
    ON meals FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
    ON meals FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migration 010: Create meal_items table

```sql
-- 010_create_meal_items_table.sql
CREATE TABLE IF NOT EXISTS meal_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name text NOT NULL,
    estimated_quantity text,
    estimated_weight_grams numeric,
    calories numeric NOT NULL DEFAULT 0,
    protein_g numeric NOT NULL DEFAULT 0,
    carbs_g numeric NOT NULL DEFAULT 0,
    fat_g numeric NOT NULL DEFAULT 0,
    fiber_g numeric NOT NULL DEFAULT 0,
    sugars_g numeric NOT NULL DEFAULT 0,
    sodium_mg numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal items"
    ON meal_items FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own meal items"
    ON meal_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own meal items"
    ON meal_items FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own meal items"
    ON meal_items FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));
```

### Migration 011: Create daily_summaries table

```sql
-- 011_create_daily_summaries_table.sql
CREATE TABLE IF NOT EXISTS daily_summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_date date NOT NULL,
    calories_total numeric NOT NULL DEFAULT 0,
    protein_total_g numeric NOT NULL DEFAULT 0,
    carbs_total_g numeric NOT NULL DEFAULT 0,
    fat_total_g numeric NOT NULL DEFAULT 0,
    fiber_total_g numeric NOT NULL DEFAULT 0,
    sugars_total_g numeric NOT NULL DEFAULT 0,
    sodium_total_mg numeric NOT NULL DEFAULT 0,
    meal_count int NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
    ON daily_summaries FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
    ON daily_summaries FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
    ON daily_summaries FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update daily_summaries when meals change
-- (Will be implemented as a separate function or handled application-side)
```

### Migration 012: Create analysis_events table

```sql
-- 012_create_analysis_events_table.sql
CREATE TABLE IF NOT EXISTS analysis_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id uuid REFERENCES meals(id) ON DELETE SET NULL,
    model_name text NOT NULL DEFAULT 'gemini-2.0-flash',
    input_type text NOT NULL CHECK (input_type IN ('image', 'text')),
    status text NOT NULL CHECK (status IN ('success', 'error', 'low_confidence')),
    latency_ms int,
    error_message text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_events_user_id ON analysis_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_events_meal_id ON analysis_events(meal_id);

ALTER TABLE analysis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis events"
    ON analysis_events FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis events"
    ON analysis_events FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
```

---

## 5. Gemini Integration Strategy

### Architecture

```
[Angular Frontend] --HTTP POST--> [Supabase Edge Function] --Gemini API--> [Google Gemini]
                                        |
                                   [Supabase DB write]
```

- **Never expose the Gemini API key** to the frontend. It stays in Edge Function environment variables.
- Supabase Edge Functions are Deno-based. Use `@google/generative-ai` npm package or direct REST calls to Gemini.

### Edge Function: `analyze-meal`

**Input:**
```typescript
interface AnalyzeMealRequest {
  imageBase64?: string;       // base64-encoded image, optional
  mimeType?: string;          // image/jpeg, image/png, etc.
  textDescription?: string;   // free-text meal description, optional
  mealType?: string;          // breakfast, lunch, dinner, snack, other
}
```

**Logic:**
1. Receive request with JWT from authenticated user (Supabase Auth context).
2. Build Gemini prompt based on input type (image vs text).
3. Call Gemini with `response_mime_type: application/json` and the structured schema.
4. Parse and validate the JSON response against the expected schema.
5. Return structured result to frontend.
6. Optionally log to `analysis_events` table directly from Edge Function.

**Output:**
```typescript
interface AnalyzeMealResponse {
  success: boolean;
  data?: MealAnalysis;       // The structured JSON from Gemini
  error?: string;
}
```

### Prompt Templates

See PRD prompt design section. Use those verbatim, customized to include the JSON schema in the system instruction.

### Model Choice
- **Primary**: `gemini-2.0-flash` — fast, cheap, supports multimodal and JSON mode.
- **Fallback**: `gemini-1.5-pro` — if more accuracy needed for complex images.

### JSON Response Validation
- The Edge Function should validate the Gemini response against the schema using a lightweight JSON schema validator (e.g., `zod` or manual validation).
- If validation fails, return a clear error to the frontend so the user can retry.

---

## 6. Supabase Storage Strategy for Meal Images

### Bucket Setup
- Create a new Storage bucket: `meal-images`
- Set bucket to `private` (not public)

### Upload Flow
1. Frontend uploads image directly to Supabase Storage using the authenticated client.
2. Path pattern: `meal-images/{userId}/{mealId}/{timestamp}-{filename}`
3. After upload, store only the `image_path` (storage path) in the `meals` table.

### RLS for Storage
```sql
CREATE POLICY "Users can view own meal images"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own meal images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own meal images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Edge Function Image Access
- The Edge Function receives a signed URL or the base64 data from the frontend (not from storage directly for the analysis call, since we need to send data to Gemini).
- **Option A**: Frontend reads image as base64, sends to Edge Function in the request body.
- **Option B**: Frontend uploads to storage first, then Edge Function generates a signed URL and fetches it.
- **Recommendation**: Option A is simpler for V1 (read as base64 client-side, send to Edge Function).

### Image Cleanup
- When a meal is deleted, the associated image in storage should also be deleted.
- Handle this in the frontend or via a Supabase database function/trigger.

---

## 7. Angular Architecture & Route Design

### Route Structure

```typescript
// app.routes.ts additions
{
  path: 'nutrition',
  loadChildren: () => import('./features/nutrition/nutrition.routes').then(m => m.NUTRITION_ROUTES),
}
```

```typescript
// nutrition.routes.ts
export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/nutrition-dashboard/nutrition-dashboard.page')
      .then(m => m.NutritionDashboardPage),
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add-meal/add-meal.page')
      .then(m => m.AddMealPage),
  },
  {
    path: 'review',
    loadComponent: () => import('./pages/meal-review/meal-review.page')
      .then(m => m.MealReviewPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/meal-history/meal-history.page')
      .then(m => m.MealHistoryPage),
  },
  {
    path: 'goals',
    loadComponent: () => import('./pages/profile-goals/profile-goals.page')
      .then(m => m.ProfileGoalsPage),
  },
];
```

### State Management Pattern

Follow the existing **Facade + Signal** pattern (matching `TodoFacade`):

```
NutritionFacade (signal<NutritionState>)
  ├── computed signals: todayMeals, todayTotals, dailyProgress, mealHistory, isLoading, error
  ├── load methods: loadTodayMeals, loadDailySummary, loadMealHistory
  ├── action methods: analyzeMeal, saveMeal, deleteMeal, updateMealItem, updateGoals
  └── delegates to:
       ├── NutritionApiService (Supabase queries)
       └── NutritionAnalysisService (Edge Function HTTP calls)
```

### State Interface

```typescript
interface NutritionState {
  todayMeals: Meal[];
  dailySummary: DailySummary | null;
  goals: NutritionGoals;
  mealHistory: { date: string; summary: DailySummary; meals: Meal[] }[];
  pendingAnalysis: MealAnalysis | null;   // AI result waiting for review
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### Services Layer

| Service | Responsibility |
|---------|---------------|
| `NutritionApiService` | All Supabase CRUD: meals, meal_items, daily_summaries, profile goals |
| `NutritionAnalysisService` | HTTP POST to Edge Function `analyze-meal`, handle response |
| `NutritionFacade` | State management, orchestrates API + Analysis services |

### Component Tree

```
NutritionDashboardPage
  ├── NutrientDisplayComponent (today's totals vs targets)
  ├── ProgressRingComponent (calorie ring)
  ├── MealTimelineComponent (meals today)
  │   └── MealCardComponent[] (individual meal)
  │       └── ConfidenceBadgeComponent
  └── [FAB button → AddMealPage]

AddMealPage
  ├── MealInputComponent (image upload + text input)
  └── [Analyze button → NutritionAnalysisService → MealReviewPage]

MealReviewPage
  ├── MealCardComponent (editable)
  ├── NutrientDisplayComponent (per-item and total)
  └── [Save/Cancel]

MealHistoryPage
  ├── Date picker/navigation
  ├── NutrientDisplayComponent (daily totals)
  └── MealTimelineComponent (meals for selected date)

ProfileGoalsPage
  └── Goal editing form (calories, protein, carbs, fat, fiber)
```

---

## 8. Security Considerations

### Gemini API Key
- Stored as Supabase Edge Function secret (`GEMINI_API_KEY`).
- Never in frontend code, env files, or version control.
- Edge Function authenticates via Supabase Auth JWT (user must be authenticated).

### Row Level Security
- Every table has RLS policies scoped to `auth.uid() = user_id`.
- Storage bucket policies restrict access to the owning user's folder.
- `meal_items` RLS uses a subquery to check ownership through the `meals` table.

### Image Security
- Storage bucket is `private`, not public.
- Use Supabase signed URLs for image display if needed (or read from client-side storage which already handles auth).
- Image path includes user UUID to prevent enumeration.

### API Key Validation
- Edge Function verifies the Supabase Auth JWT before processing.
- Invalid/expired tokens return 401.

### Data Privacy
- No sensitive health data is stored beyond nutrition estimates.
- Raw AI responses are stored for debugging/tuning but are private to each user.
- No PII is sent to Gemini — only food descriptions and images.

### Input Sanitization
- Text descriptions should be sanitized before logging and before sending to Gemini (prevent prompt injection).
- Image MIME types should be validated (accept only `image/jpeg`, `image/png`, `image/webp`).
- Max file size limit: 10MB per image.

---

## 9. Validation & Error Handling Plan

### Frontend Validation

| Scenario | Handling |
|----------|----------|
| Empty image + empty text | Disable "Analyze" button, show validation: "Upload an image or type a description" |
| Image too large (>10MB) | Reject before upload, show error toast |
| Unsupported image format | Validate MIME type, show error toast |
| Network error on analyze | Retry button (up to 3 attempts), fallback to text-only |
| Gemini response missing fields | Show partial data, mark as low-confidence, note which fields are missing |
| User edits invalid values | Validate numbers are non-negative, grams are reasonable range |
| Save conflict | Show retry dialog (unlikely but handle gracefully) |

### Backend/Edge Function Validation

| Scenario | Handling |
|----------|----------|
| Invalid JWT | Return 401 |
| Missing image AND text | Return 400: "Provide image or text description" |
| Gemini API timeout | Return 503 with retry-after header |
| Gemini response not valid JSON | Retry up to 2 times, then return error |
| Gemini response fails schema validation | Return error with Gemini raw text for debugging |
| Image decode failure | Return 400: "Unable to process image" |

### Error Display Pattern

Follow the existing pattern from `TodoFacade`: errors are stored as a signal string, displayed via PrimeNG `MessageService` toast.

### Confidence Handling

- `analysis_confidence >= 0.7`: Show green badge, auto-populate all fields.
- `analysis_confidence >= 0.4 and < 0.7`: Show amber badge, display assumptions list.
- `analysis_confidence < 0.4`: Show red badge, display assumptions, require explicit user confirmation before save.
- `clarifying_question` present: Show question prompt, let user add info and re-analyze.

---

## 10. Testing Strategy

### Unit Tests (Vitest)

| Target | What to Test |
|--------|-------------|
| `NutritionApiService` | Each method: returns data, handles errors, uses correct Supabase methods |
| `NutritionAnalysisService` | HTTP calls, response parsing, error handling, retry logic |
| `NutritionFacade` | State transitions, computed signals, load/save/delete flows, error propagation |
| `NutrientDisplayComponent` | Correct calculation of consumed vs target, remaining, percentages |
| `ProgressRingComponent` | SVG arc calculation, color transitions at thresholds |
| `ConfidenceBadgeComponent` | Correct color/icon based on confidence value |
| `MealInputComponent` | File selection, text input, validation states |

### Integration Tests

| Test | Description |
|------|-------------|
| Full meal logging flow | Upload image → analyze → review → save → dashboard updates |
| Text-only meal flow | Type description → analyze → review → save |
| Edit before save | Modify items, adjust grams, verify totals recalculate |
| Daily dashboard | Save multiple meals, verify totals, remaining, progress bars |
| Goal update | Change targets, verify dashboard recalculates |

### Edge Function Tests (Deno)

- Unit test prompt building and response parsing.
- Integration test with Gemini (using test API key).
- Test error handling for malformed inputs.

### E2E Tests (Playwright — future)

- Full user journey: login → add meal → review → dashboard.
- Image upload flow with mock camera.

---

## 11. Rollout Order

### Phase 1: Foundation (estimated: 2-3 days)

| Step | Task | Depends On |
|------|------|-----------|
| 1.1 | Create SQL migrations (008-012) | Nothing |
| 1.2 | Apply migrations to Supabase | 1.1 |
| 1.3 | Create Supabase Storage bucket `meal-images` + RLS policies | Nothing |
| 1.4 | Extend `Profile` interface and add nutrition targets | Nothing |
| 1.5 | Add `nutrition` route to app.routes.ts | Nothing |
| 1.6 | Add "Nutrition" nav link to side navigation | Nothing |
| 1.7 | Create empty feature folder structure | Nothing |
| 1.8 | Add environment vars (Gemini key placeholder, functions URL) | Nothing |

### Phase 2: Backend Edge Function (estimated: 2 days)

| Step | Task | Depends On |
|------|------|-----------|
| 2.1 | Create `supabase/functions/analyze-meal/` with package.json | Nothing |
| 2.2 | Implement Gemini API call with JSON mode | 2.1 |
| 2.3 | Build prompt templates (image + text) | 2.2 |
| 2.4 | Implement response validation against schema | 2.2 |
| 2.5 | Add auth JWT verification | 2.1 |
| 2.6 | Add error handling, timeouts, retries | 2.2 |
| 2.7 | Deploy Edge Function to Supabase | 2.1-2.6 |
| 2.8 | Set `GEMINI_API_KEY` secret in Supabase | 2.7 |

### Phase 3: Models, Services, Facade (estimated: 2 days)

| Step | Task | Depends On |
|------|------|-----------|
| 3.1 | Create TypeScript models (meal.model, nutrition-goal, ai-analysis) | 1.7 |
| 3.2 | Implement `NutritionApiService` (Supabase CRUD) | 3.1 |
| 3.3 | Implement `NutritionAnalysisService` (Edge Function HTTP calls) | 3.1, 2.7 |
| 3.4 | Implement `NutritionFacade` (state management) | 3.2, 3.3 |
| 3.5 | Update `AuthService` with profile/goal update methods | 1.4 |

### Phase 4: UI Components (estimated: 3-4 days)

| Step | Task | Depends On |
|------|------|-----------|
| 4.1 | `MealInputComponent` (image upload + text input) | 3.4 |
| 4.2 | `NutrientDisplayComponent` (totals vs targets) | 3.4 |
| 4.3 | `ProgressRingComponent` (SVG ring for calorie progress) | Nothing |
| 4.4 | `ConfidenceBadgeComponent` | 3.1 |
| 4.5 | `MealCardComponent` (meal summary with items) | 3.1 |
| 4.6 | `MealTimelineComponent` (day timeline) | 4.5, 3.1 |

### Phase 5: Pages (estimated: 3-4 days)

| Step | Task | Depends On |
|------|------|-----------|
| 5.1 | `AddMealPage` — wire up MealInputComponent + analyze flow | 4.1, 3.4 |
| 5.2 | `MealReviewPage` — display AI result, edit items, save | 4.2, 4.4, 4.5, 3.4 |
| 5.3 | `NutritionDashboardPage` — daily totals, progress, timeline | 4.2, 4.3, 4.6, 3.4 |
| 5.4 | `MealHistoryPage` — browse past days | 4.2, 4.6, 3.4 |
| 5.5 | `ProfileGoalsPage` — edit nutrition targets | 3.5, 3.4 |

### Phase 6: Integration & Polish (estimated: 2-3 days)

| Step | Task | Depends On |
|------|------|-----------|
| 6.1 | Wire up full navigation flow | All pages |
| 6.2 | Add skeleton loading states | All pages |
| 6.3 | Add empty states | All pages |
| 6.4 | Add error states and retry buttons | All pages |
| 6.5 | Responsive design audit | All pages |
| 6.6 | Optimistic dashboard refresh after meal save | 5.3 |

### Phase 7: Testing & Launch (estimated: 2-3 days)

| Step | Task | Depends On |
|------|------|-----------|
| 7.1 | Write unit tests for services | Phase 3 |
| 7.2 | Write unit tests for components | Phase 4 |
| 7.3 | Write unit tests for facade | Phase 3 |
| 7.4 | Integration test full flow | All phases |
| 7.5 | Manual QA on mobile viewports | All phases |
| 7.6 | Deploy to production | 7.1-7.5 |

**Total estimated time: 16-21 days**

---

## 12. Risks & Unknowns

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini JSON mode may produce invalid JSON | Medium | Implement robust retry + validation in Edge Function; fall back to raw text parsing |
| Image analysis quality varies widely by cuisine type | Medium | Show confidence clearly; allow text fallback; iterate on prompt design |
| Supabase Edge Functions cold start latency | Medium | Use warm-up pings or keep function warm; acceptable for 1.0 since analysis is async anyway |
| Large images slow down analysis | Low | Resize/compress images client-side before upload (max 1024px width) |
| User uploads non-food images | Low | Gemini will return low confidence; flag with clarifying question |
| Daily summary updates could be slow if recalculated per meal | Medium | Recalculate on save; use DB triggers for eventual consistency |
| Supabase free tier limits (Edge Function invocations, Storage) | Medium | Monitor usage; optimize image sizes; cache summaries |
| No existing Edge Functions in project — new pattern for team | Low | Document pattern; keep function simple |
| Browser support for camera API on mobile | Low | Provide file picker fallback; test on iOS Safari |
| Angular SSR hydration issues with client-only features | Low | Ensure nutrition pages are client-rendered; wrap in `isPlatformBrowser` if needed |

---

## 13. Blockers & Assumptions

### Assumptions

1. **Supabase project is already configured** with the existing credentials in `environment.ts` — no new Supabase project needed.
2. **Google Gemini API key** will be provisioned by the developer and set as a Supabase Edge Function secret.
3. **Existing auth flow** (email/password via Supabase Auth) is sufficient — no auth changes needed.
4. **The existing `update_updated_at_column()` function** already exists in the database (created by migration 001). The new migrations reference it.
5. **Tailwind CSS 4 + PrimeNG** are the styling toolkit — all new components will use them.
6. **Angular 21 standalone** with `OnPush` change detection — all new components follow this.
7. **Mobile-first responsive design** — all new pages will be responsive.
8. **English-only** for V1 (no i18n).
9. **Daily summaries** will be calculated and stored application-side (the facade computes totals from meals for a date and upserts the summary row).

### Blockers

1. **Google Gemini API key** must be obtained before the Edge Function can be tested.
2. **Supabase CLI** must be configured to deploy Edge Functions (`supabase functions deploy`).
3. **Edge Functions require Deno** — the developer must have Deno installed locally for development and testing.
4. **The existing project has no Edge Functions** — the `supabase/functions/` directory needs to be initialized and configured.
5. **Unit test infrastructure** (Vitest) exists but has minimal coverage — need to ensure testing patterns are consistent.

---

## 14. Key Conventions to Follow

From `AGENTS.md` and observed code patterns:

| Convention | How to Apply |
|-----------|-------------|
| Standalone components | Every component uses `standalone: true` |
| OnPush change detection | `changeDetection: ChangeDetectionStrategy.OnPush` on every component |
| `inject()` over constructor injection | Always use `inject()` |
| Signals for all state | `signal()`, `computed()`, never plain properties |
| `@if`/`@for`/`@switch` control flow | Never use `*ngIf`, `*ngFor` |
| `track` in `@for` | Always use `track` |
| `templateUrl` + `styleUrl` (`.html` + `.scss`) | No inline templates or styles |
| Type safety | No `any` types, all models typed |
| Facade pattern | Single `signal<State>` with computed derivations |
| Service `{ data, error }` tuple | Return `{ data, error }` from all API methods |
| Tailwind + CSS variables | Use Tailwind utility classes + CSS custom properties from `styles.css` |
| PrimeNG components | Use PrimeNG for inputs, buttons, dialogs, cards, etc. |

---

## 15. Implementation Checklist

### Phase 1 — Foundation
- [ ] Create `docs/plans/ai-nutrition-tracker-plan.md` (DONE — this file)
- [ ] Create SQL migrations 008-012
- [ ] Apply migrations to Supabase
- [ ] Create Supabase Storage bucket `meal-images` with RLS policies
- [ ] Extend `profile.interface.ts` with nutrition target fields
- [ ] Add nutrition routes to `app.routes.ts`
- [ ] Add "Nutrition" nav link to `side-navigation.component.ts`
- [ ] Create feature folder structure
- [ ] Update environment files with `gemini.apiKey` placeholder and `supabase.functionsUrl`

### Phase 2 — Edge Function
- [ ] Initialize `supabase/functions/` directory
- [ ] Create `analyze-meal` Edge Function
- [ ] Implement Gemini API integration
- [ ] Build prompt templates
- [ ] Implement JSON response validation
- [ ] Add JWT verification
- [ ] Add error handling and retries
- [ ] Deploy to Supabase
- [ ] Set `GEMINI_API_KEY` secret

### Phase 3 — Services & Models
- [ ] Create `meal.model.ts`
- [ ] Create `nutrition-goal.model.ts`
- [ ] Create `ai-analysis.model.ts`
- [ ] Implement `NutritionApiService`
- [ ] Implement `NutritionAnalysisService`
- [ ] Implement `NutritionFacade`

### Phase 4 — Shared Components
- [ ] `MealInputComponent`
- [ ] `NutrientDisplayComponent`
- [ ] `ProgressRingComponent`
- [ ] `ConfidenceBadgeComponent`
- [ ] `MealCardComponent`
- [ ] `MealTimelineComponent`

### Phase 5 — Pages
- [ ] `AddMealPage`
- [ ] `MealReviewPage`
- [ ] `NutritionDashboardPage`
- [ ] `MealHistoryPage`
- [ ] `ProfileGoalsPage`

### Phase 6 — Integration & Polish
- [ ] Wire up navigation and routing
- [ ] Add skeleton loading states
- [ ] Add empty states
- [ ] Add error states
- [ ] Responsive design audit
- [ ] Optimistic dashboard refresh

### Phase 7 — Testing & Launch
- [ ] Unit tests for services
- [ ] Unit tests for components
- [ ] Unit tests for facade
- [ ] Integration test full flow
- [ ] Manual QA
- [ ] Production deployment

---

## Implementation Approval Status

**Status:** `Waiting for approval`

Once approved with "نفذ" or "Implement now", execution will begin with Phases 1-7 in order.

**Note:** No code, schema, migration, configuration, or terminal changes have been made yet. This is a planning-only document.
