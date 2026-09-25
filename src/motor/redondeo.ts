// Redondeo a 2 decimales idéntico a round(x, 2) de Python, que genera los casos del motor.
// Ambos redondean el valor binario exacto; solo difieren cuando ese valor es un empate
// exacto, y en ese caso Python elige el par. Un empate a 2 decimales solo ocurre si
// x × 8 es un entero impar (…0.125, …0.375, …0.625, …0.875).
export function redondear2(x: number): number {
  const absoluto = Math.abs(x);
  const octavos = absoluto * 8;
  let texto: string;
  if (Number.isInteger(octavos) && octavos % 2 === 1) {
    const abajo = Math.floor(absoluto * 100);
    texto = ((abajo % 2 === 0 ? abajo : abajo + 1) / 100).toFixed(2);
  } else {
    texto = absoluto.toFixed(2);
  }
  // Conserva el signo, incluido el -0 que Python escribe como -0.0.
  return x < 0 || Object.is(x, -0) ? -Number(texto) : Number(texto);
}
