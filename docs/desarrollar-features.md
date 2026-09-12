# Desarrollar features en el frontend

Cómo añadir o cambiar cualquier cosa en la UI: una pantalla, un campo, un filtro o una acción. El contrato es [`docs/swagger.json`](swagger.json) (copia del backend). Cada operación autenticada declara `x-required-roles`. La UI oculta rutas y botones; **autoriza el API**.

Roles y rutas: [RBAC.md](RBAC.md). Guía del backend: `gym-now-back/docs/desarrollar-features.md`. Arranque local: [GETTING_STARTED.md](../../docs/GETTING_STARTED.md).

## 1. Acotar el cambio

Antes de abrir archivos:

1. **¿El path ya existe en Swagger?** Si el API no está, impléméntalo primero (o en el mismo PR, API antes que UI).
2. **¿Quién lo ve?** Mismo grupo que `x-required-roles`: `STAFF_ROLES`, `OWNER_ROLES`, `MEMBER_ROLES`. Un rol desconocido es `guest` (`asUserRole`), nunca `owner`.
3. **¿Pantalla nueva o acción en una existente?** Ruta nueva vs botón/modal/filtro en Clients, Exercises, Settings, etc.
4. **¿Staff o miembro?** Staff usa el shell con sidebar (`/`). Miembro usa `/me` y no debe disparar listados de gestión (`GET /clients/`, etc.).
5. **¿Qué escribe el usuario?** Campos del PATCH/POST. No inventes un body que el serializer no acepta.

No hay i18n: copy en español, hardcodeado.

## 2. Dónde vive cada pieza

| Si el feature… | Archivo |
| --- | --- |
| Habla con el API | [`src/lib/api.ts`](../src/lib/api.ts) — tipo + `*API` |
| Cachea el recurso | [`src/lib/query-keys.ts`](../src/lib/query-keys.ts) + `src/hooks/use*.ts` |
| Cambia quién ve/hace algo | [`src/lib/rbac.ts`](../src/lib/rbac.ts) |
| Es una ruta | [`src/App.tsx`](../src/App.tsx) + [`src/pages/lazy.ts`](../src/pages/lazy.ts) |
| Aparece en el menú | [`src/components/Layout.tsx`](../src/components/Layout.tsx) |
| Es la pantalla | `src/pages/…` o un componente en `src/components/` |
| Cambia el título de pestaña | [`src/components/DocumentTitle.tsx`](../src/components/DocumentTitle.tsx) |
| Es sesión | [`src/stores/auth.store.ts`](../src/stores/auth.store.ts) vía [`useAuth`](../src/hooks/useAuth.ts) |
| Documenta roles/rutas | [RBAC.md](RBAC.md) |

Stack fijo: React 19, Vite, Tailwind, Axios, TanStack Query, Zustand, React Router 7, `react-hot-toast`. Formularios grandes: Formik + Yup. Los simples: estado controlado.

UI: `Card`, `Button`, `Input`, `Badge`, `Avatar`, `Tabs`, `Progress`. No hay `Table` ni `Dialog` de librería; los modales son overlay (`fixed inset-0 bg-black/50` + `Card`). Listados en **card grid**, no tablas.

## 3. Orden de trabajo

Sigue este orden. Si un paso no aplica, sáltalo.

### Contrato

Abre `docs/swagger.json` y anota método, path, body, query (`search`, `role`, `ordering`, `page`) y `x-required-roles`. Si el backend cambió, regenera y copia:

```bash
cd gym-now-back
pipenv run python manage.py update_swagger   # servidor arriba
cp swagger.json ../gym-now/docs/swagger.json
```

`allowedRoles` y los `can*` de la UI deben coincidir con `x-required-roles` de **esa** operación.

### Tipo + cliente HTTP

En `api.ts`: interfaz del recurso y un objeto `recursoAPI` (`getAll`, `getById`, `create`, `update`, `patch`, `delete`, más acciones). El Axios base ya manda el JWT y refresca en 401.

El listado del API viene paginado (`{ count, next, previous, results }`). Elige una forma y sé consistente en el hook:

- Devolver `results` (ejercicios) si la UI solo pinta la página actual.
- Devolver el objeto paginado (clientes, rutinas) si usas `count` o `results` en varios sitios.

Errores al usuario: `handleApiError`. El backend debe mandar `detail` / `error` / `message` para que el toast tenga texto útil.

### Query keys y hooks

Añade el recurso en `query-keys.ts` (`all` → `lists` → `list(params)` → `detail(id)`).

Hook de dominio, mismo patrón que `useExercises.ts`:

```ts
export function useRecursosQuery(params?: ListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.recursos.list(params),
    queryFn: () => recursosAPI.getAll(params),
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateRecursoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Recurso> }) =>
      recursosAPI.patch(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recursos.all })
    },
  })
}
```

`enabled: false` si el rol no puede llamar el endpoint (evita 403 al montar). Incluye `search` / filtro en la query key para no mezclar caches.

No pidas datos de staff desde una vista de miembro.

### RBAC

Si la acción no cubre `isStaff` / `isOwner` / `isMember`, añade un helper en `rbac.ts` con la **misma** semántica que el backend (`canDeleteClient`, `canManageRoles`, …).

Tres capas, las tres:

1. **Ruta** — `ProtectedRoute` + `allowedRoles`. Si el rol no entra, redirige a `getHomePath(role)`.
2. **Nav** — no muestres el ítem (Ajustes solo con `isOwner`).
3. **Acción** — no renderices el botón que pega un endpoint fuera de rol.

Ocultar no sustituye al 403. Si alguien fuerza la URL, el API debe rechazar.

### Ruta, lazy y menú

Página nueva:

1. `src/pages/Nombre.tsx` + `export default`.
2. `lazy.ts`: `export const Nombre = lazy(() => import('./Nombre'))` y entrada en `prefetchPage`.
3. `App.tsx`: ruta bajo el `Layout` de staff o el de `/me`, con `ProtectedRoute`.
4. `Layout.tsx`: tab si va en el menú de staff.
5. `DocumentTitle.tsx`: título de la pestaña.

Ruta de staff anidada en `/`. Ruta solo owner: guard anidado (`/settings`). Detalle fuera del shell: `/clients/:id`. Socio: `/me` y `/my-routine/progress`.

### Pantalla

Patrón de listado (Clients, Exercises, Settings):

- Título + búsqueda. `search` y filtros en la URL (`useSearchParams`), input con `useDebounce` (~500 ms).
- Cards + `Badge` para estados.
- Crear/editar: modal o query `?modal=`. Confirmación antes de delete o cambios irreversibles.
- Loading: `Loader2`. Vacío y error: mensaje, el error vía `handleApiError`.
- Mutación: `toast.success` / `toast.error(handleApiError(error))`.
- Si el cambio afecta al usuario logueado (rol, perfil), `refreshUserProfile()`.

Formulario largo o con validación cruzada: Formik + Yup. Uno o dos campos: `useState`.

No añadas primitivos UI nuevos si basta con `Card` / `Button` / `Input` / `Badge` + un `<select>` nativo.

## 4. Cómo verificar

La UI se comprueba en el navegador, no solo con un screenshot.

1. `bun run dev` + API en `8000`.
2. Recorre el flujo como usuario: click, type, submit, navegar.
3. Prueba el rol que sí puede y uno que no (ruta oculta / redirect; acción oculta).
4. Vacío, error de API y, si hay filtros, un query param que recorte de verdad.
5. Otras pantallas que lean el mismo estado (p. ej. cambiar un rol y ver que Clientes sigue igual).

`bunx tsc -b` si tocaste tipos. No hay suite de tests de UI.

## 5. Checklist

- [ ] Path y `x-required-roles` contrastados con `docs/swagger.json`
- [ ] Tipo + `*API` en `api.ts`
- [ ] `queryKeys` + hook; mutaciones invalidan `queryKey` del recurso
- [ ] Helper RBAC si la acción no la cubre uno existente
- [ ] `ProtectedRoute` / nav / botón alineados con el API
- [ ] Página lazy + prefetch + título si es ruta nueva
- [ ] Búsqueda/filtros en la URL si es un listado
- [ ] Toast / `handleApiError` en mutaciones
- [ ] Miembro no llama listados de staff
- [ ] [RBAC.md](RBAC.md) si cambió una ruta o una superficie por rol
- [ ] Flujo verificado en el navegador

## 6. Errores que se repiten

- **UI más permisiva que el API.** El botón existe, el `role_map` no. 403 al primer click.
- **UI más estricta sin motivo.** El API ya permite trainer y la ruta quedó owner-only.
- **Query al montar con el rol equivocado.** Falta `enabled` en el hook.
- **Cache sucia.** Mutación sin `invalidateQueries` del `all` del recurso.
- **Listado paginado sin desempaquetar.** Pintas `{ count, results }` como si fuera el array.
- **Filtro solo en cliente.** Con `PAGE_SIZE=20` el resto de páginas no existe en memoria; manda el query al API.
- **Confiar en el JWT.** El rol de la UI sale de `/user-profile/` (store). Tras cambiar el propio rol, `refreshUserProfile()`.
- **Pantalla de staff colgada en `/me`.** Un socio no debe listar todos los clientes ni el catálogo de gestión.
