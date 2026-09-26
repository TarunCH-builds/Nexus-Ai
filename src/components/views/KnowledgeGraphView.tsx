/**
 * NEXUS AI - Dynamic Spatial Knowledge Graph & Relationship Explorer
 * 
 * Dynamic multi-entity graph:
 * - Entities & Concepts (Snapdragon X, Hexagon NPU, Qualcomm QNN)
 * - Documents (Architecture Guide, Whitepaper)
 * - Topics (Zero-Leak Privacy, DirectML Engine)
 * - People (Alex Chen, Sarah Lin)
 * - Meetings (Qualcomm AI Engine Sync)
 * - Tasks (INT8 Quantization, Sandboxed Runner)
 * 
 * Inspector reveals:
 * - Name
 * - Type
 * - Source
 * - Connected Relationships
 * - Timestamp
 * - Confidence / Graph Metric
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Share2,
  Filter,
  Info,
  Search,
  Sparkles,
  Layers,
  CheckCircle,
  ExternalLink,
  Zap,
  Activity,
  Maximize2,
  Calendar,
  User,
  FileText,
  Cpu,
  Clock,
  CheckSquare,
  Tag,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Eye,
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const KnowledgeGraphView: React.FC = () => {
  const { addToast } = useApp();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Zoom, Pan, and Focus Mode state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    api.getGraph().then((data) => {
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNodeId(data.nodes[0].id);
      }
    });
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'concept':
        return '#06b6d4'; // cyan
      case 'document':
        return '#10b981'; // emerald
      case 'person':
        return '#ec4899'; // pink
      case 'topic':
        return '#3b82f6'; // blue
      case 'meeting':
        return '#f59e0b'; // amber
      case 'task':
        return '#a855f7'; // purple
      case 'project':
        return '#f43f5e'; // rose
      default:
        return '#6366f1'; // indigo
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'concept':
        return Cpu;
      case 'document':
        return FileText;
      case 'person':
        return User;
      case 'topic':
        return Tag;
      case 'meeting':
        return Calendar;
      case 'task':
        return CheckSquare;
      default:
        return Layers;
    }
  };

  // Node position calculation for SVG Spatial topology
  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const total = nodes.length || 1;
    const width = 640;
    const height = 440;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.40;

    nodes.forEach((node, index) => {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      // Stagger radius by type for a layered organic topology
      let rOffset = 1.0;
      if (node.type === 'concept') rOffset = 0.55;
      else if (node.type === 'topic') rOffset = 0.78;
      else if (node.type === 'document') rOffset = 0.95;
      else if (node.type === 'person') rOffset = 1.1;

      const x = Math.round(centerX + Math.cos(angle) * (radius * rOffset));
      const y = Math.round(centerY + Math.sin(angle) * (radius * rOffset));
      posMap.set(node.id, { x, y });
    });
    return posMap;
  }, [nodes]);

  const filteredNodes = nodes.filter((n) => {
    if (isFocusMode && selectedNodeId) {
      const isSelf = n.id === selectedNodeId;
      const isNeighbor = edges.some(
        (e) => (e.source === selectedNodeId && e.target === n.id) ||
               (e.target === selectedNodeId && e.source === n.id)
      );
      if (!isSelf && !isNeighbor) return false;
    }
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const getConnectedEdges = (nodeId: string) => {
    return edges.filter((e) => e.source === nodeId || e.target === nodeId);
  };

  const connectedEdgeIds = useMemo(() => {
    const activeId = hoveredNodeId || selectedNodeId;
    if (!activeId) return new Set<string>();
    const relEdges = edges.filter((e) => e.source === activeId || e.target === activeId);
    return new Set(relEdges.map((e) => e.id));
  }, [edges, hoveredNodeId, selectedNodeId]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              <span>Dynamic Knowledge Graph & Entity Matrix</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              TOPOLOGICAL SEMANTICS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Interconnected entities across hardware targets, local documents, team meetings, tasks, and team members.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, people, docs..."
              className="bg-[#0b0e16] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none w-48 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs bg-[#0b0e16] p-1 rounded-lg border border-white/[0.06]">
            {['all', 'concept', 'document', 'topic', 'person', 'meeting', 'task'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 rounded capitalize text-[11px] font-medium transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas Representation + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Topological Graph Canvas (Cols 1-8) */}
        <div className="lg:col-span-8 rounded-xl border border-white/[0.07] bg-[#0c0f17]/90 backdrop-blur-md p-4 flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          {/* Top Canvas Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>DYNAMIC MATRIX: {filteredNodes.length} NODES · {edges.length} RELATIONAL EDGES</span>
            </div>

            {/* Interactive Zoom / Pan / Focus Mode Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                title="Toggle Focus Mode: isolates selected entity and its direct connections"
                className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                  isFocusMode
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/30 font-bold'
                    : 'bg-black/40 text-neutral-400 border-white/[0.08] hover:text-white'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Focus Mode</span>
              </button>

              <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                  title="Zoom In"
                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[10px] font-mono text-neutral-300 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                  title="Zoom Out"
                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  title="Reset View"
                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <div className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                Local SQLite Graph
              </div>
            </div>
          </div>

          {/* Interactive SVG Diagram */}
          <div
            className={`relative w-full h-[440px] flex items-center justify-center my-1 select-none overflow-hidden cursor-${
              isDragging ? 'grabbing' : 'grab'
            }`}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setZoom((z) => Math.max(0.4, Math.min(2.5, Number((z + delta).toFixed(2)))));
            }}
          >
            <svg
              className="w-full h-full select-none"
              viewBox="0 0 640 440"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="graphGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0c0f17" stopOpacity="0" />
                </radialGradient>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="14"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Background ambient circular glow */}
              <circle cx="320" cy="220" r="200" fill="url(#graphGlow)" />

              {/* Transformed Group for Zoom and Pan */}
              <g transform={`translate(${320 + pan.x}, ${220 + pan.y}) scale(${zoom}) translate(-320, -220)`}>
                {/* Edge Links */}
                {edges.map((edge) => {
                  const srcPos = nodePositions.get(edge.source);
                  const tgtPos = nodePositions.get(edge.target);
                  if (!srcPos || !tgtPos) return null;

                  const isHighlighted = connectedEdgeIds.has(edge.id);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        stroke={isHighlighted ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
                        strokeWidth={isHighlighted ? 2.5 : 1}
                        strokeDasharray={isHighlighted ? 'none' : '3 3'}
                        markerEnd={isHighlighted ? 'url(#arrowhead)' : undefined}
                        className="transition-all duration-300"
                      />
                      {isHighlighted && (
                        <text
                          x={(srcPos.x + tgtPos.x) / 2}
                          y={(srcPos.y + tgtPos.y) / 2 - 4}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="9"
                          fontFamily="monospace"
                          className="bg-neutral-900 px-1 select-none pointer-events-none"
                        >
                          {edge.relation}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Node Circles & Labels */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;

                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const color = getNodeColor(node.type);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* Pulsing halo if selected */}
                      {isSelected && (
                        <circle
                          r="24"
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          opacity="0.6"
                          className="animate-pulse"
                        />
                      )}

                      {/* Outer node circle */}
                      <circle
                        r={isSelected ? '16' : '12'}
                        fill="#0d111a"
                        stroke={color}
                        strokeWidth={isSelected ? '3' : '1.5'}
                        className="transition-all duration-200 hover:scale-110"
                      />

                      {/* Inner core dot */}
                      <circle r="4" fill={color} />

                      {/* Node text label */}
                      <text
                        y={isSelected ? '28' : '24'}
                        textAnchor="middle"
                        fill={isSelected || isHovered ? '#ffffff' : '#94a3b8'}
                        fontSize={isSelected ? '11' : '10'}
                        fontWeight={isSelected ? '600' : '400'}
                        fontFamily="system-ui, sans-serif"
                        className="pointer-events-none transition-colors"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Relationship Legend */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold uppercase text-[10px] text-neutral-400">Entities:</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Concept</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Document</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Topic</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-400" /> Person</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Meeting</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Task</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400">
              Click node to inspect metadata
            </div>
          </div>
        </div>

        {/* Right Detail Inspector Panel (Cols 9-12) */}
        <div className="lg:col-span-4 rounded-xl border border-white/[0.07] bg-[#0c0f17]/90 backdrop-blur-md p-4 space-y-4">
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Entity Inspector</span>
            </span>
            {selectedNode && (
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                  color: getNodeColor(selectedNode.type),
                  border: `1px solid ${getNodeColor(selectedNode.type)}40`,
                }}
              >
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                  />
                  <span>{selectedNode.label}</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  ID: {selectedNode.id}
                </div>
              </div>

              {/* Exact user requested inspector fields */}
              <div className="p-3 rounded-lg bg-[#090b12] border border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Type:</span>
                  <span className="font-semibold text-neutral-200 capitalize">{selectedNode.type}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Source:</span>
                  <span className="font-mono text-cyan-300">
                    {selectedNode.source || 'Local SQLite Seed / Ingest'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Timestamp:</span>
                  <span className="font-mono text-neutral-300">
                    {new Date(selectedNode.timestamp || Date.now()).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Confidence Metric:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedNode.confidence 
                      ? `${(selectedNode.confidence * 100).toFixed(1)}% Measured`
                      : 'Deterministic Graph Relation'}
                  </span>
                </div>

                {selectedNode.description && (
                  <div className="pt-2 border-t border-white/[0.04] text-[11px] text-neutral-300 leading-relaxed font-sans">
                    {selectedNode.description}
                  </div>
                )}
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Connected Topological Edges:</span>
                  <span className="text-cyan-400">{getConnectedEdges(selectedNode.id).length} Links</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {getConnectedEdges(selectedNode.id).map((edge) => {
                    const isSource = edge.source === selectedNode.id;
                    const otherNodeId = isSource ? edge.target : edge.source;
                    const otherNode = nodes.find((n) => n.id === otherNodeId);
                    return (
                      <div
                        key={edge.id}
                        onClick={() => otherNode && setSelectedNodeId(otherNode.id)}
                        className="p-2.5 rounded-lg bg-[#111420] border border-white/[0.06] hover:border-cyan-500/30 text-xs space-y-1 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-cyan-400">
                            {isSource ? '↓ ' + edge.relation : '↑ ' + edge.relation}
                          </span>
                          <span className="text-[10px] text-neutral-400 uppercase font-mono">
                            {otherNode?.type}
                          </span>
                        </div>
                        <div className="font-medium text-neutral-200">
                          {otherNode?.label || otherNodeId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() =>
                    addToast('info', `Focused knowledge node: "${selectedNode.label}" in workspace context`, 'Graph Focus')
                  }
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Node In RAG Context</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-400 py-12 text-center">
              Select any node in the topology matrix to inspect its metadata and relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
