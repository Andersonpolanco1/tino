// Reglas del respaldo automático de Android (decisión D81). El respaldo de Google se lleva solo
// lo que aquí se incluye:
// - la copia automática de Tino (tino-respaldo-automatico.json, en la carpeta de archivos);
// - las preferencias de la app, menos la llave de SecureStore (su clave vive en el Keystore y no
//   viaja: sin ella no sirve) y el resumen del widget (se reescribe al abrir la app).
// La base cifrada no se incluye: su clave tampoco viaja. Reemplaza las reglas que pone
// expo-secure-store, que solo excluían su llave (su archivo es SecureStore.xml; se excluye con y
// sin la extensión, como lo hace esa librería y como lo pide la documentación de Android).
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const COPIA = 'tino-respaldo-automatico.json';
const REGLAS = `
    <include domain="sharedpref" path="."/>
    <exclude domain="sharedpref" path="SecureStore"/>
    <exclude domain="sharedpref" path="SecureStore.xml"/>
    <exclude domain="sharedpref" path="tino_widget.xml"/>
    <include domain="file" path="${COPIA}"/>`;

const RESPALDO_HASTA_ANDROID_11 = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por plugins/respaldo-android.js (decisión D81). -->
<full-backup-content>${REGLAS}
</full-backup-content>
`;

const RESPALDO_DESDE_ANDROID_12 = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por plugins/respaldo-android.js (decisión D81). -->
<data-extraction-rules>
  <cloud-backup>${REGLAS.replace(/\n    /g, '\n      ')}
  </cloud-backup>
  <device-transfer>${REGLAS.replace(/\n    /g, '\n      ')}
  </device-transfer>
</data-extraction-rules>
`;

function conArchivos(config) {
  return withDangerousMod(config, [
    'android',
    async cfg => {
      const carpeta = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(carpeta, { recursive: true });
      fs.writeFileSync(path.join(carpeta, 'tino_respaldo_reglas.xml'), RESPALDO_HASTA_ANDROID_11);
      fs.writeFileSync(path.join(carpeta, 'tino_respaldo_extraccion.xml'), RESPALDO_DESDE_ANDROID_12);
      return cfg;
    },
  ]);
}

function conManifiesto(config) {
  return withAndroidManifest(config, cfg => {
    const aplicacion = cfg.modResults.manifest.application?.[0];
    if (aplicacion) {
      aplicacion.$['android:allowBackup'] = 'true';
      aplicacion.$['android:fullBackupContent'] = '@xml/tino_respaldo_reglas';
      aplicacion.$['android:dataExtractionRules'] = '@xml/tino_respaldo_extraccion';
    }
    return cfg;
  });
}

module.exports = function respaldoAndroid(config) {
  return conManifiesto(conArchivos(config));
};
module.exports.REGLAS = REGLAS;
