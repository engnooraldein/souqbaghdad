# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.NativePlugin public class * { public *; }
-keep @com.getcapacitor.CapacitorPlugin public class * { public *; }
-keep public class * extends com.getcapacitor.Plugin { public *; }
-keep public class * extends com.getcapacitor.BridgeActivity { public *; }

# Keeping JavaScript Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
