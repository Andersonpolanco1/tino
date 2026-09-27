package expo.modules.tinowidget

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// La app escribe aquí el resumen que calcula src/widget/resumen.ts.
class TinoWidgetModule : Module() {
  private val contexto: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("TinoWidget")

    Function("guardarResumen") { json: String ->
      TinoWidgetProvider.guardar(contexto, json)
      TinoWidgetProvider.actualizarTodos(contexto)
    }

    Function("widgetsInstalados") {
      TinoWidgetProvider.ids(contexto).size
    }
  }
}
