import React, { useMemo } from 'react';
import { ScanData } from '../types/scan';

interface GlobalGlobeProps {
  scanData: ScanData | null;
}

export function GlobalGlobe({ scanData }: GlobalGlobeProps) {
  const markers = useMemo(() => {
    if (!scanData) return [];
    
    const numMarkers = Math.min(
      (scanData.breachResults?.length || 0) + (scanData.socialResults?.filter(s => s.found).length || 0),
      12 // max blips
    );

    // Generate random positions within the radar circle (20% to 85% radius, 0 to 360 deg)
    return Array.from({ length: Math.max(1, numMarkers) }).map((_, i) => {
      const angle = Math.random() * 360;
      const radius = 20 + Math.random() * 65; 
      return { id: i, angle, radius };
    });
  }, [scanData]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group py-4 min-h-[300px]">
      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-sweep {
          animation: radar-spin 4s linear infinite;
          background: conic-gradient(from 0deg, transparent 70%, rgba(34, 197, 94, 0.1) 95%, rgba(34, 197, 94, 0.5) 100%);
        }
        .blip-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Legend overlay */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-sm text-xs max-w-[200px]">
          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5 shrink-0 animate-ping" />
            <p className="text-slate-700 dark:text-slate-300 leading-tight">
              <span className="font-semibold block mb-0.5 text-slate-900 dark:text-slate-100">Threat Radar</span>
              Detecting active signals from data centers hosting your footprint.
            </p>
          </div>
        </div>
      </div>

      {/* Radar Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-green-500/30 dark:border-green-400/20 bg-slate-50 dark:bg-slate-900/50 overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.05)] dark:shadow-[0_0_40px_rgba(34,197,94,0.1)]">
        
        {/* Concentric Grid Circles */}
        <div className="absolute inset-4 rounded-full border border-green-500/20" />
        <div className="absolute inset-12 rounded-full border border-green-500/20" />
        <div className="absolute inset-20 rounded-full border border-green-500/20" />
        
        {/* Crosshairs */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-green-500/20" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-green-500/20" />

        {/* Sweeping Radar Arm */}
        <div className="absolute inset-0 rounded-full radar-sweep origin-center" />

        {/* Threat Blips */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `rotate(${marker.angle}deg) translateY(-${marker.radius * 1.5}px)`, // using px approximation based on radius %
            }}
          >
            {/* Blip Dot */}
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,1)] absolute -ml-1.5 -mt-1.5" />
              <div className="w-3 h-3 bg-red-500 rounded-full absolute -ml-1.5 -mt-1.5 blip-pulse opacity-75" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
