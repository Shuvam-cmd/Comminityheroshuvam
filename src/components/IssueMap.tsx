import React, { useState } from "react";
import { IIssue } from "../types";
import { MapPin, ZoomIn, ZoomOut, Compass, Search } from "lucide-react";

interface IssueMapProps {
  issues: IIssue[];
  selectedIssue: IIssue | null;
  onSelectIssue: (issue: IIssue) => void;
  onPlacePin: (lat: number, lng: number) => void;
  newPinCoordinates: { latitude: number; longitude: number } | null;
}

export default function IssueMap({
  issues,
  selectedIssue,
  onSelectIssue,
  onPlacePin,
  newPinCoordinates
}: IssueMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  // Grid coordinates mapping to visual space
  // Base map bounds simulating Green Valley District:
  // Lat: 37.7500 to 37.8000
  // Lng: -122.4500 to -122.3800
  const latMin = 37.7500;
  const latMax = 37.8000;
  const lngMin = -122.4500;
  const lngMax = -122.3800;

  const mapWidth = 800;
  const mapHeight = 550;

  // Transform coordinates to SVG pixels
  const getXY = (lat: number, lng: number) => {
    // Latitude decreases as we go down the screen
    const x = ((lng - lngMin) / (lngMax - lngMin)) * mapWidth;
    const y = mapHeight - ((lat - latMin) / (latMax - latMin)) * mapHeight;
    return { x, y };
  };

  // Transform SVG pixels back to coordinates
  const getLatLng = (x: number, y: number) => {
    const lng = (x / mapWidth) * (lngMax - lngMin) + lngMin;
    const lat = ((mapHeight - y) / mapHeight) * (latMax - latMin) + latMin;
    return {
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Adjust click based on zoom and pan offset
    const adjustedX = (clickX - rect.width / 2 - panOffset.x) / zoomLevel + mapWidth / 2;
    const adjustedY = (clickY - rect.height / 2 - panOffset.y) / zoomLevel + mapHeight / 2;

    if (adjustedX >= 0 && adjustedX <= mapWidth && adjustedY >= 0 && adjustedY <= mapHeight) {
      const coords = getLatLng(adjustedX, adjustedY);
      onPlacePin(coords.latitude, coords.longitude);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "circle" || (e.target as HTMLElement).closest(".marker-btn")) {
      return; // Don't pan if clicking marker
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const zoomIn = () => setZoomLevel((z) => Math.min(z + 0.2, 3));
  const zoomOut = () => setZoomLevel((z) => Math.max(z - 0.2, 0.6));
  const resetMap = () => {
    setZoomLevel(1.2);
    setPanOffset({ x: 0, y: 0 });
  };

  // Get status marker colors based on Natural Tones
  const getMarkerColor = (status: "Pending" | "In Progress" | "Resolved", priority: string) => {
    if (status === "Resolved") return "#10B981"; // Success (Resolved)
    if (status === "In Progress") return "#3B82F6"; // Info (In Progress)
    if (status === "Pending") return "#F59E0B"; // Pending / Accent
    if (priority === "Urgent" || priority === "High") return "#EF4444"; // Urgent/High error-like color
    return "#6B7280"; // Secondary text color
  };

  return (
    <div className="relative w-full h-full bg-[#F8FAFC] rounded-2xl overflow-hidden shadow-inner border border-natural-border flex flex-col">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 w-72 max-w-full">
        <div className="bg-white rounded-xl shadow-md border border-natural-border flex items-center px-3 py-2 w-full">
          <Search className="w-4 h-4 text-natural-primary mr-2" />
          <input
            type="text"
            placeholder="Search neighborhood or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-transparent outline-none w-full text-natural-text placeholder-natural-light/80 font-medium"
          />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-md border border-natural-border p-1 flex flex-col">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-natural-bg text-natural-primary transition-colors rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-natural-border my-1 mx-2" />
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-natural-bg text-natural-primary transition-colors rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={resetMap}
          className="bg-white p-2.5 rounded-xl shadow-md border border-natural-border hover:bg-natural-bg text-natural-primary transition-colors flex items-center justify-center"
          title="Reset View"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Instructions Banner */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-xs px-4 py-2 rounded-xl shadow-md border border-natural-border max-w-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-natural-primary mb-0.5">
          Interactive Map
        </p>
        <p className="text-[11px] text-natural-text leading-tight">
          Click anywhere on the map to pin a new local issue, or select a marker to view community comments.
        </p>
      </div>

      {/* SVG Vector Map Container */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          onClick={handleMapClick}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out"
          }}
          className="select-none"
        >
          {/* Water Bodies (Green Valley Lake / River) */}
          <rect width={mapWidth} height={mapHeight} fill="#F8FAFC" />
          <path
            d="M -50 150 Q 200 120 400 250 T 850 400 L 850 480 L -50 480 Z"
            fill="#E8F5E9"
            opacity="0.6"
          />
          <circle cx="680" cy="180" r="70" fill="#E8F5E9" opacity="0.6" />

          {/* Parks & Forest Reserves */}
          <rect x="50" y="50" width="160" height="120" rx="20" fill="#D1FAE5" opacity="0.5" />
          <rect x="500" y="60" width="120" height="90" rx="15" fill="#D1FAE5" opacity="0.5" />
          <rect x="180" y="320" width="140" height="150" rx="25" fill="#D1FAE5" opacity="0.5" />

          {/* Road Networks / Grid layout */}
          <line x1="0" y1="110" x2={mapWidth} y2="110" stroke="#E2E8F0" strokeWidth="12" />
          <line x1="0" y1="280" x2={mapWidth} y2="280" stroke="#E2E8F0" strokeWidth="16" />
          <line x1="0" y1="440" x2={mapWidth} y2="440" stroke="#E2E8F0" strokeWidth="10" />

          <line x1="120" y1="0" x2="120" y2={mapHeight} stroke="#E2E8F0" strokeWidth="14" />
          <line x1="380" y1="0" x2="380" y2={mapHeight} stroke="#E2E8F0" strokeWidth="18" />
          <line x1="640" y1="0" x2="640" y2={mapHeight} stroke="#E2E8F0" strokeWidth="12" />

          {/* Neighborhood Labels */}
          <text x="70" y="40" fill="#6B7280" fontSize="10" fontWeight="bold" letterSpacing="1">
            FOREST RIDGE
          </text>
          <text x="250" y="100" fill="#6B7280" fontSize="10" fontWeight="bold" letterSpacing="1">
            NORTH COMMONS
          </text>
          <text x="500" y="40" fill="#6B7280" fontSize="10" fontWeight="bold" letterSpacing="1">
            RIVERFRONT
          </text>
          <text x="440" y="380" fill="#6B7280" fontSize="10" fontWeight="bold" letterSpacing="1">
            VALLEY HEIGHTS
          </text>

          {/* Placed Pin for New Report */}
          {newPinCoordinates && (
            (() => {
              const { x, y } = getXY(newPinCoordinates.latitude, newPinCoordinates.longitude);
              return (
                <g className="animate-bounce">
                  <circle cx={x} cy={y} r="18" fill="#2E7D32" opacity="0.2" />
                  <circle cx={x} cy={y} r="6" fill="#2E7D32" stroke="white" strokeWidth="2" />
                  <path
                    d={`M ${x} ${y} L ${x} ${y - 12}`}
                    stroke="#2E7D32"
                    strokeWidth="2"
                  />
                  <circle cx={x} cy={y - 12} r="4" fill="#2E7D32" />
                </g>
              );
            })()
          )}

          {/* Existing Issue Pins */}
          {issues
            .filter((issue) => {
              if (!searchQuery) return true;
              return (
                issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.description.toLowerCase().includes(searchQuery.toLowerCase())
              );
            })
            .map((issue) => {
              const { x, y } = getXY(issue.latitude, issue.longitude);
              const isSelected = selectedIssue && selectedIssue.id === issue.id;
              const markerColor = getMarkerColor(issue.status, issue.priority);

              return (
                <g
                  key={issue.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIssue(issue);
                  }}
                  className="cursor-pointer marker-btn group"
                >
                  {/* Glowing selection ring */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="22" fill="none" stroke="#2E7D32" strokeWidth="2" className="animate-pulse" />
                  )}

                  {/* Pin Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? "11" : "8"}
                    fill={markerColor}
                    stroke="white"
                    strokeWidth="2.5"
                    className="shadow-md transition-all duration-150 group-hover:scale-125"
                  />

                  {/* Active priority badge or indicator inner dot */}
                  <circle cx={x} cy={y} r={isSelected ? "4" : "3"} fill="white" />

                  {/* Tooltip on hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <rect
                      x={x - 85}
                      y={y - 50}
                      width="170"
                      height="38"
                      rx="8"
                      fill="white"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                    <text x={x} y={y - 36} textAnchor="middle" fill="#1F2937" fontSize="10" fontWeight="bold">
                      {issue.title.length > 25 ? `${issue.title.substring(0, 22)}...` : issue.title}
                    </text>
                    <text x={x} y={y - 22} textAnchor="middle" fill={markerColor} fontSize="8" fontWeight="bold">
                      {issue.status.toUpperCase()} • {issue.priority.toUpperCase()}
                    </text>
                  </g>
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
