package expo.modules.tinowidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.File
import java.util.Calendar
import java.util.Locale

// Widget de Tino (sección 11 de la especificación): solo la tarjeta de hoy, como en Inicio
// (decisión D72). No calcula nada: busca el día de hoy en el resumen que la app calculó por
// adelantado y lo dibuja con los textos y colores que trae. Se redibuja cuando la app guarda un
// resumen, cada 30 minutos, a la medianoche y si cambian la hora o la zona horaria.
class TinoWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(contexto: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) dibujar(contexto, manager, id)
    programarMedianoche(contexto)
  }

  override fun onAppWidgetOptionsChanged(contexto: Context, manager: AppWidgetManager, id: Int, opciones: Bundle) {
    dibujar(contexto, manager, id)
  }

  override fun onReceive(contexto: Context, intent: Intent) {
    super.onReceive(contexto, intent)
    when (intent.action) {
      ACCION_MEDIANOCHE, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_DATE_CHANGED -> actualizarTodos(contexto)
    }
  }

  companion object {
    private const val ARCHIVO = "tino_widget"
    private const val CLAVE = "resumen"
    private const val ACCION_MEDIANOCHE = "expo.modules.tinowidget.MEDIANOCHE"
    // Igual a VERSION_RESUMEN en src/widget/resumen.ts; cambia cuando cambian los campos.
    private const val VERSION_RESUMEN = 4
    // Altos (dp) desde los que cabe la tarjeta de hoy completa, con la línea del ciclo, y además
    // la recompensa. El 4 × 2 de un Pixel mide unos 230 dp y cabe todo.
    private const val ALTURA_TARJETA_COMPLETA = 170
    private const val ALTURA_RECOMPENSA = 210

    fun guardar(contexto: Context, json: String) {
      contexto.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE).edit().putString(CLAVE, json).apply()
    }

    // Logos de los bancos de las tarjetas del usuario (D63), copiados por la app desde sus
    // archivos incluidos. Solo nombres del catálogo ("banreservas.png"), nunca rutas.
    private const val CARPETA_LOGOS = "tino_widget_logos"
    private val NOMBRE_LOGO = Regex("""^[a-z0-9-]+\.png$""")

    fun guardarLogos(contexto: Context, rutas: Map<String, String>) {
      val carpeta = File(contexto.filesDir, CARPETA_LOGOS).apply { mkdirs() }
      for ((nombre, uri) in rutas) {
        if (!NOMBRE_LOGO.matches(nombre)) continue
        val origen = Uri.parse(uri).path?.let(::File) ?: continue
        runCatching { origen.copyTo(File(carpeta, nombre), overwrite = true) }
      }
      carpeta.listFiles()?.filter { it.name !in rutas.keys }?.forEach { it.delete() }
    }

    private fun logo(contexto: Context, nombre: String): Bitmap? {
      if (!NOMBRE_LOGO.matches(nombre)) return null
      val archivo = File(File(contexto.filesDir, CARPETA_LOGOS), nombre)
      return if (archivo.exists()) BitmapFactory.decodeFile(archivo.path) else null
    }

    fun ids(contexto: Context): IntArray =
      AppWidgetManager.getInstance(contexto).getAppWidgetIds(ComponentName(contexto, TinoWidgetProvider::class.java))

    fun actualizarTodos(contexto: Context) {
      val manager = AppWidgetManager.getInstance(contexto)
      val ids = ids(contexto)
      for (id in ids) dibujar(contexto, manager, id)
      if (ids.isNotEmpty()) programarMedianoche(contexto)
    }

    private fun dibujar(contexto: Context, manager: AppWidgetManager, id: Int) {
      // Android da el alto en horizontal (MIN_HEIGHT) y en vertical (MAX_HEIGHT).
      val opciones = manager.getAppWidgetOptions(id)
      val vertical = contexto.resources.configuration.orientation != Configuration.ORIENTATION_LANDSCAPE
      val clave = if (vertical) AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT else AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT
      val alto = opciones.getInt(clave, ALTURA_TARJETA_COMPLETA)
      // Un resumen que no se puede leer (por ejemplo, el de una versión anterior de la app antes
      // de abrirla) nunca debe tumbar la app: el widget pide abrirla, y al abrirla se reescribe.
      val vistas = runCatching { construir(contexto, alto) }.getOrElse { sinResumen(contexto) }
      manager.updateAppWidget(id, vistas)
    }

    // Como en el mensaje de construir: se pide todo explícitamente, porque el launcher reutiliza
    // las vistas que ya estaban.
    private fun sinResumen(contexto: Context): RemoteViews =
      RemoteViews(contexto.packageName, R.layout.tino_widget).apply {
        setViewVisibility(R.id.widget_mensaje, View.VISIBLE)
        setViewVisibility(R.id.widget_contenido, View.GONE)
        setTextViewText(R.id.widget_mensaje, contexto.getString(R.string.tino_widget_sin_datos))
        setContentDescription(R.id.widget_raiz, contexto.getString(R.string.tino_widget_sin_datos))
        setOnClickPendingIntent(R.id.widget_raiz, abrirApp(contexto, null))
      }

    private fun construir(contexto: Context, alto: Int): RemoteViews {
      val json = contexto.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE).getString(CLAVE, null)
      val resumen = json?.let { runCatching { JSONObject(it) }.getOrNull() }
      // Sin resumen, o de otra versión: el diseño trae el mensaje para abrir la app.
      if (resumen == null || resumen.optInt("version") != VERSION_RESUMEN) return sinResumen(contexto)

      val vistas = RemoteViews(contexto.packageName, R.layout.tino_widget)
      val colores = Colores(contexto, resumen)
      val textos = resumen.getJSONObject("textos")
      colores.aplicar(vistas, R.id.widget_fondo, "setColorFilter", "destacado")
      colores.aplicar(vistas, R.id.widget_mensaje, "setTextColor", "sobreDestacado")
      vistas.setOnClickPendingIntent(R.id.widget_raiz, abrirApp(contexto, resumen.optString("enlace").ifEmpty { null }))

      val dia = if (resumen.getString("estado") == "tarjetas") diaDeHoy(resumen) else null
      if (dia == null) {
        val mensaje = if (resumen.getString("estado") == "tarjetas") textos.getString("abrir") else textos.getString("mensaje")
        // El launcher reutiliza las vistas si el diseño es el mismo y solo aplica lo que se pide
        // aquí: sin esto quedaba a la vista la tarjeta anterior (por ejemplo, tras "Borrar todo").
        vistas.setViewVisibility(R.id.widget_mensaje, View.VISIBLE)
        vistas.setViewVisibility(R.id.widget_contenido, View.GONE)
        vistas.setTextViewText(R.id.widget_mensaje, mensaje)
        vistas.setContentDescription(R.id.widget_raiz, mensaje)
        return vistas
      }

      vistas.setViewVisibility(R.id.widget_mensaje, View.GONE)
      vistas.setViewVisibility(R.id.widget_contenido, View.VISIBLE)
      vistas.setContentDescription(R.id.widget_raiz, dia.getString("accesible"))

      if (alto >= ALTURA_TARJETA_COMPLETA) {
        tarjetaCompleta(contexto, vistas, colores, textos, dia, conRecompensa = alto >= ALTURA_RECOMPENSA)
      } else {
        tarjetaCompacta(vistas, colores, textos, dia)
      }
      return vistas
    }

    private fun tarjetaCompacta(vistas: RemoteViews, colores: Colores, textos: JSONObject, dia: JSONObject) {
      vistas.setViewVisibility(R.id.widget_compacto, View.VISIBLE)
      vistas.setViewVisibility(R.id.widget_completo, View.GONE)
      vistas.setTextViewText(R.id.widget_titulo, textos.getString("titulo"))
      vistas.setTextViewText(R.id.widget_alias, dia.getString("alias"))
      vistas.setTextViewText(R.id.widget_dias, dia.getInt("dias").toString())
      vistas.setTextViewText(R.id.widget_dias_texto, textos.getString("diasParaPagar"))
      for (texto in listOf(R.id.widget_titulo, R.id.widget_alias, R.id.widget_dias, R.id.widget_dias_texto)) {
        colores.aplicar(vistas, texto, "setTextColor", "sobreDestacado")
      }
    }

    // La tarjeta de hoy de Inicio, con el título de la pantalla encima: banco, nombre, días,
    // línea del ciclo y recompensa.
    private fun tarjetaCompleta(
      contexto: Context,
      vistas: RemoteViews,
      colores: Colores,
      textos: JSONObject,
      dia: JSONObject,
      conRecompensa: Boolean,
    ) {
      vistas.setViewVisibility(R.id.widget_compacto, View.GONE)
      vistas.setViewVisibility(R.id.widget_completo, View.VISIBLE)
      banco(contexto, vistas, colores, dia.optJSONObject("banco"))
      val textosDelDia = mapOf(
        R.id.widget_titulo_completo to textos.getString("titulo"),
        R.id.widget_alias_completo to dia.getString("alias"),
        R.id.widget_dias_completo to dia.getInt("dias").toString(),
        R.id.widget_dias_texto_completo to textos.getString("diasParaPagar"),
        R.id.widget_hito_hoy to textos.getString("hitoHoy"),
        R.id.widget_hito_corta to textos.getString("hitoCorta"),
        R.id.widget_hito_pagas to textos.getString("hitoPagas"),
        R.id.widget_fecha_hoy to dia.getString("hoy"),
        R.id.widget_fecha_corta to dia.getString("corta"),
        R.id.widget_fecha_pagas to dia.getString("pagas"),
      )
      for ((id, texto) in textosDelDia) {
        vistas.setTextViewText(id, texto)
        colores.aplicar(vistas, id, "setTextColor", "sobreDestacado")
      }
      // Línea: pista tenue, relleno y puntos en el color del texto, centro de los anillos en el
      // verde de la tarjeta y el pago en dorado, como LineaCiclo.
      colores.aplicar(vistas, R.id.widget_pista, "setColorFilter", "pista")
      for (id in listOf(R.id.widget_relleno, R.id.widget_punto_corto, R.id.widget_punto_hoy, R.id.widget_punto_corta)) {
        colores.aplicar(vistas, id, "setColorFilter", "sobreDestacado")
      }
      for (id in listOf(R.id.widget_punto_hoy_centro, R.id.widget_punto_corta_centro)) {
        colores.aplicar(vistas, id, "setColorFilter", "destacado")
      }
      colores.aplicar(vistas, R.id.widget_punto_pagas, "setColorFilter", "recompensaPunto")

      val recompensa = if (dia.isNull("recompensa")) null else dia.getString("recompensa")
      if (conRecompensa && recompensa != null) {
        vistas.setViewVisibility(R.id.widget_fila_recompensa, View.VISIBLE)
        vistas.setTextViewText(R.id.widget_recompensa, recompensa)
        colores.aplicar(vistas, R.id.widget_recompensa, "setTextColor", "sobreDestacado")
        colores.aplicar(vistas, R.id.widget_punto_recompensa, "setColorFilter", "recompensaPunto")
      } else {
        vistas.setViewVisibility(R.id.widget_fila_recompensa, View.GONE)
      }
    }

    // Logo sobre blanco si el widget lo tiene; si no, las iniciales sobre el verde translúcido.
    private fun banco(contexto: Context, vistas: RemoteViews, colores: Colores, banco: JSONObject?) {
      if (banco == null) {
        vistas.setViewVisibility(R.id.widget_chip, View.GONE)
        return
      }
      vistas.setViewVisibility(R.id.widget_chip, View.VISIBLE)
      val imagen = banco.optString("logo").ifEmpty { null }?.let { logo(contexto, it) }
      if (imagen != null) {
        vistas.setImageViewBitmap(R.id.widget_chip_logo, imagen)
        vistas.setViewVisibility(R.id.widget_chip_logo, View.VISIBLE)
        vistas.setViewVisibility(R.id.widget_chip_iniciales, View.GONE)
        colores.aplicar(vistas, R.id.widget_chip_fondo, "setColorFilter", "fondoLogo")
      } else {
        vistas.setTextViewText(R.id.widget_chip_iniciales, banco.getString("iniciales"))
        vistas.setViewVisibility(R.id.widget_chip_iniciales, View.VISIBLE)
        vistas.setViewVisibility(R.id.widget_chip_logo, View.GONE)
        colores.aplicar(vistas, R.id.widget_chip_iniciales, "setTextColor", "sobreDestacado")
        colores.aplicar(vistas, R.id.widget_chip_fondo, "setColorFilter", "fondoIniciales")
      }
    }

    private fun diaDeHoy(resumen: JSONObject): JSONObject? {
      val hoy = Calendar.getInstance().let {
        String.format(Locale.US, "%04d-%02d-%02d", it.get(Calendar.YEAR), it.get(Calendar.MONTH) + 1, it.get(Calendar.DAY_OF_MONTH))
      }
      val dias = resumen.getJSONArray("dias")
      for (i in 0 until dias.length()) {
        val dia = dias.getJSONObject(i)
        if (dia.getString("fecha") == hoy) return dia
      }
      return null
    }

    private fun abrirApp(contexto: Context, enlace: String?): PendingIntent {
      val intent = enlace?.let { Intent(Intent.ACTION_VIEW, Uri.parse(it)).setPackage(contexto.packageName) }
        ?: contexto.packageManager.getLaunchIntentForPackage(contexto.packageName)
        ?: Intent()
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      return PendingIntent.getActivity(contexto, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    // Alarma inexacta (sin permisos) poco después de la medianoche, para pasar al día nuevo sin
    // esperar la actualización de cada 30 minutos.
    private fun programarMedianoche(contexto: Context) {
      val alarmas = contexto.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(contexto, TinoWidgetProvider::class.java).setAction(ACCION_MEDIANOCHE)
      val pendiente = PendingIntent.getBroadcast(contexto, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val manana = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 1)
        set(Calendar.SECOND, 0)
      }
      alarmas.set(AlarmManager.RTC, manana.timeInMillis, pendiente)
    }
  }

  // Colores del resumen (tokens de Tino) según el tema elegido en Ajustes o el del teléfono.
  private class Colores(private val contexto: Context, resumen: JSONObject) {
    private val tema = resumen.optString("tema", "automatico")
    private val claro = resumen.getJSONObject("colores").getJSONObject("claro")
    private val oscuro = resumen.getJSONObject("colores").getJSONObject("oscuro")

    fun aplicar(vistas: RemoteViews, id: Int, metodo: String, rol: String) {
      val deDia = Color.parseColor(claro.getString(rol))
      val deNoche = Color.parseColor(oscuro.getString(rol))
      when {
        tema == "claro" -> vistas.setInt(id, metodo, deDia)
        tema == "oscuro" -> vistas.setInt(id, metodo, deNoche)
        // Android 12 en adelante cambia de color solo cuando el teléfono cambia de modo.
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> vistas.setColorInt(id, metodo, deDia, deNoche)
        else -> vistas.setInt(id, metodo, if (nocturno()) deNoche else deDia)
      }
    }

    private fun nocturno() =
      (contexto.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
  }
}
