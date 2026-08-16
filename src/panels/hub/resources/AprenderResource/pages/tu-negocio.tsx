import { Callout } from '../components/lesson-content'
import { LessonLayout } from '../components/LessonLayout'

export default function TuNegocioLesson() {
  return (
    <LessonLayout slug="tu-negocio">
      <p>
        Con el catálogo armado y algunas compras y ventas registradas, el panel
        empieza a devolverte algo valioso: una foto clara de cómo está tu
        negocio, sin que tengas que sumar nada a mano.
      </p>

      <p>
        El <strong>Dashboard</strong> (la primera pantalla que ves al entrar) te
        muestra de un vistazo:
      </p>

      <ul className="flex flex-col gap-2 pl-1 text-[15px] text-gray-700 dark:text-gray-300">
        <li>• Cuánto vale, en plata, todo lo que tenés en inventario.</li>
        <li>• Cuántos productos tenés con stock, sobre el total de tu catálogo.</li>
        <li>• Qué productos están por debajo del mínimo que definiste — para saber qué reponer.</li>
        <li>• Qué lotes están por vencer o ya vencieron, si manejás productos con fecha de caducidad.</li>
      </ul>

      <p>
        La pantalla <strong>Ventas y ganancia</strong> va un paso más allá: te
        dice cuánto vendiste, cuánto te costó lo que vendiste, y cuánto te
        quedó — en un período que vos elegís (hoy, esta semana, este mes, el
        que quieras).
      </p>

      <Callout>
        <p>
          <strong>¿Qué es el "margen"?</strong> Es simplemente qué porcentaje de
          lo que vendiste terminó siendo ganancia. Si vendiste algo en $100.000 y
          te había costado $80.000, ganaste $20.000 — un margen del 20%. Faro lo
          calcula solo, y siempre contra el costo real de cada producto, no
          contra un cálculo aproximado.
        </p>
      </Callout>

      <p>
        Un detalle que vale la pena saber: los montos de esta pantalla no
        incluyen el IVA. Eso es a propósito — el IVA lo cobrás, pero después se
        lo entregás al Estado, así que no es plata que te quede a vos. Mostrarlo
        como si fuera ganancia inflaría el número y te haría creer que ganaste
        más de lo que ganaste.
      </p>

      <p>
        Con esto termina el recorrido. Ya tenés lo esencial para manejar tu
        negocio en Faro con confianza — y si en el camino te olvidás de algo,
        el Centro de aprendizaje va a seguir acá, esperándote.
      </p>
    </LessonLayout>
  )
}
