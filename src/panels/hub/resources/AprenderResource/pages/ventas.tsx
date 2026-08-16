import { Callout, Steps } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function VentasLesson() {
  return (
    <LessonLayout slug="ventas">
      <p>
        Registrar una venta se siente muy parecido a registrar una compra —
        cambia la dirección: acá la mercancía sale.
      </p>

      <Steps
        items={[
          <>
            En <strong>Documentos &gt; Ventas</strong>, tocá "Nueva venta". El
            cliente es opcional — para una venta de mostrador, dejalo en blanco.
          </>,
          <>
            Elegí la ubicación desde donde estás vendiendo (tu local, tu punto de
            venta) y agregá los productos con su cantidad. El precio se sugiere
            solo, según la lista de precios del cliente.
          </>,
          <>
            Guardá como borrador si querés revisarlo antes, o confirmá directo si
            ya está todo listo.
          </>,
          <>
            Al confirmar, Faro descuenta el inventario y te avisa antes si falta
            stock — nunca te deja confirmar una venta que dejaría el inventario
            en negativo.
          </>,
        ]}
      />

      <Callout>
        <p>
          <strong>¿Qué mercancía sale primero?</strong> Si tenés dos entradas del
          mismo producto (por ejemplo, una del mes pasado y otra de esta semana),
          no hace falta que elijas cuál vender: Faro descuenta primero la que
          esté más cerca de vencer, y si ninguna vence, la más vieja. Vos solo
          elegís el producto y la cantidad — el resto es automático.
        </p>
      </Callout>

      <p>
        Después de confirmar, entrá a la venta y vas a ver una sección "Lotes
        descargados" que te muestra exactamente de cuál capa de costo salió
        cada producto — útil para entender un número raro en la ganancia, o
        simplemente para llevar la cuenta.
      </p>
    </LessonLayout>
  )
}
