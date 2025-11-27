# Copilot Instructions - Rol Secrets Unfold

## Project Overview
Angular 17 hybrid RPG character management app with Supabase backend. Supports web, iOS, and Android via Capacitor.

## Architecture

### Core Service Pattern
All Supabase interactions go through `SupabaseService` (`src/app/services/supabase/supabase.service.ts`). This 700+ line service is the **single source of truth** for:
- Data models (`Profile`, `Hability`, `Enemy`, `NPC`, `Mission`, `Item`)
- CRUD operations for all entities
- Authentication (`signIn`, `signUp`, `signOut`)
- Realtime channels (battle-channel-room)

```typescript
// Pattern: Always inject SupabaseService for data operations
private _supabaseService: SupabaseService = inject(SupabaseService);
```

### State Management
- **UserService**: Manages authenticated user (Supabase `User`), persists to `localStorage`
- **ProfileService**: Manages current RPG profile, persists to `localStorage`
- **LoaderService**: Simple boolean state for loading spinners

### Component Structure
All components are **standalone** with explicit imports. Pattern:
```typescript
@Component({
    standalone: true,
    imports: [MaterialModule, TranslocoModule, /* specific deps */]
})
```

### Key Routes
- `/` → `AuthComponent` (login/register)
- `/admin` → `AdminComponent` (Game Master dashboard, restricted to `dmthesecretsunfold@gmail.com`)
- `/profile` → `ProfileComponent` (player view with stats, inventory, habilities)

## Development Commands
```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build
npm test           # Karma unit tests
```

## UI Patterns

### Material + Tailwind
- Angular Material 17 components via `MaterialModule` (`src/app/modules/material.module.ts`)
- TailwindCSS for layout (custom breakpoints: sm=400px, md=700px)
- SCSS for component-specific styles
- Theme: `pink-bluegrey` Material prebuilt theme

### Dialogs
Dialogs live in `src/app/components/dialogs/`. Each is standalone with `MAT_DIALOG_DATA` injection:
- `EnemyDialogComponent`, `NPCDialogComponent`, `MissionDialogComponent`
- `DiceMatDialogComponent` - dice rolling with animations
- `ViewHabilitiesDialogComponent`, `HabilityDialogComponent`

### Internationalization (i18n)
Uses **Transloco** (`@jsverse/transloco`). Translation files in `src/assets/i18n/{en,es}.json`.
```typescript
// In templates
{{ 'key' | transloco }}

// In components
imports: [TranslocoModule]
```

## Data Model Relationships
```
profiles (1) ←→ (N) profile_habilities ←→ (N) habilities
profiles (1) ←→ (N) items
misions → assigned_to → profiles.id
```

### Hability Filtering Logic
Habilities are filtered by: `level <= profile.level`, `power === profile.power`, `clase === profile.clase OR clase === 'Base'`

## Supabase Integration

### Environment Config
```typescript
// src/environments/environment.ts
export const environment = {
  supabaseUrl: 'https://...',
  supabaseKey: '...'
}
```

## Code Conventions
1. Use `inject()` for DI over constructor injection
2. Prefix private members with underscore: `private _supabaseService`
3. Keep Supabase queries in `SupabaseService`, not in components
4. Spanish error messages in user-facing alerts (primary audience)
5. All new components must be `standalone: true`
