# Genera todos los iconos de Tino desde una sola geometría (decisión D94): tres tarjetas en
# abanico, en proporción real (85.6 × 54 mm); al frente la que Tino elige, con su chip. Un solo
# estilo en todas partes: la del frente blanca con sombra, que se lee sobre el jade, sobre fondos
# claros y sobre oscuros.
#
# Uso, desde la raíz del repositorio: python herramientas/iconos/generar_iconos.py (requiere Pillow).
# Escribe en assets/iconos/: fuente-icono.svg, tino-tarjetas.svg, tino-tarjetas-monocromo.svg,
# tino-tarjetas.png, app-store-1024.png, play-store-512.png, android-fondo.png,
# android-primer-plano.png, android-monocromo.png y splash.png.
import math
from PIL import Image, ImageDraw, ImageFilter

DESTINO = 'assets/iconos'

# Colores base de src/diseno/tokens.json.
JADE_ARRIBA, JADE_ABAJO = '#12916A', '#0B6B4E'  # degradado del fondo
JADE_VIVO = '#2BD49A'  # jadeVivo
ORO = '#F2B33D'        # oro
PAPEL = '#F5F7F4'      # papel
TINTA = '#0D1B16'      # tinta

# Geometría en un lienzo de 512: la tarjeta, su chip y el giro de las dos de atrás alrededor de
# la esquina inferior izquierda, como cartas en la mano.
TARJETA = (138, 212, 236, 149)  # x, y, ancho, alto (236 / 149 ≈ 85.6 / 54)
RADIO = 22
CHIP = (164, 270, 42, 32, 7)    # x, y, ancho, alto, radio
PIVOTE = (168, 352)
ATRAS = [(-20, 0.45), (-10, 0.8)]  # grados y opacidad, de la más lejana a la más cercana


def esquinas(angulo):
    x, y, w, h = TARJETA
    a = math.radians(angulo)
    px, py = PIVOTE
    for cx, cy in ((x, y), (x + w, y), (x, y + h), (x + w, y + h)):
        dx, dy = cx - px, cy - py
        yield px + dx * math.cos(a) - dy * math.sin(a), py + dx * math.sin(a) + dy * math.cos(a)


# Caja del abanico, para centrarlo en el lienzo.
_puntos = [p for angulo in [0] + [a for a, _ in ATRAS] for p in esquinas(angulo)]
CAJA = (min(p[0] for p in _puntos), min(p[1] for p in _puntos), max(p[0] for p in _puntos), max(p[1] for p in _puntos))
CENTRO = ((CAJA[0] + CAJA[2]) / 2, (CAJA[1] + CAJA[3]) / 2)


def rgba(h, a=1.0):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), int(round(a * 255)))


# ---------- SVG ----------

def svg_tarjetas(frente, atras, chip, sombra):
    """Las tres tarjetas centradas en el lienzo de 512."""
    x, y, w, h = TARJETA
    cx, cy, cw, ch, cr = CHIP
    mover = f'translate({256 - CENTRO[0]:.1f} {256 - CENTRO[1]:.1f})'
    filas = [f'<g transform="{mover}">']
    for angulo, opacidad in ATRAS:
        filas.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{RADIO}" fill="{atras}" fill-opacity="{opacidad}" transform="rotate({angulo} {PIVOTE[0]} {PIVOTE[1]})"/>')
    filas.append(f'  <g{" filter=\"url(#sombra)\"" if sombra else ""}>')
    filas.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{RADIO}" fill="{frente}"/>')
    if chip:
        filas.append(f'    <rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="{cr}" fill="{chip}"/>')
    filas.append('  </g>')
    filas.append('</g>')
    return '\n'.join('  ' + f for f in filas)


def escribir_svg():
    sombra = (f'    <filter id="sombra" x="-30%" y="-30%" width="160%" height="170%">\n'
              f'      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="{TINTA}" flood-opacity="0.32"/>\n'
              f'    </filter>\n')
    fondo = (f'    <linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1">\n'
             f'      <stop offset="0" stop-color="{JADE_ARRIBA}"/>\n      <stop offset="1" stop-color="{JADE_ABAJO}"/>\n'
             f'    </linearGradient>\n')
    cabeza = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n'
    with open(f'{DESTINO}/fuente-icono.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Icono de Tino (D94). Lo genera herramientas/iconos/generar_iconos.py: no editar a mano. -->\n'
                f'  <defs>\n{fondo}{sombra}  </defs>\n  <rect width="512" height="512" fill="url(#fondo)"/>\n'
                + svg_tarjetas(PAPEL, JADE_VIVO, ORO, True) + '\n</svg>\n')
    with open(f'{DESTINO}/tino-tarjetas.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Tarjetas de Tino sin fondo (D94). Generado: no editar a mano. -->\n'
                f'  <defs>\n{sombra}  </defs>\n' + svg_tarjetas(PAPEL, JADE_VIVO, ORO, True) + '\n</svg>\n')
    with open(f'{DESTINO}/tino-tarjetas-monocromo.svg', 'w', encoding='utf-8') as f:
        f.write(cabeza + '  <!-- Tarjetas de Tino en una sola tinta (D94). Generado: no editar a mano. -->\n'
                + svg_tarjetas('#FFFFFF', '#FFFFFF', None, False) + '\n</svg>\n')


# ---------- PNG ----------

S = 4  # sobremuestreo para bordes suaves


def tarjetas(lado, escala, frente, atras, chip, sombra, centro=None):
    """Capa RGBA de lado×lado con el abanico; `escala` es el ancho del icono de 512 en píxeles."""
    N = lado * S
    k = escala * S / 512
    ox = (centro[0] if centro else lado / 2) * S - CENTRO[0] * k
    oy = (centro[1] if centro else lado / 2) * S - CENTRO[1] * k
    x, y, w, h = TARJETA

    def una(color, opacidad=1.0):
        capa = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        ImageDraw.Draw(capa).rounded_rectangle([ox + x * k, oy + y * k, ox + (x + w) * k, oy + (y + h) * k], radius=RADIO * k, fill=rgba(color, opacidad))
        return capa

    pivote = (ox + PIVOTE[0] * k, oy + PIVOTE[1] * k)
    final = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for angulo, opacidad in ATRAS:
        # rotate() de PIL gira en sentido contrario al SVG.
        final = Image.alpha_composite(final, una(atras, opacidad).rotate(-angulo, center=pivote, resample=Image.BICUBIC))
    frente_capa = una(frente)
    if chip:
        cx, cy, cw, ch, cr = CHIP
        ImageDraw.Draw(frente_capa).rounded_rectangle([ox + cx * k, oy + cy * k, ox + (cx + cw) * k, oy + (cy + ch) * k], radius=cr * k, fill=rgba(chip))
    if sombra:
        alfa = frente_capa.split()[3].point(lambda a: int(a * 0.32))
        sombra_capa = Image.new('RGBA', (N, N), rgba(TINTA, 0))
        sombra_capa.putalpha(alfa)
        sombra_capa = sombra_capa.transform((N, N), Image.AFFINE, (1, 0, 0, 0, 1, -8 * k)).filter(ImageFilter.GaussianBlur(10 * k))
        final = Image.alpha_composite(final, sombra_capa)
    final = Image.alpha_composite(final, frente_capa)
    return final.resize((lado, lado), Image.LANCZOS)


def degradado(lado):
    arriba, abajo = rgba(JADE_ARRIBA), rgba(JADE_ABAJO)
    fondo = Image.new('RGBA', (lado, lado))
    d = ImageDraw.Draw(fondo)
    for fila in range(lado):
        t = fila / (lado - 1)
        d.line([(0, fila), (lado, fila)], fill=tuple(int(arriba[i] + (abajo[i] - arriba[i]) * t) for i in range(4)))
    return fondo


def icono_con_fondo(lado):
    return Image.alpha_composite(degradado(lado), tarjetas(lado, lado, PAPEL, JADE_VIVO, ORO, True)).convert('RGB')


def escribir_png():
    icono_con_fondo(1024).save(f'{DESTINO}/app-store-1024.png', optimize=True)  # sin transparencia ni esquinas
    icono_con_fondo(512).save(f'{DESTINO}/play-store-512.png', optimize=True)
    tarjetas(1024, 1024, PAPEL, JADE_VIVO, ORO, True).save(f'{DESTINO}/tino-tarjetas.png', optimize=True)

    # Icono adaptativo de Android: lienzo de 108 dp (432 px a 4x) del que se ven 72 dp; el icono de
    # 512 se ajusta a esos 72 dp, así el abanico queda dentro de la zona segura de 66 dp.
    visible = 432 * 72 / 108
    degradado(432).save(f'{DESTINO}/android-fondo.png', optimize=True)
    tarjetas(432, visible, PAPEL, JADE_VIVO, ORO, True).save(f'{DESTINO}/android-primer-plano.png', optimize=True)
    tarjetas(432, visible, '#FFFFFF', '#FFFFFF', None, False).save(f'{DESTINO}/android-monocromo.png', optimize=True)

    # Splash (Android 12+): recorta en un círculo de 2/3 del lienzo; el abanico tiene que caber con aire.
    lado_caja = max(CAJA[2] - CAJA[0], CAJA[3] - CAJA[1])
    diagonal = math.hypot(CAJA[2] - CAJA[0], CAJA[3] - CAJA[1])
    escala = 1024 * (2 / 3) * 0.9 / diagonal * 512
    tarjetas(1024, escala, PAPEL, JADE_VIVO, ORO, True).save(f'{DESTINO}/splash.png', optimize=True)
    assert lado_caja  # la caja nunca es vacía


if __name__ == '__main__':
    escribir_svg()
    escribir_png()
    print('Iconos generados en', DESTINO)
