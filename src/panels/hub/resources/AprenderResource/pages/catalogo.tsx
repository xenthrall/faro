import { Callout, Steps } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function CatalogoLesson() {
  return (
    <LessonLayout slug="catalogo">
      <p>
        Antes de registrar tu primera compra o venta, conviene tener armado el
        catálogo: qué productos manejás, en qué categorías, con qué unidad y en
        qué ubicaciones. Es trabajo de una sola vez — después, comprar y vender
        es simplemente elegir de una lista.
      </p>

      <p>Dentro del panel de negocio, todo esto vive en la sección <strong>Catálogo</strong>:</p>

      <Steps
        items={[
          <>
            <strong>Unidades</strong> — creá primero las que uses: Unidad, Metro,
            Litro, Kilogramo, Caja... Ya vienen algunas cargadas de ejemplo.
          </>,
          <>
            <strong>Categorías</strong> — armá tus secciones (Herramientas,
            Plomería, Pinturas...). Podés anidarlas, por ejemplo "Herramientas
            &gt; Herramienta eléctrica", si te sirve para ordenar más fino.
          </>,
          <>
            <strong>Ubicaciones</strong> — tu bodega, tu local, un punto de venta.
            Si trabajás en un solo lugar, con una ubicación alcanza.
          </>,
          <>
            <strong>Listas de precio</strong> — al menos una (por ejemplo
            "Minorista"). Si le vendés distinto a un cliente frecuente o a un
            revendedor, podés crear una segunda ("Mayorista") más adelante.
          </>,
          <>
            <strong>Productos</strong> — el paso final: nombre, categoría, unidad,
            y si el impuesto que le aplica (por defecto, el 19% de IVA). Acá
            también decidís si ese producto necesita número de lote o fecha de
            vencimiento — pensado para cosas como pinturas o líquidos, no para un
            tornillo.
          </>,
        ]}
      />

      <Callout>
        <p>
          <strong>No hace falta cargar todo el catálogo el primer día.</strong>{' '}
          Podés crear productos sobre la marcha, justo cuando registrás la
          primera compra de cada uno. Muchos negocios arrancan con lo esencial y
          van completando el resto en las primeras semanas.
        </p>
      </Callout>

      <p>
        Un detalle que te va a ahorrar dolores de cabeza: el <strong>SKU</strong>{' '}
        (el código interno del producto) tiene que ser único. Usá algo que vos
        mismo reconozcas de un vistazo — por ejemplo "TOR-014" para un tornillo,
        o "LLA-2055516" para una llanta — no hace falta que sea un código de
        barras real.
      </p>
    </LessonLayout>
  )
}
