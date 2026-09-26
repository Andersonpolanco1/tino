export { ProveedorDatos, useEstadoDatos, useReabrirDatos, type EstadoDatos } from './ContextoDatos';
export { abrirBase, borrarBase, ErrorBaseCifrada, NOMBRE_BASE, type BaseLocal } from './base';
export { migrar, migraciones, VERSION_ESQUEMA, ErrorVersionEsquema, type Migracion } from './migraciones';
export { repositorioTarjetas, repositorioIngresos, repositorioPreferencias, ErrorDatoProhibido } from './repositorios';
export { preferenciasIniciales } from './preferencias';
