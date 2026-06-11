"use client";
import React, { useState } from 'react';
import { Check, Info, Server, Network, Layers, Database, Cpu, Compass } from 'lucide-react';

interface Node {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  completed: boolean;
  topics: string[];
}

const roadmapNodes: Node[] = [
  {
    id: "networking",
    title: "1. Networking Basics",
    desc: "Understand how computers talk to each other across protocols.",
    icon: <Network className="w-6 h-6 text-sketch-primary" />,
    completed: true,
    topics: ["TCP/UDP & Handshakes", "IP Routing & Subnets", "DNS Resolution Loop", "HTTP/1.1 vs HTTP/2 vs HTTP/3"],
  },
  {
    id: "load-balancers",
    title: "2. Load Balancers",
    desc: "Distribute incoming client requests across servers.",
    icon: <Layers className="w-6 h-6 text-sketch-primary" />,
    completed: true,
    topics: ["Round-Robin & Hashing Algorithms", "Layer 4 vs Layer 7 Routing", "HAProxy & Nginx Proxies", "Health Check Pools"],
  },
  {
    id: "caching",
    title: "3. Caching & CDNs",
    desc: "Speed up read request rates by storing data closer to users.",
    icon: <Cpu className="w-6 h-6 text-sketch-primary" />,
    completed: true,
    topics: ["Redis & Memcached storage", "Eviction: LRU, LFU, FIFO", "Cache Invalidation strategies", "Edge Servers & CDNs"],
  },
  {
    id: "databases",
    title: "4. Databases & Scaling",
    desc: "Store persistent state and handle heavy read/write volumes.",
    icon: <Database className="w-6 h-6 text-sketch-primary" />,
    completed: true,
    topics: ["Relational (SQL) vs NoSQL", "B-Tree Indexing Optimization", "Primary-Replica Replication", "Database Sharding"],
  },
  {
    id: "distributed",
    title: "5. Distributed Systems",
    desc: "Build highly available networks that tolerate partitions.",
    icon: <Server className="w-6 h-6 text-sketch-primary" />,
    completed: true,
    topics: ["CAP Theorem & PACELC", "Consensus: Raft & Paxos", "Consistent Hashing Ring", "Eventual vs Strong Consistency"],
  },
  {
    id: "cases",
    title: "6. Practical Case Studies",
    desc: "Put theoretical concepts together to build global apps.",
    icon: <Compass className="w-6 h-6 text-sketch-orange" />,
    completed: false,
    topics: ["Scale YouTube Video Uploads", "Real-Time Group Chat System", "Distributed Rate Limiting", "Global TinyURL Service"],
  },
];

function FeaturedRoadmap() {
  const [activeNode, setActiveNode] = useState<Node>(roadmapNodes[0]);

  return (
    <section id="roadmap" className="w-full px-6 md:px-12 lg:px-24 py-16 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold inline-block relative scribble-underline mb-4">
          Featured Learning Path
        </h2>
        <p className="font-sans text-2xl text-slate-600 max-w-2xl mx-auto mt-2">
          Explore a generated roadmap. Click any milestone to inspect the AI-extracted syllabus.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Winding Roadmap Visual Path */}
        <div className="lg:col-span-2 w-full flex flex-col gap-6 relative">
          <div className="font-display text-2xl font-bold mb-2 text-slate-700 bg-white inline-block px-4 py-2 wobbly-border border-2 self-start rotate-1">
            Topic: System Design Architectures
          </div>

          {/* Connected Tree Nodes */}
          <div className="flex flex-col gap-8 relative pl-6 md:pl-12 border-l-4 border-dashed border-slate-900/40 py-4 ml-6 md:ml-10">
            {roadmapNodes.map((node) => {
              const isActive = activeNode.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(node)}
                  className={`relative cursor-pointer transition-all duration-200 group flex items-center gap-4 ${
                    isActive ? 'scale-105' : 'hover:scale-[1.02]'
                  }`}
                >
                  {/* Timeline connector circle node */}
                  <div className={`absolute -left-12 md:-left-18 w-12 h-12 rounded-full wobbly-border border-2 bg-white flex items-center justify-center transition-all ${
                    isActive ? 'bg-sketch-primary border-slate-900 shadow-md scale-110' : 'bg-slate-50 border-slate-700 group-hover:bg-purple-50'
                  }`}>
                    {node.completed ? (
                      <Check className={`w-6 h-6 ${isActive ? 'text-white' : 'text-sketch-primary'}`} strokeWidth={3} />
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full ${isActive ? 'bg-white' : 'bg-sketch-orange'}`} />
                    )}
                  </div>

                  {/* Node Panel */}
                  <div className={`flex-1 p-5 wobbly-border border-2 bg-white transition-all ${
                    isActive ? 'hard-shadow border-slate-950 bg-white rotate-0.5' : 'hard-shadow-sm border-slate-900/60 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-full wobbly-border border">
                          {node.icon}
                        </div>
                        <h4 className="font-display text-xl md:text-2xl font-bold text-slate-800">
                          {node.title}
                        </h4>
                      </div>
                      
                      {node.completed ? (
                        <span className="font-sans text-sm font-bold text-sketch-primary bg-purple-50 px-2 py-0.5 wobbly-border border-2 rounded">
                          Mastered
                        </span>
                      ) : (
                        <span className="font-sans text-sm font-bold text-sketch-orange bg-orange-50 px-2 py-0.5 wobbly-border border-2 rounded">
                          Up Next
                        </span>
                      )}
                    </div>
                    
                    <p className="font-sans text-lg text-slate-500 mt-2 leading-snug">
                      {node.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Drawer / Syllabus Detail Pane */}
        <div className="lg:col-span-1 w-full lg:sticky lg:top-28 wobbly-border hard-shadow bg-white p-6 rotate-1">
          <div className="tape -top-3 right-5 opacity-60"></div>
          
          <div className="flex items-center gap-3 border-b-2 border-dashed border-slate-200 pb-4 mb-4">
            <Info className="w-6 h-6 text-sketch-primary" />
            <h3 className="font-display text-2xl font-bold text-slate-900 leading-none">
              Syllabus Inspector
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-display text-2xl font-bold text-sketch-primary">
              {activeNode.title}
            </h4>
            <p className="font-sans text-lg text-slate-600 leading-snug">
              {activeNode.desc}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <span className="font-display text-base text-slate-400 uppercase font-bold">
                AI-Extracted Core Concepts:
              </span>
              <ul className="flex flex-col gap-2.5">
                {activeNode.topics.map((topic, i) => (
                  <li
                    key={i}
                    className="font-sans text-lg text-slate-700 flex items-start gap-2.5 bg-slate-50 p-2.5 wobbly-border border-2 border-dashed"
                  >
                    <span className="w-5 h-5 rounded-full bg-sketch-orange/20 text-sketch-orange text-xs font-bold font-sans flex items-center justify-center shrink-0 mt-0.5 border border-sketch-orange">
                      {i + 1}
                    </span>
                    <span className="leading-tight">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-50 p-4 border border-sketch-primary/40 border-dashed rounded mt-4 flex items-start gap-2.5">
              <span className="text-xl">💡</span>
              <p className="font-sans text-base text-slate-600 leading-tight">
                {activeNode.completed 
                  ? "Spaced repetition reviews are scheduled. Keep revising to maintain mastery."
                  : "Prerequisites met. Click 'Generate' above to generate and begin this module."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedRoadmap;
