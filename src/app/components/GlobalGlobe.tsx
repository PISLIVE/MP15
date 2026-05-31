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

    const isDark = theme === 'dark';

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 800,
      height: 800,
      phi: 0,
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: isDark ? 2 : 1.2,
      baseColor: isDark ? [0.1, 0.1, 0.2] : [0.9, 0.9, 0.95],
      markerColor: [1, 0.2, 0.3], // Red markers for breaches
      glowColor: isDark ? [0.2, 0.2, 0.4] : [0.8, 0.8, 0.9],
      markers: markers,
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [theme, markers]);

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] rounded-2xl"></div>
      
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
