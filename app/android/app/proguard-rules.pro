# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# 3.2.3 R8 켜기: 게임이 쓰는 Capacitor 플러그인과 다리는 이름을 바꾸거나 지우지 않아요(리플렉션으로 불려요)
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.admob.** { *; }
-keep class ee.forgr.capacitor.social.login.** { *; }
-keep class io.capawesome.capacitorjs.plugins.** { *; }
-keep class io.github.seopsci.forestschool.** { *; }
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
# 구글 로그인(Credential Manager)
-if class androidx.credentials.CredentialManager
-keep class androidx.credentials.playservices.** { *; }
-dontwarn com.google.errorprone.annotations.**
