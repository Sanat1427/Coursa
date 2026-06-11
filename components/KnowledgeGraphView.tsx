import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Move, X, Layers, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface Node {
    id: string;
    name: string;
    description: string;
    category: string;
    status?: 'Mastered' | 'Needs Review' | 'Ready to Learn' | 'Locked';
    masteryScore?: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    type: string;
}

interface Props {
    nodes: Node[];
    edges: Edge[];
    onNodeSelect?: (conceptId: string) => void;
}

export default function KnowledgeGraphView({ nodes = [], edges = [], onNodeSelect }: Props) {
    const [transform, setTransform] = useState({ x: 100, y: 50, zoom: 0.75 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const svgRef = useRef<SVGSVGElement | null>(null);

    // Categories coordinates mapping (Columns Layout)
    const categoryPositions: Record<string, { x: number; yStart: number; yGap: number }> = {
        "Programming Basics": { x: 150, yStart: 120, yGap: 140 },
        "Frontend": { x: 450, yStart: 80, yGap: 140 },
        "Data Structures": { x: 750, yStart: 100, yGap: 130 },
        "Algorithms": { x: 1050, yStart: 100, yGap: 130 },
        "Databases": { x: 1350, yStart: 120, yGap: 150 },
        "Backend & Systems": { x: 1650, yStart: 80, yGap: 120 },
        "AI & Data Science": { x: 1950, yStart: 180, yGap: 160 },
    };

    // Calculate node coordinate list
    const nodeCoords = new Map<string, { x: number; y: number }>();
    const categoryCounts: Record<string, number> = {};

    nodes.forEach(node => {
        const cat = node.category || "Programming Basics";
        const layout = categoryPositions[cat] || { x: 150, yStart: 100, yGap: 130 };
        const index = categoryCounts[cat] || 0;
        categoryCounts[cat] = index + 1;

        nodeCoords.set(node.id, {
            x: layout.x + (index % 2 === 0 ? 0 : 25), // slight zigzag for spacing
            y: layout.yStart + index * layout.yGap
        });
    });

    // Zoom Handlers
    const handleZoomIn = () => {
        setTransform(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.15, 3) }));
    };

    const handleZoomOut = () => {
        setTransform(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.15, 0.2) }));
    };

    const handleReset = () => {
        setTransform({ x: 100, y: 50, zoom: 0.75 });
    };

    // Pan Handlers
    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if ((e.target as HTMLElement).tagName === "circle" || (e.target as HTMLElement).tagName === "text" || (e.target as HTMLElement).tagName === "path") return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDragging) return;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        setTransform(prev => ({
            ...prev,
            zoom: Math.max(0.2, Math.min(3, prev.zoom * zoomFactor))
        }));
    };

    // Get color themes for node categories / statuses
    const getNodeTheme = (node: Node) => {
        if (node.status) {
            switch (node.status) {
                case "Mastered":
                    return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" }; // green
                case "Needs Review":
                    return { bg: "#fffbeb", border: "#f59e0b", text: "#78350f" }; // yellow/orange
                case "Ready to Learn":
                    return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" }; // blue
                case "Locked":
                    return { bg: "#f1f5f9", border: "#94a3b8", text: "#64748b" }; // grey
            }
        }
        
        switch (node.category) {
            case "Programming Basics": return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" }; // green
            case "Frontend": return { bg: "#fdf4ff", border: "#d946ef", text: "#86198f" }; // purple
            case "Data Structures": return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" }; // blue
            case "Algorithms": return { bg: "#fff7ed", border: "#f97316", text: "#9a3412" }; // orange
            case "Databases": return { bg: "#fff1f2", border: "#f43f5e", text: "#9f1239" }; // rose
            case "Backend & Systems": return { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8" }; // violet
            case "AI & Data Science": return { bg: "#f0fdfa", border: "#14b8a6", text: "#115e59" }; // teal
            default: return { bg: "#f8fafc", border: "#64748b", text: "#334155" };
        }
    };

    // Generate hand-drawn wobbly circle paths for nodes
    const makeWobblyCircle = (cx: number, cy: number, r: number) => {
        // Creates a wobbly circle by drawing 4 bezier curves with small offsets
        const d1 = r * 0.04;
        const d2 = r * 0.05;
        const p1 = `M ${cx - r + d1} ${cy - d2}`;
        const c1 = `C ${cx - r} ${cy - r - d1}, ${cx - d2} ${cy - r + d1}, ${cx} ${cy - r}`;
        const c2 = `C ${cx + r - d1} ${cy - r - d2}, ${cx + r + d2} ${cy + d1}, ${cx + r} ${cy}`;
        const c3 = `C ${cx + r - d2} ${cy + r + d1}, ${cx + d1} ${cy + r - d2}, ${cx} ${cy + r}`;
        const c4 = `C ${cx - r - d1} ${cy + r + d2}, ${cx - r + d2} ${cy - d1}, ${cx - r + d1} ${cy - d2}`;
        return `${p1} ${c1} ${c2} ${c3} ${c4} Z`;
    };

    return (
        <div className="w-full relative h-[600px] bg-[#fbf9f5] wobbly-border border-2 overflow-hidden select-none select-none">
            {/* Toolbar Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-2.5 bg-white wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-700 cursor-pointer"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-2.5 bg-white wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-700 cursor-pointer"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={handleReset}
                    title="Reset view"
                    className="px-4 py-2.5 bg-white wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-700 font-display text-sm cursor-pointer"
                >
                    Center View
                </button>
            </div>

            {/* Instruction Label */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none bg-slate-900/5 backdrop-blur-xs px-3 py-1.5 wobbly-border border-dashed border text-[10px] uppercase font-bold text-slate-500 font-sans tracking-wide">
                🖱️ Drag canvas to pan | Scroll to zoom
            </div>

            {/* SVG Graph Canvas */}
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Arrowhead Marker definition */}
                <defs>
                    <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="48"  // distance to end node circle boundary
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                    <marker
                        id="arrow-active"
                        viewBox="0 0 10 10"
                        refX="48"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                    </marker>
                </defs>

                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
                    {/* Render Category Columns Backdrop Guides */}
                    {Object.entries(categoryPositions).map(([cat, pos]) => (
                        <g key={cat} opacity={0.06}>
                            <line
                                x1={pos.x}
                                y1={0}
                                x2={pos.x}
                                y2={1000}
                                stroke="#475569"
                                strokeWidth="4"
                                strokeDasharray="10 10"
                            />
                            <text
                                x={pos.x}
                                y={40}
                                textAnchor="middle"
                                className="font-display text-4xl font-extrabold uppercase fill-slate-800"
                            >
                                {cat}
                            </text>
                        </g>
                    ))}

                    {/* Render Relationship Edges */}
                    {edges.map(edge => {
                        const start = nodeCoords.get(edge.source);
                        const end = nodeCoords.get(edge.target);
                        if (!start || !end) return null;

                        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                        const isPrimary = edge.type === 'PREREQUISITE';

                        return (
                            <g key={edge.id}>
                                <line
                                    x1={start.x}
                                    y1={start.y}
                                    x2={end.x}
                                    y2={end.y}
                                    stroke={isHighlighted ? "#6366f1" : "#cbd5e1"}
                                    strokeWidth={isHighlighted ? 3 : 2}
                                    strokeDasharray={isPrimary ? "none" : "5 5"}
                                    markerEnd={isHighlighted ? "url(#arrow-active)" : "url(#arrow)"}
                                />
                                {/* Relationship Type Text on hover */}
                                {isHighlighted && (
                                    <text
                                        x={(start.x + end.x) / 2}
                                        y={(start.y + end.y) / 2 - 5}
                                        textAnchor="middle"
                                        className="font-sans text-[10px] font-bold fill-indigo-600 bg-white"
                                    >
                                        {edge.type}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Render Concept Nodes */}
                    {nodes.map(node => {
                        const coord = nodeCoords.get(node.id);
                        if (!coord) return null;

                        const theme = getNodeTheme(node);
                        const isHovered = hoveredNode === node.id;
                        const isSelected = selectedNode?.id === node.id;
                        
                        // Radii of nodes
                        const radius = 40;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${coord.x}, ${coord.y})`}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={() => {
                                    setSelectedNode(node);
                                    if (onNodeSelect) onNodeSelect(node.id);
                                }}
                            >
                                {/* Handwritten Styled Wobbly Circle Node */}
                                <path
                                    d={makeWobblyCircle(0, 0, radius)}
                                    fill={isHovered || isSelected ? "#e0e7ff" : theme.bg}
                                    stroke={isHovered || isSelected ? "#4f46e5" : theme.border}
                                    strokeWidth={isHovered || isSelected ? 3 : 2}
                                />

                                {/* Label inside node */}
                                <text
                                    x={0}
                                    y={-2}
                                    textAnchor="middle"
                                    className="font-display font-bold text-xs"
                                    fill={isHovered || isSelected ? "#312e81" : theme.text}
                                >
                                    {node.name.length > 11 ? `${node.name.substring(0, 9)}..` : node.name}
                                </text>

                                {/* Mastery score or status label */}
                                <text
                                    x={0}
                                    y={14}
                                    textAnchor="middle"
                                    className="font-sans text-[8px] opacity-60 font-semibold"
                                    fill={isHovered || isSelected ? "#4f46e5" : theme.text}
                                >
                                    {node.status === "Locked" ? "Locked" : `${node.masteryScore ?? 0}%`}
                                </text>

                                {/* Padlock overlay for Locked nodes */}
                                {node.status === "Locked" && (
                                    <text x={18} y={-18} className="text-sm">🔒</text>
                                )}

                                {/* Tooltip for Category name on hover */}
                                {isHovered && (
                                    <g transform="translate(0, -50)">
                                        <rect
                                            x="-60"
                                            y="-15"
                                            width="120"
                                            height="22"
                                            fill="#1e293b"
                                            rx="4"
                                        />
                                        <text
                                            x="0"
                                            y="0"
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            className="font-sans text-[8px] font-bold"
                                        >
                                            {node.name} ({node.status || "Locked"})
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Selected Node Details side-sheet overlay panel */}
            {selectedNode && (
                <div className="absolute top-4 right-4 bottom-4 w-72 bg-white wobbly-border hard-shadow p-5 flex flex-col justify-between z-20 animate-fade-in font-sans">
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-4 overflow-y-auto">
                        <div>
                            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 wobbly-border border uppercase">
                                {selectedNode.category}
                            </span>
                            <h3 className="font-display text-xl font-bold text-slate-900 mt-2">
                                {selectedNode.name}
                            </h3>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed">
                            {selectedNode.description}
                        </p>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-4 mt-4">
                        <Link href={`/concepts/${selectedNode.id}`}>
                            <button className="w-full bg-black text-white py-2 wobbly-border hard-shadow-sm font-display text-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                Open in Concept Explorer <BookOpen className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
