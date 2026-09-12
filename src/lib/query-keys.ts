export interface ListQuery {
  search?: string
  ordering?: string
  filter?: string
}

export interface UsersListQuery {
  search?: string
  role?: string
  ordering?: string
}

export interface PlansListQuery {
  search?: string
  is_active?: boolean
  ordering?: string
}

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
  },
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (params?: ListQuery) => [...queryKeys.clients.lists(), params ?? {}] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.clients.details(), id] as const,
    me: () => [...queryKeys.clients.all, 'me'] as const,
    progress: (id: number) => [...queryKeys.clients.all, 'progress', id] as const,
  },
  exercises: {
    all: ['exercises'] as const,
    lists: () => [...queryKeys.exercises.all, 'list'] as const,
    list: (params?: ListQuery) => [...queryKeys.exercises.lists(), params ?? {}] as const,
  },
  routines: {
    all: ['routines'] as const,
    lists: () => [...queryKeys.routines.all, 'list'] as const,
    list: (params?: ListQuery) => [...queryKeys.routines.lists(), params ?? {}] as const,
    details: () => [...queryKeys.routines.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.routines.details(), id] as const,
  },
  clientRoutines: {
    all: ['clientRoutines'] as const,
    lists: () => [...queryKeys.clientRoutines.all, 'list'] as const,
    list: (params?: { ordering?: string }) =>
      [...queryKeys.clientRoutines.lists(), params ?? {}] as const,
    byClient: (clientId: number) => [...queryKeys.clientRoutines.all, 'client', clientId] as const,
    progress: (id: number) => [...queryKeys.clientRoutines.all, 'progress', id] as const,
  },
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (params?: ListQuery) => [...queryKeys.goals.lists(), params ?? {}] as const,
  },
  progress: {
    all: ['progress'] as const,
    lists: () => [...queryKeys.progress.all, 'list'] as const,
    list: (params?: { ordering?: string }) =>
      [...queryKeys.progress.lists(), params ?? {}] as const,
    byClient: (clientId: number) => [...queryKeys.progress.all, 'client', clientId] as const,
    clientProgress: (params?: { ordering?: string; client_id?: number }) =>
      [...queryKeys.progress.all, 'clientProgress', params ?? {}] as const,
  },
  routineProgress: {
    all: ['routineProgress'] as const,
    lists: () => [...queryKeys.routineProgress.all, 'list'] as const,
    list: (params?: { ordering?: string }) =>
      [...queryKeys.routineProgress.lists(), params ?? {}] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: UsersListQuery) => [...queryKeys.users.lists(), params ?? {}] as const,
  },
  plans: {
    all: ['plans'] as const,
    lists: () => [...queryKeys.plans.all, 'list'] as const,
    list: (params?: PlansListQuery) => [...queryKeys.plans.lists(), params ?? {}] as const,
    details: () => [...queryKeys.plans.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.plans.details(), id] as const,
  },
}
