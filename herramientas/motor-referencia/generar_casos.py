import json
from motor import motor
def tarjeta(id,alias,corte,limite,rec=None,moneda='solo_principal',ajuste='ninguno',compraCorte='entra_en_siguiente',pausa=False,**kw):
    t={'id':id,'alias':alias,'emisorId':None,'productoId':None,'productoDesconocido':False,'diaCorte':corte,'fechaLimite':limite,
       'ajusteDiaNoHabil':ajuste,'compraEnDiaDeCorte':compraCorte,'monedaFacturacion':moneda,'recompensa':rec or {'tipo':'ninguna'},'enPausa':pausa,'creadaEn':'2026-09-01'}
    t.update(kw);return t
dia=lambda d:{'tipo':'dia_del_mes','dia':d}
despues=lambda n:{'tipo':'dias_despues_corte','dias':n}
pts_monto=lambda p,x,v:{'tipo':'puntos','regla':{'tipo':'por_monto','puntos':p,'porCadaMonto':x},'valorPunto':v,'valorPuntoConfirmado':True}
pts_pct=lambda pct,v:{'tipo':'puntos','regla':{'tipo':'por_porcentaje','porcentaje':pct},'valorPunto':v,'valorPuntoConfirmado':True}
cb=lambda pct:{'tipo':'cashback','porcentaje':pct}
def pref(modo='equilibrado',pago=None,**kw):
    p={'pais':'DO','idioma':'es-DO','enfoque':{'modo':modo},'pagoBalanceUsd':pago,'diferencialCambiarioPct':6,'umbralCorteCercanoDias':3,'analiticaActiva':True,'plan':'gratis'};p.update(kw);return p
def pais(fer=()):
    return {'codigo':'DO','monedaPrincipal':'DOP','monedaSecundaria':'USD','idiomas':['es-DO'],'feriados':list(fer),'catalogoDisponible':True,'funciones':{'dobleBalance':True},'montoReferencia':1000}
A=tarjeta('A','Tarjeta A',5,dia(25),pts_monto(1,100,0.5))
B=tarjeta('B','Tarjeta B',20,dia(10),pts_pct(2,1.0))
C=tarjeta('C','Tarjeta C',1,dia(21),cb(1))
casos=[]
def caso(id,desc,hoy,tarjetas,preferencias,paisc=None,ingresos=(),compra=None,verifica=''):
    e={'hoy':hoy,'tarjetas':tarjetas,'ingresos':list(ingresos),'preferencias':preferencias,'pais':paisc or pais()}
    if compra: e['compra']=compra
    casos.append({'id':id,'descripcion':desc,'verifica':verifica,'entrada':e,'esperado':motor(e)})
caso('ej-7.4-equilibrado','Ejemplo de la sección 7.4 de la especificación en modo Equilibrado','2026-10-06',[A,B,C],pref(),verifica='Orden C, B, A; días 46, 35 y 50')
caso('ej-7.4-liquidez','Mismo ejemplo en modo Liquidez','2026-10-06',[A,B,C],pref('liquidez'),verifica='C sigue primero por poco (83.6 frente a 82.5): Liquidez aún da 10% a puntos y 10% a cashback. El orden puro por días es el botón Más días de la barra de orden')
caso('ej-7.4-puntos','Mismo ejemplo en modo Puntos','2026-10-06',[A,B,C],pref('puntos'),verifica='B primero por mayor valor en puntos')
caso('corte-31-febrero','Corte el día 31 en febrero se toma como el último día del mes','2027-02-10',[tarjeta('F','Febrero',31,despues(20))],pref(),verifica='Próximo corte 2027-02-28, fecha de pago 2027-03-20')
caso('compra-dia-corte-siguiente','Compra el mismo día del corte entra en el siguiente estado','2026-10-05',[tarjeta('S','Siguiente',5,dia(25))],pref(),verifica='Próximo corte 2026-11-05, pago 2026-11-25, 51 días')
caso('compra-dia-corte-actual','Compra el mismo día del corte entra en el estado actual','2026-10-05',[tarjeta('S','Actual',5,dia(25),compraCorte='entra_en_corte_actual')],pref(),verifica='Próximo corte 2026-10-05, pago 2026-10-25, 20 días')
# weekend: corte Oct 20 2026; due dia 7 Nov 2026 -> Nov 7 2026 is Saturday
for aj in ['ninguno','adelantar','atrasar']:
    caso(f'fin-de-semana-{aj}',f'Fecha límite en sábado con ajuste "{aj}"','2026-10-10',[tarjeta('W','Sabado',20,dia(7),ajuste=aj)],pref(),verifica='Fecha límite nominal 2026-11-07 (sábado)')
caso('feriado-atrasar','Fecha límite en feriado con ajuste "atrasar"','2026-10-10',[tarjeta('H','Feriado',20,dia(10),ajuste='atrasar')],pref(),paisc=pais(['2026-11-10']),verifica='2026-11-10 es feriado de prueba: se mueve al 2026-11-11')
caso('en-pausa','Una tarjeta en pausa no aparece en el ranking','2026-10-06',[A,dict(B,enPausa=True),C],pref(),verifica='B en excluidas con motivo en_pausa')
caso('una-tarjeta','Una sola tarjeta: ranking de un elemento y semáforo','2026-10-06',[A],pref(),verifica='Semáforo verde: el corte fue ayer')
caso('corte-cercano','Tarjeta a 2 días del corte recibe penalización y semáforo rojo','2026-10-18',[B,C],pref(),verifica='B con etiqueta corta_pronto y penalización 10')
caso('sin-recompensas','Ninguna tarjeta tiene recompensa: todo el peso pasa a días','2026-10-06',[tarjeta('X','X',5,dia(25)),tarjeta('Y','Y',20,dia(10))],pref(),verifica='Pesos aplicados 100/0/0')
nomina=[{'id':'n','nombre':'Nómina','frecuencia':{'tipo':'quincenal_dias_fijos','dias':[15,30]},'ajusteDiaNoHabil':'adelantar'}]
caso('vence-antes-del-cobro','Pago que vence antes de cualquier cobro','2026-10-01',[tarjeta('P','Pronto',2,dia(12)),A],pref(),ingresos=nomina,verifica='P: corte 2026-10-02, pago 2026-10-12, sin cobro entre medio: etiqueta vence_antes_del_cobro')
DB=tarjeta('DB','Doble balance',5,dia(25),cb(1),moneda='doble_balance')
SP=tarjeta('SP','Solo pesos',5,dia(25),cb(2),moneda='solo_principal')
SL=tarjeta('SL','Solo local',5,dia(25),cb(3),moneda='solo_local')
caso('usd-paga-con-dolares','Compra en dólares; el usuario paga su balance en dólares','2026-10-06',[DB,SP,SL],pref(pago='con_dolares'),compra={'monto':100,'moneda':'USD'},verifica='SL excluida; SP penalizada con 60; DB primero')
caso('usd-paga-con-pesos','Compra en dólares; el usuario paga su balance con pesos','2026-10-06',[DB,SP,SL],pref(pago='con_pesos'),compra={'monto':100,'moneda':'USD'},verifica='SL excluida; SP sin penalización y primero por más cashback')
json.dump({'version':'1','descripcion':'Casos de prueba del motor de recomendación de Tino. Generados con la implementación de referencia descrita en la sección 5 de la documentación técnica.','casos':casos},open('../../src/motor/__tests__/motor.casos.json','w'),ensure_ascii=False,indent=2)
for c in casos:
    r=c['esperado']
    print(c['id'],[(x['tarjetaId'],x['diasGracia'],x['fechaPago'],x['puntaje'],x['etiquetas'],x['semaforo']) for x in r['ranking']],r['excluidas'],r['pesosAplicados'])
