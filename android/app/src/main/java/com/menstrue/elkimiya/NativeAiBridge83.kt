@file:OptIn(com.google.firebase.ai.type.PublicPreviewAPI::class)
package com.menstrue.elkimiya

import android.net.Uri
import android.webkit.WebView
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.google.firebase.Firebase
import com.google.firebase.ai.DownloadStatus
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.TimeoutCancellationException
import org.json.JSONObject
import org.json.JSONTokener
import java.util.Locale

// ELKIMIYA_V83_NATIVE_AI. Origin-scoped, main-frame only. No token or UID transfer.
// The UI/session gate is defense in depth; App Check remains enforced by Firebase.
internal class NativeAiBridge83(private val activity: ComponentActivity, private val view: WebView) {
    private val cloudModel = "gemini-3.5-flash-lite"
    private val origin = "https://el-kimiya.vercel.app"
    private val routes = setOf("dashboard","mission","library","faith","reader","tutor","hybrid","practice","explorer","molecules","flashcards","progress","notes","settings","scan","profile","about")
    private val modes = mapOf("Prefer on-device" to InferenceMode.PREFER_ON_DEVICE, "On-device only" to InferenceMode.ONLY_ON_DEVICE, "Prefer cloud" to InferenceMode.PREFER_IN_CLOUD, "Cloud only" to InferenceMode.ONLY_IN_CLOUD)
    private var epoch = 0L
    private var busy = false
    private var job: Job? = null
    private var activeId: String? = null
    private var activeReply: JavaScriptReplyProxy? = null
    private fun trusted(uri: Uri) = uri.scheme == "https" && uri.host == "el-kimiya.vercel.app" && uri.userInfo == null && (uri.port == -1 || uri.port == 443)
    private fun workspaceUrl(url: String?): Boolean {
        val uri = Uri.parse(url ?: "")
        return trusted(uri) && uri.path == "/" && uri.fragment in routes
    }
    private fun send(proxy: JavaScriptReplyProxy, id: String, kind: String, fields: JSONObject = JSONObject()) {
        try { proxy.postMessage(fields.put("id",id).put("kind",kind).toString()) } catch (_: Exception) { /* frame may have disappeared */ }
    }
    private fun failure(proxy: JavaScriptReplyProxy, id: String, code: String) = send(proxy,id,"error",JSONObject().put("code",code))
    fun invalidate() {
        epoch++
        activeId?.let { id -> activeReply?.let { failure(it,id,"ACCESS") } }
        activeId = null; activeReply = null
        job?.cancel(); job = null; busy = false
    }
    private fun snapshot(cb: (String?) -> Unit) {
        if(!workspaceUrl(view.url)) { cb(null); return }
        // Only obtain an ephemeral per-mount nonce, never credentials.
        val script = """
          (()=>{const el=document.querySelector('[data-elk-ai-v83="learner"]');
          if(!el || !document.querySelector('.sidebar .v82-session-nav') ||
          !document.querySelector('.app-shell .page-entrance') ||
          document.querySelector('.landing-page,.v81-auth,.v82-guest-preview,.v81-session,.v81-moduler,.v81-admin-nav'))return null;
          return el.getAttribute('data-elk-ai-session');})()
        """.trimIndent()
        view.evaluateJavascript(script) { value ->
            val token = try { JSONTokener(value ?: "null").nextValue() as? String } catch (_: Exception) { null }
            cb(token?.takeIf { it.matches(Regex("[A-Za-z0-9-]{12,100}")) })
        }
    }
    fun install() {
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return
        WebViewCompat.addWebMessageListener(view,"ElKimiyaAI83",setOf(origin)) { _, message, source, mainFrame, reply ->
            if(!mainFrame || !trusted(source)) return@addWebMessageListener
            val raw = message.data ?: return@addWebMessageListener
            if(raw.length > 180000) return@addWebMessageListener
            val packet = try { JSONObject(raw) } catch (_: Exception) { return@addWebMessageListener }
            val id = packet.optString("id")
            if(!id.matches(Regex("[A-Za-z0-9-]{1,80}"))) return@addWebMessageListener
            val kind = packet.optString("kind")
            val prompt = packet.optString("prompt")
            val mode = modes[packet.optString("preference")]
            if(kind !in setOf("generate","status","download")) { failure(reply,id,"FAILED"); return@addWebMessageListener }
            if(kind=="generate" && (prompt.isBlank() || mode==null || prompt.length>64000)) { failure(reply,id,"LIMIT"); return@addWebMessageListener }
            if(!workspaceUrl(view.url)) { failure(reply,id,"ACCESS"); return@addWebMessageListener }
            if(busy) { failure(reply,id,"BUSY"); return@addWebMessageListener }
            busy = true; activeId = id; activeReply = reply
            val generation = epoch
            val url = view.url
            snapshot { session ->
                if(generation != epoch) return@snapshot
                if(session==null || view.url!=url) { busy=false;activeId=null;activeReply=null;failure(reply,id,"ACCESS");return@snapshot }
                job = activity.lifecycleScope.launch {
                    var result: JSONObject? = null
                    var errorCode: String? = null
                    try {
                        withTimeout(if(kind=="download") 600000L else 120000L) {
                            val model = Firebase.ai(backend=GenerativeBackend.googleAI()).generativeModel(
                                modelName=cloudModel,onDeviceConfig=OnDeviceConfig(mode=mode ?: InferenceMode.PREFER_ON_DEVICE))
                            if(kind=="generate") {
                                val response = model.generateContent(prompt)
                                val provider = response.inferenceSource.toString().uppercase(Locale.ROOT)
                                val text = response.text
                                if(text.isNullOrBlank() || provider !in setOf("ON_DEVICE","IN_CLOUD") ||
                                    (mode==InferenceMode.ONLY_ON_DEVICE && provider!="ON_DEVICE") ||
                                    (mode==InferenceMode.ONLY_IN_CLOUD && provider!="IN_CLOUD")) errorCode="FAILED"
                                else result=JSONObject().put("text",text).put("provider",provider).put("model",if(provider=="ON_DEVICE") "Android on-device model" else cloudModel)
                            } else {
                                val extension = model.onDeviceExtension
                                if(extension==null) result=JSONObject().put("status","UNAVAILABLE")
                                else {
                                    if(kind=="download") {
                                        var total=0L
                                        var failed=false
                                        extension.download().collect { event ->
                                            when(event) {
                                                is DownloadStatus.DownloadStarted -> total=event.bytesToDownload
                                                is DownloadStatus.DownloadInProgress -> if(total>0L && generation==epoch && view.url==url)
                                                    send(reply,id,"progress",JSONObject().put("fraction",(event.totalBytesDownloaded.toDouble()/total).coerceIn(0.0,1.0)))
                                                is DownloadStatus.DownloadCompleted -> Unit
                                                is DownloadStatus.DownloadFailed -> failed=true
                                            }
                                        }
                                        if(failed) errorCode="LOCAL"
                                    }
                                    if(errorCode==null) {
                                        val status=extension.checkStatus().toString().uppercase(Locale.ROOT)
                                        result=JSONObject().put("status",if(status in setOf("AVAILABLE","DOWNLOADABLE","DOWNLOADING","UNAVAILABLE")) status else "UNKNOWN")
                                    }
                                }
                            }
                        }
                    } catch (_: TimeoutCancellationException) { errorCode="TIMEOUT" }
                    catch (e: CancellationException) { throw e }
                    catch(e: Exception) {
                        // Do not log private questions, response text, or raw service errors.
                        Log.w("ElKimiyaAI83","Native request failed: " + e.javaClass.simpleName)
                        val raw=(e.message ?: "").lowercase()
                        errorCode=when {
                            "app check" in raw || "appcheck" in raw || "token is invalid" in raw || "attestation" in raw -> "APP_CHECK"
                            "on-device" in raw || "not supported" in raw || mode==InferenceMode.ONLY_ON_DEVICE -> "LOCAL"
                            "network" in raw || "connection" in raw || "unavailable" in raw -> "NETWORK"
                            else -> "FAILED"
                        }
                    }
                    if(generation!=epoch) return@launch
                    snapshot { current ->
                        if(generation!=epoch) return@snapshot
                        busy=false;activeId=null;activeReply=null;job=null
                        if(current!=session || view.url!=url) failure(reply,id,"ACCESS")
                        else if(errorCode!=null) failure(reply,id,errorCode ?: "FAILED")
                        else if(result!=null) send(reply,id,"result",result ?: JSONObject())
                        else failure(reply,id,"FAILED")
                    }
                }
            }
        }
    }
}
