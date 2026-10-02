# Genera todos los iconos de Tino desde una sola geometría (decisión D104): tres tarjetas apiladas
# de frente, en proporción real (85.6 × 54 mm), que crecen hacia el frente como vistas desde
# arriba. Atrás la jade, en medio la dorada y al frente la blanca, con su chip y la línea del
# número recortados. Plano, sin sombras: entre las piezas hay un hueco recortado de verdad, así
# que la figura se lee igual en color, en gris y en una sola tinta.
#
# Uso, desde la raíz del repositorio: python herramientas/iconos/generar_iconos.py (requiere Pillow).
# Escribe en assets/iconos/: fuente-icono.svg, tino-tarjetas.svg, tino-tarjetas-monocromo.svg,
# tino-tarjetas.png, app-store-1024.png, play-store-512.png, android-fondo.png,
# android-primer-plano.png, android-monocromo.png y splash.png. La página de Tino en
# polancolabs.com usa una copia de fuente-icono.svg (public/apps/tino/icono.svg).
import math
from PIL import Image, ImageDraw

DESTINO = 'assets/iconos'

# Colores base de src/diseno/tokens.json.
JADE_ARRIBA, JADE_ABAJO = '#12916A', '#0B6B4E'  # degradado del fondo
JADE_VIVO = '#2BD49A'  # jadeVivo
ORO = '#F2B33D'        # oro
PAPEL = '#F5F7F4'      # papel

# Geometría en un lienzo de 512: x, y, ancho, alto, radio. LogoTino repite estos números.
ATRAS = (126, 102, 260, 164, 24)
MEDIO = (111, 152, 290, 183, 26)
FRENTE = (96, 210, 320, 202, 28)
HUECOS_FRENTE = [(136, 268, 64, 48, 12), (136, 350, 170, 20, 10)]  # chip y línea del número
SEPARACION = 12  # hueco entre una tarjeta y la de delante
CAPAS = [(ATRAS, JADE_VIVO), (MEDIO, ORO), (FRENTE, PAPEL)]  # de atrás hacia adelante
CENTRO = (256, (ATRAS[1] + FRENTE[1] + FRENTE[3]) / 2)
# En los iconos con fondo (App Store, Google Play) la pila se agranda hasta ocupar el 75% del
# ancho, con un 12.5% de margen a cada lado: las tiendas muestran el cuadro completo, solo con las
# esquinas suavizadas.
AUMENTO_TIENDAS = 1.2


def contorno(r, pasos=24):
    """Puntos del borde de un rectángulo redondeado."""
    x, y, w, h, rr = r
    for cx, cy, desde in ((x + w - rr, y + rr, -90), (x + w - rr, y + h - rr, 0), (x + rr, y + h - rr, 90), (x + rr, y + rr, 180)):
        for i in range(pasos + 1):
            t = math.radians(desde + 90 * i / pasos)
            yield cx + rr * math.cos(t), cy + rr * math.sin(t)


# Distancia del centro al punto más lejano de la pila: lo que tiene que caber en un círculo.
RADIO_PILA = max(math.hypot(px - CENTRO[0], py - CENTRO[1]) for r, _ in CAPAS for px, py in contorno(r))


def agrandar(r, d):
    x, y, w, h, rr = r
    return (x - d, y - d, w + 2 * d, h + 2 * d, rr + d)


def rgba(h, a=1.0):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), int(round(a * 255)))


# ---------- SVG ----------

def atributos(r):
    x, y, w, h, rr = r
    return f'x="{x}" y="{y}" width="{w}" height="{h}" rx="{rr}"'


def svg_pila(colores, aumento=1.0):
    """Máscaras y piezas de la pila centrada en el lienzo de 512, agrandada `aumento` veces."""
    caja = 'maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"'
    mascaras, piezas = [], []
    for i, (r, _) in enumerate(CAPAS):
        quitar = [agrandar(d, SEPARACION) for d, _ in CAPAS[i + 1:]] + (HUECOS_FRENTE if r is FRENTE else [])
        nombre = f'hueco{i}'
        mascaras.append(f'    <mask id="{nombre}" {caja}>\n      <rect width="512" height="512" fill="#fff"/>\n'
                        + ''.join(f'      <rect {atributos(q)} fill="#000"/>\n' for q in quitar) + '    </mask>\n')
        piezas.append(f'    <rect {atributos(r)} fill="{colores[i]}" mask="url(#{nombre})"/>')
    mover = f'translate(256 256) scale({aumento}) translate({-CENTRO[0]} {-CENTRO[1]})'
    return ''.join(mascaras), f'  <g transform="{mover}">\n' + '\n'.join(piezas) + '\n  </g>'


def escribir_svg():
    fondo = (f'    <linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1">\n'
             f'      <stop offset="0" stop-color="{JADE_ARRIBA}"/>\n      <stop offset="1" stop-color="{JADE_ABAJO}"/>\n'
             f'    </linearGradient>\n')
    cabeza = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n'
    color = [c for _, c in CAPAS]

    mascaras, pila = svg_pila(color, AUMENTO_TIENDAS)
    with open(f'{DESTINO}/fuente-icono.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Icono de Tino (D104). Lo genera herramientas/iconos/generar_iconos.py: no editar a mano. -->\n'
                f'  <defs>\n{fondo}{mascaras}  </defs>\n  <rect width="512" height="512" fill="url(#fondo)"/>\n' + pila + '\n</svg>\n')
    mascaras, pila = svg_pila(color)
    with open(f'{DESTINO}/tino-tarjetas.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Tarjetas de Tino sin fondo (D104), para fondos oscuros o de color. Generado: no editar a mano. -->\n'
                f'  <defs>\n{mascaras}  </defs>\n' + pila + '\n</svg>\n')
    mascaras, pila = svg_pila(['#FFFFFF'] * 3)
    with open(f'{DESTINO}/tino-tarjetas-monocromo.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Tarjetas de Tino en una sola tinta (D104). Generado: no editar a mano. -->\n'
                f'  <defs>\n{mascaras}  </defs>\n' + pila + '\n</svg>\n')


# ---------- PNG ----------

S = 4  # sobremuestreo para bordes suaves


def pila(lado, escala, colores):
    """Capa RGBA de lado×lado con la pila al centro; `escala` es el ancho del icono de 512 en píxeles."""
    N = lado * S
    k = escala * S / 512
    ox, oy = N / 2 - CENTRO[0] * k, N / 2 - CENTRO[1] * k

    def caja(r):
        x, y, w, h, rr = r
        return [ox + x * k, oy + y * k, ox + (x + w) * k, oy + (y + h) * k], rr * k

    final = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for i, (r, _) in enumerate(CAPAS):
        alfa = Image.new('L', (N, N), 0)
        d = ImageDraw.Draw(alfa)
        d.rounded_rectangle(*caja(r), fill=255)
        for q in [agrandar(t, SEPARACION) for t, _ in CAPAS[i + 1:]] + (HUECOS_FRENTE if r is FRENTE else []):
            d.rounded_rectangle(*caja(q), fill=0)
        capa = Image.new('RGBA', (N, N), rgba(colores[i]))
        capa.putalpha(alfa)
        final = Image.alpha_composite(final, capa)
    return final.resize((lado, lado), Image.LANCZOS)


def degradado(lado):
    arriba, abajo = rgba(JADE_ARRIBA), rgba(JADE_ABAJO)
    fondo = Image.new('RGBA', (lado, lado))
    d = ImageDraw.Draw(fondo)
    for fila in range(lado):
        t = fila / (lado - 1)
        d.line([(0, fila), (lado, fila)], fill=tuple(int(arriba[i] + (abajo[i] - arriba[i]) * t) for i in range(4)))
    return fondo


COLORES = [c for _, c in CAPAS]
BLANCO = ['#FFFFFF'] * 3


def icono_con_fondo(lado):
    return Image.alpha_composite(degradado(lado), pila(lado, lado * AUMENTO_TIENDAS, COLORES)).convert('RGB')


def escribir_png():
    icono_con_fondo(1024).save(f'{DESTINO}/app-store-1024.png', optimize=True)  # sin transparencia ni esquinas
    icono_con_fondo(512).save(f'{DESTINO}/play-store-512.png', optimize=True)
    pila(1024, 1024 * 512 / (FRENTE[2] + 32), COLORES).save(f'{DESTINO}/tino-tarjetas.png', optimize=True)

    # Icono adaptativo de Android: lienzo de 108 dp (432 px a 4x); cualquier forma del launcher
    # deja ver al menos el círculo de 66 dp del centro. La pila se agranda hasta que su punto más
    # lejano quede a 32.5 dp del centro: llena el icono sin que ninguna forma lo recorte.
    visible = 32.5 * 4 / RADIO_PILA * 512
    degradado(432).save(f'{DESTINO}/android-fondo.png', optimize=True)
    pila(432, visible, COLORES).save(f'{DESTINO}/android-primer-plano.png', optimize=True)
    pila(432, visible, BLANCO).save(f'{DESTINO}/android-monocromo.png', optimize=True)

    # Splash (Android 12+): recorta en un círculo de 2/3 del lienzo; la pila tiene que caber con aire.
    escala = 1024 * (1 / 3) * 0.9 / RADIO_PILA * 512
    pila(1024, escala, COLORES).save(f'{DESTINO}/splash.png', optimize=True)


if __name__ == '__main__':
    escribir_svg()
    escribir_png()
    print('Iconos generados en', DESTINO)
