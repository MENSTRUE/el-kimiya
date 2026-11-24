package com.menstrue.elkimiya

// ELKIMIYA_ANDROID_HYBRID_WEB_V1
// ELKIMIYA_ANDROID_UI_V2_NATIVE_SHELL
// ELKIMIYA_ANDROID_UI_AI_V3
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
private const val WEB_HOST = "el-kimiya.vercel.app"
private const val WEB_ORIGIN = "https://el-kimiya.vercel.app"
private const val MAX_BLOB_BYTES = 2 * 1024 * 1024
private val AppNavy = Color(0xFF103954)
private val AppCanvas = Color(0xFFF8F7F2)

/** No addJavascriptInterface: AndroidX WebMessage listener is HTTPS-origin scoped. */
class MainActivity : ComponentActivity() {
    private var browser: WebView? = null
    // ELKIMIYA_V69_CAMERA_CAPTURE: capture through Android Camera + private FileProvider URI.
    private var pickerCallback: ValueCallback<Array<Uri>>? = null
    private var capturedPhotoUri: Uri? = null
    private var cameraRequest: PermissionRequest? = null
    private var reportBytes: ByteArray? = null
    private var reportFilename: String = "ElKimiya_Report.json"
    private var busy by mutableStateOf(true)
    private var errorLoading by mutableStateOf(false)
    private var themeMode by mutableStateOf(ThemeMode.SYSTEM)
    private var themeStartScript: ScriptHandler? = null

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
                toast("Laporan tersimpan")
            } catch (e: Exception) { toast("Gagal menyimpan: ${e.localizedMessage}") }
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
        themeMode = ElKimiyaPrefs.theme(this)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val view = browser
                if (view?.canGoBack() == true) view.goBack() else finish()
            }
        })
        setContent {
            var quickMenuExpanded by remember { mutableStateOf(false) }
            val dark = resolveDark(this@MainActivity, themeMode)
            val palette = elKimiyaPalette(dark)
            val colors = if (dark) darkColorScheme(
                primary = palette.primary, background = palette.canvas, surface = palette.surface,
                onSurface = palette.title, onBackground = palette.title
            ) else lightColorScheme(primary = palette.primary, background = palette.canvas, surface = palette.surface)
            SideEffect { applyElKimiyaSystemBars(dark) }
            MaterialTheme(colorScheme = colors) {
                Box(
                    modifier = Modifier.fillMaxSize().background(palette.canvas)
                        .windowInsetsPadding(WindowInsets.safeDrawing)
                ) {
                    // The React website already has its own header and 5-tab mobile nav.
                    // Do NOT draw another native toolbar above that header.
                    AndroidView(factory = { newBrowser() }, modifier = Modifier.fillMaxSize())

                    if (busy) {
                        LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
                    }
                    if (errorLoading) {
                        Column(
                            modifier = Modifier.align(Alignment.Center).background(palette.canvas)
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Image(
                                painterResource(if (dark) R.drawable.elkimiya_logo_white else R.drawable.elkimiya_logo_navy),
                                contentDescription = "Logo El-Kīmiyā",
                                modifier = Modifier.size(56.dp)
                            )
                            Text("Koneksi ke El-Kīmiyā terputus", fontWeight = FontWeight.Bold, color = palette.title)
                            Text("Materi web memerlukan koneksi. Coba ulang atau buka di Chrome.")
                            Button(onClick = { errorLoading = false; browser?.loadUrl(WEB_ROOT) }) {
                                Text("Coba lagi")
                            }
                            OutlinedButton(onClick = { openExternally(Uri.parse(WEB_ROOT)) }) {
                                Text("Buka di Chrome")
                            }
                        }
                    }

                    // Small native-only action. Replaces React's floating tutor button
                    // inside this WebView; React bottom navigation remains visible.
                    Box(
                        modifier = Modifier.align(Alignment.BottomEnd)
                            .padding(end = 14.dp, bottom = 100.dp)
                    ) {
                        Surface(
                            color = if (dark) palette.surfaceAlt else AppNavy,
                            shape = RoundedCornerShape(18.dp),
                            shadowElevation = 8.dp
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                TextButton(onClick = {
                                    startActivity(Intent(this@MainActivity, NativeTutorActivity::class.java))
                                }) {
                                    Image(
                                        painterResource(R.drawable.elkimiya_logo_white),
                                        contentDescription = null,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Spacer(Modifier.size(7.dp))
                                    Text("AI Native", color = Color.White, fontWeight = FontWeight.SemiBold)
                                }
                                IconButton(onClick = { quickMenuExpanded = true }) {
                                    Text("⋮", color = Color.White, fontSize = 20.sp)
                                }
                            }
                        }
                        DropdownMenu(
                            expanded = quickMenuExpanded,
                            onDismissRequest = { quickMenuExpanded = false }
                        ) {
                            DropdownMenuItem(text = { Text("Kembali") }, onClick = {
                                quickMenuExpanded = false
                                if (browser?.canGoBack() == true) browser?.goBack()
                                else toast("Sudah di halaman awal")
                            })
                            DropdownMenuItem(text = { Text("Beranda") }, onClick = {
                                quickMenuExpanded = false
                                navigate("landing")
                            })
                            DropdownMenuItem(text = { Text("Muat ulang") }, onClick = {
                                quickMenuExpanded = false
                                browser?.reload()
                            })
                            DropdownMenuItem(text = { Text("Simpan / cetak PDF") }, onClick = {
                                quickMenuExpanded = false
                                printCurrentPage()
                            })
                            DropdownMenuItem(text = { Text("Tema: ikut Samsung") }, onClick = {
                                quickMenuExpanded = false; changeTheme(ThemeMode.SYSTEM)
                            })
                            DropdownMenuItem(text = { Text("Tema: terang") }, onClick = {
                                quickMenuExpanded = false; changeTheme(ThemeMode.LIGHT)
                            })
                            DropdownMenuItem(text = { Text("Tema: gelap") }, onClick = {
                                quickMenuExpanded = false; changeTheme(ThemeMode.DARK)
                            })
                        }
                    }
                }
            }
        }
    }

    private fun changeTheme(mode: ThemeMode) {
        themeMode = mode
        ElKimiyaPrefs.saveTheme(this, mode)
        browser?.let { installThemeStartScript(it) }
        val isDark = resolveDark(this, mode)
        val view = browser ?: return
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        view.evaluateJavascript("(function(){localStorage.setItem('elk.dark','$isDark');location.reload();})();", null)
    }

    override fun onResume() {
        super.onResume()
        val latest = ElKimiyaPrefs.theme(this)
        if (themeMode != latest) changeTheme(latest)
    }

    private fun installThemeStartScript(view: WebView) {
        themeStartScript?.remove()
        themeStartScript = null
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            val dark = resolveDark(this, themeMode)
            themeStartScript = WebViewCompat.addDocumentStartJavaScript(
                view,
                "try{localStorage.setItem('elk.dark','$dark')}catch(e){}",
                setOf(WEB_ORIGIN)
            )
        }
    }

    private fun navigate(route: String) {
        val url = if (route == "landing") WEB_ROOT else "${WEB_ROOT}#$route"
        errorLoading = false
        browser?.loadUrl(url)
    }

    private fun originAllowed(uri: Uri?): Boolean = uri != null &&
        uri.scheme.equals("https", ignoreCase = true) && uri.host.equals(WEB_HOST, ignoreCase = true) &&
        (uri.port == -1 || uri.port == 443)

    @SuppressLint("SetJavaScriptEnabled")
    private fun newBrowser(): WebView = WebView(this).apply {
        browser = this
        setBackgroundColor(if (resolveDark(this@MainActivity, themeMode))
            android.graphics.Color.rgb(12, 30, 48) else android.graphics.Color.WHITE)
        settings.javaScriptEnabled = true
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
                busy = true
                errorLoading = false
            }
            override fun onPageFinished(view: WebView, url: String?) {
                busy = false
                if (originAllowed(Uri.parse(url ?: ""))) {
                    injectDownloadSupport(view)
                    if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                        val desired = resolveDark(this@MainActivity, themeMode)
                        view.evaluateJavascript("(function(){if(localStorage.getItem('elk.dark')!=='$desired'){localStorage.setItem('elk.dark','$desired');location.reload()}})();", null)
                    }
                }
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) { busy = false; errorLoading = true }
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
                    toast("Pemilih file tidak tersedia")
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
            if (!originAllowed(uri)) { toast("Unduhan eksternal dibuka di Chrome"); openExternally(uri); return@DownloadListener }
            val filename = safeFilename(URLUtil.guessFileName(url, contentDisposition, mimeType))
            try {
                val request = DownloadManager.Request(uri).apply {
                    setTitle(filename)
                    setMimeType(mimeType)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                }
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
                toast("Mengunduh $filename")
            } catch (e: Exception) { openExternally(uri) }
        })
        loadUrl(WEB_ROOT)
    }

    private fun safeFilename(value: String): String = value
        .replace(Regex("[^A-Za-z0-9._-]"), "_")
        .take(96).trim('.').ifBlank { "ElKimiya_Report.json" }

    private fun processWebMessage(raw: String) {
        try {
            val packet = JSONObject(raw)
            when (packet.optString("kind")) {
                "theme" -> {
                    val chosen = if (packet.optBoolean("dark")) ThemeMode.DARK else ThemeMode.LIGHT
                    if (themeMode != chosen) {
                        themeMode = chosen
                        ElKimiyaPrefs.saveTheme(this, chosen)
                        browser?.let { installThemeStartScript(it) }
                    }
                }
                "print" -> printCurrentPage()
                "download" -> {
                    val name = safeFilename(packet.optString("name", "ElKimiya_Report.json"))
                    val mime = packet.optString("mime").lowercase(Locale.ROOT)
                    if (!(mime.startsWith("text/") || mime.startsWith("application/json"))) return
                    val data = packet.optString("data")
                    val pos = data.indexOf(";base64,")
                    if (!data.startsWith("data:") || pos !in 5..80) return
                    val encoded = data.substring(pos + 8)
                    if (encoded.length > 2_800_000) return
                    val bytes = Base64.decode(encoded, Base64.DEFAULT)
                    if (bytes.size > MAX_BLOB_BYTES) { toast("File terlalu besar untuk ekspor aplikasi"); return }
                    reportFilename = name
                    reportBytes = bytes
                    saveReport.launch(name)
                }
            }
        } catch (_: Exception) { toast("Ekspor laporan tidak tersedia") }
    }

    private fun injectDownloadSupport(view: WebView) {
        // Captures programmatic <a download>.click() used by Research Mission.
        // Works only if origin-scoped WebMessageListener is supported by Android WebView.
        val code = """
            (function () {
              if (window.__elkAndroidReady) return;
              window.__elkAndroidReady = true;
              // The native AI pill replaces the duplicate React tutor FAB in APK only.
              // The published website and its 5-tab navigation are unchanged.
              var shellStyle = document.createElement('style');
              shellStyle.id = 'elkimiya-android-shell-v2';
              shellStyle.textContent = '.mobile-tutor-fab{display:none!important;}';
              (document.head || document.documentElement).appendChild(shellStyle);
              if (!window.ElKimiyaDownload || !window.ElKimiyaDownload.postMessage) return;
              // Sync explicit React theme toggles back to the native screen.
              var lastTheme = localStorage.getItem('elk.dark');
              document.addEventListener('click', function () {
                setTimeout(function () {
                  var currentTheme = localStorage.getItem('elk.dark');
                  if ((currentTheme === 'true' || currentTheme === 'false') && currentTheme !== lastTheme) {
                    lastTheme = currentTheme;
                    window.ElKimiyaDownload.postMessage(JSON.stringify({kind:'theme',dark:currentTheme==='true'}));
                  }
                }, 120);
              }, true);
              document.addEventListener('click', function (ev) {
                var target = ev.target;
                var a = target && target.closest ? target.closest('a[download]') : null;
                if (!a || !a.href || !a.href.startsWith('blob:')) return;
                ev.preventDefault(); ev.stopImmediatePropagation();
                fetch(a.href).then(function(r){return r.blob();}).then(function(blob){
                  if(blob.size > 2097152) { alert('Laporan melebihi batas 2 MB.'); return; }
                  var reader = new FileReader();
                  reader.onload = function () {
                    window.ElKimiyaDownload.postMessage(JSON.stringify({
                      kind:'download',name:a.getAttribute('download')||'ElKimiya_Report.json',
                      mime:blob.type||'text/plain',data:reader.result
                    }));
                  };
                  reader.readAsDataURL(blob);
                }).catch(function(){alert('Gagal menyiapkan laporan. Gunakan browser Chrome.');});
              }, true);
              window.print = function(){ window.ElKimiyaDownload.postMessage(JSON.stringify({kind:'print'})); };
            })();
        """.trimIndent()
        view.evaluateJavascript(code, null)
    }

    private fun printCurrentPage() {
        val view = browser ?: return
        if (!originAllowed(Uri.parse(view.url ?: ""))) return
        try {
            val manager = getSystemService(Context.PRINT_SERVICE) as PrintManager
            manager.print("ElKimiya_Report", view.createPrintDocumentAdapter("ElKimiya"), PrintAttributes.Builder().build())
        } catch (e: Exception) { toast("Cetak PDF gagal: ${e.localizedMessage}") }
    }

    private fun openExternally(uri: Uri) {
        if (uri.scheme != "https" && uri.scheme != "http" && uri.scheme != "mailto") return
        try { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
        catch (_: Exception) { toast("Tidak ada aplikasi untuk membuka tautan") }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    override fun onDestroy() {
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
