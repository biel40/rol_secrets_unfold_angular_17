# Rol Secrets Unfold - Angular 21

🎮 **Aplicación de gestión de perfiles de rol y aventuras** desarrollada con Angular 21 y tecnologías modernas.

## 📋 Descripción del Proyecto

Esta aplicación permite a los usuarios crear y gestionar perfiles de personajes de rol, con un sistema completo de estadísticas, habilidades e inventario. Incluye funcionalidades de autenticación, internacionalización y soporte multiplataforma móvil.

## 🛠️ Stack Tecnológico

### Frontend
- **Angular 21.0.6** - Framework principal
- **Angular Material 21.0.5** - Componentes UI
- **TailwindCSS 3.4.1** - Framework de estilos
- **SCSS** - Preprocesador CSS
- **TypeScript 5.9.3** - Lenguaje de programación

### Backend y Base de Datos
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Base de datos (a través de Supabase)
- **Autenticación** - Sistema de auth integrado

### Herramientas y Librerías
- **Capacitor 6.x** - Framework híbrido para iOS/Android
- **Transloco** - Internacionalización (i18n)
- **RxJS 7.8.0** - Programación reactiva
- **Angular Tilt** - Efectos 3D en componentes

### Testing
- **Jasmine & Karma** - Testing unitario
- **TypeScript** - Tipado estático

## 🏗️ Arquitectura del Proyecto

```
src/
├── app/
│   ├── components/          # Componentes reutilizables
│   │   ├── admin/          # Administración
│   │   ├── auth/           # Autenticación
│   │   ├── profile/        # Gestión de perfiles
│   │   ├── habilities/     # Sistema de habilidades
│   │   └── dialogs/        # Modales y diálogos
│   ├── services/           # Servicios de la aplicación
│   │   ├── supabase/       # Cliente Supabase
│   │   ├── profile/        # Gestión de perfiles
│   │   ├── user/           # Gestión de usuarios
│   │   └── loader/         # Estados de carga
│   └── modules/            # Módulos compartidos
├── assets/
│   ├── i18n/              # Archivos de traducciones
│   └── flags/             # Banderas de idiomas
└── environments/          # Configuraciones de entorno
```

## 🚀 Características Principales

- ✅ **Gestión de Perfiles de Personajes** - Creación y edición completa
- ✅ **Sistema de Estadísticas** - HP, ataque, defensa, velocidad, etc.
- ✅ **Inventario Virtual** - Gestión de armas y objetos
- ✅ **Sistema de Habilidades** - Capacidades especiales configurables
- ✅ **Autenticación Segura** - Login/registro con Supabase
- ✅ **Multiidioma** - Soporte para Español e Inglés
- ✅ **Aplicación Híbrida** - Compatible con iOS y Android
- ✅ **Responsive Design** - Adaptable a todos los dispositivos
- ✅ **Efectos Visuales** - Animaciones y efectos 3D

## 💻 Desarrollo Local

### Prerrequisitos
- Node.js (versión LTS recomendada)
- npm o yarn
- Angular CLI 21.x

### Instalación
```bash
# Clonar el repositorio
git clone <repo-url>

# Navegar al directorio
cd rol_secrets_unfold_angular_17

# Instalar dependencias
npm install

# Configurar variables de entorno
# Copiar las credenciales de Supabase en src/environments/
```

### Servidor de Desarrollo
```bash
npm start
# o
ng serve
```
Navega a `http://localhost:4200/`. La aplicación se recarga automáticamente cuando cambias los archivos fuente.

### Construcción
```bash
npm run build
# o
ng build
```
Los artefactos de construcción se almacenan en el directorio `dist/`.

## 📱 Desarrollo Móvil

### Configuración de Capacitor
```bash
# Construcción para producción
npm run build

# Sincronizar con plataformas nativas
npx cap sync

# Ejecutar en iOS
npx cap run ios

# Ejecutar en Android
npx cap run android
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test
# o
ng test
```

## 🌍 Internacionalización

El proyecto soporta múltiples idiomas usando Transloco:
- **Español (es)** - Idioma por defecto
- **Inglés (en)** - Idioma alternativo

Los archivos de traducción se encuentran en `src/assets/i18n/`.

## 📊 Base de Datos

### Estructura Principal (Supabase)
- **profiles** - Perfiles de personajes
- **habilities** - Habilidades y capacidades
- **inventories** - Sistema de inventario
- **users** - Gestión de usuarios

## 🎨 Estilos y UI

- **TailwindCSS** - Utility-first CSS framework
- **Angular Material** - Componentes Material Design
- **SCSS** - Variables y mixins personalizados
- **Responsive Design** - Breakpoints personalizados

## 🔧 Scripts Disponibles

```bash
npm start          # Servidor de desarrollo
npm run build      # Construcción para producción
npm test           # Ejecutar tests unitarios
```

## 📁 Configuración de Entorno

El proyecto utiliza archivos de entorno para configuraciones:
- `environment.ts` - Desarrollo
- `environment.prod.ts` - Producción

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Calidad

- No se permiten warnings ni errores al aplicar cambios. Verifica con `npm start` o `ng build` antes de compartir tu trabajo.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ usando Angular 21 y las mejores prácticas de desarrollo moderno.**
