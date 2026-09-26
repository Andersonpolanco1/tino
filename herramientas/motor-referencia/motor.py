import calendar, json
from datetime import date, timedelta
D=date.fromisoformat
def ultimo(y,m): return calendar.monthrange(y,m)[1]
def en_mes(y,m,d): return date(y,m,min(d,ultimo(y,m)))
def sig_mes(y,m): return (y+1,1) if m==12 else (y,m+1)
def ant_mes(y,m): return (y-1,12) if m==1 else (y,m-1)
def proximo_corte(hoy,t):
    c=en_mes(hoy.year,hoy.month,t['diaCorte'])
    if hoy<c or (hoy==c and t['compraEnDiaDeCorte']=='entra_en_corte_actual'): return c
    y,m=sig_mes(hoy.year,hoy.month); return en_mes(y,m,t['diaCorte'])
def corte_anterior(prox,t):
    y,m=ant_mes(prox.year,prox.month); return en_mes(y,m,t['diaCorte'])
def habil(d,fer): return d.weekday()<5 and d.isoformat() not in fer
def ajustar(d,modo,fer):
    if modo=='ninguno': return d
    step=-1 if modo=='adelantar' else 1
    while not habil(d,fer): d+=timedelta(days=step)
    return d
def fecha_limite(corte,regla,modo,fer):
    if regla['tipo']=='dia_del_mes':
        c=en_mes(corte.year,corte.month,regla['dia'])
        if c<=corte:
            y,m=sig_mes(corte.year,corte.month); c=en_mes(y,m,regla['dia'])
    else: c=corte+timedelta(days=regla['dias'])
    return ajustar(c,modo,fer)
def valor_recompensa(r,M,por_tx):
    if r['tipo']=='ninguna': return 0,0
    if r['tipo']=='cashback': return 0, M*r['porcentaje']/100
    g=r['regla'];vp=r['valorPunto']
    if g['tipo']=='por_monto': return M/g['porCadaMonto']*g['puntos']*vp,0
    if g['tipo']=='por_porcentaje': return M*g['porcentaje']/100*vp,0
    return (g['puntos']*vp if por_tx else 0),0
PESOS={'liquidez':(80,10,10),'puntos':(20,70,10),'cashback':(20,10,70),'equilibrado':(40,30,30)}
def ultimo_habil(y,m,fer):
    d=date(y,m,ultimo(y,m))
    while not habil(d,fer): d-=timedelta(days=1)
    return d
def cobra(fr,d,fer):
    t=fr['tipo']
    if t=='quincenal_dias_fijos': return any(d==en_mes(d.year,d.month,x) for x in fr['dias'])
    if t=='mensual':
        if fr['dia']=='ultimo_dia_habil': return d==ultimo_habil(d.year,d.month,fer)
        return d==en_mes(d.year,d.month,fr['dia'])
    if t=='semanal': return (d.weekday()+1)%7==fr['diaSemana']
    if t=='cada_dos_semanas': return (d.weekday()+1)%7==fr['diaSemana'] and (d-D(fr['referencia'])).days%14==0
    if t=='personalizada': return any(d==D(x['fecha']) for x in fr['fechas'])
    return False
# Etapa 5: se revisan también los 7 días de cada lado, porque el ajuste por día no hábil
# puede meter un cobro en la ventana (un sábado adelantado al viernes) o sacarlo de ella.
MARGEN=7
def cobros(ingresos,desde,hasta,fer):
    out=set()
    d=desde-timedelta(days=MARGEN)
    while d<=hasta+timedelta(days=MARGEN):
        for f in ingresos:
            if cobra(f['frecuencia'],d,fer):
                a=ajustar(d,f.get('ajusteDiaNoHabil','ninguno'),fer)
                if desde<=a<=hasta: out.add(a)
        d+=timedelta(days=1)
    return out
def motor(e):
    hoy=D(e['hoy']); pref=e['preferencias']; pais=e['pais']; fer=set(pais['feriados'])
    compra=e.get('compra'); M=compra['monto'] if compra else pais['montoReferencia']
    usd = compra and compra['moneda']=='USD'
    umbral=pref.get('umbralCorteCercanoDias',3)
    res=[];exc=[]
    for t in e['tarjetas']:
        if t['enPausa']: exc.append({'tarjetaId':t['id'],'motivo':'en_pausa'});continue
        if usd and t['monedaFacturacion']=='solo_local': exc.append({'tarjetaId':t['id'],'motivo':'solo_local_excluida'});continue
        pc=proximo_corte(hoy,t)
        regla=t.get('fechaLimiteUsd') if (usd and t['monedaFacturacion']=='doble_balance' and t.get('fechaLimiteUsd')) else t['fechaLimite']
        fp=fecha_limite(pc,regla,t['ajusteDiaNoHabil'],fer)
        rec=t.get('recompensaUsd') if (usd and t.get('recompensaUsd')) else t['recompensa']
        pts,cb=valor_recompensa(rec,M,bool(compra))
        pen=0;etq=[]
        dpc=(pc-hoy).days
        if dpc<=umbral: pen+=10; etq.append('corta_pronto')
        if e['ingresos']:
            cs=cobros(e['ingresos'],hoy,fp,fer)
            if not cs: pen+=15; etq.append('vence_antes_del_cobro')
        if usd and pref['pagoBalanceUsd']=='con_dolares' and t['monedaFacturacion']=='solo_principal':
            pen+=min(100,pref.get('diferencialCambiarioPct',6)*10)
        ca=corte_anterior(pc,t) if pc!=hoy else hoy
        ciclo=(pc-ca).days; trans=(hoy-ca).days
        sem='rojo' if dpc<=umbral else ('verde' if trans < ciclo/3 else 'amarillo')
        res.append(dict(t=t,dias=(fp-hoy).days,fp=fp,pc=pc,dpc=dpc,pts=pts,cb=cb,pen=pen,etq=etq,sem=sem))
    w=list(PESOS[pref['enfoque']['modo']])
    maxs=[max([r['dias'] for r in res],default=0),max([r['pts'] for r in res],default=0),max([r['cb'] for r in res],default=0)]
    act=[m>0 for m in maxs]; tot=sum(wi for wi,a in zip(w,act) if a)
    w=[(wi*100/tot if a else 0) for wi,a in zip(w,act)] if tot else w
    out=[]
    for r in res:
        n=[ (v/m*100 if m>0 else 0) for v,m in zip([r['dias'],r['pts'],r['cb']],maxs)]
        s=sum(wi/100*ni for wi,ni in zip(w,n))-r['pen']
        out.append({'tarjetaId':r['t']['id'],'diasGracia':r['dias'],'fechaPago':r['fp'].isoformat(),'proximoCorte':r['pc'].isoformat(),'diasParaCorte':r['dpc'],
          'valorRecompensa':round(r['pts']+r['cb'],2),'normalizado':{'dias':round(n[0],2),'puntos':round(n[1],2),'cashback':round(n[2],2)},
          'penalizacion':r['pen'],'puntaje':round(s,2),'etiquetas':r['etq'],'semaforo':r['sem'],'_alias':r['t']['alias']})
    out.sort(key=lambda x:(-x['puntaje'],-x['diasGracia'],x['_alias']))
    for o in out: o.pop('_alias')
    return {'ranking':out,'excluidas':exc,'pesosAplicados':{'dias':round(w[0],2),'puntos':round(w[1],2),'cashback':round(w[2],2)}}
