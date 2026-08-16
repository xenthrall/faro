import { Callout, Steps } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function TransferenciasLesson() {
  return (
    <LessonLayout slug="transferencias">
      <p>
        Si tenés más de una ubicación — una bodega y un local, por ejemplo — vas
        a necesitar mover mercancía de una a otra de vez en cuando. Para eso
        están las <strong>transferencias</strong>.
      </p>

      <Steps
        items={[
          <>
            En <strong>Documentos &gt; Transferencias</strong>, elegí el origen
            (de dónde sale) y el destino (a dónde llega).
          </>,
          <>
            Agregá los productos y la cantidad. Cada línea te muestra cuánto hay
            disponible en el origen, así sabés antes de confirmar si alcanza.
          </>,
          <>
            Confirmá. La mercancía se descuenta del origen y aparece en el
            destino, al mismo costo con el que estaba — trasladarla no la
            encarece ni la abarata.
          </>,
        ]}
      />

      <Callout>
        <p>
          Igual que con una venta, si el producto tiene varias entradas con
          distinto costo, Faro elige automáticamente cuál mover (la que vence
          antes, o la más vieja). No hace falta que decidas vos, salvo que
          quieras indicarlo a mano.
        </p>
      </Callout>
    </LessonLayout>
  )
}
