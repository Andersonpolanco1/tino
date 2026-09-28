package expo.modules.tinowidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar
import java.util.Locale

// Widget de Tino (sección 11 de la especificación): la tarjeta de hoy, la tarjeta a evitar y el
// próximo pago. No calcula nada: busca el día de hoy en el resumen que la app calculó por
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
    private const val VERSION_RESUMEN = 2
    // Altos (dp) desde los que caben las líneas de abajo (tarjeta a evitar y pago) y la tarjeta
    // de hoy completa, con la línea del ciclo como en Inicio. Con la tarjeta completa y la de
    // evitar, la recompensa necesita más alto.
    private const val ALTURA_LINEAS = 120
    private const val ALTURA_TARJETA_COMPLETA = 200
    private const val ALTURA_RECOMPENSA_Y_EVITAR = 250

    fun guardar(contexto: Context, json: String) {
      contexto.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE).edit().putString(CLAVE, json).apply()
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

    private fun sinResumen(contexto: Context): RemoteViews =
      RemoteViews(contexto.packageName, R.layout.tino_widget).apply {
        setOnClickPendingIntent(R.id.widget_raiz, abrirApp(contexto, null))
      }

    private fun construir(contexto: Context, alto: Int): RemoteViews {
      val lineas = alto >= ALTURA_LINEAS
      val json = contexto.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE).getString(CLAVE, null)
      val resumen = json?.let { runCatching { JSONObject(it) }.getOrNull() }
      // Sin resumen, o de otra versión: el diseño trae el mensaje para abrir la app.
      if (resumen == null || resumen.optInt("version") != VERSION_RESUMEN) return sinResumen(contexto)

      val vistas = RemoteViews(contexto.packageName, R.layout.tino_widget)
      val colores = Colores(contexto, resumen)
      val textos = resumen.getJSONObject("textos")
      colores.aplicar(vistas, R.id.widget_fondo, "setColorFilter", "fondo")
      colores.aplicar(vistas, R.id.widget_bloque_fondo, "setColorFilter", "destacado")
      colores.aplicar(vistas, R.id.widget_mensaje, "setTextColor", "texto")
      vistas.setOnClickPendingIntent(R.id.widget_raiz, abrirApp(contexto, resumen.optString("enlace").ifEmpty { null }))

      val dia = if (resumen.getString("estado") == "tarjetas") diaDeHoy(resumen) else null
      if (dia == null) {
        val mensaje = if (resumen.getString("estado") == "tarjetas") textos.getString("abrir") else textos.getString("mensaje")
        vistas.setTextViewText(R.id.widget_mensaje, mensaje)
        vistas.setContentDescription(R.id.widget_raiz, mensaje)
        return vistas
      }

      vistas.setViewVisibility(R.id.widget_mensaje, View.GONE)
      vistas.setViewVisibility(R.id.widget_contenido, View.VISIBLE)
      vistas.setContentDescription(R.id.widget_raiz, dia.getString("accesible"))

      val evitar = if (dia.isNull("evitar")) null else dia.getString("evitar")
      if (alto >= ALTURA_TARJETA_COMPLETA) {
        tarjetaCompleta(vistas, colores, textos, dia, conRecompensa = evitar == null || alto >= ALTURA_RECOMPENSA_Y_EVITAR)
      } else {
        tarjetaCompacta(vistas, colores, textos, dia)
      }

      if (lineas && evitar != null) {
        vistas.setViewVisibility(R.id.widget_evitar, View.VISIBLE)
        vistas.setTextViewText(R.id.widget_evitar, evitar)
        colores.aplicar(vistas, R.id.widget_evitar, "setTextColor", "alerta")
      } else {
        vistas.setViewVisibility(R.id.widget_evitar, View.GONE)
      }

      val pago = dia.optJSONObject("pago")
      if (lineas && pago != null) {
        vistas.setViewVisibility(R.id.widget_pago, View.VISIBLE)
        vistas.setTextViewText(R.id.widget_pago, pago.getString("texto"))
        colores.aplicar(vistas, R.id.widget_pago, "setTextColor", if (pago.getBoolean("urgente")) "alerta" else "textoSecundario")
      } else {
        vistas.setViewVisibility(R.id.widget_pago, View.GONE)
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

    // La tarjeta de hoy de Inicio: nombre, días, línea del ciclo y recompensa.
    private fun tarjetaCompleta(vistas: RemoteViews, colores: Colores, textos: JSONObject, dia: JSONObject, conRecompensa: Boolean) {
      vistas.setViewVisibility(R.id.widget_compacto, View.GONE)
      vistas.setViewVisibility(R.id.widget_completo, View.VISIBLE)
      val textosDelDia = mapOf(
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
