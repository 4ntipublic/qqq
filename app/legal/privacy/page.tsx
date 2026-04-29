import type { Metadata } from 'next'
import LegalShell from '../_components/LegalShell'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Política de privacidad de akpkyy: qué datos recopilamos, cómo los protegemos y los derechos que tiene cada usuario sobre su información.',
  alternates: { canonical: '/legal/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Política de Privacidad" updatedAt="29 de abril de 2026">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">1. Información que recopilamos</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Recopilamos únicamente la
          información necesaria para procesar las compras y administrar la cuenta del usuario:
          nombre, correo electrónico, datos de facturación, identificadores de pago y, de
          manera opcional, redes sociales asociadas al perfil.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">2. Uso de los datos</h2>
        <p>
          Los datos se utilizan exclusivamente para: (i) procesar pagos y entregar las
          descargas adquiridas; (ii) habilitar el acceso a la biblioteca personal del
          usuario; (iii) brindar soporte; y (iv) enviar notificaciones operativas vinculadas
          a la compra. No realizamos perfilado publicitario ni venta de datos a terceros.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">3. Procesadores de pago</h2>
        <p>
          Aenean lacinia bibendum nulla sed consectetur. Los pagos son procesados por
          proveedores externos certificados. akpkyy no almacena directamente datos
          completos de tarjetas de crédito ni credenciales bancarias. Sólo conservamos los
          identificadores necesarios para conciliar las operaciones.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">4. Cookies y sesión</h2>
        <p>
          Utilizamos cookies estrictamente necesarias para mantener la sesión de cada
          usuario, recordar su carrito y proteger el sitio frente a accesos no autorizados.
          No usamos cookies publicitarias de terceros.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">5. Seguridad</h2>
        <p>
          Donec sed odio dui. Aplicamos medidas razonables para proteger los datos personales,
          incluyendo conexiones cifradas, controles de acceso y almacenamiento de archivos en
          infraestructura distribuida con políticas de retención mínimas.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">6. Tus derechos</h2>
        <p>
          Podés solicitar en cualquier momento el acceso, la rectificación o la eliminación
          de tus datos personales. La eliminación de la cuenta también remueve tus
          identificadores asociados, manteniendo únicamente los registros mínimos exigidos
          por las normas fiscales aplicables.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">7. Contacto</h2>
        <p>
          Para ejercer tus derechos o realizar consultas sobre esta política, podés escribirnos
          al canal oficial de soporte. Este texto es un placeholder temporal y será reemplazado
          por la versión definitiva redactada por el equipo legal del cliente.
        </p>
      </section>
    </LegalShell>
  )
}
