import React, { useMemo } from 'react';
import { ScanData } from '../types/scan';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useTheme } from 'next-themes';

interface GlobalGlobeProps {
  scanData: ScanData | null;
}

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Standard datacenters, coordinates in [Longitude, Latitude] for standard mapping
const MOCK_DATACENTERS = [
  { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
  { name: "New York", coordinates: [-74.0060, 40.7128] },
  { name: "London", coordinates: [-0.1278, 51.5074] },
  { name: "Frankfurt", coordinates: [8.6821, 50.1109] },
  { name: "Singapore", coordinates: [103.8198, 1.3521] },
  { name: "Tokyo", coordinates: [139.6503, 35.6762] },
  { name: "Sydney", coordinates: [151.2093, -33.8688] },
];

export function GlobalGlobe({ scanData }: GlobalGlobeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const markers = useMemo(() => {
    if (!scanData) return [];
    
    const numMarkers = Math.min(
      (scanData.breachResults?.length || 0) + (scanData.socialResults?.filter(s => s.found).length || 0),
      MOCK_DATACENTERS.length
    );

    return MOCK_DATACENTERS.slice(0, Math.max(1, numMarkers)).map((m, i) => ({
      id: i,
      ...m
    }));
  }, [scanData]);

  const mapColor = isDark ? "#1E293B" : "#F1F5F9"; // slate-800 / slate-100
  const strokeColor = isDark ? "#334155" : "#E2E8F0"; // slate-700 / slate-200

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group py-4 min-h-[300px]">
      {/* Legend overlay */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-sm text-xs max-w-[200px]">
          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5 shrink-0" />
            <p className="text-slate-700 dark:text-slate-300 leading-tight">
              <span className="font-semibold block mb-0.5 text-slate-900 dark:text-slate-100">Global Threat Vectors</span>
              Detected infrastructure nodes containing footprint traces.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-full max-w-2xl px-2 sm:px-4 flex items-center justify-center">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 100, center: [0, 30] }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={mapColor}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: isDark ? "#334155" : "#E2E8F0" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          
          {markers.map(({ id, name, coordinates }) => (
            <Marker key={id} coordinates={coordinates as [number, number]}>
              {/* Outer pulsing ring */}
              <circle r={6} fill="#EF4444" className="animate-pulse opacity-40" />
              {/* Inner dot */}
              <circle r={3} fill="#EF4444" />
              {/* City Name Label */}
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: "inherit",
                  fill: isDark ? "#94A3B8" : "#64748B", // slate-400 / slate-500
                  fontSize: '9px',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}
              >
                {name}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
}
