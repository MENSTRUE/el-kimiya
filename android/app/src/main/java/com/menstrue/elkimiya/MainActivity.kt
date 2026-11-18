package com.menstrue.elkimiya

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.google.firebase.Firebase
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect

private val Navy = Color(0xFF072847)
private val WarmBackground = Color(0xFFF8F7F2)
private val Muted = Color(0xFF586B7A)
private val Stroke = Color(0xFFDCE5E9)
private const val CLOUD_MODEL = "gemini-3.5-flash-lite"

private enum class RouteChoice(val label: String, val inference: InferenceMode) {
    PREFER_LOCAL("Prefer device", InferenceMode.PREFER_ON_DEVICE),
    LOCAL_ONLY("Device only", InferenceMode.ONLY_ON_DEVICE),
    PREFER_CLOUD("Prefer cloud", InferenceMode.PREFER_IN_CLOUD),
    CLOUD_ONLY("Cloud only", InferenceMode.ONLY_IN_CLOUD)
}

@OptIn(PublicPreviewAPI::class)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var prompt by remember { mutableStateOf("Explain why water is polar and give one example.") }
            var mode by remember { mutableStateOf(RouteChoice.PREFER_LOCAL) }
            var resultText by remember { mutableStateOf("") }
            var provider by remember { mutableStateOf("Not run") }
            var busy by remember { mutableStateOf(false) }
            var localStatus by remember { mutableStateOf("Not checked") }

            MaterialTheme(colorScheme = lightColorScheme(primary = Navy, background = WarmBackground, surface = Color.White)) {
                Column(
                    modifier = Modifier.fillMaxSize().background(WarmBackground)
                        .verticalScroll(rememberScrollState()).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    Spacer(Modifier.height(12.dp))
                    Column(Modifier.fillMaxWidth().background(Navy, RoundedCornerShape(23.dp)).padding(21.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Image(painter = painterResource(R.drawable.elkimiya_mark), contentDescription = "El-Kīmiyā official calligraphic flask logo", modifier = Modifier.size(60.dp))
                            Column {
                                Text("El-Kīmiyā", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 28.sp)
                                Text("الكيمياء · Your chemistry companion", color = Color(0xFFE0EAF1), fontSize = 13.sp)
                            }
                        }
                        Spacer(Modifier.height(13.dp))
                        Text("Understand chemistry. Anywhere.", color = Color.White, fontSize = 17.sp)
                        Text("Android Hybrid AI · real Firebase inference", color = Color(0xFFCADCE9), fontSize = 12.sp)
                    }
                    Text("Chemistry tutor", color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text("Single-turn educational explanation. Source citations are not claimed in this Android MVP.", color = Muted, fontSize = 13.sp)
                    OutlinedTextField(
                        value = prompt, onValueChange = { prompt = it.take(700) },
                        label = { Text("Ask a chemistry question") },
                        minLines = 3, maxLines = 7, modifier = Modifier.fillMaxWidth()
                    )
                    Text("Inference preference", fontWeight = FontWeight.SemiBold, color = Navy)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        RouteChoice.entries.forEach { choice ->
                            FilterChip(
                                selected = choice == mode, onClick = { mode = choice },
                                label = { Text(choice.label) }, modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = {
                            lifecycleScope.launch {
                                try {
                                    localStatus = "Checking device…"
                                    val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                        .generativeModel(
                                            modelName = CLOUD_MODEL,
                                            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE)
                                        )
                                    localStatus = model.onDeviceExtension?.checkStatus()?.toString() ?: "No local model extension"
                                } catch (e: Exception) { localStatus = "Unable to check: ${e.message}" }
                            }
                        }) { Text("Check local model") }
                    }
                    OutlinedButton(onClick = {
                        lifecycleScope.launch {
                            try {
                                val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                    .generativeModel(modelName = CLOUD_MODEL, onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE))
                                val extension = model.onDeviceExtension
                                if (extension == null) {
                                    localStatus = "Device model extension unavailable on this hardware"
                                } else {
                                    localStatus = "Preparing local model download…"
                                    extension.download().collect { event -> localStatus = event.toString() }
                                }
                            } catch (e: Exception) { localStatus = "Model download failed: ${e.message}" }
                        }
                    }, modifier = Modifier.fillMaxWidth()) { Text("Download local model (if supported)") }
                    Text("On-device status: $localStatus", color = Muted, fontSize = 12.sp)
                    Button(enabled = prompt.isNotBlank() && !busy, onClick = {
                        busy = true
                        provider = "Request in progress"
                        resultText = ""
                        val selectedMode = mode.inference
                        val question = prompt.trim()
                        lifecycleScope.launch {
                            try {
                                val model = Firebase.ai(backend = GenerativeBackend.googleAI())
                                    .generativeModel(modelName = CLOUD_MODEL, onDeviceConfig = OnDeviceConfig(mode = selectedMode))
                                val answer = model.generateContent(
                                    "You are El-Kīmiyā, a careful chemistry tutor. Respond in simple Indonesian or English. " +
                                        "Provide a short evidence-based explanation and a safe everyday example. " +
                                        "Do not invent textbook page references or Qur'an citations. Question: " + question
                                )
                                resultText = answer.text ?: "The model returned no text."
                                provider = answer.inferenceSource?.toString() ?: "Provider not reported"
                            } catch (e: Exception) {
                                provider = "Request failed"
                                resultText = "No AI answer was generated. ${e.message ?: "Check Firebase/App Check and local model availability."}"
                            } finally { busy = false }
                        }
                    }, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                        Text(if (busy) "Generating…" else "Run Firebase Hybrid AI")
                    }
                    Column(Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(18.dp)).padding(18.dp)) {
                        Text("Actual inference source", color = Muted, fontSize = 11.sp)
                        Text(provider, color = Navy, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        HorizontalDivider(Modifier.padding(vertical = 13.dp), color = Stroke)
                        Text(if (resultText.isNotBlank()) resultText else "Ask a question to view the model response here.", color = Navy, fontSize = 14.sp, lineHeight = 22.sp)
                    }
                    Text("This app calls Firebase AI Logic directly. On-device is available only with compatible hardware and a downloaded model; a preference is not proof of actual local execution.", color = Muted, fontSize = 11.sp, lineHeight = 16.sp)
                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
}
