import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { unwrap, useQuery } from '@/lib/query'
import { toNullable, toNullableNumber, useForm, type FormValues } from '@/lib/use-form'
import {
  Button,
  CheckboxField,
  ConfirmDialog,
  DataTable,
  FieldGrid,
  IconButton,
  Modal,
  PageHeader,
  SelectField,
  TextField,
  TextareaField,
  type Column,
} from '@/ui/components'
import { useToast } from '@/ui/toast'
import { crudClient } from './crud-client'
import type { CrudConfig, CrudField } from './types'

type Record_ = Record<string, unknown>

function initialValues(fields: CrudField[], record?: Record_): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    if (record) {
      const raw = record[field.name]
      values[field.name] =
        field.type === 'checkbox' ? Boolean(raw) : raw == null ? '' : String(raw)
    } else {
      values[field.name] = field.defaultValue ?? (field.type === 'checkbox' ? false : '')
    }
  }
  return values
}

/** Turns form strings back into the types the column expects. */
function toPayload(fields: CrudField[], values: FormValues): Record_ {
  const payload: Record_ = {}
  for (const field of fields) {
    if (field.visible && !field.visible(values)) continue
    const value = values[field.name]

    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(value)
    } else if (field.numeric || field.type === 'number') {
      const parsed = toNullableNumber(value)
      // A required numeric field with an empty value would violate NOT NULL;
      // sending 0 instead would silently invent data, so let the database
      // reject it and surface the real constraint name.
      payload[field.name] = parsed
    } else {
      payload[field.name] = toNullable(value)
    }
  }
  return payload
}

/**
 * The whole screen for a catalogue resource: table, create/edit modal and
 * delete confirmation, driven by a declarative config.
 *
 * This exists so the six catalogue resources (units, categories, locations,
 * price lists, suppliers, customers) are a config object each instead of six
 * near-identical 200-line pages — and so a fix to any of that behaviour lands
 * in every one of them at once.
 */
export function CrudPage<T extends Record_>({ config }: { config: CrudConfig<T> }) {
  const toast = useToast()
  const {
    table,
    tag,
    title,
    description,
    singular,
    gender = 'm',
    icon,
    columns,
    fields,
    select = '*',
    orderBy = 'name',
    filter,
    searchPlaceholder,
    emptyDescription,
  } = config

  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery<T[]>(
    async () => unwrap(await crudClient.from(table).select(select).order(orderBy)) as T[],
    { tags: [tag] },
  )

  const open = creating || editing !== null
  const form = useForm<FormValues>(initialValues(fields))

  const startCreate = useCallback(() => {
    form.reset(initialValues(fields))
    setFormError(null)
    setCreating(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  const startEdit = useCallback(
    (record: T) => {
      form.reset(initialValues(fields, record))
      setFormError(null)
      setEditing(record)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields],
  )

  const close = useCallback(() => {
    setCreating(false)
    setEditing(null)
    setFormError(null)
  }, [])

  async function save() {
    setSaving(true)
    setFormError(null)

    const payload = toPayload(fields, form.values)
    const { error } = editing
      ? await crudClient.from(table).update(payload).eq('id', editing.id)
      : await crudClient.from(table).insert(payload)

    setSaving(false)

    if (error) {
      setFormError(error.message)
      return
    }

    toast.success(editing ? `${capitalize(singular)} actualizada.` : `${capitalize(singular)} creada.`)
    close()
    query.refetch()
  }

  async function remove() {
    if (!deleting) return
    setSaving(true)

    const { error } = await crudClient.from(table).delete().eq('id', deleting.id)

    setSaving(false)

    if (error) {
      // Almost always an ON DELETE RESTRICT: the record is referenced by a
      // product, a document or a movement. The database message names the
      // constraint, which is more useful than a generic "no se pudo eliminar".
      toast.error(`No se pudo eliminar: ${error.message}`)
      return
    }

    toast.success(`${capitalize(singular)} eliminada.`)
    setDeleting(null)
    query.refetch()
  }

  const newLabel = gender === 'f' ? `Nueva ${singular}` : `Nuevo ${singular}`

  const allColumns = useMemo<Column<T>[]>(
    () => [
      ...columns,
      {
        key: '__actions',
        header: '',
        align: 'right',
        width: 'w-24',
        cell: (row) => (
          <div className="flex justify-end gap-1">
            <IconButton label="Editar" onClick={() => startEdit(row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton label="Eliminar" onClick={() => setDeleting(row)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        ),
      },
    ],
    [columns, startEdit],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            {newLabel}
          </Button>
        }
      />

      <DataTable
        rows={query.data}
        columns={allColumns}
        getRowKey={(row) => row.id as number}
        loading={query.initialLoading}
        error={query.error}
        onRetry={query.refetch}
        filter={filter}
        searchPlaceholder={searchPlaceholder}
        empty={{
          icon,
          title: `Todavía no hay registros`,
          description: emptyDescription,
          action: (
            <Button onClick={startCreate}>
              <Plus className="h-4 w-4" />
              {newLabel}
            </Button>
          ),
        }}
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Editar ${singular}` : newLabel}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void save()} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <FieldGrid>
            {fields.map((field) => {
              if (field.visible && !field.visible(form.values)) return null
              const className = field.wide ? 'md:col-span-2' : undefined

              if (field.type === 'checkbox') {
                return (
                  <CheckboxField
                    key={field.name}
                    label={field.label}
                    hint={field.hint}
                    className={`${className ?? ''} self-end pb-2`}
                    {...form.checkbox(field.name)}
                  />
                )
              }

              if (field.type === 'select') {
                return (
                  <SelectField
                    key={field.name}
                    label={field.label}
                    hint={field.hint}
                    required={field.required}
                    options={field.options ?? []}
                    placeholder={field.emptyOption}
                    className={className}
                    {...form.input(field.name)}
                  />
                )
              }

              if (field.type === 'textarea') {
                return (
                  <TextareaField
                    key={field.name}
                    label={field.label}
                    hint={field.hint}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={className}
                    {...form.input(field.name)}
                  />
                )
              }

              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  placeholder={field.placeholder}
                  type={field.type ?? 'text'}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  className={className}
                  {...form.input(field.name)}
                />
              )
            })}
          </FieldGrid>

          {formError ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          {/* Lets Enter submit the form even though the real button lives in
              the modal footer, outside this <form>. */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        loading={saving}
        destructive
        confirmLabel="Eliminar"
        title={`Eliminar ${singular}`}
        description={`Esta acción no se puede deshacer. Si el registro está en uso por productos, documentos o movimientos, la base de datos lo impedirá.`}
      />
    </div>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
