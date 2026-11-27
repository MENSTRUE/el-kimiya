package com.menstrue.elkimiya

import android.app.Activity
import android.content.Context
import android.graphics.Color as AndroidColor
import android.content.res.Configuration
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat

enum class ThemeMode { SYSTEM, LIGHT, DARK }

object ElKimiyaPrefs {
    private const val PREF_FILE = "elkimiya_android_ui_v3"
    fun theme(context: Context): ThemeMode {
        val value = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            .getString("appearance", ThemeMode.SYSTEM.name)
        return ThemeMode.entries.firstOrNull { it.name == value } ?: ThemeMode.SYSTEM
    }
    fun saveTheme(context: Context, value: ThemeMode) {
        context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            .edit().putString("appearance", value.name).apply()
    }
    fun language(context: Context): String = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
        .getString("language", "id") ?: "id"
    fun saveLanguage(context: Context, language: String) {
        context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            .edit().putString("language", if (language == "en") "en" else "id").apply()
    }
}

fun systemIsDark(context: Context): Boolean =
    (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

fun resolveDark(context: Context, mode: ThemeMode): Boolean = when (mode) {
    ThemeMode.SYSTEM -> systemIsDark(context)
    ThemeMode.LIGHT -> false
    ThemeMode.DARK -> true
}

data class ElKimiyaPalette(
    val canvas: Color, val surface: Color, val surfaceAlt: Color,
    val primary: Color, val title: Color, val secondary: Color,
    val border: Color, val accent: Color
)

fun elKimiyaPalette(dark: Boolean) = if (dark) ElKimiyaPalette(
    canvas = Color(0xFF122434), surface = Color(0xFF1B3445), surfaceAlt = Color(0xFF28495B),
    primary = Color(0xFFA8D4DF), title = Color(0xFFEDF5F7), secondary = Color(0xFFC2D6DF),
    border = Color(0xFF587583), accent = Color(0xFFF2E4C9)
) else ElKimiyaPalette(
    canvas = Color(0xFFF7F7F2), surface = Color(0xFFFFFEFA), surfaceAlt = Color(0xFFEDF2EF),
    primary = Color(0xFF204F63), title = Color(0xFF16384B), secondary = Color(0xFF506977),
    border = Color(0xFFCBD9D8), accent = Color(0xFF234D69)
)

@Suppress("DEPRECATION")
fun Activity.applyElKimiyaSystemBars(dark: Boolean) {
    // Android 15 may draw system bars edge-to-edge. safeDrawing is applied in Compose.
    val color = if (dark) AndroidColor.rgb(18, 36, 52) else AndroidColor.rgb(247, 247, 242)
    window.decorView.setBackgroundColor(color)
    window.statusBarColor = color
    window.navigationBarColor = color
    WindowCompat.getInsetsController(window, window.decorView).apply {
        isAppearanceLightStatusBars = !dark
        isAppearanceLightNavigationBars = !dark
    }
}
