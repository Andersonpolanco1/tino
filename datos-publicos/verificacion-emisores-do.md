# Verificación del catálogo de RD

Registro de dónde sale cada producto de `emisores-do.json` (versión 2026.09.3). Revisado el 2026-09-25 en los sitios oficiales y documentos publicados por cada emisor.

**Reglas:**

- Entra un producto solo si el emisor lo publica hoy como tarjeta de crédito para personas.
- La moneda de facturación se fija solo cuando el emisor la declara para ese producto: `doble_balance` (límites o facturación separados en RD$ y US$), `solo_principal` (todo se factura en pesos, llamado "multimoneda" por algunos bancos) o `solo_local`. Sin declaración, queda vacía y el registro se la pregunta al usuario.
- Quedan fuera: tarjetas de empresa, tarjetas de flotilla o combustible (solo sirven en gasolineras, así que no deben competir en el ranking general), líneas de crédito asociadas y productos que el emisor ya no publica.
- Las recompensas no se precargan (decisión D14). Las tasas base que publica cada banco se anotan para cuando se decida precargarlas.

## Grupo 1

### Banreservas (12)

- Fuente: [banreservas.com/personal/tarjetas](https://www.banreservas.com/personal/tarjetas/).
- Clásica/Standard, Gold y Platinum se venden en dos modalidades: multimoneda (en pesos) o doble saldo. Por eso no llevan moneda fija; el usuario la elige.
- Visa SER y Mastercard Standard Táctil: solo multimoneda → `solo_principal`.
- Preserva: el sitio la lista como tarjeta de crédito, pero no publica la marca → `otra`.
- Fuera: Visa Flotilla Personal (flotilla), Credimás (línea de cuotas), Visa Negocios (pyme).
- Recompensas: Puntos Banreservas.

### Banco Popular (19)

- El sitio bloquea las descargas automáticas; se verificó con las fichas indexadas en popularenlinea.com y con documentos oficiales: guías de beneficios de JetBlue e IKEA Family (2025), requisitos de Plus CCN, Almacenes Iberia y gnial, y resumen de tarjetas (abril de 2023, solo como referencia).
- Doble saldo declarado: Visa y Mastercard Platinum Doble Saldo, Mastercard JetBlue.
- Seguros Universal: "facturación en pesos" → `solo_principal`.
- Gold se vende en pesos o en doble saldo → sin moneda fija.
- Fuera: Excelsa (gastos de ejecutivos de empresas), Visa Impulsa (pyme), DP World (empresarial), Orbit (su dirección ahora lleva a gnial), Pola Sirena (solo en el resumen de 2023), Teen y Avanza (sin fuente oficial), Platinum Internacional de Popular Bank (marca sin confirmar).
- Recompensas: Millas Popular; ISI da 5% en supermercados y gasolineras, 2% en compras internacionales en línea y 1% en lo demás.

### BHD (20)

- Fuente: [bhd.com.do/homepage-personal/tarjetas/tarjeta-filter](https://bhd.com.do/homepage-personal/tarjetas/tarjeta-filter) y fichas de cada tarjeta.
- Las que dicen "Facturación en pesos (RD$) y dólares (US$)" → `doble_balance`. Las versiones "Pesos" y Billet facturan solo en RD$ → `solo_principal`.
- Fuera: Emprendedor (negocios), Visa Distribución, Visa Business. No aparecen hoy: Oro, UNIQUE, Edesur, La Cadena.
- Recompensas: Estrellas BHD, 1 por cada RD$100 (1 Estrella = RD$1) en la Visa Clásica.

### Banco Santa Cruz (8)

- Fuente: [bsc.com.do/productos/tarjetas/tarjetas-de-credito](https://bsc.com.do/productos/tarjetas/tarjetas-de-credito). Todas son Visa.
- PriceSmart Santa Cruz: la ficha no declara doble saldo → sin moneda fija.
- Fuera: Full Car (flotilla), PriceSmart Negocios y Visa Empresarial.

### APAP (10)

- Fuente: [apap.com.do/productos/?categoria=tarjetas](https://apap.com.do/productos/?categoria=tarjetas) y fichas. Clásica, Familiar y Premium Gold son Visa.
- Fuera: Tarjeta PYME; Click To Pay (no queda claro que sea una tarjeta aparte).
- Recompensas: Ceritos (Premium Gold: 1 por cada RD$300 o US$5).

### Scotiabank (28)

- Fuente: [tarifario de tarjetas de crédito personales, vigente desde el 1 de mayo de 2026](https://do.scotiabank.com/banca-personal/tarifas/tarifas-tarjetas-credito.html). Los nombres siguen ese tarifario.
- Visa Local y Mastercard Local → `solo_local`.
- El tarifario lista a la vez las tarjetas "Internacional" y las "Scotiabank …"; se conservan ambas porque el banco cobra tarifas a las dos.
- Recompensas: Membership Rewards (American Express), AAdvantage y Scotia Puntos.

### Asociación Cibao (6)

- Fuente: [cibao.com.do/banca-personal/tarjetas-de-credito](https://cibao.com.do/banca-personal/tarjetas-de-credito/visa-clasica-cibao/). Todas son Visa.
- Visa Clásica: "Dos límites independientes: pesos … y dólares" → `doble_balance`.
- Fuera: Visa empresarial, Ultracrédito (financiamiento).

### Promerica (12)

- Fuente: [promerica.com.do/banca-personal/tarjetas-de-credito](https://www.promerica.com.do/banca-personal/tarjetas-de-credito/). Todas son Visa.
- "Visa Lama Plazos" es el nombre real (tarjeta de Plaza Lama).
- Fuera: Visa Flotilla Promerica (corporativa).
- Recompensas: Puntos Promerica, 1 por cada RD$100 o US$3 en la Clásica.

### Banco Caribe (6)

- El sitio bloquea las descargas automáticas; se verificó con las fichas indexadas en bancocaribe.com.do e [insignia.bancocaribe.com.do](https://insignia.bancocaribe.com.do/).
- Visa Clásica Local → `solo_local`. Insignia es Visa (nivel Platinum).
- Pendiente: Visa Elite Infinite (solo aparece en una nota de prensa, sin ficha de producto).
- Recompensas: Pesos Caribe, RD$1.25 por cada RD$100.

### Asociación La Nacional (8)

- Fuente: [alnap.com.do/productos/tarjetas-de-credito](https://www.alnap.com.do/productos/tarjetas-de-credito) (vista en el índice del buscador; el sitio no respondió a la descarga directa).
- Unase Local → `solo_local`. Clásica Internacional, Gold, ConfiaMás, Confía en Ti y Confiador no publican la marca → `otra`.
- Fuera: CompraMás (línea diferida).

### Banesco (11)

- Fuente: [banesco.com.do/tarjetas](https://www.banesco.com.do/tarjetas/).
- El banco describe un "límite de crédito consolidado en pesos o su equivalente en dólares"; no queda claro cómo factura, así que no se fija moneda.
- Fuera: "Miles" (aparece en el listado sin datos suficientes para identificarla).
- Recompensas: Puntos Verdes, 1 por cada RD$100 o US$2.

### BDI (8)

- Fuente: fichas de [bdi.com.do/tarjetas-de-credito](https://www.bdi.com.do/tarjetas-de-credito/tarjeta-de-credito-visa-clasica-bdi/) y [programa Soles](https://www.bdi.com.do/servicios/programa-soles-del-bdi/).
- Anthony's (Clásica, Gold, Platinum): "doble saldo independientes: RD$ y USD$" → `doble_balance`.
- Fuera: versiones "empresas", Crediplan (financiamiento).
- Recompensas: Soles BDI; Clásica 1 por cada RD$300, Gold 2 por cada RD$300, Platinum 1 por cada RD$100, Signature 1 por cada RD$80.

### López de Haro (9)

- Fuente: [blh.com.do/tarjetas-de-credito](https://www.blh.com.do/tarjetas-de-credito/). Todas son Visa.
- Fuera: Visa Línea Efectivo (línea de crédito), Fleet Card Combustibles (flotilla).
- Recompensas: Escudos, 1 por cada RD$100 o US$4; Iberia acumula Avios.

### Banco Ademi (5)

- Fuente: fichas de [bancoademi.com.do/productos](https://bancoademi.com.do/productos/tarjetas-de-credito-visa-clasica-multimoneda/). Todas son Visa.
- Visa Clásica Multimoneda: compras "con su disponible en pesos" → `solo_principal`.
- No aparece hoy: Visa Clásica Local. Fuera: Visa Empresarial Multimoneda.
- Recompensas: Manos Ademi.

### Vimenca (3)

- Fuentes: fichas de bancovimenca.com y el lanzamiento de Visa Infinite (noviembre de 2025, [Diario Libre](https://www.diariolibre.com/revista/sociales/2025/11/20/banco-vimenca-presenta-tarjeta-de-credito-visa-infinite/3331938)).
- El portafolio está en transición. Siguen publicadas páginas anteriores (Clásica Local e Internacional, Gold Internacional, Black Gold Internacional, Súper Crédito, Vimenpaq, Más Beneficios) que pueden no estar vigentes. Se cargaron solo Clásica, Gold e Infinite.

### Lafise (6)

- Fuente: [lafise.com/blrd/personas/tarjetas/tarjetas-de-credito](https://www.lafise.com/blrd/personas/tarjetas/tarjetas-de-credito/).
- Recompensas: Puntos LAFISE, 1 por cada RD$100 o US$3.

### Qik (1)

- Fuente: [qik.do/tarjetadecredito](https://qik.do/tarjetadecredito/). Mastercard Gold, 1% de cashback en todas las compras.

### Sin productos

Alaver, Banfondesa, Motor Crédito, Banco Adopem y Citibank siguen "por verificar": no se encontró una tarjeta de crédito para personas vigente publicada por ellos. El grupo 2 no se ha revisado.
