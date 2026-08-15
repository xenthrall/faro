import { FolderTree } from 'lucide-react'
import { useMemo } from 'react'
import { categoryPath, useCategories } from '@/lib/references'
import type { Category } from '@/lib/types'
import { Badge, Muted, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

export default function CategoriesPage() {
  const categories = useCategories()

  const config = useMemo<CrudConfig<Category>>(
    () => ({
      table: 'categories',
      tag: 'categories',
      title: 'Categorías',
      description:
        'Jerarquía de clasificación de productos. Una categoría sin padre es una raíz del árbol.',
      singular: 'categoría',
      gender: 'f',
      icon: FolderTree,
      searchPlaceholder: 'Buscar categoría…',
      emptyDescription:
        'Empezá por las raíces (Ferretería, Alimentos) y después agregá sus subcategorías.',
      filter: (category, query) =>
        categoryPath(category, categories.rows).toLowerCase().includes(query),
      columns: [
        {
          key: 'name',
          header: 'Categoría',
          cell: (category) => (
            <div className="flex flex-col">
              <Primary>{category.name}</Primary>
              {category.parent_id ? (
                <Muted>{categoryPath(category, categories.rows)}</Muted>
              ) : (
                <Muted>Categoría raíz</Muted>
              )}
            </div>
          ),
        },
        {
          key: 'description',
          header: 'Descripción',
          hideBelow: 'md',
          cell: (category) => category.description ?? '—',
        },
        {
          key: 'active',
          header: 'Estado',
          hideBelow: 'sm',
          cell: (category) =>
            category.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge>,
        },
      ],
      fields: [
        { name: 'name', label: 'Nombre', required: true, placeholder: 'Tornillería' },
        {
          name: 'parent_id',
          label: 'Categoría padre',
          type: 'select',
          numeric: true,
          options: categories.options,
          emptyOption: 'Sin padre (categoría raíz)',
          hint: 'Dejalo vacío para crear una raíz del árbol.',
        },
        { name: 'description', label: 'Descripción', type: 'textarea', wide: true },
        { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: true },
      ],
    }),
    [categories.rows, categories.options],
  )

  return <CrudPage config={config} />
}
