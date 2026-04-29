import type { Metadata } from 'next'
import LegalShell from '../_components/LegalShell'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Términos y condiciones del uso de akpkyy: licencias, descargas, reembolsos y obligaciones del comprador.',
  alternates: { canonical: '/legal/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <LegalShell title="Términos y Condiciones" updatedAt="29 de abril de 2026">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">1. Aceptación</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Al acceder a este sitio
          y/o realizar una compra de cualquier beat, licencia o producto digital, el usuario
          declara aceptar de forma íntegra los presentes Términos y Condiciones. Si no estás
          de acuerdo con alguno de los puntos detallados a continuación, te pedimos abstenerte
          de utilizar el servicio.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">2. Licencias y uso</h2>
        <p>
          Praesent commodo cursus magna, vel scelerisque nisl consectetur. Cada beat se
          comercializa bajo el tipo de licencia seleccionada al momento de la compra. La
          licencia otorga derechos no exclusivos sobre el material salvo indicación contraria
          en el contrato firmado adjunto a la entrega.
        </p>
        <p>
          El comprador no podrá revender, sublicenciar ni distribuir los archivos originales
          fuera de los términos pactados. Cualquier uso comercial fuera de la licencia
          adquirida puede dar lugar a la rescisión inmediata del acuerdo.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">3. Pagos y reembolsos</h2>
        <p>
          Curabitur blandit tempus porttitor. Las compras se procesan a través de proveedores
          de pago certificados. Los productos digitales (audio, contratos, archivos
          asociados) se consideran entregados al momento en que la descarga queda disponible
          en la biblioteca del usuario.
        </p>
        <p>
          Por tratarse de bienes digitales con entrega inmediata, las devoluciones quedan
          sujetas a evaluación. Cualquier reembolso aprobado deshabilita automáticamente las
          descargas asociadas a la compra correspondiente.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">4. Propiedad intelectual</h2>
        <p>
          Donec ullamcorper nulla non metus auctor fringilla. Todos los archivos de audio,
          imágenes, videos, marca e identidad pertenecen a akpkyy o a sus licenciantes. La
          licencia adquirida no implica transferencia de derechos de autor ni cesión de
          marca.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">5. Limitación de responsabilidad</h2>
        <p>
          Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. akpkyy no
          será responsable por pérdidas indirectas, daños emergentes ni lucro cesante
          derivados del uso o la imposibilidad de uso del material adquirido. El servicio se
          presta &quot;tal cual&quot;, sin garantías implícitas más allá de las exigidas por la
          legislación aplicable.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">6. Modificaciones</h2>
        <p>
          akpkyy se reserva el derecho de actualizar estos Términos en cualquier momento.
          Las modificaciones entrarán en vigencia desde su publicación en este sitio. Es
          responsabilidad del usuario revisar este documento periódicamente.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">7. Contacto</h2>
        <p>
          Para consultas relacionadas con estos Términos, podés escribirnos al canal
          oficial de soporte. Este texto es un placeholder temporal y será reemplazado por
          la versión definitiva redactada por el equipo legal del cliente.
        </p>
      </section>
    </LegalShell>
  )
}
