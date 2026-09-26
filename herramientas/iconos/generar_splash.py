# Dibuja las tarjetas del icono (la capa de primer plano de assets/iconos/fuente-icono.svg), sin
# fondo y sin márgenes, en assets/iconos/splash.png; el splash pone el jade como fondo de pantalla.
# Uso, desde la raíz del repositorio: python herramientas/iconos/generar_splash.py (requiere Pillow).
from PIL import Image, ImageDraw, ImageFilter
S = 8  # 512 * 8 = 4096, luego se reduce a 1024 para suavizar bordes
N = 512 * S
def c(v): return int(round(v * S))
def hexa(h, a=255): return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)

# Primer plano
capa = Image.new('RGBA', (N, N), (0, 0, 0, 0))
trasera = Image.new('RGBA', (N, N), (0, 0, 0, 0))
ImageDraw.Draw(trasera).rounded_rectangle([c(118), c(126), c(418), c(314)], radius=c(26), fill=(255, 255, 255, int(255 * 0.28)))
trasera = trasera.rotate(9, center=(c(268), c(220)), resample=Image.BICUBIC)  # rotate(-9) en SVG = +9 en PIL
capa = Image.alpha_composite(capa, trasera)
dd = ImageDraw.Draw(capa)
dd.rounded_rectangle([c(96), c(182), c(416), c(382)], radius=c(28), fill=hexa('#F5F7F4'))
dd.rounded_rectangle([c(132), c(296), c(194), c(342)], radius=c(11), fill=hexa('#F2B33D'))
dd.ellipse([c(344 - 46), c(248 - 46), c(344 + 46), c(248 + 46)], fill=hexa('#0E7C5B'))
pts = [(c(322), c(249)), (c(337), c(264)), (c(367), c(233))]
dd.line(pts, fill=(255, 255, 255, 255), width=c(12), joint='curve')
for x, y in (pts[0], pts[-1]):
    r = c(6); dd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255))

# Sombra del primer plano
alfa = capa.split()[3]
sombra = Image.new('RGBA', (N, N), hexa('#0D1B16', 0))
sombra.putalpha(alfa.point(lambda a: int(a * 0.35)))
sombra = sombra.transform((N, N), Image.AFFINE, (1, 0, 0, 0, 1, -c(10))).filter(ImageFilter.GaussianBlur(c(12)))
final = Image.alpha_composite(sombra, capa)

# Android 12+ recorta el icono del splash en un círculo de 2/3 del lienzo (192 de 288 dp).
# Se centra el contenido en un lienzo donde su diagonal cabe en ese círculo, con un poco de aire.
x0, y0, x1, y1 = capa.getbbox()  # sin la sombra, que puede quedar cortada sin que se note
diagonal = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5
lado = int(diagonal / (2 / 3) / 0.97)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
lienzo.paste(final.crop((cx - lado // 2, cy - lado // 2, cx - lado // 2 + lado, cy - lado // 2 + lado)), (0, 0))
lienzo.resize((1024, 1024), Image.LANCZOS).save('assets/iconos/splash.png', optimize=True)
print('ok')
