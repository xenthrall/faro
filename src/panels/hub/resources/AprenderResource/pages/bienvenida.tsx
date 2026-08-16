import { Callout } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function BienvenidaLesson() {
  return (
    <LessonLayout slug="bienvenida">
      <p>
        Si nunca usaste un programa como este, tranquilo: no hace falta saber de
        computadores ni de contabilidad para manejarlo. Faro está pensado para
        reemplazar el cuaderno, la calculadora y la memoria — no para complicarte
        más la vida.
      </p>

      <p>
        En el día a día, Faro hace tres cosas por vos:
      </p>

      <ul className="flex flex-col gap-2 pl-1 text-[15px] text-gray-700 dark:text-gray-300">
        <li>• Sabe cuánto tenés de cada producto, y en cuál local o bodega está.</li>
        <li>• Guarda cada compra y cada venta, para que no dependas de recordarlas.</li>
        <li>• Te muestra, sin que tengas que calcular nada, cuánto estás ganando.</li>
      </ul>

      <Callout>
        <p>
          <strong>No podés "romper" nada por mirar.</strong> Andar clickeando y
          explorando no cambia números reales. Lo único que sí cuenta es
          confirmar una compra, una venta o una transferencia — y antes de
          confirmar, siempre podés revisar con calma o borrar lo que empezaste.
        </p>
      </Callout>

      <p>
        Este recorrido tiene ocho lecciones cortas — dos o tres minutos cada
        una — que van de lo más simple a lo más completo. No hace falta
        hacerlas todas de una sentada: podés cerrar acá y volver cuando
        quieras, el Centro de aprendizaje te va a mostrar por dónde ibas.
      </p>

      <p>Empecemos por lo básico: las palabras que vas a encontrar en el panel.</p>
    </LessonLayout>
  )
}
