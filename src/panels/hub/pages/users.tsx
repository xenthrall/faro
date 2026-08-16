import { Users } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import { DataTable, Muted, PageHeader, Primary } from '@/ui/components'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Usuarios',
  icon: Users,
  order: 10,
}

type PanelUser = {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersPage() {
  const query = useQuery<PanelUser[]>(async () => unwrap(await supabase.rpc('list_panel_users')))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Quién tiene acceso a Faro. Por ahora todos pueden hacer de todo — los permisos por rol llegan más adelante."
      />

      <DataTable
        rows={query.data}
        columns={[
          {
            key: 'user',
            header: 'Usuario',
            cell: (row) => (
              <div className="flex flex-col">
                <Primary>{row.full_name || row.email || 'Sin nombre'}</Primary>
                {row.full_name && row.email ? <Muted>{row.email}</Muted> : null}
              </div>
            ),
          },
          {
            key: 'created_at',
            header: 'Alta',
            hideBelow: 'sm',
            cell: (row) => formatDateTime(row.created_at),
          },
          {
            key: 'last_sign_in_at',
            header: 'Último acceso',
            hideBelow: 'md',
            cell: (row) => (row.last_sign_in_at ? formatDateTime(row.last_sign_in_at) : 'Nunca'),
          },
        ]}
        getRowKey={(row) => row.id}
        loading={query.initialLoading}
        error={query.error}
        onRetry={query.refetch}
        empty={{
          icon: Users,
          title: 'Sin usuarios',
          description: 'Todavía no hay cuentas creadas para este panel.',
        }}
      />
    </div>
  )
}
