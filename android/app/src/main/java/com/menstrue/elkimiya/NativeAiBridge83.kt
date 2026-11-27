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
import com.google.firebase.ai.InferenceSource
import com.google.firebase.ai.OnDeviceModelStatus
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.APINotConfiguredException
import com.google.firebase.ai.type.ContentBlockedException
import com.google.firebase.ai.type.FirebaseAIOnDeviceInvalidRequestException
import com.google.firebase.ai.type.FirebaseAIOnDeviceNotAvailableException
import com.google.firebase.ai.type.FirebaseAIOnDeviceUnknownException
import com.google.firebase.ai.type.InvalidAPIKeyException
import com.google.firebase.ai.type.PermissionMissingException
import com.google.firebase.ai.type.PromptBlockedException
import com.google.firebase.ai.type.QuotaExceededException
import com.google.firebase.ai.type.RequestTimeoutException
import com.google.firebase.ai.type.ServiceDisabledException
import java.net.UnknownHostException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.SocketException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlinx.coroutines.TimeoutCancellationException
import org.json.JSONObject
import org.json.JSONTokener
import java.util.Locale

// ELKIMIYA_V83_NATIVE_AI. Origin-scoped, main-frame only. No token or UID transfer.
// The UI/session gate is defense in depth; App Check remains enforced by Firebase.
internal class NativeAiBridge83(private val activity: ComponentActivity, private val view: WebView) {
    // ELKIMIYA_AI_DOCTOR83: no tokens, raw prompts, generated text, or raw service errors in logs.
    private fun diagnostic(message: String) {
        if(BuildConfig.DEBUG) Log.i("ElKimiyaAI83", "AI_DOCTOR83 " + message)
    }
    // ELKIMIYA_V84_AI: diagnostic probe only; never pass an App Check token to the WebView.
    // Token acquisition is distinct from a successful, verified cloud generation.
    private suspend fun verifyAppCheck(): String? = suspendCancellableCoroutine { cont ->
        FirebaseAppCheck.getInstance().getLimitedUseAppCheckToken().addOnCompleteListener { task ->
            if (!cont.isActive) return@addOnCompleteListener
            val code = if (task.isSuccessful && !task.result.token.isNullOrBlank()) null
                       else task.exception?.let { classifyFailure(it, null, "attest") } ?: "APP_CHECK"
            cont.resume(code)
        }
    }
    private val cloudModel = "gemini-3.5-flash-lite"
    private val origin = "https://el-kimiya.vercel.app"
    private val routes = setOf("dashboard","mission","library","faith","reader","tutor","hybrid","practice","explorer","molecules","flashcards","progress","notes","settings","scan","profile","about")
    private val modes = mapOf("Prefer on-device" to InferenceMode.PREFER_ON_DEVICE, "On-device only" to InferenceMode.ONLY_ON_DEVICE, "Prefer cloud" to InferenceMode.PREFER_IN_CLOUD, "Cloud only" to InferenceMode.ONLY_IN_CLOUD)
    private var epoch = 0L
    private var busy = false
    private var job: Job? = null
    private var activeId: String? = null
    private var activeReply: JavaScriptReplyProxy? = null
    private class NativeFailure(val code: String) : Exception(code)

    // Only known local availability/request/runtime-capacity failures may trigger a
    // local-first cloud attempt. A blocked prompt, unverified source, blank response,
    // access failure, or App Check rejection must NOT be treated as successful inference.
    private val localFallbackCodes = setOf("LOCAL", "LOCAL_INPUT", "LOCAL_BUSY", "LOCAL_QUOTA")

    private fun classifyFailure(e: Throwable, mode: InferenceMode?, kind: String): String {
        val chain = generateSequence<Throwable>(e) { it.cause?.takeIf { cause -> cause !== it } }
            .take(6).toList()
        chain.filterIsInstance<NativeFailure>().firstOrNull()?.let { return it.code }
        // Raw error text is used only for bounded classification, never returned or logged.
        val raw = chain.joinToString(" ") { (it.message ?: "").take(2048) }.lowercase(Locale.ROOT)
        fun hasCode(code: String) = Regex("(^|[^0-9])" + code + "([^0-9]|$)").containsMatchIn(raw)
        val local = mode == InferenceMode.ONLY_ON_DEVICE || kind in setOf("status", "download") ||
            chain.any { it is FirebaseAIOnDeviceNotAvailableException || it is FirebaseAIOnDeviceInvalidRequestException || it is FirebaseAIOnDeviceUnknownException }
        return when {
            chain.any { it is PromptBlockedException || it is ContentBlockedException } ||
                "prompt_blocked" in raw || "content_blocked" in raw || "safety filter" in raw || "safety policy" in raw ||
                "request_processing_error" in raw || "response_generation_error" in raw || "response_processing_error" in raw ||
                "policy check" in raw -> "BLOCKED"
            "app check" in raw || "app_check" in raw || "appcheck" in raw || "attestation" in raw || "token is invalid" in raw ||
                "invalid app check token" in raw || "replay protection" in raw -> "APP_CHECK"
            chain.any { it is InvalidAPIKeyException } || "api_key_service_blocked" in raw ||
                "api_key_invalid" in raw || "api key" in raw -> "API_KEY"
            chain.any { it is APINotConfiguredException || it is ServiceDisabledException } || "service_disabled" in raw || "api has not been used" in raw -> "CONFIG"
            local && ("per_app_battery_use_quota_exceeded" in raw || "quota_exceeded" in raw ||
                      chain.any { it is QuotaExceededException }) -> "LOCAL_QUOTA"
            local && Regex("(^|[^a-z])busy([^a-z]|$)").containsMatchIn(raw) -> "LOCAL_BUSY"
            chain.any { it is FirebaseAIOnDeviceInvalidRequestException } ||
                (local && ("request_too_large" in raw || "request_too_small" in raw || "request is too large" in raw || "request is too small" in raw)) -> "LOCAL_INPUT"
            chain.any { it is FirebaseAIOnDeviceNotAvailableException } -> "LOCAL"
            chain.any { it is RequestTimeoutException || it is SocketTimeoutException } -> "TIMEOUT"
            chain.any { it is UnknownHostException || it is ConnectException || it is SocketException } ||
                "network" in raw || "unable to resolve host" in raw || "connection refused" in raw || "connection reset" in raw -> "NETWORK"
            kind == "attest" && (hasCode("429") || "too many attempts" in raw || "resource_exhausted" in raw) -> "APP_CHECK"
            !local && (chain.any { it is QuotaExceededException } || hasCode("429") || "resource_exhausted" in raw) -> "QUOTA"
            chain.any { it is PermissionMissingException } || hasCode("403") || "permission_denied" in raw -> "HTTP_403"
            hasCode("404") || "not_found" in raw -> "HTTP_404"
            hasCode("401") || "unauthenticated" in raw -> "HTTP_401"
            !local && (hasCode("500") || hasCode("502") || hasCode("503") || hasCode("504") || "service unavailable" in raw) -> "SERVICE"
            local && ("not supported" in raw || "unavailable" in raw || "not available" in raw ||
                      "model not downloaded" in raw || "model is not ready" in raw ||
                      "not_supported" in raw || "not_available" in raw || "aicore_incompatible" in raw ||
                      "needs_system_update" in raw) -> "LOCAL"
            // Don't infer a quota or treat *all* local errors as safe fallback triggers.
            local -> "LOCAL_RUNTIME"
            kind == "attest" -> "APP_CHECK"
            else -> "FAILED"
        }
    }

    private fun model(mode: InferenceMode) = Firebase.ai(
        backend = GenerativeBackend.googleAI(),
        // Works with App Check baseline protection and replay protection.
        useLimitedUseAppCheckTokens = true
    ).generativeModel(modelName = cloudModel, onDeviceConfig = OnDeviceConfig(mode = mode))

    private suspend fun generateVerified(prompt: String, mode: InferenceMode): JSONObject {
        currentCoroutineContext().ensureActive()
        val response = model(mode).generateContent(prompt)
        currentCoroutineContext().ensureActive()
        val provider = when (response.inferenceSource) {
            InferenceSource.IN_CLOUD -> "IN_CLOUD"
            InferenceSource.ON_DEVICE -> "ON_DEVICE"
            else -> "UNKNOWN"
        }
        val text = response.text
        if (BuildConfig.DEBUG) {
            // Compatibility with the Doctor V83 format; comparison is diagnostic only.
            val legacyMatch = response.inferenceSource.toString().uppercase(Locale.ROOT) == provider
            diagnostic("RESPONSE provider=$provider nonblank=${!text.isNullOrBlank()} legacyMatch=$legacyMatch")
        }
        if (provider == "UNKNOWN" ||
            (mode == InferenceMode.ONLY_ON_DEVICE && provider != "ON_DEVICE") ||
            (mode == InferenceMode.ONLY_IN_CLOUD && provider != "IN_CLOUD")) throw NativeFailure("SOURCE_MISMATCH")
        if (text.isNullOrBlank()) throw NativeFailure("NO_TEXT")
        val modelLabel = if (provider == "ON_DEVICE") "Android on-device model"
                         else response.modelVersion?.takeIf { it.isNotBlank() } ?: cloudModel
        return JSONObject().put("text", text).put("provider", provider).put("model", modelLabel)
    }

    private suspend fun generate(prompt: String, mode: InferenceMode, recheck: suspend () -> Boolean): JSONObject {
        if (mode != InferenceMode.PREFER_ON_DEVICE) {
            // PREFER_IN_CLOUD keeps Firebase's documented offline-only fallback.
            return generateVerified(prompt, mode)
        }
        // Explicit local-first attempt means a missing cloud token cannot prevent
        // a successful local result; the cloud is called only on eligible failure.
        try {
            return generateVerified(prompt, InferenceMode.ONLY_ON_DEVICE)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            currentCoroutineContext().ensureActive()
            val code = classifyFailure(e, InferenceMode.ONLY_ON_DEVICE, "generate")
            diagnostic("EXCEPTION kind=generate class=${e.javaClass.simpleName} reason=$code")
            if (!localFallbackCodes.contains(code)) throw NativeFailure(code)
            if (!recheck()) throw NativeFailure("ACCESS")
            diagnostic("FALLBACK from=ON_DEVICE to=IN_CLOUD reason=$code")
            return generateVerified(prompt, InferenceMode.ONLY_IN_CLOUD)
        }
    }

    private fun statusName(status: OnDeviceModelStatus) = when (status) {
        OnDeviceModelStatus.AVAILABLE -> "AVAILABLE"
        OnDeviceModelStatus.DOWNLOADABLE -> "DOWNLOADABLE"
        OnDeviceModelStatus.DOWNLOADING -> "DOWNLOADING"
        OnDeviceModelStatus.UNAVAILABLE -> "UNAVAILABLE"
        else -> "UNKNOWN"
    }

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
            if(kind !in setOf("generate","status","download") && !(kind=="attest" && BuildConfig.DEBUG)) { failure(reply,id,"FAILED"); return@addWebMessageListener }
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
                        diagnostic("START kind=$kind")
                        withTimeout(if(kind=="download") 600000L else 120000L) {
                            if(kind=="attest" && BuildConfig.DEBUG) {
                                errorCode = verifyAppCheck()
                                diagnostic("APP_CHECK verified=${errorCode == null}")
                                if(errorCode==null) result=JSONObject().put("attestation","OK")
                            } else if(kind=="generate") {
                                result = generate(prompt, mode ?: throw NativeFailure("LIMIT")) {
                                    suspendCancellableCoroutine { cont ->
                                        snapshot { current ->
                                            if(cont.isActive) cont.resume(generation==epoch && view.url==url && current==session)
                                        }
                                    }
                                }
                            } else {
                                // Local readiness/download must not depend on cloud attestation.
                                val extension = model(InferenceMode.ONLY_ON_DEVICE).onDeviceExtension
                                if(extension==null) result=JSONObject().put("status","UNAVAILABLE")
                                else {
                                    var status = statusName(extension.checkStatus())
                                    if(kind=="download" && status=="DOWNLOADABLE") {
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
                                        status = statusName(extension.checkStatus())
                                        if(failed && status!="AVAILABLE") throw NativeFailure("LOCAL")
                                    }
                                    diagnostic("MODEL_STATUS status=$status")
                                    result=JSONObject().put("status",status)
                                }
                            }
                        }
                    } catch (_: TimeoutCancellationException) { errorCode="TIMEOUT"; diagnostic("TIMEOUT kind=$kind") }
                    catch (e: CancellationException) { throw e }
                    catch(e: Exception) {
                        currentCoroutineContext().ensureActive()
                        errorCode = classifyFailure(e, mode, kind)
                        diagnostic("EXCEPTION kind=$kind class=${e.javaClass.simpleName} reason=$errorCode")
                    }
                    if(generation!=epoch) return@launch
                    snapshot { current ->
                        if(generation!=epoch) return@snapshot
                        busy=false;activeId=null;activeReply=null;job=null
                        if(current!=session || view.url!=url) { diagnostic("END kind=$kind code=ACCESS"); failure(reply,id,"ACCESS") }
                        else if(errorCode!=null) { diagnostic("END kind=$kind code=$errorCode"); failure(reply,id,errorCode ?: "FAILED") }
                        else if(result!=null) { diagnostic("END kind=$kind code=OK"); send(reply,id,"result",result ?: JSONObject()) }
                        else { diagnostic("END kind=$kind code=FAILED"); failure(reply,id,"FAILED") }
                    }
                }
            }
        }
    }
}
