# RBAC — Gym Now Frontend

La UI replica la matriz del contrato OpenAPI en [`docs/swagger.json`](swagger.json) (copia de `gym-now-back/swagger.json`). Cada operación autenticada declara `x-required-roles`; el backend responde **401** sin token y **403** si el rol no alcanza. La UI oculta rutas y acciones, pero **la seguridad real es el API**.

Documentación del backend: `gym-now-back/docs/rbac.md`.

## Roles

Mismo enum que `UserProfile.role` en Swagger:

| Rol | Grupo | Home | Qué ve |
|-----|--------|------|--------|
| `owner` | Staff | `/` | App de gestión + Ajustes + eliminar clientes |
| `trainer` | Staff | `/` | App de gestión, sin Ajustes ni eliminar clientes |
| `client` | Miembro | `/me` | Su perfil, rutina y progreso |
| `guest` | Miembro | `/me` | Igual que `client` |

Helpers en [`src/lib/rbac.ts`](../src/lib/rbac.ts): `STAFF_ROLES`, `MEMBER_ROLES`, `isStaff`, `isMember`, `isOwner`, `canDeleteClient`, `canViewCredentials`, `canManageRoles`, `canManagePlans`, `ROLE_LABELS`, `getHomePath`. Un rol desconocido se trata como `guest` (`asUserRole`), nunca como `owner`.

## Flujo de autenticación

1. `POST /token/` (público) → `access` + `refresh`.
2. `GET /user-profile/` (cualquier autenticado) → `role`.
3. Si el rol es miembro → `GET /clients/me/` para hidratar `user.clientId`.
4. Redirect: miembro → `/me`; staff → `/` (o la ruta previa si no es `/login`).

Implementado en [`src/stores/auth.store.ts`](../src/stores/auth.store.ts). Si el perfil falla tras el login, **no** se inventa `role: 'owner'`: se limpia la sesión y se muestra error.

El access token incluye claims `role` y `user_id`. La UI no los usa como fuente de verdad; siempre pide `/user-profile/`.

## Rutas

Definidas en [`src/App.tsx`](../src/App.tsx) con [`ProtectedRoute`](../src/components/ProtectedRoute.tsx). Si el rol no está en `allowedRoles`, redirige a `getHomePath(role)`.

| Ruta | Roles | Notas |
|------|--------|-------|
| `/login` | Público | |
| `/`, `/clients`, `/routines`, `/exercises`, `/plans`, `/progress` | `owner`, `trainer` | Shell con sidebar |
| `/settings` | `owner` | Nested guard. Asignación de roles (`GET/PATCH /users/`) |
| `/clients/:id` | `owner`, `trainer` | Detalle de cualquier cliente |
| `/me` | `client`, `guest` | `ClientDetail` vía `/clients/me/` |
| `/my-routine` | — | Redirect a `/me` |
| `/my-routine/progress` | `client`, `guest` | Historial de medidas del socio |

Un owner/trainer que abre `/me` vuelve a `/`. Un socio que abre `/` o `/clients/:id` vuelve a `/me`.

## UI según rol

| Superficie | Comportamiento |
|------------|----------------|
| [`Layout.tsx`](../src/components/Layout.tsx) | Miembros: sin sidebar, header mínimo. Staff: menú completo. “Ajustes” solo si `isOwner`. |
| [`Plans.tsx`](../src/pages/Plans.tsx) | Staff ve el catálogo (`GET /plans/`). Crear/editar/borrar solo si `canManagePlans` (owner). |
| [`Settings.tsx`](../src/pages/Settings.tsx) | Lista usuarios y cambia `role` si `canManageRoles` (owner). El último owner no se puede degradar. |
| [`Clients.tsx`](../src/pages/Clients.tsx) | “Eliminar” solo si `canDeleteClient` (owner). |
| [`Exercises.tsx`](../src/pages/Exercises.tsx) | Staff crea/edita/borra. Subida de imagen (`POST /exercises/{id}/upload_image/`) solo staff. |
| [`ClientDetail.tsx`](../src/pages/ClientDetail.tsx) | Staff: editar cliente/rutinas; botón “Volver al panel” a `/`. Miembro: copy “Mi Rutina”, foto, sin `ClientCreator` / `RoutineEditor`. `hasAccess` usa `clientId` hidratado. |
| [`Login.tsx`](../src/pages/Login.tsx) | Redirect con `getHomePath`. |
| [`SubscriptionExpiredOverlay.tsx`](../src/components/SubscriptionExpiredOverlay.tsx) | Solo miembros (`client`, `guest`). Si `subscription_end` ya pasó, overlay a pantalla completa: no se puede navegar (redirige a `/me`) ni usar la app. Staff no lo ve. |

El front **no** llama listados de staff desde `/me` (p. ej. `GET /clients/`).

## Contrato Swagger

Tras cambiar `role_map` o permisos en el backend:

```bash
cd gym-now-back
pipenv run python manage.py update_swagger   # servidor Django en marcha
cp swagger.json ../gym-now/docs/swagger.json
```

Comprobar en `docs/swagger.json`:

- `securityDefinitions.Bearer`
- `paths.*.*.x-required-roles`
- `definitions.UserProfile.properties.role.enum`

Si se agrega una ruta o acción en el front, el `allowedRoles` debe coincidir con `x-required-roles` de esa operación.

## Cómo extender

1. Añadir o ajustar el helper en `src/lib/rbac.ts` (misma semántica que el backend).
2. Envolver la ruta con `ProtectedRoute` y el grupo correcto (`STAFF_ROLES`, `MEMBER_ROLES`, `OWNER_ROLES`).
3. Ocultar botones que disparen endpoints fuera de rol (`canDeleteClient`, `isStaff`, etc.).
4. No confiar solo en la UI: un 403 del API es el fallo esperado si alguien fuerza la URL.

## Asignación de roles

En `/settings` (solo owner): `GET /users/` lista cuentas y `PATCH /users/{id}/` cambia `role`. El API rechaza quitar el último `owner` (400). Cambiar el rol no crea ni borra `Client`; un staff que era socio conserva su ficha.

Django admin sigue siendo una vía alternativa. No se crean ni borran usuarios desde esta pantalla.

## Fuera de alcance

- Crear o borrar usuarios / invitar staff
- Roles o permisos custom
- Codegen de tipos desde Swagger
- Distinción de producto entre `guest` y `client` más allá del label
