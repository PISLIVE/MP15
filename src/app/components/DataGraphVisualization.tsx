import React, { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { ScanData } from "../types/scan";
import { Card } from "./ui/card";
import { Share2, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

interface DataGraphVisualizationProps {
  scanData: ScanData | null;
}

export function DataGraphVisualization({ scanData }: DataGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();
  const { theme } = useTheme();
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    if (!scanData) return { nodes: [], links: [] };

    const nodes: any[] = [];
    const links: any[] = [];

    const rootId = scanData.input.email || scanData.input.username || scanData.input.name || "Target";
    
    // Root Node
    nodes.push({
      id: rootId,
      name: rootId,
      group: "root",
      val: 25,
      color: theme === "dark" ? "#818cf8" : "#4f46e5" // Indigo
    });

    // Social Nodes
    if (scanData.socialResults && scanData.socialResults.length > 0) {
      const socialGroupNodeId = "social_profiles";
      nodes.push({ id: socialGroupNodeId, name: "Social Profiles", group: "category", val: 15, color: "#0ea5e9" });
      links.push({ source: rootId, target: socialGroupNodeId });

      scanData.socialResults.forEach((social, i) => {
        if (!social.found) return;
        const id = `social_${social.platform}_${i}`;
        nodes.push({
          id,
          name: social.platform,
          group: "social",
          val: 10,
          color: "#38bdf8"
        });
        links.push({ source: socialGroupNodeId, target: id });
      });
    }

    // Breach Nodes
    if (scanData.breachResults && scanData.breachResults.length > 0) {
      const breachGroupNodeId = "data_breaches";
      nodes.push({ id: breachGroupNodeId, name: "Data Breaches", group: "category", val: 15, color: "#f43f5e" });
      links.push({ source: rootId, target: breachGroupNodeId });

      scanData.breachResults.forEach((breach, i) => {
        const id = `breach_${breach.name || breach.platform || i}`;
        nodes.push({
          id,
          name: breach.name || breach.platform || "Unknown Breach",
          group: "breach",
          val: 12,
          color: "#fb7185"
        });
        links.push({ source: breachGroupNodeId, target: id });
      });
    }

    // Mention Nodes
    if (scanData.googleResults && scanData.googleResults.length > 0) {
      const searchGroupNodeId = "search_mentions";
      nodes.push({ id: searchGroupNodeId, name: "Public Mentions", group: "category", val: 15, color: "#10b981" });
      links.push({ source: rootId, target: searchGroupNodeId });

      scanData.googleResults.slice(0, 15).forEach((mention, i) => { // limit to 15 to avoid clutter
        const id = `mention_${i}`;
        nodes.push({
          id,
          name: (mention.title || "Mention").substring(0, 20) + "...",
          group: "mention",
          val: 8,
          color: "#34d399"
        });
        links.push({ source: searchGroupNodeId, target: id });
      });
    }

    return { nodes, links };
  }, [scanData, theme]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.2, 400);
    }
  };

  const handleFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  };

  if (!scanData) {
    return <div className="text-center p-8 text-slate-500">No data to visualize. Please run a scan.</div>;
  }

  return (
    <Card className="relative overflow-hidden bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-slate-200/50 dark:border-slate-800/50">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-blue-500" />
          Exposure Graph
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
          Interactive map of your digital footprint. Scroll to zoom, drag nodes to explore connections.
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl h-8 w-8 text-slate-700 dark:text-slate-200">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl h-8 w-8 text-slate-700 dark:text-slate-200">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleFit} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl h-8 w-8 text-slate-700 dark:text-slate-200">
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      <div ref={containerRef} className="w-full h-[600px] cursor-move bg-slate-50/30 dark:bg-slate-900/20">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          nodeRelSize={1}
          linkColor={() => theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
          linkWidth={1.5}
          onNodeClick={(node: any) => {
            if (fgRef.current) {
              fgRef.current.centerAt(node.x, node.y, 1000);
              fgRef.current.zoom(8, 2000);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = Math.max(12 / globalScale, 4);
            ctx.font = `${fontSize}px Inter, sans-serif`;
            
            const r = Math.sqrt(Math.max(0, node.val || 1)) * 1.5;
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Draw text
            if (globalScale > 0.8 || node.group === "root" || node.group === "category") {
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 
              
              ctx.fillStyle = theme === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + r + 2, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = theme === "dark" ? "#e2e8f0" : "#1e293b";
              ctx.fillText(label, node.x, node.y + r + 2 + bckgDimensions[1] / 2);
            }
          }}
        />
      </div>
    </Card>
  );
}
