# GymNow - Aplicación de Gestión de Gimnasio

Una aplicación móvil para el seguimiento de rutinas y el avance de clientes en gimnasios, desarrollada con React, TypeScript y Vite.

## 🚀 Características

### 📱 Diseño Mobile-First
- Interfaz optimizada para dispositivos móviles
- Navegación intuitiva con barra inferior
- Componentes responsivos y accesibles

### 👥 Gestión de Clientes
- Perfiles completos de clientes con información personal
- Seguimiento de objetivos y metas
- Historial de progreso y mediciones
- Búsqueda y filtrado de clientes

### 💪 Gestión de Rutinas
- Creación y gestión de rutinas de entrenamiento
- Ejercicios con instrucciones detalladas
- Diferentes niveles de dificultad
- Categorización por tipo de entrenamiento

### 📊 Seguimiento de Progreso
- Métricas de peso, grasa corporal y medidas
- Gráficos de progreso visual
- Comparación de resultados a lo largo del tiempo
- Seguimiento de metas y objetivos

### ⚙️ Configuración
- Perfil de entrenador personalizable
- Configuración de notificaciones
- Preferencias de privacidad y seguridad

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Lucide React
- **State Management**: React Hooks
- **Icons**: Lucide React

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd gym-now
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                 # Componentes base de UI
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── avatar.tsx
│   │   ├── tabs.tsx
│   │   └── badge.tsx
│   ├── Navigation.tsx      # Navegación principal
│   ├── Dashboard.tsx       # Panel principal
│   ├── Clients.tsx         # Gestión de clientes
│   ├── Routines.tsx        # Gestión de rutinas
│   ├── Progress.tsx        # Seguimiento de progreso
│   └── Settings.tsx        # Configuración
├── data/
│   └── mockData.ts         # Datos de ejemplo
├── lib/
│   └── utils.ts           # Utilidades y helpers
├── types/
│   └── index.ts           # Definiciones de tipos TypeScript
├── App.tsx                # Componente principal
└── index.css              # Estilos globales
```

## 🎨 Componentes UI

La aplicación utiliza un sistema de componentes modular basado en:
- **Radix UI**: Componentes accesibles y sin estilos
- **Tailwind CSS**: Utilidades de CSS para estilos
- **Class Variance Authority**: Sistema de variantes para componentes

### Componentes Disponibles:
- `Button`: Botones con diferentes variantes y tamaños
- `Card`: Contenedores con header, content y footer
- `Input`: Campos de entrada con estados
- `Progress`: Barras de progreso
- `Avatar`: Avatares de usuario
- `Tabs`: Pestañas organizacionales
- `Badge`: Etiquetas para estados y categorías

## 📱 Funcionalidades Principales

### Dashboard
- Resumen de estadísticas del gimnasio
- Actividad reciente de clientes
- Progreso de metas en tiempo real
- Métricas clave de rendimiento

### Gestión de Clientes
- Lista de clientes con búsqueda
- Perfiles detallados con información personal
- Historial de entrenamientos
- Seguimiento de objetivos

### Rutinas de Entrenamiento
- Biblioteca de ejercicios
- Creación de rutinas personalizadas
- Asignación a clientes
- Seguimiento de progreso

### Seguimiento de Progreso
- Métricas de peso y composición corporal
- Medidas corporales
- Gráficos de evolución
- Comparación temporal

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción
- `npm run lint`: Ejecuta el linter

## 🎯 Próximas Funcionalidades

- [ ] Autenticación de usuarios
- [ ] Base de datos real (Firebase/Supabase)
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] Modo offline
- [ ] Integración con wearables
- [ ] Chat entre entrenador y cliente
- [ ] Calendario de entrenamientos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para la gestión eficiente de gimnasios.

---

**GymNow** - Transformando la gestión de fitness, un entrenamiento a la vez.
