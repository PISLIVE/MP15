import React, { useEffect, useRef, useMemo } from 'react';
import createGlobe from 'cobe';
import { ScanData } from '../types/scan';
import { useTheme } from 'next-themes';

interface GlobalGlobeProps {
  scanData: ScanData | null;
}

// Generate some random coordinates roughly corresponding to major data centers
const MOCK_DATACENTERS = [
  { location: [37.7749, -122.4194], size: 0.1 }, // SF
  { location: [40.7128, -74.0060], size: 0.1 }, // NY
  { location: [51.5074, -0.1278], size: 0.1 }, // London
  { location: [50.1109, 8.6821], size: 0.1 }, // Frankfurt
  { location: [1.3521, 103.8198], size: 0.1 }, // Singapore
  { location: [35.6762, 139.6503], size: 0.1 }, // Tokyo
  { location: [-33.8688, 151.2093], size: 0.1 }, // Sydney
];

export function GlobalGlobe({ scanData }: GlobalGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const markers = useMemo(() => {
    if (!scanData) return [];
    
    const numMarkers = Math.min(
      (scanData.breachResults?.length || 0) + (scanData.socialResults?.filter(s => s.found).length || 0),
      MOCK_DATACENTERS.length
    );

    // Pick a number of mock datacenters based on how much data was found
    return MOCK_DATACENTERS.slice(0, Math.max(1, numMarkers)).map(m => ({
      location: m.location as [number, number],
      size: m.size + (Math.random() * 0.05)
    }));
  }, [scanData]);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;

    let width = 0;
    let globe: any = null;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    const isDark = theme === 'dark';

    globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.2,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: isDark ? [0.3, 0.3, 0.3] : [1, 1, 1],
      markerColor: [1, 0.1, 0.2], // Bright Red markers for breaches
      glowColor: isDark ? [0.1, 0.1, 0.2] : [1, 1, 1],
      markers: markers.map(m => ({ location: m.location, size: 0.05 })),
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.005;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [theme, markers]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group">
      {/* Informational overlay to explain the globe */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-sm text-xs max-w-[200px]">
          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5 shrink-0 animate-pulse" />
            <p className="text-slate-700 dark:text-slate-300 leading-tight">
              <span className="font-semibold block mb-0.5 text-slate-900 dark:text-slate-100">Threat Vectors</span>
              Red markers simulate global data centers where your profiles or breached records are hosted.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] rounded-2xl"></div>
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div style={{ width: '100%', maxWidth: 600, aspectRatio: '1' }} className="relative z-0">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', contain: 'layout paint size' }}
        />
      </div>
    </div>
  );
}
