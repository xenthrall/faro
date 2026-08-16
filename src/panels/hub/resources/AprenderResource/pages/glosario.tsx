import { Callout, Definition, Term } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function GlosarioLesson() {
  return (
    <LessonLayout slug="glosario">
      <p>
        Vas a ver estas palabras una y otra vez en el panel. Ninguna es
        complicada una vez que sabés qué significa — leelas una vez acá y el
        resto del recorrido va a fluir solo.
      </p>

      <dl className="flex flex-col gap-5">
        <div>
          <Term>Producto</Term>
          <Definition>
            Cualquier cosa que vendas o uses: un martillo, una llanta, un galón de
            pintura. Cada producto se crea una sola vez, con su nombre, su
            categoría y su unidad — después lo usás en todas las compras y ventas
            sin volver a cargarlo.
          </Definition>
        </div>

        <div>
          <Term>Categoría</Term>
          <Definition>
            La "sección" a la que pertenece un producto — Herramientas,
            Tornillería, Pinturas. Sirve para encontrar cosas rápido y para ver
            reportes agrupados, nada más.
          </Definition>
        </div>

        <div>
          <Term>Unidad de medida</Term>
          <Definition>
            Cómo se cuenta el producto: por unidad, por metro, por litro, por
            caja. Un tornillo se cuenta de a uno; un cable, por metro.
          </Definition>
        </div>

        <div>
          <Term>Ubicación</Term>
          <Definition>
            Cualquier lugar donde tengas mercancía: tu bodega, tu local, un punto
            de venta. Faro sabe cuánto tenés de cada producto en cada ubicación
            por separado.
          </Definition>
        </div>

        <div>
          <Term>Existencias (o inventario)</Term>
          <Definition>
            Cuánto tenés, ahora mismo, de un producto en una ubicación. Es el
            número que sube cuando comprás y baja cuando vendés.
          </Definition>
        </div>

        <div>
          <Term>Lote</Term>
          <Definition>
            Cada vez que te entra mercancía, Faro guarda a qué costo la
            compraste. Si el mes que viene el mismo producto te cuesta más caro,
            esa entrada queda como un lote aparte — así tu ganancia siempre se
            calcula contra lo que realmente pagaste, no contra un promedio
            inventado.
          </Definition>
        </div>

        <div>
          <Term>Movimiento</Term>
          <Definition>
            El registro de cada vez que algo entró o salió: una compra, una
            venta, un traslado, un ajuste. Es tu historial completo — como el
            extracto de una cuenta, pero de mercancía en vez de plata.
          </Definition>
        </div>

        <div>
          <Term>Documento (compra, venta, transferencia)</Term>
          <Definition>
            Lo que armás cada vez que hacés una operación. Empieza como
            <strong> borrador</strong> — lo podés editar o borrar sin problema — y
            pasa a <strong>confirmado</strong> cuando lo das por bueno. Solo ahí
            se actualiza el inventario de verdad.
          </Definition>
        </div>
      </dl>

      <Callout>
        <p>
          <strong>No necesitás memorizar esto.</strong> Cada palabra vuelve a
          aparecer, explicada de nuevo en contexto, en las lecciones que siguen.
          Esta lección es solo para que ninguna te tome por sorpresa.
        </p>
      </Callout>
    </LessonLayout>
  )
}
