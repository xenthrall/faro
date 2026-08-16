import { Callout, Steps } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function AjustesLesson() {
  return (
    <LessonLayout slug="ajustes">
      <p>
        No todo lo que cambia tu inventario es una compra o una venta. A veces
        se rompe algo, un conteo físico no coincide con lo que dice el sistema,
        o un cliente devuelve mercancía. Para esos casos está el{' '}
        <strong>ajuste manual</strong>, disponible desde la pantalla de{' '}
        <strong>Existencias</strong>.
      </p>

      <Steps
        items={[
          <>Elegí el producto y la ubicación donde notaste la diferencia.</>,
          <>
            Decidí la dirección: <strong>entrada</strong> (sube el inventario) o{' '}
            <strong>salida</strong> (lo baja). Siempre escribís la cantidad en
            positivo — la dirección es la que define el signo.
          </>,
          <>
            Elegí el motivo: ajuste (lo más común), stock inicial (para cargar
            existencias por primera vez) o devolución.
          </>,
          <>
            Si es una entrada nueva, indicá el costo — así queda registrada como
            una capa de costo más, igual que una compra.
          </>,
        ]}
      />

      <Callout>
        <p>
          <strong>Todo ajuste queda anotado en tu historial</strong>, con nota y
          todo si querés dejar el motivo por escrito. No es un truco para
          "arreglar números" a escondidas — es la forma correcta de que tu
          inventario refleje la realidad cuando la realidad no coincidió con lo
          esperado.
        </p>
      </Callout>
    </LessonLayout>
  )
}
