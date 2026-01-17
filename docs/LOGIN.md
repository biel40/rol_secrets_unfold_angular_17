# Sistema de Autenticación - Documentación Técnica

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Componentes del Sistema](#componentes-del-sistema)
3. [Flujos de Autenticación](#flujos-de-autenticación)
4. [Gestión de Sesión](#gestión-de-sesión)
5. [Guards de Rutas](#guards-de-rutas)
6. [Mejores Prácticas Aplicadas](#mejores-prácticas-aplicadas)
7. [Mejoras Futuras Recomendadas](#mejoras-futuras-recomendadas)

---

## Arquitectura General

El sistema de autenticación utiliza **Supabase Auth** como backend de autenticación, integrado con Angular mediante un patrón de servicios centralizados.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ AuthComponent│───▶│  UserService │◀───│   AppComponent   │  │
│  │   (Login)    │    │ (Estado User)│    │ (Init Auth Sync) │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SupabaseService                        │    │
│  │  - signIn() / signUp() / signOut()                      │    │
│  │  - getSession() / authChanges()                          │    │
│  │  - Configuración cliente Supabase                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     localStorage                         │    │
│  │  - 'rol-secrets-unfold-auth-v2' (Session de Supabase)   │    │
│  │  - 'user' (User object para acceso rápido)              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Supabase)                          │
├─────────────────────────────────────────────────────────────────┤
│  - Supabase Auth (JWT tokens)                                   │
│  - PostgreSQL (profiles, habilities, etc.)                      │
│  - Row Level Security (RLS)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes del Sistema

### 1. SupabaseService (`src/app/services/supabase/supabase.service.ts`)

**Responsabilidad**: Capa de abstracción para todas las operaciones con Supabase.

#### Configuración del Cliente

```typescript
this._supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
  auth: {
    persistSession: true,                    // Persiste sesión en localStorage
    storageKey: 'rol-secrets-unfold-auth-v2', // Clave única para evitar conflictos
    storage: localStorage,                   // Usa localStorage como almacenamiento
    autoRefreshToken: true,                  // Renueva automáticamente tokens expirados
    detectSessionInUrl: true,                // Detecta tokens en URL (OAuth)
    flowType: 'implicit',                    // Flujo de autenticación implícito
    debug: false                             // Sin logs de debug en producción
  },
  global: {
    headers: { 'x-my-custom-header': 'rol-secrets-unfold' }
  }
});
```

#### Métodos de Autenticación

| Método | Descripción |
|--------|-------------|
| `signIn(email, password)` | Inicia sesión con credenciales |
| `signUp(email, password)` | Registra nuevo usuario |
| `signOut()` | Cierra sesión y limpia tokens |
| `getSession()` | Obtiene sesión actual (cached) |
| `authChanges(callback)` | Suscripción a cambios de autenticación |

---

### 2. UserService (`src/app/services/user/user.service.ts`)

**Responsabilidad**: Gestión del estado del usuario autenticado en la aplicación.

#### Estado y Sincronización

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
    protected user: User | null = null;
    private _authSubscription: { unsubscribe: () => void } | null = null;

    // Inicializa sincronización con Supabase Auth
    public async initializeAuthSync(): Promise<void> {
        // 1. Obtiene sesión actual
        const session = await this._supabaseService.getSession();
        
        // 2. Valida expiración del token
        const isSessionValid = !!session?.user && 
                               !!session?.expires_at && 
                               session.expires_at > Math.floor(Date.now() / 1000);

        // 3. Sincroniza estado
        if (isSessionValid) {
            this.setUser(session!.user);
        } else {
            this.clearUser();
        }

        // 4. Escucha cambios futuros (refresh, logout, etc.)
        const { data } = this._supabaseService.authChanges((_, updatedSession) => {
            if (updatedSession?.user) {
                this.setUser(updatedSession.user);
            } else {
                this.clearUser();
            }
        });

        this._authSubscription = data?.subscription ?? null;
    }
}
```

#### Persistencia Dual

El sistema mantiene dos almacenamientos:

1. **Supabase Auth Storage** (`rol-secrets-unfold-auth-v2`): Contiene la sesión completa con tokens JWT
2. **User Cache** (`user`): Objeto User simplificado para acceso rápido sin parsing de tokens

---

### 3. AuthComponent (`src/app/components/auth/auth.component.ts`)

**Responsabilidad**: Interfaz de usuario para login y registro.

#### Flujo de Inicialización

```typescript
constructor() {
    this._checkUserSession();  // Verifica sesión existente al cargar
}

private async _checkUserSession() {
    const session = await this._supabaseService.getSession();
    
    // Valida que la sesión no haya expirado
    const isSessionValid = !!session?.user && 
                           !!session?.expires_at && 
                           session.expires_at > Math.floor(Date.now() / 1000);

    if (!isSessionValid) {
        this._userService.clearUser();
        return;  // Muestra formulario de login
    }

    // Sesión válida: redirige según rol
    this.user = session!.user;
    this._userService.setUser(this.user);

    // Verifica que el perfil exista en BD
    const userIsInDb = await this._supabaseService.profile(this.user);
    
    // Redirige a admin o profile según email
    const isAdmin = this.user?.email === "dmthesecretsunfold@gmail.com";
    this._router.navigate([isAdmin ? 'admin' : 'profile']);
}
```

---

## Flujos de Autenticación

### Login Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│    Usuario  │────▶│ AuthComponent│────▶│SupabaseAuth │────▶│ Supabase │
│ (email/pwd) │     │  handleLogin │     │   signIn()  │     │  Server  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
                           │                                       │
                           │◀─────────── { user, session } ◀───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ UserService  │
                    │  setUser()   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Router     │
                    │  navigate()  │
                    └──────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              [/admin]      [/profile]
            (si es DM)    (usuario normal)
```

### Signup Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│    Usuario  │────▶│ AuthComponent│────▶│SupabaseAuth │────▶│ Supabase │
│ (email/pwd) │     │ handleSignup │     │   signUp()  │     │  Server  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
                           │                                       │
                           │◀─────────── { user, session } ◀───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │_createProfile│  ← Crea perfil RPG en BD
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Router     │
                    │[/new-profile]│  ← Configuración inicial
                    └──────────────┘
```

### Session Restore Flow (al recargar página)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ AppComponent│────▶│ UserService  │────▶│SupabaseAuth │
│  ngOnInit() │     │initAuthSync()│     │ getSession()│
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           │◀──── session ◀──────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            [session válida] [session inválida]
                    │             │
                    ▼             ▼
              setUser()      clearUser()
              (restaura)     (limpia cache)
```

---

## Gestión de Sesión

### Tokens JWT de Supabase

Supabase Auth utiliza **JWT (JSON Web Tokens)** para autenticación:

| Token | Duración | Propósito |
|-------|----------|-----------|
| `access_token` | 1 hora | Autorización de requests |
| `refresh_token` | 1 semana | Renovar access_token |

### Auto-Refresh de Tokens

La configuración `autoRefreshToken: true` permite que Supabase:

1. Detecte cuando el `access_token` está por expirar
2. Use el `refresh_token` para obtener nuevos tokens
3. Actualice automáticamente el localStorage
4. Emita evento a `authChanges()` para sincronizar estado

### Validación de Expiración

```typescript
const isSessionValid = !!session?.user && 
                       !!session?.expires_at && 
                       session.expires_at > Math.floor(Date.now() / 1000);
```

- `expires_at`: Timestamp UNIX de expiración del token
- `Date.now() / 1000`: Timestamp actual en segundos
- Si `expires_at > now`: Token aún válido

---

## Guards de Rutas

### authGuard (`src/app/guards/auth.guard.ts`)

Protege rutas que requieren autenticación básica.

```typescript
export const authGuard: CanActivateFn = async () => {
  const userService = inject(UserService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    let user = userService.getUser();

    // Fallback: verificar sesión en Supabase
    if (!user) {
      const session = await supabaseService.getSession();
      user = session?.user ?? null;
      userService.setUser(user);
    }

    // Requiere email confirmado
    if (user && user.email_confirmed_at) {
      return true;
    }
  } catch (error) {
    console.error('Auth guard error:', error);
  }

  return router.createUrlTree(['']);  // Redirige a login
};
```

### adminGuard (`src/app/guards/admin.guard.ts`)

Protege rutas exclusivas del Dungeon Master.

```typescript
const ADMIN_EMAIL = 'dmthesecretsunfold@gmail.com';

export const adminGuard: CanActivateFn = async () => {
  // ... misma lógica que authGuard ...

  // Verificación adicional: email de admin
  if (user && user.email_confirmed_at && user.email === ADMIN_EMAIL) {
    return true;
  }

  return router.createUrlTree(['']);
};
```

### Rutas Protegidas

```typescript
export const routes: Routes = [
  { path: '', component: AuthComponent },                              // Público
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'profile-edit', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'new-profile', component: NewProfileComponent, canActivate: [authGuard] },
  { path: 'profile-stats-edit', component: ProfileStatsEditComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
```

---

## Mejores Prácticas Aplicadas

### ✅ Implementadas

1. **Persistencia de Sesión**
   - `persistSession: true` mantiene la sesión entre recargas
   - `storageKey` único evita conflictos con otras apps

2. **Auto-Refresh de Tokens**
   - `autoRefreshToken: true` renueva tokens automáticamente
   - Evita expiración mientras el usuario está activo

3. **Validación de Expiración**
   - Se verifica `expires_at` antes de confiar en la sesión
   - Limpia estado si el token ha expirado

4. **Sincronización Reactiva**
   - `authChanges()` mantiene el estado sincronizado
   - Reacciona a logout desde otras pestañas

5. **Guards Funcionales**
   - Uso de `CanActivateFn` (patrón moderno de Angular)
   - Verificación async con fallback a Supabase

6. **Separación de Responsabilidades**
   - `SupabaseService`: Operaciones con Supabase
   - `UserService`: Estado de la aplicación
   - `AuthComponent`: UI de autenticación

7. **Manejo de Errores**
   - Mensajes específicos según tipo de error
   - Snackbar para feedback al usuario

---

## Mejoras Futuras Recomendadas

### 🔧 Mejoras de Seguridad

1. **Usar PKCE Flow en lugar de Implicit**
   ```typescript
   auth: {
     flowType: 'pkce',  // Más seguro que 'implicit'
   }
   ```

2. **Validación de Token en Guards**
   ```typescript
   // En lugar de solo verificar user, validar expiración
   const session = await supabaseService.getSession();
   const isValid = session?.expires_at > Date.now() / 1000;
   ```

3. **Centralizar Email de Admin**
   ```typescript
   // Crear archivo de constantes
   // src/app/constants/auth.constants.ts
   export const ADMIN_EMAILS = ['dmthesecretsunfold@gmail.com'];
   ```

### 🔧 Mejoras de UX

1. **Loading State Durante Verificación**
   ```typescript
   // Mostrar spinner mientras se verifica sesión
   public isCheckingSession = signal(true);
   ```

2. **Manejo de Sesión Expirada**
   ```typescript
   // Notificar al usuario y ofrecer re-login
   if (!isSessionValid) {
     this._snackBar.open('Tu sesión ha expirado', 'Iniciar Sesión');
   }
   ```

### 🔧 Mejoras de Arquitectura

1. **Lazy Loading de AuthComponent**
   ```typescript
   { 
     path: '', 
     loadComponent: () => import('./components/auth/auth.component')
       .then(m => m.AuthComponent) 
   }
   ```

2. **Unsubscribe en UserService**
   ```typescript
   public destroyAuthSync(): void {
     this._authSubscription?.unsubscribe();
     this._authSubscription = null;
   }
   ```

3. **Signals para Estado Reactivo**
   ```typescript
   // Migrar UserService a signals
   public readonly user = signal<User | null>(null);
   public readonly isAuthenticated = computed(() => !!this.user());
   ```

---

## Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/app/services/supabase/supabase.service.ts` | Cliente Supabase y métodos auth |
| `src/app/services/user/user.service.ts` | Estado del usuario |
| `src/app/components/auth/auth.component.ts` | UI de login/signup |
| `src/app/app.component.ts` | Inicialización de auth sync |
| `src/app/guards/auth.guard.ts` | Protección rutas autenticadas |
| `src/app/guards/admin.guard.ts` | Protección rutas admin |
| `src/app/app.routes.ts` | Definición de rutas |
| `src/environments/environment.ts` | Credenciales Supabase |

---

## Debugging

### Habilitar Logs de Supabase

```typescript
auth: {
  debug: true,  // Activa logs en consola
}
```

### Verificar Sesión Manualmente

```javascript
// En consola del navegador
localStorage.getItem('rol-secrets-unfold-auth-v2');
```

### Forzar Logout

```javascript
// En consola del navegador
localStorage.removeItem('rol-secrets-unfold-auth-v2');
localStorage.removeItem('user');
location.reload();
```
