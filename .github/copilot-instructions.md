# Copilot Instructions - Rol Secrets Unfold

## Project Overview
**Rol Secrets Unfold** es una aplicación RPG híbrida de gestión de personajes desarrollada en **Angular 17** con backend **Supabase**. Soporta web, iOS y Android mediante Capacitor. Es una aplicación que combina:

- 🎮 Sistema de gestión de personajes RPG
- ⚔️ Sistema de combate en tiempo real
- 👥 Panel del Dungeon Master (DM) para administración
- 📱 Aplicación multiplataforma
- 🌐 Internacionalización (ES/EN)

## Architecture Overview

### Tech Stack
- **Frontend**: Angular 17 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mobile**: Capacitor (iOS/Android)
- **UI Framework**: Angular Material 17 + TailwindCSS
- **i18n**: Transloco
- **Build Tool**: Angular CLI

### Folder Structure
```
src/
├── app/
│   ├── components/           # All Angular components
│   │   ├── admin/            # Admin/DM dashboard
│   │   ├── auth/             # Authentication flows
│   │   ├── dialogs/          # Material Dialog components
│   │   ├── profile/          # Player profile views
│   │   └── ...
│   ├── services/             # Business logic & data
│   │   ├── supabase/         # Supabase integration (PRIMARY)
│   │   ├── user/             # User auth state
│   │   ├── profile/          # Current RPG profile
│   │   └── loader/           # Loading spinners
│   ├── modules/              # Shared modules
│   │   └── material.module.ts
│   ├── app.config.ts         # Root configuration
│   ├── app.routes.ts         # Route definitions
│   └── transloco-loader.ts   # i18n loader
├── assets/
│   ├── i18n/                 # Translation files
│   │   ├── es.json
│   │   └── en.json
│   └── flags/                # Country flags for locale
├── environments/             # Environment configs
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.scss              # Global styles
```

---

## Core Architecture Patterns

### 1. Service-First Pattern
**SupabaseService** (`src/app/services/supabase/supabase.service.ts`) es el **single source of truth** para:

- ✅ Todas las operaciones CRUD
- ✅ Autenticación (signIn, signUp, signOut)
- ✅ Canales Realtime (batallas)
- ✅ Consultas a la base de datos
- ✅ Manejo de errores centralizado

**Principio clave**: Nunca accedas directamente a Supabase desde componentes. Todo debe pasar por SupabaseService.

```typescript
// ✅ CORRECTO
private _supabaseService = inject(SupabaseService);
const profile = await this._supabaseService.getProfileInfo(userId);

// ❌ INCORRECTO - No hagas esto
const { data } = await supabase.from('profiles').select('*');
```

### 2. Dependency Injection
Usa `inject()` en lugar de inyección por constructor:

```typescript
// ✅ Moderno (Angular 14+)
private _router = inject(Router);
private _dialog = inject(MatDialog);
private _supabaseService = inject(SupabaseService);

// ❌ Evitar
constructor(private router: Router, private dialog: MatDialog) { }
```

### 3. Standalone Components
Todos los componentes DEBEN ser `standalone: true`:

```typescript
@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.scss'],
    standalone: true,                              // ← REQUIRED
    imports: [
        MaterialModule,
        TranslocoModule,
        CommonModule,
        FormsModule
        // Add only needed imports
    ]
})
export class ExampleComponent { }
```

**Por qué**:
- Mejor tree-shaking
- Más modular
- Menos boilerplate
- Mejor rendimiento

### 4. State Management Pattern

Tenemos tres niveles de estado:

#### a) **UserService** - Autenticación global
```typescript
// Gestiona el usuario autenticado de Supabase
// Persiste en localStorage
// Usado en: AuthComponent, AdminComponent

const user = this._userService.getUser();
this._userService.setUser(newUser);
this._userService.clearUser();  // On logout
```

#### b) **ProfileService** - Perfil RPG actual
```typescript
// Gestiona el perfil RPG seleccionado
// Persiste en localStorage
// Usado en: ProfileComponent, stats, inventory

const profile = this._profileService.getProfile();
this._profileService.setProfile(newProfile);
```

#### c) **LoaderService** - Loading spinners
```typescript
// Estado simple para spinners
const isLoading = this._loaderService.isLoading();
this._loaderService.setLoading(true);
```

### 5. Dialog Components Pattern
Todos los diálogos están en `src/app/components/dialogs/` como componentes standalone:

```typescript
// Abriendo un diálogo
const dialogRef = this._dialog.open(HabilityDialogComponent, {
    data: { hability, associatedProfiles },
    width: '600px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: false,
    autoFocus: false
});

// Escuchando resultado
dialogRef.afterClosed().subscribe(result => {
    if (result) {
        // Usuario confirmó
    }
});
```

**Diálogos existentes**:
- `EnemyDialogComponent` - Crear/editar enemigos
- `NPCDialogComponent` - Crear/editar NPCs
- `MissionDialogComponent` - Crear/editar misiones
- `HabilityDialogComponent` - Crear/editar habilidades
- `HabilityAssociationDialogComponent` - Asociar habilidades a perfiles
- `ProfileEditDialogComponent` - Editar perfil del usuario
- `ViewHabilitiesDialogComponent` - Ver habilidades del personaje
- `DiceMatDialogComponent` - Tirador de dados con animaciones

---

## Data Model Architecture

### Database Schema (Supabase)
```
profiles
├── id (uuid, PK)              // Same as auth.users.id
├── username (text)
├── clase (text)               // Clase del personaje
├── power (text)               // Tipo de poder/elemento
├── level (integer)
├── weapon (text)
├── current_hp / total_hp
├── attack / defense
├── special_attack / special_defense
├── speed
├── current_experience
├── image_url
└── created_at / updated_at

profile_habilities (junction table)
├── profile_id (FK → profiles)
├── hability_id (FK → habilities)
└── learned_at

habilities
├── id (uuid, PK)
├── name (text)
├── description (text)
├── clase (text)
├── power (text)               // Pyro, Hydro, Electro, etc.
├── level (integer)
├── total_uses / current_uses
├── dice (text)                // Tipo de dado (d6, d20, etc.)
├── scales_with (text)         // Stat que escala (ATK, SP.ATK)
└── created_at / updated_at

enemies
├── id (uuid, PK)
├── name (text)
├── level (integer)
├── is_boss (boolean)
├── description (text)
├── current_hp / total_hp
├── defense (integer)
├── image_url
└── created_at / updated_at

missions
├── id (uuid, PK)
├── title (text)
├── description (text)
├── status ('pending'|'in_progress'|'completed'|'failed')
├── difficulty ('easy'|'medium'|'hard'|'legendary')
├── assigned_to (FK → profiles)
├── reward_xp / reward_gold
└── created_at / updated_at

npcs
├── id (uuid, PK)
├── name (text)
├── description (text)
├── location (text)
├── img_url (text)
└── created_at / updated_at

items
├── id (uuid, PK)
├── profile_id (FK → profiles)
├── name (text)
├── description (text)
├── quantity (integer)
├── value (integer)
├── img_src (text)
└── created_at / updated_at
```

### TypeScript Interfaces (src/app/services/supabase/supabase.service.ts)
Todas las interfaces están definidas en `SupabaseService`:

```typescript
// Perfil del jugador
export interface Profile {
  id?: string;              // Matches auth.users.id
  username?: string;
  clase: string;
  power: string;
  level: number;
  weapon: string;
  current_hp?: number;
  total_hp?: number;
  attack?: number;
  defense?: number;
  special_attack?: number;
  special_defense?: number;
  speed?: number;
  current_experience?: number;
  image_url?: string;
  habilities?: Hability[];
}

// Resumen de perfil (para listas)
export interface ProfileSummary {
  id?: string;
  username?: string;
  clase: string;
  level: number;
}

// Habilidad/Magia
export interface Hability {
  id?: string;
  name?: string;
  description?: string;
  clase: string;
  power: string;
  level: number;
  total_uses: number;
  current_uses: number;
  dice: string;
  scales_with: string;
}

// Enemigo en batalla
export interface Enemy {
  id: string;
  name: string;
  level: number;
  description: string;
  current_hp: number;
  total_hp: number;
  is_boss: boolean;
  image_url: string;
  defense?: number;
}

// NPC no jugable
export interface NPC {
  id: number;
  name: string;
  description: string;
  img_url: string;
}

// Misión/Quest
export interface Mission {
  id?: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  created_at?: string;
  updated_at?: string;
  assigned_to?: string;
  reward_xp?: number;
  reward_gold?: number;
}

// Item en inventario
export interface Item {
  id: number;
  profile_id: string;
  name: string;
  description: string;
  quantity: number;
  value: number;
  img_src: string;
}

// Usuario de auth
export interface UserReplica {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  user_metadata?: {
    full_name?: string;
  };
}
```

### Data Relationships
```
auth.users (Supabase Auth)
    ↓ (id match)
profiles (RPG data)
    ↓ (1:N)
profile_habilities (junction)
    ↓ (N:1)
habilities (skill library)

profiles (1:N)
    ↓
items (inventory)

missions (FK)
    ↓
profiles (assigned_to)
```

---

## UI & Styling Architecture

### Material Design + TailwindCSS
La aplicación usa dos sistemas de estilos coordinados:

#### **MaterialModule** (`src/app/modules/material.module.ts`)
Centraliza todos los componentes de Angular Material:

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
// ...

@NgModule({
  exports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    // ...
  ]
})
export class MaterialModule { }
```

**Siempre importa MaterialModule en componentes**:
```typescript
@Component({
    imports: [MaterialModule, TranslocoModule, CommonModule]
})
```

#### **TailwindCSS**
Usado para layout y responsive. Breakpoints custom en `tailwind.config.js`:

```javascript
module.breakpoints: {
  'sm': '400px',    // Mobile pequeño
  'md': '700px',    // Tablet
  'lg': '1024px',   // Desktop
}
```

#### **SCSS Components**
Cada componente tiene su propio `*.component.scss`:

```scss
// Variables globales
$primary-color: #1e40af;
$gold-color: #d4af37;
$bg-dark: #0f172a;

// Estructura:
// 1. Variables locales
// 2. Main container
// 3. Child selectors
// 4. Estado (:hover, :active, .active)
// 5. Responsive media queries
// 6. Animaciones

.component-container {
    display: flex;
    flex-direction: column;
    
    &:hover {
        transform: translateY(-2px);
    }
    
    @media (max-width: 640px) {
        padding: 0.5rem;
    }
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
}
```

### Theme Colors
La aplicación usa un tema **dark fantasy RPG**:

```scss
// Colores principales
$gold-color: #d4af37;           // Acentos, botones principales
$gold-light: #ffeba7;           // Hover, resaltados
$primary-color: #1e40af;        // Acciones secundarias
$bg-dark: #0f172a;              // Fondo oscuro
$bg-card: #2c3e50;              // Tarjetas
$text-primary: #e0e0e0;         // Texto principal
$text-secondary: rgba(224, 224, 224, 0.7);  // Subtexto

// Colores de elementos
$pyro: #e74c3c;   // Fuego - Rojo
$hydro: #3498db;  // Agua - Azul
$electro: #9b59b6; // Electricidad - Morado
$geo: #8b4513;    // Tierra - Marrón
$cryo: #74b9ff;   // Hielo - Azul claro
$natura: #27ae60; // Naturaleza - Verde
```

---

## Internationalization (i18n)

### Translation System (Transloco)
**Configuración**: `src/app/app.config.ts`
**Archivos**: `src/assets/i18n/{es,en}.json`

```typescript
// En componentes
imports: [TranslocoModule]

// En templates
{{ 'key-name' | transloco }}
{{ 'greeting' | transloco: { name: playerName } }}

// En TypeScript
import { TranslocoService } from '@jsverse/transloco';
private transloco = inject(TranslocoService);
const translated = this.transloco.translate('key');
```

**Estructura de traducciones**:
```json
{
  "common": "Común",
  "profile": "Perfil",
  "battle": "Batalla",
  "hability": "Habilidad",
  "associate-hability": "Asociar Habilidad",
  "cancel": "Cancelar",
  "save": "Guardar"
}
```

**Idiomas soportados**:
- `es` - Español (principal/default)
- `en` - English

---

## Routing Architecture

### Routes Definition (`src/app/app.routes.ts`)
```typescript
export const routes: Routes = [
  { path: '', component: AuthComponent },              // Login/Register
  { path: 'admin', component: AdminComponent },        // DM Dashboard (protegido)
  { path: 'profile', component: ProfileComponent },    // Vista de perfil
  { path: 'profile-edit', component: ProfileEditComponent },
  { path: 'new-profile', component: NewProfileComponent },
  { path: 'profile-stats-edit', component: ProfileStatsEditComponent },
  { path: '**', redirectTo: '' }                       // Fallback
];
```

### Route Guards
**IMPORTANTE**: El acceso a `/admin` debe estar **protegido** por email:

```typescript
// TODO: Implementar guard
if (this.user?.email !== 'dmthesecretsunfold@gmail.com') {
    this._router.navigate(['']);
    return;
}
```

**Estructura de componentes por ruta**:

| Ruta | Componente | Propósito |
|------|-----------|----------|
| `/` | AuthComponent | Login/Sign up |
| `/admin` | AdminComponent | Panel del DM (enemies, NPCs, missions, habilities, users) |
| `/profile` | ProfileComponent | Vista principal del perfil |
| `/profile-edit` | ProfileEditComponent | Editar datos básicos |
| `/new-profile` | NewProfileComponent | Crear nuevo personaje |
| `/profile-stats-edit` | ProfileStatsEditComponent | Editar estadísticas |

---

## Component Patterns

### Standard Component Structure
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        CommonModule,
        FormsModule
    ]
})
export class ExampleComponent implements OnInit {
    // 1. Inyecciones
    private _router = inject(Router);
    private _dialog = inject(MatDialog);
    private _supabaseService = inject(SupabaseService);

    // 2. Propiedades públicas (datos)
    public items: Item[] = [];
    public isLoading: boolean = false;
    public searchTerm: string = '';

    // 3. Propiedades privadas
    private _currentUser: User | null = null;

    // 4. Computed properties (getters)
    public get filteredItems(): Item[] {
        return this.items.filter(/* ... */);
    }

    // 5. Constructor (si es necesario)
    constructor() { }

    // 6. Lifecycle hooks
    public ngOnInit(): void {
        this._loadData();
    }

    // 7. Métodos públicos
    public openDialog(): void {
        const dialogRef = this._dialog.open(ExampleDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) this._loadData();
        });
    }

    // 8. Métodos privados
    private async _loadData(): Promise<void> {
        this.isLoading = true;
        try {
            const data = await this._supabaseService.getData();
            this.items = data;
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.isLoading = false;
        }
    }
}
```

### Component Best Practices

1. **Prefija métodos privados con underscore**:
   ```typescript
   private _loadData() { }     // ✅
   public openDialog() { }     // ✅
   private loadData() { }      // ❌
   ```

2. **Separa lógica de vista**:
   ```typescript
   // ✅ Usar computed properties
   public get hasItems(): boolean {
       return this.items.length > 0;
   }
   
   // ❌ Lógica en template
   // *ngIf="items.length > 0"
   ```

3. **Manejo de errores centralizado**:
   ```typescript
   try {
       await this._supabaseService.doSomething();
       this._showSuccess('Operación exitosa');
   } catch (error) {
       console.error('Error:', error);
       this._showError('Error al procesar la operación');
   }
   ```

4. **Cleaning up resources** (OnDestroy):
   ```typescript
   ngOnDestroy(): void {
       if (this.battleChannel) {
           this.battleChannel.unsubscribe();
       }
   }
   ```

---

## Common Operations

### Authentication Flow
```typescript
// Sign Up
const { user, session, error } = await this._supabaseService.signUp(
    email, 
    password, 
    username
);

// Sign In
const { user, session, error } = await this._supabaseService.signIn(
    email, 
    password
);

// Sign Out
this._supabaseService.signOut();
this._userService.clearUser();
this._router.navigate(['']);
```

### CRUD Operations
```typescript
// CREATE
const newEnemy = await this._supabaseService.createEnemy({
    name: 'Goblin',
    level: 5,
    is_boss: false,
    // ...
});

// READ
const enemies = await this._supabaseService.getEnemies();
const enemy = await this._supabaseService.getEnemy(enemyId);

// UPDATE
const updated = await this._supabaseService.updateEnemy(enemyId, {
    level: 10
});

// DELETE
const deleted = await this._supabaseService.deleteEnemy(enemyId);
```

### Error Handling
```typescript
// En métodos async
try {
    const result = await this._supabaseService.operation();
    if (result.error) {
        console.error('Supabase error:', result.error);
        this._showSnackbar('Error al procesar la operación');
        return;
    }
    this._showSnackbar('Operación exitosa');
} catch (error) {
    console.error('Caught error:', error);
    this._showSnackbar('Error inesperado');
}
```

### Snackbar Notifications
```typescript
private _snackBar = inject(MatSnackBar);

private _showSnackbar(message: string, duration = 3000): void {
    this._snackBar.open(message, 'Cerrar', { duration });
}
```

---

## Performance Optimization

### Change Detection
Use `OnPush` strategy para componentes que no cambian frecuentemente:

```typescript
@Component({
    selector: 'app-card',
    template: `<div>{{ item.name }}</div>`,
    changeDetection: ChangeDetectionStrategy.OnPush  // ← Mejor rendimiento
})
export class CardComponent {
    @Input() item: Item;
}
```

### Lazy Loading Routes (Future)
```typescript
export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component')
      .then(m => m.AdminComponent)
  }
];
```

### Image Optimization
```html
<!-- Siempre usa loading="lazy" -->
<img [src]="imageUrl" alt="Character" loading="lazy">

<!-- Para fondos CSS -->
<div [style.backgroundImage]="'url(' + imageUrl + ')'"></div>
```

### OnDestroy Cleanup
```typescript
ngOnDestroy(): void {
    // Cancela subscripciones
    if (this.subscription) this.subscription.unsubscribe();
    
    // Cancela operaciones en progreso
    if (this.battleChannel) this.battleChannel.unsubscribe();
}
```

---

## Testing Strategy

### Unit Tests (Karma)
```bash
npm test  # Run tests
```

**Estructura de tests**:
```typescript
describe('ExampleService', () => {
    let service: ExampleService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ExampleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should filter items correctly', () => {
        const items = [{ name: 'a' }, { name: 'b' }];
        const filtered = service.filterItems(items, 'a');
        expect(filtered.length).toBe(1);
    });
});
```

**Prioridades de testing**:
1. Services (lógica de negocio)
2. Componentes complejos (lógica condicional)
3. Guards y pipes

---

## Security Best Practices

### Authentication
- ✅ Mantén tokens en `localStorage` (UserService maneja esto)
- ✅ Verifica identidad en el backend (Supabase RLS)
- ✅ Valida email para `/admin` (DM-only)

### Data Validation
```typescript
// ✅ Valida en cliente
if (!email || !email.includes('@')) {
    throw new Error('Email inválido');
}

// ✅ Confía en RLS de Supabase para validación real
// Row Level Security en BD previene acceso no autorizado
```

### Environment Secrets
```typescript
// ✅ Usa environment.ts
export const environment = {
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseKey: 'eyJhbGc...'  // Clave pública de Supabase (segura)
};

// ❌ Nunca hardcodees en componentes
// ❌ Nunca subas .env a Git
```

---

## Development Workflow

### Setup
```bash
# Instala dependencias
npm install

# Copia archivo de ambiente (si existe)
cp .env.example .env

# Dev server
npm start
# Abre http://localhost:4200
```

### Building
```bash
# Desarrollo
npm start

# Producción
npm run build
# Output: dist/rol-secrets-unfold/

# Testing
npm test

# Linting (si exists)
npm run lint
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/nueva-caracteristica

# Commit con mensajes descriptivos
git commit -m "feat: agregar sistema de misiones"

# Push y PR
git push origin feature/nueva-caracteristica
```

### Commit Message Convention
```
feat: agregar nueva característica
fix: corregir bug específico
refactor: reorganizar código sin cambiar funcionalidad
docs: actualizar documentación
style: cambios de formato/estilos
perf: mejoras de rendimiento
test: agregar o actualizar tests
chore: tareas de mantenimiento
```

---

## Common Patterns & Antipatterns

### ✅ GOOD PATTERNS

1. **Observable Subscriptions**
   ```typescript
   ngOnInit() {
       this._supabaseService.someObservable$.subscribe(data => {
           this.data = data;
       });
   }
   
   ngOnDestroy() {
       // Cleanup
   }
   ```

2. **Error Boundaries**
   ```typescript
   try { ... }
   catch (error) {
       console.error('Specific error:', error);
       this._showError();
   }
   finally {
       this.isLoading = false;  // Siempre ejecuta
   }
   ```

3. **Computed Properties**
   ```typescript
   public get totalItems(): number {
       return this.items.reduce((sum, item) => sum + item.quantity, 0);
   }
   ```

4. **Control Flow & Content Projection**
   When using `@if` or `@else` inside components with content projection (like `mat-button`), ensure the block has a single root node.

   **❌ Incorrect (Causes ngtsc -998011):**
   ```html
   <button mat-button>
       @if (loading) {
           <mat-spinner></mat-spinner>
       } @else {
           <mat-icon>save</mat-icon>  <!-- Multiple root nodes in @else -->
           <span>Save</span>
       }
   </button>
   ```

   **✅ Correct:**
   ```html
   <button mat-button>
       @if (loading) {
           <mat-spinner></mat-spinner>
       } @else {
           <ng-container>             <!-- Wrap in ng-container -->
               <mat-icon>save</mat-icon>
               <span>Save</span>
           </ng-container>
       }
   </button>
   ```

### ❌ ANTIPATTERNS (EVITAR)

1. **Memory Leaks**
   ```typescript
   // ❌ Mala práctica - sin unsubscribe
   this._service.data$.subscribe(data => {
       this.data = data;
   });
   ```

2. **Direct DB Access**
   ```typescript
   // ❌ Nunca hagas esto en componentes
   const { data } = await supabase
       .from('profiles')
       .select('*');
   ```

3. **God Components**
   ```typescript
   // ❌ Un componente haciendo todo - muy grande
   // Divide en componentes más pequeños
   ```

4. **Nested ternaries**
   ```typescript
   // ❌ Difícil de leer
   {{ condition1 ? condition2 ? 'A' : 'B' : 'C' }}
   
   // ✅ Mejor usar métodos
   {{ getDisplayText() }}
   ```

---

## Future Improvements & TODOs

### High Priority
- [ ] Implementar Route Guards para `/admin`
- [ ] Lazy loading de componentes grandes
- [ ] Progressive Web App (PWA) support
- [ ] Unit tests para servicios críticos
- [ ] Error boundary component para manejo global de errores

### Medium Priority
- [ ] State management (NgRx / Akita)
- [ ] WebSocket para batallas en tiempo real
- [ ] Caché estratégico de datos
- [ ] Service Worker para offline mode
- [ ] Notificaciones push

### Low Priority
- [ ] Dark mode toggle
- [ ] Temas personalizables
- [ ] Estadísticas de DM
- [ ] Sistema de puntos/achievements
- [ ] Social features (amigos, guilds)

---

## Helpful Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material Components](https://material.angular.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Transloco Docs](https://jsverse.github.io/transloco/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

---

**Last Updated**: January 3, 2026
**Maintainer**: Biele
**Version**: Angular 17, Supabase v2

