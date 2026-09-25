"""Genera casos aleatorios (con semilla fija) para comparar el motor en TypeScript con esta referencia.

Complementa a generar_casos.py: aquellos casos documentan reglas; estos buscan diferencias
en combinaciones que nadie escribió a mano (redondeo, meses cortos, feriados, cobros).
Uso: python3 generar_aleatorios.py  (en Windows, python)
"""
import json, random
from datetime import date, timedelta
from motor import motor

rnd = random.Random(20260925)
CANTIDAD = 200

def fecha(desde, hasta):
    return (desde + timedelta(days=rnd.randint(0, (hasta - desde).days))).isoformat()

def regla_fecha():
    if rnd.random() < 0.7:
        return {'tipo': 'dia_del_mes', 'dia': rnd.randint(1, 31)}
    return {'tipo': 'dias_despues_corte', 'dias': rnd.randint(15, 30)}

def recompensa():
    r = rnd.random()
    if r < 0.2:
        return {'tipo': 'ninguna'}
    if r < 0.5:
        return {'tipo': 'cashback', 'porcentaje': rnd.choice([0.5, 1, 1.25, 1.5, 2, 3, 5])}
    regla = rnd.choice([
        {'tipo': 'por_monto', 'puntos': rnd.choice([1, 2, 3]), 'porCadaMonto': rnd.choice([50, 100, 200, 250])},
        {'tipo': 'por_porcentaje', 'porcentaje': rnd.choice([0.5, 1, 1.5, 2, 3])},
        {'tipo': 'por_transaccion', 'puntos': rnd.choice([5, 10, 25])},
    ])
    return {'tipo': 'puntos', 'regla': regla, 'valorPunto': rnd.choice([0.1, 0.25, 0.5, 0.75, 1, 1.25]), 'valorPuntoConfirmado': True}

def tarjeta(i):
    t = {
        'id': f't{i}', 'alias': rnd.choice(['Visa', 'Oro', 'Clásica', 'Black', 'Azul', 'Viajes']) + f' {rnd.randint(1, 3)}',
        'emisorId': None, 'productoId': None, 'productoDesconocido': False,
        'diaCorte': rnd.randint(1, 31), 'fechaLimite': regla_fecha(),
        'ajusteDiaNoHabil': rnd.choice(['ninguno', 'adelantar', 'atrasar']),
        'compraEnDiaDeCorte': rnd.choice(['entra_en_siguiente', 'entra_en_corte_actual']),
        'monedaFacturacion': rnd.choice(['solo_principal', 'doble_balance', 'solo_usd', 'solo_local']),
        'recompensa': recompensa(), 'enPausa': rnd.random() < 0.1, 'creadaEn': '2026-01-01',
    }
    if t['monedaFacturacion'] == 'doble_balance' and rnd.random() < 0.5:
        t['fechaLimiteUsd'] = regla_fecha()
    if rnd.random() < 0.2:
        t['recompensaUsd'] = recompensa()
    return t

def ingreso(i):
    frecuencia = rnd.choice([
        {'tipo': 'quincenal_dias_fijos', 'dias': [15, rnd.choice([28, 30, 31])]},
        {'tipo': 'mensual', 'dia': rnd.randint(1, 31)},
        {'tipo': 'semanal', 'diaSemana': rnd.randint(0, 6)},
    ])
    return {'id': f'i{i}', 'nombre': 'Cobro', 'frecuencia': frecuencia, 'ajusteDiaNoHabil': rnd.choice(['ninguno', 'adelantar', 'atrasar'])}

def caso(n):
    inicio, fin = date(2026, 1, 1), date(2028, 12, 31)
    hoy = fecha(inicio, fin)
    base = date.fromisoformat(hoy)
    feriados = sorted({fecha(base, base + timedelta(days=90)) for _ in range(rnd.randint(0, 6))})
    entrada = {
        'hoy': hoy,
        'tarjetas': [tarjeta(i) for i in range(rnd.randint(1, 5))],
        'ingresos': [ingreso(i) for i in range(rnd.choice([0, 0, 1, 2]))],
        'preferencias': {
            'pais': 'DO', 'idioma': 'es-DO', 'enfoque': {'modo': rnd.choice(['liquidez', 'puntos', 'cashback', 'equilibrado'])},
            'pagoBalanceUsd': rnd.choice([None, 'con_pesos', 'con_dolares']),
            'diferencialCambiarioPct': rnd.choice([0, 3, 6, 6.5, 12]), 'umbralCorteCercanoDias': rnd.choice([2, 3, 5]),
            'analiticaActiva': True, 'plan': 'gratis',
        },
        'pais': {
            'codigo': 'DO', 'monedaPrincipal': 'DOP', 'monedaSecundaria': 'USD', 'idiomas': ['es-DO'], 'feriados': feriados,
            'catalogoDisponible': True, 'funciones': {'dobleBalance': True}, 'montoReferencia': 1000,
        },
    }
    if rnd.random() < 0.4:
        entrada['compra'] = {'monto': rnd.choice([37.5, 100, 250, 1234.56, 5000]), 'moneda': rnd.choice(['DOP', 'USD'])}
    return {'id': f'aleatorio-{n}', 'entrada': entrada, 'esperado': motor(entrada)}

casos = [caso(n) for n in range(CANTIDAD)]
with open('../../src/motor/__tests__/motor.aleatorios.json', 'w', encoding='utf-8') as f:
    json.dump({'semilla': 20260925, 'descripcion': 'Casos aleatorios generados con generar_aleatorios.py para comparar con la referencia.', 'casos': casos}, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(casos)} casos generados')
