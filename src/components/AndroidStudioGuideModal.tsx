import React, { useState } from 'react';
import { 
  Smartphone, 
  Copy, 
  Check, 
  Code2, 
  Download, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCode2,
  FolderTree
} from 'lucide-react';

export const AndroidStudioGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kotlin' | 'manifest' | 'layout' | 'themes' | 'steps'>('steps');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const codeMainActivity = `package com.mtk.delegasi

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        // Target URL Resmi Delegasi MTK
        private const val TARGET_URL = "https://mtk-input-delegasi.vercel.app"
        private const val FILE_CHOOSER_REQUEST_CODE = 1001
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        // 1. Pengaturan WebView Murni (Mandiri, 100% TIDAK BUTUH GOOGLE CHROME)
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true // Wajib untuk sinkronisasi data lokal & Firestore
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Hardware acceleration untuk grafis halus
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // 2. WebViewClient Murni: Mengunci semua tautan agar TIDAK MELEMPAR KE CHROME
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                
                // Jika tautan WhatsApp atau Telepon/Email, panggil aplikasi bawaan
                if (url.startsWith("whatsapp:") || url.startsWith("intent:") || url.startsWith("tel:") || url.startsWith("mailto:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    return true
                }

                // Semua tautan web dibuka langsung di dalam aplikasi ini (Bukan di browser Chrome)
                view?.loadUrl(url)
                return false
            }

            // KUNCI PENTING ANTI-BLANK: Mengatasi layar putih di HP lama / HP tanpa Google Services
            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                handler?.proceed() // Lanjutkan muat halaman tanpa crash
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                progressBar.visibility = View.GONE
            }
        }

        // 3. WebChromeClient: Penanganan Upload Nota Kamera / File
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE)
                } catch (e: Exception) {
                    fileChooserCallback = null
                    return false
                }
                return true
            }
        }

        // 4. Tangani Tombol Back Fisik HP agar tidak langsung menutup aplikasi
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // 5. Muat Aplikasi
        if (savedInstanceState == null) {
            webView.loadUrl(TARGET_URL)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (fileChooserCallback == null) return
            val results: Array<Uri>? = if (resultCode == RESULT_OK && data != null) {
                data.data?.let { arrayOf(it) } ?: data.clipData?.let { clipData ->
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                }
            } else null
            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }
}`;

  const codeManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mtk.delegasi">

    <!-- Izin Akses Jaringan & Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Izin Akses Galeri & Kamera untuk Upload Nota Pengeluaran -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Delegasi MTK"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.DelegasiMTK.NoActionBar">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;

  const codeLayout = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#ffffff">

    <!-- WebView Murni Tanpa Bilah URL -->
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Indikator Loading awal saat aplikasi dibuka -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:indeterminateTint="#1e40af"
        android:visibility="visible" />

</RelativeLayout>`;

  const codeThemes = `<resources xmlns:tools="http://schemas.android.com/tools">
    <!-- Hilangkan Title Bar / Action Bar Secara Permanen -->
    <style name="Theme.DelegasiMTK.NoActionBar" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:statusBarColor">#1e40af</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>`;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 p-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Source Code & Panduan Android Studio (APK Murni)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  No Chrome Tab
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi Native WebView agar APK 100% fullscreen tanpa bilah URL atau tombol keluar ke browser.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-100/80 border-b border-slate-200 overflow-x-auto shrink-0 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'steps' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Langkah Praktis (1 Menit)</span>
          </button>

          <button
            onClick={() => setActiveTab('kotlin')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'kotlin' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:bg-white/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>MainActivity.kt</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'manifest' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:bg-white/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>AndroidManifest.xml</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'layout' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>activity_main.xml</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'themes' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:bg-white/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>themes.xml</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-bold text-amber-900 text-sm">Kenapa Sebelumnya Tidak Bisa Dibuka di HP Tanpa Chrome?</p>
                  <p className="text-amber-800 leading-relaxed">
                    Generator APK lama membuat aplikasi bertipe <strong>TWA (Trusted Web Activity)</strong> yang secara paksa memanggil paket <code>com.android.chrome</code>. Jika HP tidak memiliki Google Chrome, aplikasi langsung mental.
                  </p>
                  <p className="text-amber-800 leading-relaxed pt-1">
                    Kode di tab <strong>MainActivity.kt</strong> ini menggunakan <strong>Native WebView Mandiri</strong> yang berjalan menggunakan mesin internal Android apa pun (Xiaomi, Oppo, Vivo, Samsung, Huawei) <strong>100% tanpa membutuhkan Google Chrome</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-800">Buat Project Android Studio</h4>
                  <p className="text-slate-600">
                    Buka Android Studio &gt; <strong>New Project</strong> &gt; pilih <strong>Empty Views Activity</strong>. Atur Bahasa ke <strong>Kotlin</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-800">Salin File XML & Kotlin</h4>
                  <p className="text-slate-600">
                    Salin <strong>MainActivity.kt</strong>, <strong>AndroidManifest.xml</strong>, <strong>activity_main.xml</strong>, dan <strong>themes.xml</strong> dari tab di atas ke project Anda.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center">3</span>
                  <h4 className="font-bold text-slate-800">Pasang Logo Aplikasi</h4>
                  <p className="text-slate-600">
                    Klik kanan folder <code>app/res</code> &gt; <strong>New</strong> &gt; <strong>Image Asset</strong> &gt; pilih gambar <code>public/icon-512.png</code> MTK untuk ikon aplikasi.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center">4</span>
                  <h4 className="font-bold text-slate-800">Build APK Langsung</h4>
                  <p className="text-slate-600">
                    Klik menu atas: <strong>Build</strong> &gt; <strong>Build Bundle(s) / APK(s)</strong> &gt; <strong>Build APK(s)</strong>. File APK siap dibagikan ke seluruh pengurus!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KOTLIN */}
          {activeTab === 'kotlin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  app/src/main/java/com/mtk/delegasi/MainActivity.kt
                </span>
                <button
                  onClick={() => copyToClipboard(codeMainActivity, 'kotlin')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'kotlin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'kotlin' ? 'Tersalin!' : 'Salin Kode Kotlin'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96 border border-slate-800">
                <code>{codeMainActivity}</code>
              </pre>
            </div>
          )}

          {/* TAB 3: MANIFEST */}
          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  app/src/main/AndroidManifest.xml
                </span>
                <button
                  onClick={() => copyToClipboard(codeManifest, 'manifest')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'manifest' ? 'Tersalin!' : 'Salin XML Manifest'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96 border border-slate-800">
                <code>{codeManifest}</code>
              </pre>
            </div>
          )}

          {/* TAB 4: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  app/src/main/res/layout/activity_main.xml
                </span>
                <button
                  onClick={() => copyToClipboard(codeLayout, 'layout')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'layout' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'layout' ? 'Tersalin!' : 'Salin Layout XML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96 border border-slate-800">
                <code>{codeLayout}</code>
              </pre>
            </div>
          )}

          {/* TAB 5: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  app/src/main/res/values/themes.xml
                </span>
                <button
                  onClick={() => copyToClipboard(codeThemes, 'themes')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'themes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'themes' ? 'Tersalin!' : 'Salin Theme XML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96 border border-slate-800">
                <code>{codeThemes}</code>
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            Target URL: <code className="font-mono text-indigo-700 font-bold">https://mtk-input-delegasi.vercel.app</code>
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
