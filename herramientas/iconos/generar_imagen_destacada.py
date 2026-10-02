# Genera la imagen destacada de Google Play (1024 × 500): el jade del icono, el nombre y el
# eslogan a la izquierda, y la pila de tarjetas del icono (D104) a la derecha.
#
# Uso, desde la raíz del repositorio: python herramientas/iconos/generar_imagen_destacada.py
# (requiere Pillow y node_modules instalado, de donde salen las fuentes de la app).
# Escribe assets/tienda/google-play-destacada.png y assets/tienda/tino-pro-512.png (icono de la
# suscripción en Google Play: el del icono de la app, en PNG de 32 bits como pide la consola).
import os
import sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from generar_iconos import COLORES, JADE_ABAJO, JADE_ARRIBA, PAPEL, icono_con_fondo, pila, rgba

ANCHO, ALTO = 1024, 500
DESTINO = 'assets/tienda/google-play-destacada.png'
FUENTES = 'node_modules/@expo-google-fonts'
TITULO = ImageFont.truetype(f'{FUENTES}/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf', 132)
ESLOGAN = ImageFont.truetype(f'{FUENTES}/atkinson-hyperlegible-next/600SemiBold/AtkinsonHyperlegibleNext_600SemiBold.ttf', 40)

# Textos de la ficha (docs/tienda/fichas.md); van en la imagen, no en i18n.
NOMBRE = 'Tino'
LINEAS = ['La tarjeta correcta,', 'cada día.']


def fondo():
    arriba, abajo = rgba(JADE_ARRIBA), rgba(JADE_ABAJO)
    imagen = Image.new('RGBA', (ANCHO, ALTO))
    d = ImageDraw.Draw(imagen)
    for fila in range(ALTO):
        t = fila / (ALTO - 1)
        d.line([(0, fila), (ANCHO, fila)], fill=tuple(int(arriba[i] + (abajo[i] - arriba[i]) * t) for i in range(4)))
    return imagen


def main():
    imagen = fondo()
    # Las tarjetas en un cuadro de 500 a la derecha, del tamaño del icono de tienda en ese cuadro.
    tarjetas = pila(ALTO, ALTO * 1.1, COLORES)
    imagen.alpha_composite(tarjetas, (ANCHO - ALTO - 40, 0))

    d = ImageDraw.Draw(imagen)
    x = 84
    d.text((x, 118), NOMBRE, font=TITULO, fill=rgba(PAPEL))
    for i, linea in enumerate(LINEAS):
        d.text((x, 292 + i * 52), linea, font=ESLOGAN, fill=rgba(PAPEL))

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    imagen.convert('RGB').save(DESTINO, optimize=True)
    print('Imagen destacada en', DESTINO)

    icono_con_fondo(512).convert('RGBA').save('assets/tienda/tino-pro-512.png', optimize=True)
    print('Icono de la suscripción en assets/tienda/tino-pro-512.png')


if __name__ == '__main__':
    main()
