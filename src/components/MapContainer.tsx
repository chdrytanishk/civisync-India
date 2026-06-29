import { useEffect, useRef } from "react";
import L from "leaflet";
import { Issue, Neighborhood, LatLng } from "../types";

interface MapContainerProps {
  issues: Issue[];
  neighborhoods: Neighborhood[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  isSelectorMode?: boolean;
  selectorLocation?: LatLng | null;
  onLocationSelect?: (loc: LatLng) => void;
  center?: LatLng;
  zoom?: number;
}

export default function MapContainer({
  issues,
  neighborhoods,
  selectedIssue,
  onSelectIssue,
  isSelectorMode = false,
  selectorLocation = null,
  onLocationSelect,
  center = { lat: 12.9716, lng: 77.6400 }, // Default Bengaluru Indiranagar
  zoom = 13,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const selectorMarkerRef = useRef<L.Marker | null>(null);
  const polygonsRef = useRef<L.Polygon[]>([]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], zoom);
    
    mapRef.current = map;

    // Add zoom controls to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // High-quality dark CartoDB Dark Matter tiles for gorgeous dark map HUD
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);

    // Map Click Listener (for reporting mode)
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (isSelectorMode && onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Create ResizeObserver to auto-invalidate size and solve the classic Leaflet grey tiles bug
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Initial timeout for safe measures
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Fly to position when center changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo([center.lat, center.lng], mapRef.current.getZoom());
    }
  }, [center]);

  // 3. Render Selector Location Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (selectorMarkerRef.current) {
      mapRef.current.removeLayer(selectorMarkerRef.current);
      selectorMarkerRef.current = null;
    }    if (isSelectorMode && selectorLocation) {
      const pinIcon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; width: 32px; height: 32px; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #00ff87; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #00ff87; border: 3px solid #ffffff; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>
          </div>
        `,
        className: "selector-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([selectorLocation.lat, selectorLocation.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(mapRef.current);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        if (onLocationSelect) {
          onLocationSelect({ lat: position.lat, lng: position.lng });
        }
      });

      selectorMarkerRef.current = marker;
      mapRef.current.panTo([selectorLocation.lat, selectorLocation.lng]);
    }
  }, [isSelectorMode, selectorLocation]);

  // 4. Render Neighborhood Overlays (FixScore heat-maps)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old polygons
    polygonsRef.current.forEach((p) => map.removeLayer(p));
    polygonsRef.current = [];

    // Skip overlays when in selector mode to keep interface clean
    if (isSelectorMode) return;

    neighborhoods.forEach((nh) => {
      if (!nh.boundaries || nh.boundaries.length === 0) return;

      const pathPoints = nh.boundaries.map((b) => [b.lat, b.lng] as [number, number]);
      
      // Determine shade based on FixScore: 0-100 (closer to 100 = greener, 0 = redder)
      let color = "#ef4444"; // Red (poor)
      if (nh.fixScore >= 80) color = "#00ff87"; // Green (excellent)
      else if (nh.fixScore >= 65) color = "#10b981"; // Orange (good)
      else if (nh.fixScore >= 50) color = "#059669"; // Amber (moderate)

      const polygon = L.polygon(pathPoints, {
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.1,
        dashArray: "4, 4",
      }).addTo(map);

      // Simple tooltip show on hover
      polygon.bindTooltip(
        `<div class="font-display font-semibold text-emerald-50">${nh.name}</div>
         <div class="text-xs text-emerald-300 mt-0.5">FixScore: <span class="font-bold" style="color: ${color}">${nh.fixScore}/100</span></div>`,
        { sticky: true, opacity: 0.9 }
      );

      polygonsRef.current.push(polygon);
    });
  }, [neighborhoods, isSelectorMode]);

  // 5. Render Issue Pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Skip regular pins in selector mode to focus on setting location
    if (isSelectorMode) return;

    issues.forEach((issue) => {
      // Pin Status colors & severities
      let colorHex = "#ef4444"; // default open red
      
      if (issue.status === "Resolved") {
        colorHex = "#00ff87"; // success green
      } else if (issue.status === "In Progress") {
        colorHex = "#10b981"; // warning amber
      } else {
        // Open
        if (issue.severity === "Critical") colorHex = "#ef4444"; // deep red
        else if (issue.severity === "High") colorHex = "#f87171"; // normal red
        else if (issue.severity === "Medium") colorHex = "#fca5a5"; // soft red
        else colorHex = "#fee2e2"; // low severity light red
      }

      const icon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; width: 28px; height: 28px; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${colorHex}; opacity: 0.35; ${issue.status === "Open" ? "animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;" : ""}"></div>
            <div style="width: 11px; height: 11px; border-radius: 50%; background-color: ${colorHex}; border: 2px solid #ffffff; box-shadow: 0 0 5px rgba(0,0,0,0.6); transition: all 0.2s ease-in-out;" class="marker-dot"></div>
          </div>
        `,
        className: "custom-issue-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -10],
      });

      const marker = L.marker([issue.location.lat, issue.location.lng], { icon })
        .addTo(map)
        .on("click", () => {
          onSelectIssue(issue);
        });

      // Highlight selected marker
      if (selectedIssue && selectedIssue.id === issue.id) {
        map.panTo([issue.location.lat, issue.location.lng]);
      }

      markersRef.current.push(marker);
    });
  }, [issues, selectedIssue, isSelectorMode]);

  return (
    <div className="relative w-full h-full bg-[#020d08] rounded-xl overflow-hidden border border-[#0f3d2b]/60 shadow-2xl">
      <div id="map" ref={mapContainerRef} className="w-full h-full z-10" />
      {isSelectorMode && (
        <div className="absolute top-4 left-4 z-20 bg-[#02130c]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#0f3d2b]/65 text-xs shadow-md max-w-xs text-emerald-100 animate-fade-in">
          <p className="font-display font-bold text-[#00ff87] mb-1">📍 Select Issue Location</p>
          <p className="text-emerald-300 leading-relaxed font-normal">
            Click anywhere on the map or drag the green indicator to adjust the reported position precisely.
          </p>
        </div>
      )}
    </div>
  );
}
