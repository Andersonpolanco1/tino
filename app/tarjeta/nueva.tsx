import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { FormularioTarjeta } from '@/registro/FormularioTarjeta';
import { useAlmacen } from '@/estado';
import { MuroPago, puedeAgregarTarjeta } from '@/suscripciones';
import { useVolver } from '@/utilidades/useVolver';

export default function NuevaTarjeta() {
  const router = useRouter();
  const volver = useVolver();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const plan = useAlmacen(s => s.preferencias?.plan ?? 'gratis');
  // Todas las entradas para agregar tarjeta pasan por aquí: con el límite del plan gratis se
  // muestra la oferta de Pro, y tras la confirmación de compra sigue el registro (15.5). Se decide
  // al abrir, para que guardar la 2.ª tarjeta no muestre la oferta antes de cerrar.
  const [alAbrir] = useState(() => puedeAgregarTarjeta(tarjetas, plan));
  const [conPro, setConPro] = useState(false);
  const permitido = alAbrir || conPro;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {permitido ? (
        <FormularioTarjeta
          onCerrar={volver}
          onListo={(_tarjeta, preguntarPagoUsd) => (preguntarPagoUsd ? router.replace('/tarjeta/pago-usd') : volver())}
        />
      ) : (
        <MuroPago motivo="tercera_tarjeta" onCerrar={volver} onPro={() => setConPro(true)} />
      )}
    </>
  );
}
