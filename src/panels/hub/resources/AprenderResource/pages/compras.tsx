import { Callout, Steps } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function ComprasLesson() {
  return (
    <LessonLayout slug="compras">
      <p>
        Cada vez que te llega mercancía de un proveedor, se registra como una{' '}
        <strong>compra</strong>. Es la puerta de entrada de todo lo que después
        vas a poder vender.
      </p>

      <Steps
        items={[
          <>
            En <strong>Documentos &gt; Compras</strong>, tocá "Nueva compra" y
            elegí el proveedor y la ubicación donde va a quedar la mercancía
            (normalmente tu bodega).
          </>,
          <>
            Agregá una línea por cada producto: buscalo por nombre o código,
            poné la cantidad y el costo al que lo compraste. El impuesto se
            completa solo, tomando el que tiene configurado el producto.
          </>,
          <>
            Guardá como <strong>borrador</strong>. Todavía no pasó nada con tu
            inventario — podés revisar, corregir una cantidad o borrar la compra
            entera sin que quede rastro.
          </>,
          <>
            Cuando esté todo bien, tocá <strong>Confirmar</strong>. Ahí sí: las
            existencias suben, y ese costo queda guardado como el precio real al
            que entró esa mercancía.
          </>,
        ]}
      />

      <Callout>
        <p>
          <strong>¿Por qué importa guardar el costo de cada compra?</strong> Si
          en marzo comprás un producto a $8.000 y en junio te sale a $9.500, Faro
          no se olvida del primero — los dos costos conviven. Así, cuando vendas,
          la ganancia se calcula contra lo que de verdad pagaste por esa unidad
          en particular, no contra un promedio que podría estar equivocado.
        </p>
      </Callout>

      <p>
        Si un producto quedó marcado para controlar lote o vencimiento (algo
        típico de pinturas, aceites o productos con fecha de caducidad), Faro te
        va a pedir el número de lote y, si aplica, la fecha de vencimiento antes
        de dejarte confirmar. Para el resto de los productos no hace falta nada
        de eso — Faro arma esa capa de costo automáticamente.
      </p>
    </LessonLayout>
  )
}
