import { useState, useEffect } from 'react';

export interface DeviceInfo {
  browser: string | null;
  os: string | null;
  platform: string | null;
  cores: number | null;
  memory: number | null;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  } | null;
  battery: {
    level: number;
    charging: boolean;
  } | null;
  network: {
    effectiveType: string | null;
    downlink: number | null;
  } | null;
  gpu: string | null;
  language: string | null;
  online: boolean;
}

function parseUserAgent() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let platform = navigator.platform || null;

  // OS detection
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('X11') !== -1) os = 'UNIX';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  // Browser detection
  if (ua.indexOf('Firefox') !== -1) {
    const match = ua.match(/Firefox\/([0-9.]+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (ua.indexOf('SamsungBrowser') !== -1) {
    const match = ua.match(/SamsungBrowser\/([0-9.]+)/);
    browser = match ? `Samsung Browser ${match[1]}` : 'Samsung';
  } else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) {
    const match = ua.match(/(?:Opera|OPR)\/([0-9.]+)/);
    browser = match ? `Opera ${match[1]}` : 'Opera';
  } else if (ua.indexOf('Trident') !== -1) {
    browser = 'Internet Explorer';
  } else if (ua.indexOf('Edge') !== -1 || ua.indexOf('Edg') !== -1) {
    const match = ua.match(/(?:Edge|Edg)\/([0-9.]+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (ua.indexOf('Chrome') !== -1) {
    const match = ua.match(/Chrome\/([0-9.]+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (ua.indexOf('Safari') !== -1) {
    const match = ua.match(/Version\/([0-9.]+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  }

  // userAgentData fallback / enhancement
  const uad = (navigator as any).userAgentData;
  if (uad) {
    if (uad.platform) {
      platform = uad.platform;
    }
    if (uad.brands && uad.brands.length > 0) {
      const activeBrand = uad.brands.find((b: any) => b.brand !== 'Not A(Brand');
      if (activeBrand) {
        browser = `${activeBrand.brand} ${activeBrand.version}`;
      }
    }
  }

  return { browser, os, platform };
}

function getGPUInfo(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbgRenderInfo) return null;
    const gpu = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
    return gpu || null;
  } catch (e) {
    return null;
  }
}

export function useDeviceInfo() {
  const [isAllowed, setIsAllowed] = useState(() => localStorage.getItem('nexus_device_diagnostics_allowed') === 'true');

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (!isAllowed) {
      return {
        browser: null,
        os: null,
        platform: null,
        cores: null,
        memory: null,
        screen: null,
        battery: null,
        network: null,
        gpu: null,
        language: null,
        online: navigator.onLine,
      };
    }
    const { browser, os, platform } = parseUserAgent();
    return {
      browser,
      os,
      platform,
      cores: navigator.hardwareConcurrency || null,
      memory: (navigator as any).deviceMemory || null,
      screen: window.screen ? {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
      } : null,
      battery: null,
      network: null,
      gpu: getGPUInfo(),
      language: navigator.language || null,
      online: navigator.onLine,
    };
  });

  const allowDiagnostics = () => {
    localStorage.setItem('nexus_device_diagnostics_allowed', 'true');
    setIsAllowed(true);
  };

  useEffect(() => {
    if (!isAllowed) return;

    // Trigger initial load when allowed
    const { browser, os, platform } = parseUserAgent();
    setDeviceInfo(prev => ({
      ...prev,
      browser,
      os,
      platform,
      cores: navigator.hardwareConcurrency || null,
      memory: (navigator as any).deviceMemory || null,
      screen: window.screen ? {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
      } : null,
      gpu: getGPUInfo(),
      language: navigator.language || null,
      online: navigator.onLine,
    }));

    // 1. Online / Offline state
    const handleOnline = () => setDeviceInfo(prev => ({ ...prev, online: true }));
    const handleOffline = () => setDeviceInfo(prev => ({ ...prev, online: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Battery status API
    let batteryInstance: any = null;
    const updateBatteryInfo = (bat: any) => {
      setDeviceInfo(prev => ({
        ...prev,
        battery: {
          level: Math.round(bat.level * 100),
          charging: bat.charging
        }
      }));
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        batteryInstance = bat;
        updateBatteryInfo(bat);
        bat.addEventListener('levelchange', () => updateBatteryInfo(bat));
        bat.addEventListener('chargingchange', () => updateBatteryInfo(bat));
      }).catch(() => {
        // Safe fail
      });
    }

    // 3. Network connection status
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const updateNetworkInfo = () => {
      if (conn) {
        setDeviceInfo(prev => ({
          ...prev,
          network: {
            effectiveType: conn.effectiveType || null,
            downlink: conn.downlink || null
          }
        }));
      }
    };

    if (conn) {
      updateNetworkInfo();
      conn.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => updateBatteryInfo(batteryInstance));
        batteryInstance.removeEventListener('chargingchange', () => updateBatteryInfo(batteryInstance));
      }
      if (conn) {
        conn.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [isAllowed]);

  return {
    ...deviceInfo,
    isAllowed,
    allowDiagnostics,
  };
}
