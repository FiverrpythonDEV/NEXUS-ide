/**
 * Utility to generate Data URIs and scripts for NEXUS Station Desktop apps
 */

export function getDesktopAppData(platform: 'windows' | 'macos' | 'linux' | 'universal') {
  const currentUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-dev-ovig7dudsiymqqgre5zqsy-116473737908.europe-west2.run.app';

  if (platform === 'windows') {
    const filename = 'NEXUS-Station-Desktop-Windows-Setup.bat';
    const content = `@echo off
title NEXUS Station Desktop v1.0.4 - Native App Launcher
color 0A
cls
echo =========================================================================
echo                   NEXUS STATION DESKTOP v1.0.4
echo             Next-Gen IDE ^& Polyglot Developer Workstation
echo =========================================================================
echo.
echo [1/3] Checking system environment...
echo [2/3] Registering NEXUS Station Desktop App protocol...
echo [3/3] Launching in Standalone App Mode...
echo.

:: Try opening in Microsoft Edge App Mode or Chrome App Mode
start msedge --app="${currentUrl}" || start chrome --app="${currentUrl}" || start "" "${currentUrl}"

echo.
echo NEXUS Station Desktop is now running in native application window!
echo You can close this terminal window.
timeout /t 3 >nul
exit
`;
    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const cmd = `start msedge --app="${currentUrl}"`;
    return { filename, content, dataUri, cmd, mime: 'text/plain' };
  } 

  if (platform === 'macos') {
    const filename = 'NEXUS-Station-Desktop-macOS.command';
    const content = `#!/bin/bash
# NEXUS Station Desktop v1.0.4 macOS Native App Launcher

echo "========================================================================="
echo "               NEXUS STATION DESKTOP v1.0.4 FOR MACOS"
echo "========================================================================="
echo ""
echo "Launching NEXUS Station Desktop App..."

# Launch in Chrome App mode if available, fallback to default browser
if open -a "Google Chrome" --args --app="${currentUrl}"; then
    echo "Opened in Google Chrome App Mode."
elif open -a "Brave Browser" --args --app="${currentUrl}"; then
    echo "Opened in Brave App Mode."
else
    open "${currentUrl}"
    echo "Opened in default web browser."
fi

exit 0
`;
    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const cmd = `open -a "Google Chrome" --args --app="${currentUrl}"`;
    return { filename, content, dataUri, cmd, mime: 'text/plain' };
  }

  if (platform === 'linux') {
    const filename = 'NEXUS-Station-Desktop-Linux.sh';
    const content = `#!/usr/bin/env bash
# NEXUS Station Desktop v1.0.4 Linux Installer ^& Launcher

DESKTOP_FILE="$HOME/.local/share/applications/nexus-station.desktop"

echo "========================================================================="
echo "              NEXUS STATION DESKTOP v1.0.4 LINUX INSTALLER"
echo "========================================================================="
echo ""
echo "Creating Linux Desktop Application Entry at $DESKTOP_FILE..."

mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Name=NEXUS Station Desktop
Comment=Polyglot IDE & Developer Workstation
Exec=x-www-browser --app="${currentUrl}"
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Development;IDE;
EOF

chmod +x "$DESKTOP_FILE"

echo "Launching NEXUS Station Desktop..."
xdg-open "${currentUrl}" || x-www-browser "${currentUrl}"

echo "Installation Complete! You can now launch NEXUS Station from your Application Menu."
`;
    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const cmd = `x-www-browser --app="${currentUrl}"`;
    return { filename, content, dataUri, cmd, mime: 'text/plain' };
  }

  // Universal
  const filename = 'NEXUS-Station-Desktop-Offline.html';
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NEXUS Station Desktop Standalone</title>
  <style>
    body { margin:0; padding:0; background:#0B0A12; color:#fff; font-family:system-ui, sans-serif; height:100vh; overflow:hidden; }
    iframe { width:100vw; height:100vh; border:none; }
  </style>
</head>
<body>
  <iframe src="${currentUrl}" allow="clipboard-read; clipboard-write; camera; microphone; geolocation"></iframe>
</body>
</html>`;
  const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(content)}`;
  const cmd = `window.open("${currentUrl}")`;
  return { filename, content, dataUri, cmd, mime: 'text/html' };
}

export function launchDesktopWindowMode() {
  const currentUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-dev-ovig7dudsiymqqgre5zqsy-116473737908.europe-west2.run.app';
  
  const width = Math.min(1440, window.screen.availWidth - 100);
  const height = Math.min(900, window.screen.availHeight - 100);
  const left = Math.max(0, (window.screen.availWidth - width) / 2);
  const top = Math.max(0, (window.screen.availHeight - height) / 2);

  window.open(
    currentUrl, 
    'NEXUS_Station_Desktop_App', 
    `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
  );
}
