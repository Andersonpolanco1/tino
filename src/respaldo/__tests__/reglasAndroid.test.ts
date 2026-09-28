import { NOMBRE_RESPALDO_AUTOMATICO } from '../automatico';

// Decisión D81: el respaldo de Google se lleva la copia automática y las preferencias, nunca la
// base cifrada ni la llave (no viajan sus claves) ni el resumen del widget.
const { REGLAS } = require('../../../plugins/respaldo-android') as { REGLAS: string };

test('incluye la copia automática con el mismo nombre que usa la app', () => {
  expect(REGLAS).toContain(`<include domain="file" path="${NOMBRE_RESPALDO_AUTOMATICO}"/>`);
});

test('excluye la llave de SecureStore y el resumen del widget, y no incluye la base', () => {
  expect(REGLAS).toContain('<exclude domain="sharedpref" path="SecureStore"/>');
  expect(REGLAS).toContain('<exclude domain="sharedpref" path="SecureStore.xml"/>');
  expect(REGLAS).toContain('<exclude domain="sharedpref" path="tino_widget.xml"/>');
  expect(REGLAS).not.toMatch(/domain="database"/);
});
