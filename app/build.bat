@echo off
setlocal
rem Forest School 3.3.1 Android AAB build (upload key signing)
cd /d "%~dp0"

set "JAVA_HOME="
for /d %%D in ("C:\Program Files\Microsoft\jdk-21*") do set "JAVA_HOME=%%D"
if not defined JAVA_HOME for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do set "JAVA_HOME=%%D"
if not defined JAVA_HOME (
  echo [ERROR] JDK 21 not found. Install Microsoft Build of OpenJDK 21.
  pause
  exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME=%JAVA_HOME%

if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%" (
  echo [ERROR] Android SDK not found: %ANDROID_HOME%
  pause
  exit /b 1
)
set "SDKDIR=%ANDROID_HOME:\=\\%"
> android\local.properties echo sdk.dir=%SDKDIR%

set "VERSION_CODE="
set /p "VERSION_CODE=versionCode (Enter = 103): "
if not defined VERSION_CODE set "VERSION_CODE=103"

set "ANDROID_KEYSTORE_PATH="
set /p "ANDROID_KEYSTORE_PATH=Upload key .jks file path (drag the file here): "
if not defined ANDROID_KEYSTORE_PATH goto nokey
set "ANDROID_KEYSTORE_PATH=%ANDROID_KEYSTORE_PATH:"=%"
if not exist "%ANDROID_KEYSTORE_PATH%" goto nokey

for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p = Read-Host 'Upload key password' -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "ANDROID_KEYSTORE_PASSWORD=%%P"
if not defined ANDROID_KEYSTORE_PASSWORD (
  echo [ERROR] No password.
  pause
  exit /b 1
)

cd android
call gradlew.bat --no-daemon bundleRelease
if errorlevel 1 (
  echo [ERROR] Build failed. Send the red lines above to Claude.
  cd ..
  pause
  exit /b 1
)
cd ..
copy /y "android\app\build\outputs\bundle\release\app-release.aab" "forest-school-3.3.1-vc%VERSION_CODE%.aab" >nul
echo.
echo DONE: forest-school-3.3.1-vc%VERSION_CODE%.aab
echo Upload this file to Google Play Console.
pause
exit /b 0

:nokey
echo [ERROR] Upload key file not found.
pause
exit /b 1
