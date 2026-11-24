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
    canvas = Color(0xFF0C1E30), surface = Color(0xFF132E43), surfaceAlt = Color(0xFF1C3C52),
    primary = Color(0xFFB5D7E2), title = Color(0xFFF3F5F1), secondary = Color(0xFFC0D2DC),
    border = Color(0xFF385364), accent = Color(0xFFF2E4C9)
) else ElKimiyaPalette(
    canvas = Color(0xFFF8F7F2), surface = Color.White, surfaceAlt = Color(0xFFEAF0EF),
    primary = Color(0xFF133B55), title = Color(0xFF112F46), secondary = Color(0xFF5B7380),
    border = Color(0xFFD8E2E5), accent = Color(0xFF234D69)
)

@Suppress("DEPRECATION")
fun Activity.applyElKimiyaSystemBars(dark: Boolean) {
    // Android 15 may draw system bars edge-to-edge. safeDrawing is applied in Compose.
    val color = if (dark) AndroidColor.rgb(12, 30, 48) else AndroidColor.rgb(248, 247, 242)
    window.decorView.setBackgroundColor(color)
    window.statusBarColor = color
    window.navigationBarColor = color
    WindowCompat.getInsetsController(window, window.decorView).apply {
        isAppearanceLightStatusBars = !dark
        isAppearanceLightNavigationBars = !dark
    }
}
