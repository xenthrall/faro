import {
  ArrowRightLeft,
  BookOpenText,
  ClipboardList,
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type Lesson = {
  slug: string
  title: string
  /** Una frase, en la tarjeta de la lección. */
  summary: string
  minutes: number
  icon: LucideIcon
}

/**
 * Orden real del curso. Tanto el índice como la navegación anterior/siguiente
 * de cada lección se arman a partir de esta lista — moverla acá mueve el
 * recorrido entero, sin tocar las páginas.
 */
export const LESSONS: Lesson[] = [
  {
    slug: 'bienvenida',
    title: 'Empecemos por acá',
    summary: 'Qué es Faro, para qué sirve y por qué no hace falta saber de computadores.',
    minutes: 2,
    icon: Sparkles,
  },
  {
    slug: 'glosario',
    title: 'Las palabras que vas a encontrar',
    summary: 'Producto, existencia, lote, movimiento... traducidas al lenguaje de todos los días.',
    minutes: 4,
    icon: BookOpenText,
  },
  {
    slug: 'catalogo',
    title: 'Tu catálogo',
    summary: 'Productos, categorías, unidades y ubicaciones: la base sobre la que se apoya todo.',
    minutes: 4,
    icon: Package,
  },
  {
    slug: 'compras',
    title: 'Cuando te llega mercancía',
    summary: 'Cómo registrar una compra y qué pasa con tus existencias al confirmarla.',
    minutes: 4,
    icon: ShoppingCart,
  },
  {
    slug: 'ventas',
    title: 'Cuando vendés',
    summary: 'Cómo registrar una venta y cómo Faro decide qué mercancía sale primero.',
    minutes: 4,
    icon: Receipt,
  },
  {
    slug: 'transferencias',
    title: 'Mover mercancía de un lugar a otro',
    summary: 'Bodega, tienda, punto de venta: cómo trasladar existencias entre ellos.',
    minutes: 3,
    icon: ArrowRightLeft,
  },
  {
    slug: 'ajustes',
    title: 'Cuando algo no cuadra',
    summary: 'Mermas, conteos físicos y devoluciones: cómo corregir el inventario a mano.',
    minutes: 3,
    icon: ClipboardList,
  },
  {
    slug: 'tu-negocio',
    title: 'Entender cómo va tu negocio',
    summary: 'El panel principal y la pantalla de ganancias, leídos con calma.',
    minutes: 4,
    icon: TrendingUp,
  },
]
