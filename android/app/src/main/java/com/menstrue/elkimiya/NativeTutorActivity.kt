@file:OptIn(com.google.firebase.ai.type.PublicPreviewAPI::class)

package com.menstrue.elkimiya

// ELKIMIYA_ANDROID_UI_AI_V3
// ELKIMIYA_ANDROID_WEB_V82

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.google.firebase.Firebase
import com.google.firebase.ai.DownloadStatus
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.OnDeviceModelStatus
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

private const val MODEL_CLOUD = "gemini-3.5-flash-lite"

private enum class RouteMode(val inference: InferenceMode) {
    PREFER_CLOUD(InferenceMode.PREFER_IN_CLOUD),
    PREFER_DEVICE(InferenceMode.PREFER_ON_DEVICE),
    CLOUD_ONLY(InferenceMode.ONLY_IN_CLOUD),
    DEVICE_ONLY(InferenceMode.ONLY_ON_DEVICE)
}

private fun routeLabel(route: RouteMode, id: Boolean) = when (route) {
    RouteMode.PREFER_CLOUD -> if (id) "Utamakan cloud" else "Prefer cloud"
    RouteMode.PREFER_DEVICE -> if (id) "Utamakan perangkat" else "Prefer device"
    RouteMode.CLOUD_ONLY -> if (id) "Hanya cloud" else "Cloud only"
    RouteMode.DEVICE_ONLY -> if (id) "Hanya perangkat" else "Device only"
}

private fun humanError(error: Throwable, id: Boolean): String {
    val value = (error.message ?: "").lowercase()
    return when {
        "app check" in value || "appcheck" in value || "token is invalid" in value ->
            if (id) "Verifikasi Firebase App Check gagal. Daftarkan debug token Android di Firebase Console > App Check > Manage debug tokens. Jangan bagikan token." else
                "Firebase App Check verification failed. Register this Android debug token in Firebase Console > App Check > Manage debug tokens. Keep it private."
        "on-device" in value || "not available" in value || "not supported" in value ->
            if (id) "Model AI lokal belum tersedia di perangkat ini. Periksa status dan unduh bila didukung, atau gunakan Cloud only." else
                "On-device AI is not available. Check compatibility and download status, or use Cloud only."
        "network" in value || "unavailable" in value || "connection" in value ->
            if (id) "Koneksi atau layanan AI sedang bermasalah. Periksa internet dan coba lagi." else
                "Network or AI service unavailable. Check your connection and retry."
        else -> if (id) "Permintaan AI belum berhasil. Periksa App Check, API Firebase, koneksi, dan Logcat." else
            "AI request failed. Verify App Check, Firebase API, connectivity, and Logcat."
    }
}

private fun modelDescription(status: OnDeviceModelStatus, id: Boolean): String = when (status) {
    OnDeviceModelStatus.AVAILABLE -> if (id) "Model lokal siap digunakan." else "Local model is ready."
    OnDeviceModelStatus.DOWNLOADABLE -> if (id) "Model dapat diunduh. Gunakan tombol Unduh model." else "Model can be downloaded. Use Download model."
    OnDeviceModelStatus.DOWNLOADING -> if (id) "Model sedang diunduh oleh sistem." else "The system is downloading the model."
    OnDeviceModelStatus.UNAVAILABLE -> if (id) "Model lokal tidak tersedia untuk perangkat/konfigurasi ini. Cloud tetap bisa dicoba." else "Local model unavailable for this device/configuration. You can still try cloud."
    else -> if (id) "Status model belum dikenali." else "Unknown model status."
}

class NativeTutorActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Fail closed on process restoration or an unauthorized native launch.
        if (!NativeTutorAccess.allowed.value) { finish(); return }
        lifecycleScope.launch {
            NativeTutorAccess.allowed.collect { allowed ->
                if (!allowed && !isFinishing) finish()
            }
        }
        setContent {
            var themeMode by remember { mutableStateOf(ElKimiyaPrefs.theme(this@NativeTutorActivity)) }
            var language by remember { mutableStateOf(ElKimiyaPrefs.language(this@NativeTutorActivity)) }
            val id = language == "id"
            val dark = resolveDark(this@NativeTutorActivity, themeMode)
            val palette = elKimiyaPalette(dark)
            val scheme = if (dark) darkColorScheme(
                primary = Color(0xFFB5D7E2), onPrimary = Color(0xFF0C1E30),
                background = palette.canvas, surface = palette.surface,
                onSurface = palette.title, onBackground = palette.title
            ) else lightColorScheme(
                primary = palette.primary, background = palette.canvas,
                surface = palette.surface, onSurface = palette.title, onBackground = palette.title
            )
            SideEffect { applyElKimiyaSystemBars(dark) }

            var prompt by remember { mutableStateOf(if (id) "Mengapa molekul air bersifat polar?" else "Why is the water molecule polar?") }
            var route by remember { mutableStateOf(RouteMode.PREFER_CLOUD) }
            var answer by remember { mutableStateOf("") }
            var source by remember { mutableStateOf("") }
            var status by remember { mutableStateOf(if (id) "Belum diperiksa" else "Not checked") }
            var downloadBytes by remember { mutableStateOf(0L) }
            var totalBytes by remember { mutableStateOf(0L) }
            var running by remember { mutableStateOf(false) }
            var checking by remember { mutableStateOf(false) }
            var downloading by remember { mutableStateOf(false) }
            val label: (String, String) -> String = { indo, english -> if (id) indo else english }

            MaterialTheme(colorScheme = scheme) {
                Column(
                    modifier = Modifier.fillMaxSize().background(palette.canvas)
                        .windowInsetsPadding(WindowInsets.safeDrawing)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 18.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        TextButton(onClick = { finish() }) { Text(label("‹ Kembali", "‹ Back")) }
                        Spacer(Modifier.weight(1f))
                        TextButton(onClick = {
                            language = if (id) "en" else "id"
                            ElKimiyaPrefs.saveLanguage(this@NativeTutorActivity, language)
                        }) { Text(if (id) "ID  /  EN" else "EN  /  ID") }
                    }

                    Column(
                        Modifier.fillMaxWidth().background(palette.surface, RoundedCornerShape(24.dp))
                            .border(1.dp, palette.border, RoundedCornerShape(24.dp)).padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            Image(
                                painterResource(if (dark) R.drawable.elkimiya_logo_white else R.drawable.elkimiya_logo_navy),
                                contentDescription = "El-Kīmiyā",
                                modifier = Modifier.size(55.dp)
                            )
                            Column {
                                Text("El-Kīmiyā", fontSize = 25.sp, fontWeight = FontWeight.Bold, color = palette.title)
                                Text(label("Asisten kimia · Hybrid AI", "Chemistry assistant · Hybrid AI"), fontSize = 12.sp, color = palette.secondary)
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(label("Apa yang ingin kamu pahami hari ini?", "What would you like to understand today?"),
                            fontSize = 23.sp, fontWeight = FontWeight.Bold, color = palette.title, lineHeight = 30.sp)
                        Text(label("Jawaban berasal dari Firebase AI. Sumber inferensi akan ditampilkan setelah model merespons.",
                            "Responses use Firebase AI. The actual inference source appears after a successful response."),
                            fontSize = 13.sp, color = palette.secondary, lineHeight = 20.sp)
                    }

                    Text(label("Pertanyaan kimia", "Chemistry question"), fontWeight = FontWeight.SemiBold, color = palette.title)
                    OutlinedTextField(
                        value = prompt, onValueChange = { prompt = it.take(1200) },
                        label = { Text(label("Tulis pertanyaan", "Enter a question")) },
                        minLines = 3, maxLines = 8, modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp)
                    )

                    Text(label("Preferensi inferensi", "Inference preference"), fontWeight = FontWeight.SemiBold, color = palette.title)
                    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        RouteMode.entries.forEach { option ->
                            FilterChip(
                                selected = route == option,
                                onClick = { route = option },
                                label = { Text(routeLabel(option, id)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    Text(label("Memilih perangkat tidak membuktikan inferensi lokal; lihat sumber aktual setelah respons.",
                        "Choosing device mode does not prove local inference; check the actual source after a response."),
                        fontSize = 12.sp, color = palette.secondary)

                    Column(
                        Modifier.fillMaxWidth().background(palette.surface, RoundedCornerShape(20.dp))
                            .border(1.dp, palette.border, RoundedCornerShape(20.dp)).padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(label("STATUS MODEL LOKAL", "LOCAL MODEL STATUS"), fontWeight = FontWeight.Bold,
                            fontSize = 12.sp, color = palette.secondary)
                        Text(status, color = palette.title, lineHeight = 21.sp)
                        if (downloading) {
                            val progress = if (totalBytes > 0L) (downloadBytes.toFloat() / totalBytes.toFloat()).coerceIn(0f, 1f) else null
                            if (progress != null) LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
                            else LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(enabled = !checking && !downloading, onClick = {
                                checking = true
                                lifecycleScope.launch {
                                    try {
                                        val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                            .generativeModel(modelName = MODEL_CLOUD,
                                                onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE))
                                        val extension = model.onDeviceExtension
                                        status = if (extension == null) label("Ekstensi model lokal tidak tersedia.", "Local model extension unavailable.")
                                            else modelDescription(extension.checkStatus(), id)
                                    } catch (e: Exception) {
                                        Log.w("ElKimiyaModel", "Model check failed", e)
                                        status = humanError(e, id)
                                    } finally { checking = false }
                                }
                            }) { Text(label("Periksa", "Check")) }
                            OutlinedButton(enabled = !downloading && !checking, onClick = {
                                downloading = true
                                totalBytes = 0L
                                downloadBytes = 0L
                                lifecycleScope.launch {
                                    try {
                                        val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                            .generativeModel(modelName = MODEL_CLOUD,
                                                onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE))
                                        val extension = model.onDeviceExtension
                                        if (extension == null) {
                                            status = label("Model lokal tidak tersedia pada perangkat.", "Local model unavailable on this device.")
                                        } else {
                                            extension.download().collect { event ->
                                                when (event) {
                                                    is DownloadStatus.DownloadStarted -> {
                                                        totalBytes = event.bytesToDownload
                                                        status = label("Menyiapkan unduhan model...", "Preparing model download...")
                                                    }
                                                    is DownloadStatus.DownloadInProgress -> {
                                                        downloadBytes = event.totalBytesDownloaded
                                                        val mb = downloadBytes / 1048576.0
                                                        status = if (totalBytes > 0L) {
                                                            val pct = (downloadBytes * 100.0 / totalBytes).coerceIn(0.0, 100.0).toInt()
                                                            label("Mengunduh $pct% (${String.format("%.1f", mb)} MB)",
                                                                "Downloading $pct% (${String.format("%.1f", mb)} MB)")
                                                        } else label("Terunduh ${String.format("%.1f", mb)} MB",
                                                            "Downloaded ${String.format("%.1f", mb)} MB")
                                                    }
                                                    is DownloadStatus.DownloadCompleted -> {
                                                        status = label("Unduhan selesai. Periksa status model sebelum inferensi lokal.",
                                                            "Download complete. Check model status before local inference.")
                                                    }
                                                    is DownloadStatus.DownloadFailed -> {
                                                        status = label("Unduhan gagal. Periksa jaringan, kompatibilitas, atau gunakan cloud.",
                                                            "Download failed. Check connectivity/compatibility, or use cloud.")
                                                    }
                                                }
                                            }
                                        }
                                    } catch (e: Exception) {
                                        Log.w("ElKimiyaModel", "Model download failed", e)
                                        status = humanError(e, id)
                                    } finally { downloading = false }
                                }
                            }) { Text(label("Unduh model", "Download model")) }
                        }
                    }

                    Button(
                        enabled = prompt.isNotBlank() && !running,
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        onClick = {
                            running = true
                            answer = ""
                            source = ""
                            val selected = route.inference
                            val question = prompt.trim()
                            val responseLanguage = language
                            lifecycleScope.launch {
                                try {
                                    val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                        .generativeModel(modelName = MODEL_CLOUD,
                                            onDeviceConfig = OnDeviceConfig(mode = selected))
                                    val response = model.generateContent(
                                        "You are El-Kīmiyā, a careful chemistry educator. " +
                                        "Respond in ${if (responseLanguage == "id") "Bahasa Indonesia" else "English"}. " +
                                        "Explain step by step, distinguish verified facts from uncertainties, " +
                                        "provide one safe everyday example, never invent citations. " +
                                        "Question: $question"
                                    )
                                    answer = response.text ?: label("Model tidak menghasilkan teks.", "Model returned no text.")
                                    source = response.inferenceSource.toString()
                                } catch (e: Exception) {
                                    Log.e("ElKimiyaAI", "Firebase AI call failed", e)
                                    answer = humanError(e, responseLanguage == "id")
                                    source = label("Belum ada respons berhasil", "No successful response")
                                } finally { running = false }
                            }
                        }
                    ) { Text(if (running) label("Memproses...", "Generating...") else label("Jalankan Hybrid AI", "Run Hybrid AI")) }

                    Column(
                        Modifier.fillMaxWidth().background(palette.surface, RoundedCornerShape(20.dp))
                            .border(1.dp, palette.border, RoundedCornerShape(20.dp)).padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(label("SUMBER INFERENSI AKTUAL", "ACTUAL INFERENCE SOURCE"), fontSize = 12.sp,
                            fontWeight = FontWeight.Bold, color = palette.secondary)
                        Text(source.ifBlank { label("Belum ada", "Not yet available") }, color = palette.primary, fontWeight = FontWeight.Bold)
                        HorizontalDivider(color = palette.border)
                        Text(answer.ifBlank { label("Masukkan pertanyaan, lalu jalankan AI.", "Enter a question, then run AI.") },
                            color = palette.title, lineHeight = 22.sp)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(label("Tampilan:", "Appearance:"), color = palette.secondary)
                        Spacer(Modifier.width(8.dp))
                        listOf(ThemeMode.SYSTEM, ThemeMode.LIGHT, ThemeMode.DARK).forEach { choice ->
                            FilterChip(
                                modifier = Modifier.padding(end = 4.dp),
                                selected = themeMode == choice,
                                onClick = {
                                    themeMode = choice
                                    ElKimiyaPrefs.saveTheme(this@NativeTutorActivity, choice)
                                },
                                label = { Text(when (choice) {
                                    ThemeMode.SYSTEM -> label("Sistem", "System")
                                    ThemeMode.LIGHT -> label("Terang", "Light")
                                    ThemeMode.DARK -> label("Gelap", "Dark")
                                }, fontSize = 11.sp) }
                            )
                        }
                    }
                    Text(label("Model lokal hanya berfungsi pada perangkat yang didukung. " +
                        "App Check debug token harus didaftarkan ke Firebase Console untuk build pengembangan.",
                        "On-device inference requires supported hardware. Register the private App Check debug token for development builds."),
                        fontSize = 11.sp, color = palette.secondary, lineHeight = 17.sp)
                    Spacer(Modifier.height(20.dp))
                }
            }
        }
    }
    override fun onDestroy() {
        if (!isChangingConfigurations) NativeTutorAccess.revoke()
        super.onDestroy()
    }

}
