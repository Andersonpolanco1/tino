import configDO from '../do.json';

// Los feriados alimentan el ajuste de día no hábil del motor (sección 5.1).
describe.each([['DO', configDO.feriados]])('feriados de %s', (_pais, feriados) => {
  test('son fechas reales en formato AAAA-MM-DD', () => {
    for (const fecha of feriados) {
      expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10)).toBe(fecha);
    }
  });

  test('están en orden y sin repetir', () => {
    const ordenados = [...new Set(feriados)].sort();
    expect(feriados).toEqual(ordenados);
  });
});
