package com.menstrue.elkimiya

// ELKIMIYA_ANDROID_HYBRID_WEB_V1
// ELKIMIYA_ANDROID_UI_V2_NATIVE_SHELL
// ELKIMIYA_ANDROID_UI_AI_V3
// ELKIMIYA_ANDROID_WEB_V82
// ELKIMIYA_ANDROID_THEME_SYNC_V32
// The public React learning product stays at its verified HTTPS origin.
// A separate, native Kotlin screen continues to provide Firebase Hybrid AI.

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.ClipData
import android.provider.MediaStore
import java.io.File
import androidx.core.content.FileProvider
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.print.PrintAttributes
import android.print.PrintManager
import android.util.Base64
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.PermissionRequest
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.SideEffect
import androidx.webkit.WebSettingsCompat
import androidx.webkit.ScriptHandler
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.TextButton
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.util.Locale

private const val WEB_ROOT = "https://el-kimiya.vercel.app/"
private const val WEB_RELEASE_85 = "8.5"
private const val WEB_POLISH_86 = "8.6"
private const val WEB_MOLECULE_861 = "8.6.1"
private const val MAX_PAINT_WAIT_85 = 30000L
private const val WEB_HOST = "el-kimiya.vercel.app"
private const val WEB_ORIGIN = "https://el-kimiya.vercel.app"
private const val MAX_BLOB_BYTES = 2 * 1024 * 1024
private val AppNavy = Color(0xFF103954)
private val AppCanvas = Color(0xFFF7F7F2)

/** No addJavascriptInterface: AndroidX WebMessage listener is HTTPS-origin scoped. */
class MainActivity : ComponentActivity() {
    private var browser: WebView? = null
    private var languageMode by mutableStateOf("id")
    // ELKIMIYA_ANDROID_NATIVE_AI_V83
    private var nativeAI83: NativeAiBridge83? = null
    private var pageEpoch = 0L
    private var openingNative = false
    // ELKIMIYA_V69_CAMERA_CAPTURE: capture through Android Camera + private FileProvider URI.
    private var pickerCallback: ValueCallback<Array<Uri>>? = null
    private var capturedPhotoUri: Uri? = null
    private var cameraRequest: PermissionRequest? = null
    private var reportBytes: ByteArray? = null
    private var reportFilename: String = "ElKimiya_Report.json"
    // ELKIMIYA_V85_NATIVE_SPLASH: full canvas until the current web document has painted.
    private var firstDocument84 by mutableStateOf(true)
    private var document85 = 0L
    private var paintWaitEpoch85 = -1L
    private var staleWeb85 by mutableStateOf(false)
    private var backInFlight85 = false
    private var busy by mutableStateOf(true)
    private var errorLoading by mutableStateOf(false)
    private var themeMode by mutableStateOf(ThemeMode.SYSTEM)
    private var themeStartScript: ScriptHandler? = null
    private var lastSystemThemeDark: Boolean? = null

    private val cameraCapture = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val photo = if (result.resultCode == RESULT_OK) capturedPhotoUri else null
        pickerCallback?.onReceiveValue(photo?.let { arrayOf(it) })
        pickerCallback = null
        capturedPhotoUri = null
    }

    private val chooseFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val values = if (result.resultCode == RESULT_OK) {
            val intent = result.data
            val selected = mutableListOf<Uri>()
            intent?.data?.let { selected.add(it) }
            intent?.clipData?.let { clip ->
                for (i in 0 until clip.itemCount.coerceAtMost(100)) selected.add(clip.getItemAt(i).uri)
            }
            selected.distinct().filter { it.scheme == "content" }.toTypedArray()
        } else emptyArray()
        pickerCallback?.onReceiveValue(values.takeIf { it.isNotEmpty() })
        pickerCallback = null
    }

    private val saveReport = registerForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")) { uri ->
        val bytes = reportBytes
        reportBytes = null
        if (uri != null && bytes != null) {
            try {
                contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
                    ?: error("Tidak dapat membuka tujuan penyimpanan")
                toast(tr85("Laporan tersimpan","Report saved"))
            } catch (e: Exception) { toast(tr85("Gagal menyimpan laporan","Could not save the report")) }
        }
    }

    private val cameraPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val request = cameraRequest
        cameraRequest = null
        if (request != null) {
            if (granted) request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
            else request.deny()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        themeMode = ElKimiyaPrefs.theme(this)
        languageMode = ElKimiyaPrefs.language(this)
        NativeTutorAccess.revoke()
        lastSystemThemeDark = resolveDark(this, themeMode)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val view = browser
                if (backInFlight85 || isFinishing || isDestroyed) return
                if (view == null || !originAllowed(Uri.parse(view.url ?: ""))) {
                    if (view?.canGoBack() == true) view.goBack() else finish()
                    return
                }
                backInFlight85 = true
                val script = """(() => {const close = document.querySelector('[data-elk-molecule-fullscreen] [data-elk-drawer-close]') || document.querySelector('[data-elk-drawer-open="true"] [data-elk-drawer-close]');if(!close)return false;close.click();return true;})()"""
                view.evaluateJavascript(script) { result ->
                    backInFlight85 = false
                    if (browser !== view || isFinishing || isDestroyed) return@evaluateJavascript
                    if (result != "true") {
                        if (view.canGoBack()) view.goBack() else finish()
                    }
                }
            }
        })
        setContent {
            val dark = resolveDark(this@MainActivity, themeMode)
            val palette = elKimiyaPalette(dark)
            val colors = if (dark) darkColorScheme(
                primary = palette.primary, onPrimary = palette.canvas, background = palette.canvas, surface = palette.surface,
                onSurface = palette.title, onBackground = palette.title
            ) else lightColorScheme(primary = palette.primary, onPrimary = Color.White, background = palette.canvas, surface = palette.surface, onBackground = palette.title, onSurface = palette.title)
            SideEffect { applyElKimiyaSystemBars(dark) }
            MaterialTheme(colorScheme = colors) {
                Box(
                    modifier = Modifier.fillMaxSize().background(palette.canvas)
                        .windowInsetsPadding(WindowInsets.safeDrawing)
                ) {
                    // React owns the app header and responsive navigation drawer.
                    // Do NOT draw another native toolbar above that header.
                    AndroidView(factory = { newBrowser() }, modifier = Modifier.fillMaxSize())

                    if (busy && firstDocument84) {
                        Column(
                            modifier = Modifier.fillMaxSize().background(palette.canvas).padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Image(
                                painterResource(if (dark) R.drawable.elkimiya_logo_white else R.drawable.elkimiya_logo_navy),
                                contentDescription = "El-Kīmiyā",
                                modifier = Modifier.size(96.dp)
                            )
                            Spacer(Modifier.size(20.dp))
                            Text("El-Kīmiyā", fontWeight = FontWeight.Bold, fontSize = 27.sp, color = palette.title)
                            Text(if (languageMode == "en") "Understand chemistry. Anywhere." else "Pahami kimia. Di mana saja.", color = palette.secondary)
                            Spacer(Modifier.size(28.dp))
                            CircularProgressIndicator(modifier = Modifier.size(32.dp), color = palette.primary)
                            Spacer(Modifier.size(12.dp))
                            Text(if (languageMode == "en") "Loading learning space…" else "Memuat ruang belajar…", color = palette.secondary)
                        }
                    } else if (busy) {
                        LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
                    }
                    if (errorLoading) {
                        Column(
                            modifier = Modifier.fillMaxSize().background(palette.canvas).padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically)
                        ) {
                            Image(
                                painterResource(if (dark) R.drawable.elkimiya_logo_white else R.drawable.elkimiya_logo_navy),
                                contentDescription = "Logo El-Kīmiyā",
                                modifier = Modifier.size(56.dp)
                            )
                            Text(
                                if (staleWeb85) tr85("Pembaruan web belum tersedia", "Web update not yet available")
                                else tr85("Koneksi ke El-Kīmiyā terputus", "Connection to El-Kīmiyā interrupted"),
                                fontWeight = FontWeight.Bold, color = palette.title,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Text(
                                if (staleWeb85) tr85("Versi web V8.6.1 belum diterima. Tunggu deployment Vercel, lalu coba lagi.", "Web release V8.6.1 has not arrived. Wait for the Vercel deployment, then retry.")
                                else tr85("Periksa koneksi dan coba lagi. Materi serta akun tetap tersimpan.", "Check the connection and retry. Your learning data and account remain saved."),
                                color = palette.secondary, textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Button(onClick = { errorLoading = false; staleWeb85 = false; reloadLatestWeb() }) {
                                Text(if (languageMode == "en") "Retry" else "Coba lagi")
                            }
                            OutlinedButton(onClick = { openExternally(Uri.parse(WEB_ROOT)) }) {
                                Text(if (languageMode == "en") "Open in Chrome" else "Buka di Chrome")
                            }
                        }
                    }

                    // V8.2: React remains the only navigation shell.
                    // Learner-only native AI card is inserted by the trusted WebView bridge.

                }
            }
        }
    }

    private fun changeTheme(mode: ThemeMode) {
        themeMode = mode
        ElKimiyaPrefs.saveTheme(this, mode)
        browser?.let { installThemeStartScript(it) }
        val isDark = resolveDark(this, mode)
        lastSystemThemeDark = isDark
        val view = browser ?: return
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        view.evaluateJavascript("(function(){localStorage.setItem('elk.dark','$isDark');location.reload();})();", null)
    }

    override fun onResume() {
        super.onResume()
        val latestTheme = ElKimiyaPrefs.theme(this)
        val latestLanguage = ElKimiyaPrefs.language(this)
        val resolved = resolveDark(this, latestTheme)
        if (themeMode == latestTheme && languageMode == latestLanguage && lastSystemThemeDark == resolved) return
        lastSystemThemeDark = resolved
        themeMode = latestTheme
        languageMode = latestLanguage
        val view = browser ?: return
        installThemeStartScript(view)
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        val dark = resolveDark(this, latestTheme)
        view.evaluateJavascript("try{localStorage.setItem('elk.dark','$dark');localStorage.setItem('elk.language','$latestLanguage');location.reload()}catch(e){}", null)
    }

    /** Network-first document reload. Clears HTTP cache, NEVER localStorage/user progress. */
    private fun reloadLatestWeb() {
        val view = browser ?: return
        val uri = Uri.parse(view.url ?: WEB_ROOT)
        if (!originAllowed(uri)) {
            toast(tr85("Muat ulang hanya tersedia pada halaman El-Kīmiyā","Reload is only available on El-Kīmiyā"))
            return
        }
        val fragment = uri.encodedFragment?.let { "#$it" } ?: ""
        val nonce = System.currentTimeMillis()
        view.stopLoading()
        view.clearCache(true) // HTTP cache only; no cookies, WebStorage or offline notes are erased.
        view.loadUrl("${WEB_ROOT}?elk_release=$WEB_MOLECULE_861&refresh=$nonce$fragment")
        toast(tr85("Mengambil website terbaru…","Fetching the latest website…"))
    }

    private fun installThemeStartScript(view: WebView) {
        themeStartScript?.remove()
        themeStartScript = null
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            val dark = resolveDark(this, themeMode)
            val language = if (languageMode == "en") "en" else "id"
            themeStartScript = WebViewCompat.addDocumentStartJavaScript(
                view,
                "try{if(localStorage.getItem('elk.dark')===null)localStorage.setItem('elk.dark','$dark');if(localStorage.getItem('elk.language')===null)localStorage.setItem('elk.language','$language')}catch(e){}",
                setOf(WEB_ORIGIN)
            )
        }
    }

    private fun navigate(route: String) {
        val url = if (route == "landing") WEB_ROOT else "${WEB_ROOT}#$route"
        errorLoading = false
        browser?.loadUrl(url)
    }

    private fun originAllowed(uri: Uri?): Boolean = uri != null && uri.userInfo == null &&
        uri.scheme.equals("https", ignoreCase = true) && uri.host.equals(WEB_HOST, ignoreCase = true) &&
        (uri.port == -1 || uri.port == 443)

    @SuppressLint("SetJavaScriptEnabled")
    private fun newBrowser(): WebView = WebView(this).apply {
        browser = this
        setBackgroundColor(if (resolveDark(this@MainActivity, themeMode))
            android.graphics.Color.rgb(18, 36, 52) else android.graphics.Color.rgb(247, 247, 242))
        settings.javaScriptEnabled = true
        settings.userAgentString = settings.userAgentString + " ElKimiyaAndroid/8.3 ElKimiyaRelease/8.6"
        nativeAI83?.invalidate()
        nativeAI83 = NativeAiBridge83(this@MainActivity, this).also { it.install() }
        // React provides its own dark design; never invert its colors algorithmically.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
        }
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = true  // Android document picker returns content:// URIs.
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.setSupportMultipleWindows(false)
        settings.javaScriptCanOpenWindowsAutomatically = false
        settings.setGeolocationEnabled(false)
        // The mobile molecular canvas owns touch zoom; honor the web viewport.
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = false
        settings.builtInZoomControls = false
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)

        // Install first-party theme before React reads `elk.dark` on page startup.
        // The script is restricted to the exact production HTTPS origin.
        installThemeStartScript(this)

        // The bridge is exposed only to trusted HTTPS origin frames; no generic JS interface.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(this, "ElKimiyaDownload", setOf(WEB_ORIGIN)) { _, message, source, mainFrame, _ ->
                if (!mainFrame || !originAllowed(source)) return@addWebMessageListener
                val raw = message.data ?: return@addWebMessageListener
                if (raw.length > 3_000_000) return@addWebMessageListener
                runOnUiThread { processWebMessage(raw) }
            }
        }
        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (!request.isForMainFrame) return false
                val uri = request.url
                if (originAllowed(uri)) return false
                if (uri.scheme == "https" || uri.scheme == "http" || uri.scheme == "mailto") {
                    openExternally(uri)
                    return true
                }
                // Never follow file://, intent://, javascript:, etc. as a top-level page.
                return uri.scheme != "about" && uri.scheme != "blob"
            }
            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                nativeAI83?.invalidate()
                pageEpoch++
                openingNative = false
                NativeTutorAccess.revoke()
                document85++
                paintWaitEpoch85 = -1L
                firstDocument84 = true
                staleWeb85 = false
                busy = true
                errorLoading = false
                val epoch85 = document85
                // Network hangs must end in a genuine retry state, not an infinite splash.
                view.postDelayed({
                    if (currentDocument85(view, epoch85) && busy) {
                        busy = false
                        errorLoading = true
                    }
                }, MAX_PAINT_WAIT_85)
            }
            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                if (originAllowed(Uri.parse(url ?: "")) && currentDocument85(view, document85) && busy) {
                    injectDownloadSupport(view)
                    if (paintWaitEpoch85 != document85) {
                        paintWaitEpoch85 = document85
                        waitForWebPaint85(view, document85)
                    }
                }
            }
            override fun doUpdateVisitedHistory(view: WebView, url: String?, isReload: Boolean) {
                super.doUpdateVisitedHistory(view, url, isReload)
                nativeAI83?.invalidate()
                pageEpoch++
                openingNative = false
                if (!nativeRouteAllowed(url)) NativeTutorAccess.revoke()
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) { nativeAI83?.invalidate(); pageEpoch++; openingNative = false; NativeTutorAccess.revoke(); busy = false; errorLoading = true }
            }
        }
        webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(webView: WebView?, filePathCallback: ValueCallback<Array<Uri>>?,
                                            fileChooserParams: WebChromeClient.FileChooserParams?): Boolean {
                pickerCallback?.onReceiveValue(null)
                pickerCallback = filePathCallback
                if (filePathCallback == null) return false
                // A capture-enabled <input type=file capture=environment> opens the real
                // Android camera. No permission/storage bypass and no automatic OCR.
                if (fileChooserParams?.isCaptureEnabled == true &&
                    fileChooserParams?.acceptTypes?.any { it.startsWith("image/") } == true) {
                    try {
                        val photoFile = File.createTempFile("elkimiya_scan_", ".jpg", cacheDir)
                        val uri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "${applicationContext.packageName}.fileprovider",
                            photoFile
                        )
                        capturedPhotoUri = uri
                        val camera = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                            putExtra(MediaStore.EXTRA_OUTPUT, uri)
                            clipData = ClipData.newUri(contentResolver, "El-Kimiya Scan", uri)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                        }
                        cameraCapture.launch(camera)
                        return true
                    } catch (_: Exception) {
                        capturedPhotoUri = null
                        // Camera app unavailable: fall back to the Android document picker.
                    }
                }
                try {
                    val accepts = fileChooserParams?.acceptTypes?.filter { it.contains('/') }?.distinct().orEmpty()
                    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = if (accepts.size == 1) accepts[0] else "*/*"
                        if (accepts.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, accepts.toTypedArray())
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    chooseFile.launch(intent)
                } catch (e: ActivityNotFoundException) {
                    pickerCallback?.onReceiveValue(null); pickerCallback = null
                    toast(tr85("Pemilih file tidak tersedia","File picker unavailable"))
                }
                return true
            }
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (originAllowed(request.origin) && request.resources.contentEquals(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))) {
                        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                        } else { cameraRequest = request; cameraPermission.launch(Manifest.permission.CAMERA) }
                    } else request.deny()
                }
            }
            override fun onPermissionRequestCanceled(request: PermissionRequest) {
                if (cameraRequest === request) cameraRequest = null
            }
        }
        setDownloadListener(DownloadListener { url, _, contentDisposition, mimeType, _ ->
            val uri = Uri.parse(url)
            if (!originAllowed(uri)) { toast(tr85("Unduhan eksternal dibuka di Chrome","External download opens in Chrome")); openExternally(uri); return@DownloadListener }
            val filename = safeFilename(URLUtil.guessFileName(url, contentDisposition, mimeType))
            try {
                val request = DownloadManager.Request(uri).apply {
                    setTitle(filename)
                    setMimeType(mimeType)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                }
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
                toast(tr85("Mengunduh $filename","Downloading $filename"))
            } catch (e: Exception) { openExternally(uri) }
        })
        loadUrl("${WEB_ROOT}?elk_release=$WEB_MOLECULE_861")
    }

    // Fullscreen Compose splash is removed only after React has committed visible content.
    // The HTML boot view and the session boundary use the same theme/canvas, so a
    // legitimate pending account check never reveals a white WebView underneath.
    private fun currentDocument85(view: WebView, epoch85: Long): Boolean =
        browser === view && document85 == epoch85 && !isFinishing && !isDestroyed &&
            originAllowed(Uri.parse(view.url ?: ""))

    private fun waitForWebPaint85(view: WebView, epoch85: Long) {
        if (!currentDocument85(view, epoch85) || !busy || errorLoading) return
        val script = """
            (() => {
              if(document.documentElement.getAttribute('data-elk-release') !== '$WEB_RELEASE_85' ||
                 document.documentElement.getAttribute('data-elk-polish-release') !== '$WEB_POLISH_86' ||
                 document.documentElement.getAttribute('data-elk-molecule-release') !== '$WEB_MOLECULE_861') return 'stale';
              const root=document.getElementById('root');
              const child=root && root.firstElementChild;
              return child && child.id !== 'elk-boot85' && child.getBoundingClientRect().height > 0 ? 'ready' : 'pending';
            })()
        """.trimIndent()
        view.evaluateJavascript(script) { state ->
            if (!currentDocument85(view, epoch85) || !busy || errorLoading) return@evaluateJavascript
            when (state) {
                "\"ready\"" -> view.postVisualStateCallback(epoch85, object : WebView.VisualStateCallback() {
                    override fun onComplete(requestId: Long) {
                        if (currentDocument85(view, epoch85) && busy && !errorLoading && requestId == epoch85) {
                            firstDocument84 = false
                            busy = false
                        }
                    }
                })
                "\"stale\"" -> {
                    staleWeb85 = true
                    busy = false
                    errorLoading = true
                }
                else -> view.postDelayed({ waitForWebPaint85(view, epoch85) }, 200L)
            }
        }
    }

    private fun tr85(id: String, en: String): String = if (languageMode == "en") en else id

    private fun safeFilename(value: String): String = value
        .replace(Regex("[^A-Za-z0-9._-]"), "_")
        .take(96).trim('.').ifBlank { "ElKimiya_Report.json" }

    private fun processWebMessage(raw: String) {
        try {
            val packet = JSONObject(raw)
            if (!originAllowed(Uri.parse(browser?.url ?: ""))) return
            when (packet.optString("kind")) {
                "native-access" -> {
                    if (!packet.optBoolean("allowed", false)) {
                        pageEpoch++
                        openingNative = false
                        NativeTutorAccess.revoke()
                    }
                }
                "native-ai" -> launchNativeTutor()
                "preferences" -> {
                    val chosenLanguage = packet.optString("language", "")
                    if (chosenLanguage == "en" || chosenLanguage == "id") {
                        languageMode = chosenLanguage
                        ElKimiyaPrefs.saveLanguage(this, chosenLanguage)
                    }
                    if (packet.has("dark") && !packet.isNull("dark")) {
                        val dark = packet.optBoolean("dark")
                        browser?.setBackgroundColor(if (dark) android.graphics.Color.rgb(18, 36, 52) else android.graphics.Color.rgb(247, 247, 242))
                        if (dark != resolveDark(this, themeMode)) {
                            themeMode = if (dark) ThemeMode.DARK else ThemeMode.LIGHT
                            ElKimiyaPrefs.saveTheme(this, themeMode)
                            lastSystemThemeDark = resolveDark(this, themeMode)
                        }
                    }
                }
                "theme" -> {
                    val isDark = packet.optBoolean("dark")
                    browser?.setBackgroundColor(if (isDark) android.graphics.Color.rgb(18, 36, 52) else android.graphics.Color.rgb(247, 247, 242))
                    val chosen = if (isDark) ThemeMode.DARK else ThemeMode.LIGHT
                    if (themeMode != chosen) {
                        themeMode = chosen
                        ElKimiyaPrefs.saveTheme(this, chosen)
                        browser?.let { installThemeStartScript(it) }
                    }
                }
                "print" -> withCurrentWorkspace { printCurrentPage() }
                "download" -> withCurrentWorkspace {
                    val name = safeFilename(packet.optString("name", "ElKimiya_Report.json"))
                    val mime = packet.optString("mime").lowercase(Locale.ROOT)
                    if (!(mime.startsWith("text/") || mime.startsWith("application/json"))) return@withCurrentWorkspace
                    val data = packet.optString("data")
                    val pos = data.indexOf(";base64,")
                    if (!data.startsWith("data:") || pos !in 5..80) return@withCurrentWorkspace
                    val encoded = data.substring(pos + 8)
                    if (encoded.length > 2_800_000) return@withCurrentWorkspace
                    val bytes = Base64.decode(encoded, Base64.DEFAULT)
                    if (bytes.size > MAX_BLOB_BYTES) { toast(tr85("File terlalu besar untuk ekspor aplikasi","File exceeds the app export limit")); return@withCurrentWorkspace }
                    reportFilename = name
                    reportBytes = bytes
                    saveReport.launch(name)
                }
            }
        } catch (_: Exception) { toast(tr85("Ekspor laporan tidak tersedia","Report export unavailable")) }
    }

    private fun injectDownloadSupport(view: WebView) {
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return
        try {
            val code = assets.open("elkimiya_android_v82.js").bufferedReader(Charsets.UTF_8).use { it.readText() }
            view.evaluateJavascript(code, null)
        } catch (_: Exception) { NativeTutorAccess.revoke() }
    }

    private fun nativeRouteAllowed(raw: String?): Boolean {
        val uri = Uri.parse(raw ?: "")
        return originAllowed(uri) && (uri.path == "/" || uri.path.isNullOrEmpty()) &&
                (uri.fragment == "tutor" || uri.fragment == "hybrid")
    }

    private fun launchNativeTutor() {
        val view = browser ?: return
        if (openingNative || busy || errorLoading || !nativeRouteAllowed(view.url)) return
        if (NativeTutorAccess.allowed.value || isFinishing || isDestroyed) return
        openingNative = true
        val epoch = pageEpoch
        view.evaluateJavascript("Boolean(window.__elkV82NativeAllowed && window.__elkV82NativeAllowed())") { result ->
            openingNative = false
            if (result != "true" || epoch != pageEpoch || browser !== view ||
                !nativeRouteAllowed(view.url) || busy || errorLoading || isFinishing || isDestroyed) {
                return@evaluateJavascript
            }
            NativeTutorAccess.grant()
            try {
                startActivity(Intent(this, NativeTutorActivity::class.java))
            } catch (_: Exception) {
                NativeTutorAccess.revoke()
                toast(if (languageMode == "en") "Native tutor could not open" else "Tutor native gagal dibuka")
            }
        }
    }

    private fun withCurrentWorkspace(action: () -> Unit) {
        val view = browser ?: return
        if (!originAllowed(Uri.parse(view.url ?: "")) || busy || errorLoading) return
        val epoch = pageEpoch
        view.evaluateJavascript("Boolean(window.__elkV82WorkspaceAllowed && window.__elkV82WorkspaceAllowed())") { result ->
            if (result == "true" && epoch == pageEpoch && browser === view &&
                originAllowed(Uri.parse(view.url ?: "")) && !busy && !errorLoading && !isFinishing && !isDestroyed) {
                try { action() }
                catch (_: Exception) { toast(if (languageMode == "en") "Export unavailable" else "Ekspor laporan tidak tersedia") }
            }
        }
    }

    private fun printCurrentPage() {
        val view = browser ?: return
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        try {
            val manager = getSystemService(Context.PRINT_SERVICE) as PrintManager
            manager.print("ElKimiya_Report", view.createPrintDocumentAdapter("ElKimiya"), PrintAttributes.Builder().build())
        } catch (e: Exception) { toast(tr85("Cetak PDF gagal","PDF printing failed")) }
    }

    private fun openExternally(uri: Uri) {
        if (uri.scheme != "https" && uri.scheme != "http" && uri.scheme != "mailto") return
        try { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
        catch (_: Exception) { toast(tr85("Tidak ada aplikasi untuk membuka tautan","No application can open the link")) }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    override fun onDestroy() {
        nativeAI83?.invalidate()
        nativeAI83 = null
        pageEpoch++
        openingNative = false
        NativeTutorAccess.revoke()
        pickerCallback?.onReceiveValue(null)
        pickerCallback = null
        cameraRequest?.deny()
        cameraRequest = null
        themeStartScript?.remove()
        themeStartScript = null
        browser?.let { view ->
            (view.parent as? android.view.ViewGroup)?.removeView(view)
            view.stopLoading(); view.destroy()
        }
        browser = null
        super.onDestroy()
    }
}
