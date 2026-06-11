"use client";
import React, { useState } from 'react';
import { Lock, Check, Sparkles, HelpCircle, Eye } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  status: 'Mastered' | 'In Progress' | 'Locked';
  score: number;
  x: number; // SVG center coordinate
  y: number;
  r: number; // Radius
  desc: string;
}

const mockNodes: GraphNode[] = [
  { id: "programming", name: "Programming", status: "Mastered", score: 100, x: 120, y: 180, r: 55, desc: "Basics of code execution, memory variables, functions, and control scopes." },
  { id: "dsa", name: "Data Structures", status: "Mastered", score: 95, x: 260, y: 110, r: 60, desc: "Stacks, Queues, Linked Lists, Hash Tables, Trees, and Big O Complexity." },
  { id: "dbms", name: "DBMS", status: "Mastered", score: 90, x: 280, y: 260, r: 50, desc: "ACID transactions, database engines, indexing, replication, and query schema." },
  { id: "os", name: "Operating Systems", status: "Mastered", score: 85, x: 440, y: 90, r: 55, desc: "Processes, virtual memory, threads, context switching, and resource scheduling." },
  { id: "networking", name: "Networking", status: "In Progress", score: 70, x: 460, y: 240, r: 55, desc: "TCP/IP models, routing Tables, DNS lookup protocols, and TLS encryption." },
  { id: "system-design", name: "System Design", status: "Locked", score: 0, x: 620, y: 160, r: 60, desc: "Scale architecture, CDNs, load balancing pools, consensus rings, and API gates." },
];

const mockEdges = [
  { from: "programming", to: "dsa", type: "prereq" },
  { from: "programming", to: "dbms", type: "prereq" },
  { from: "dsa", to: "os", type: "prereq" },
  { from: "dbms", to: "networking", type: "related" },
  { from: "os", to: "system-design", type: "prereq" },
  { from: "networking", to: "system-design", type: "prereq" },
];

function KnowledgeShowcase() {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(mockNodes[4]);

  return (
    <section id="knowledge-graph" className="w-full px-6 md:px-12 lg:px-24 py-16 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold inline-block relative scribble-underline mb-4">
          Watch Your Knowledge Grow
        </h2>
        <p className="font-sans text-2xl text-slate-600 max-w-2xl mx-auto mt-2">
          Every completed chapter auto-sketches into your Personal Knowledge Graph. Track what you know, revise weak nodes, and unlock advanced topics.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Detail Panel */}
        <div className="w-full wobbly-border hard-shadow bg-white p-6 flex flex-col justify-between relative rotate-[-0.5deg]">
          <div className="tape -top-3 left-4 opacity-60"></div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display text-sm tracking-wider uppercase text-sketch-primary font-bold bg-purple-50 px-2 py-0.5 wobbly-border border-2">
                Concept Node
              </span>
            </div>
            
            <h3 className="font-display text-3xl font-bold text-slate-900">
              {selectedNode.name}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2.5 items-center">
              {selectedNode.status === "Mastered" && (
                <span className="font-sans text-sm font-bold bg-purple-100 text-sketch-primary wobbly-border border-2 px-3 py-1 flex items-center gap-1">
                  <Check className="w-4 h-4" strokeWidth={3} /> Mastered ({selectedNode.score}%)
                </span>
              )}
              {selectedNode.status === "In Progress" && (
                <span className="font-sans text-sm font-bold bg-orange-100 text-sketch-orange wobbly-border border-2 px-3 py-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Reviewing ({selectedNode.score}%)
                </span>
              )}
              {selectedNode.status === "Locked" && (
                <span className="font-sans text-sm font-bold bg-slate-100 text-slate-500 wobbly-border border-2 border-dashed px-3 py-1 flex items-center gap-1">
                  <Lock className="w-4 h-4" /> Locked (0%)
                </span>
              )}
            </div>

            <p className="font-sans text-xl text-slate-500 mt-4 leading-snug">
              {selectedNode.desc}
            </p>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 mt-6 bg-slate-50/50 p-4 wobbly-border border-2 border-dashed">
            <span className="font-display text-sm text-slate-400 uppercase font-bold block mb-1">
              Active Roadmap Rule:
            </span>
            <p className="font-sans text-base text-slate-500 leading-tight">
              {selectedNode.status === "Mastered" && "Completed and stored in long-term memory. Periodic reviews scheduled automatically."}
              {selectedNode.status === "In Progress" && "Memory strength fading. Rate the revision flashcards to boost score to 100%."}
              {selectedNode.status === "Locked" && "Prerequisites required! Master 'Operating Systems' and 'Networking' first."}
            </p>
          </div>
        </div>

        {/* SVG Knowledge Graph Preview Box */}
        <div className="lg:col-span-2 w-full wobbly-border hard-shadow bg-white p-6 relative overflow-hidden rotate-0.5 min-h-[380px] flex items-center justify-center">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 wobbly-border border text-sm font-display text-slate-500 select-none">
            <Eye className="w-4 h-4" /> Hover / Click Nodes
          </div>
          
          <div className="w-full overflow-x-auto select-none py-4">
            <svg
              className="mx-auto min-w-[700px]"
              width="740"
              height="340"
              viewBox="0 0 740 340"
            >
              {/* Draw Connector Edges */}
              {mockEdges.map((edge, i) => {
                const fromNode = mockNodes.find(n => n.id === edge.from)!;
                const toNode = mockNodes.find(n => n.id === edge.to)!;
                const isDashed = edge.type === "related" || toNode.status === "Locked";
                
                return (
                  <g key={i}>
                    {/* Line connecting centers */}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={toNode.status === "Locked" ? "#cbd5e1" : "#1a1a1a"}
                      strokeWidth="3.5"
                      strokeDasharray={isDashed ? "8,6" : "0"}
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {mockNodes.map((node) => {
                const isSelected = selectedNode.id === node.id;
                
                let fill = "#ffffff";
                let strokeColor = "#1a1a1a";
                let strokeDash = "0";
                let shadowColor = "#1a1a1a";
                
                if (node.status === "Mastered") {
                  fill = "#f3e8ff"; // soft purple
                  strokeColor = "#af25f4";
                } else if (node.status === "In Progress") {
                  fill = "#ffedd5"; // soft orange
                  strokeColor = "#fb923c";
                } else {
                  fill = "#f8fafc";
                  strokeColor = "#94a3b8";
                  strokeDash = "6,4";
                  shadowColor = "#94a3b8";
                }

                if (isSelected) {
                  strokeColor = "#1a1a1a";
                }

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer group/node"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Shadow circle */}
                    <circle
                      cx={node.x + 4}
                      cy={node.y + 4}
                      r={node.r}
                      fill="transparent"
                      stroke={shadowColor}
                      strokeWidth="2"
                      className="transition-transform group-hover/node:translate-x-1 group-hover/node:translate-y-1"
                    />

                    {/* Main node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? "5" : "3.5"}
                      strokeDasharray={strokeDash}
                      className="transition-all group-hover/node:scale-105 origin-center duration-150"
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />

                    {/* Node text */}
                    <text
                      x={node.x}
                      y={node.y - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`font-display text-base font-bold ${
                        node.status === "Locked" ? "fill-slate-400" : "fill-slate-900"
                      }`}
                    >
                      {node.name}
                    </text>

                    {/* Sub text / score */}
                    <text
                      x={node.x}
                      y={node.y + 16}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-sans text-xs font-bold fill-slate-400"
                    >
                      {node.status === "Mastered" && "100% ✅"}
                      {node.status === "In Progress" && `${node.score}% 🔥`}
                      {node.status === "Locked" && "Locked 🔒"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default KnowledgeShowcase;
