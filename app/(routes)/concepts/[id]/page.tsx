import React from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen, Layers, GitPullRequest, Award, Star } from "lucide-react";
import { db } from "@/lib/db";
import { conceptsTable, conceptRelationshipsTable } from "@/lib/schema";
import { eq, or } from "drizzle-orm";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ConceptExplorerPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch concept details directly
    const concepts = await db.select().from(conceptsTable).where(eq(conceptsTable.id, id)).limit(1);
    if (concepts.length === 0) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center gap-3 bg-[#faf8f5] p-6 text-center">
                <h2 className="font-display text-2xl font-bold text-slate-800">Concept Map Not Found</h2>
                <Link href="/">
                    <button className="px-4 py-2 bg-black text-white wobbly-border hard-shadow-sm font-display text-sm cursor-pointer">
                        Back to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    const concept = concepts[0];

    // Fetch relationships linked to this concept
    const relationships = await db.select().from(conceptRelationshipsTable)
        .where(
            or(
                eq(conceptRelationshipsTable.sourceConceptId, id),
                eq(conceptRelationshipsTable.targetConceptId, id)
            )
        );

    const allConcepts = await db.select().from(conceptsTable);
    const conceptMap = new Map(allConcepts.map(c => [c.id, c]));

    const prerequisites: any[] = [];
    const advancedTopics: any[] = [];
    const related: any[] = [];
    const usedIn: any[] = [];

    for (const rel of relationships) {
        if (rel.relationshipType === 'PREREQUISITE') {
            if (rel.targetConceptId === id) {
                prerequisites.push(conceptMap.get(rel.sourceConceptId));
            } else {
                usedIn.push(conceptMap.get(rel.targetConceptId));
            }
        } else if (rel.relationshipType === 'ADVANCED_TOPIC') {
            if (rel.sourceConceptId === id) {
                advancedTopics.push(conceptMap.get(rel.targetConceptId));
            } else {
                prerequisites.push(conceptMap.get(rel.sourceConceptId));
            }
        } else if (rel.relationshipType === 'USED_IN') {
            if (rel.sourceConceptId === id) {
                usedIn.push(conceptMap.get(rel.targetConceptId));
            } else {
                prerequisites.push(conceptMap.get(rel.sourceConceptId));
            }
        } else if (rel.relationshipType === 'RELATED') {
            const otherId = rel.sourceConceptId === id ? rel.targetConceptId : rel.sourceConceptId;
            related.push(conceptMap.get(otherId));
        }
    }

    const cleanPrerequisites = prerequisites.filter(Boolean);
    const cleanAdvancedTopics = advancedTopics.filter(Boolean);
    const cleanRelated = related.filter(Boolean);
    const cleanUsedIn = usedIn.filter(Boolean);

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10 bg-[#faf8f5] w-full">
            {/* Header Navigation */}
            <div className="w-full max-w-4xl mb-8 flex items-center justify-between">
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        <ChevronLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* Main Concept Card */}
            <div className="w-full max-w-4xl bg-white wobbly-border hard-shadow p-6 md:p-8 relative mb-8">
                <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-6">
                    <span className="text-xs uppercase font-display font-bold tracking-wider text-sketch-primary px-2.5 py-0.5 wobbly-border border bg-purple-50">
                        {concept.category}
                    </span>
                    <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-3 flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-sketch-orange" />
                        {concept.name}
                    </h1>
                </div>

                <div className="mb-6">
                    <h3 className="font-display text-lg font-bold text-slate-800 mb-2 uppercase tracking-wide">Definition & Description:</h3>
                    <p className="font-sans text-slate-700 text-lg leading-relaxed bg-slate-50/50 p-5 wobbly-border border-dashed border">
                        {concept.description}
                    </p>
                </div>
            </div>

            {/* Relationships Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-8">
                {/* 1. Prerequisites */}
                <div className="p-6 bg-white wobbly-border hard-shadow relative">
                    <div className="thumbtack absolute -top-3 left-8 pointer-events-none"></div>
                    <h3 className="font-display text-lg font-bold text-slate-800 mb-4 pb-1.5 border-b border-dashed border-slate-200 flex items-center gap-2">
                        <GitPullRequest className="w-5 h-5 text-sketch-blue" /> Prerequisites
                    </h3>
                    {cleanPrerequisites.length === 0 ? (
                        <p className="text-slate-400 font-sans text-sm italic">None required. Ready to learn directly!</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {cleanPrerequisites.map((c: any) => (
                                <Link href={`/concepts/${c.id}`} key={c.id}>
                                    <div className="p-3 wobbly-border border border-slate-100 hover:bg-sketch-primary/5 transition-colors font-display font-bold text-sm text-slate-700 flex justify-between items-center cursor-pointer">
                                        <span>{c.name}</span>
                                        <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Advanced Topics */}
                <div className="p-6 bg-white wobbly-border hard-shadow relative">
                    <div className="thumbtack absolute -top-3 left-8 pointer-events-none"></div>
                    <h3 className="font-display text-lg font-bold text-slate-800 mb-4 pb-1.5 border-b border-dashed border-slate-200 flex items-center gap-2">
                        <Award className="w-5 h-5 text-sketch-orange animate-pulse" /> Advanced Topics
                    </h3>
                    {cleanAdvancedTopics.length === 0 ? (
                        <p className="text-slate-400 font-sans text-sm italic">No advanced follow-up topics mapped.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {cleanAdvancedTopics.map((c: any) => (
                                <Link href={`/concepts/${c.id}`} key={c.id}>
                                    <div className="p-3 wobbly-border border border-slate-100 hover:bg-sketch-primary/5 transition-colors font-display font-bold text-sm text-slate-700 flex justify-between items-center cursor-pointer">
                                        <span>{c.name}</span>
                                        <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Used In */}
                <div className="p-6 bg-white wobbly-border hard-shadow relative">
                    <div className="thumbtack absolute -top-3 left-8 pointer-events-none"></div>
                    <h3 className="font-display text-lg font-bold text-slate-800 mb-4 pb-1.5 border-b border-dashed border-slate-200 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-600" /> Used In / Applied In
                    </h3>
                    {cleanUsedIn.length === 0 ? (
                        <p className="text-slate-400 font-sans text-sm italic">Used directly as standalone building blocks.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {cleanUsedIn.map((c: any) => (
                                <Link href={`/concepts/${c.id}`} key={c.id}>
                                    <div className="p-3 wobbly-border border border-slate-100 hover:bg-sketch-primary/5 transition-colors font-display font-bold text-sm text-slate-700 flex justify-between items-center cursor-pointer">
                                        <span>{c.name}</span>
                                        <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Related Concepts */}
                <div className="p-6 bg-white wobbly-border hard-shadow relative">
                    <div className="thumbtack absolute -top-3 left-8 pointer-events-none"></div>
                    <h3 className="font-display text-lg font-bold text-slate-800 mb-4 pb-1.5 border-b border-dashed border-slate-200 flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600 animate-pulse" /> Related Concepts
                    </h3>
                    {cleanRelated.length === 0 ? (
                        <p className="text-slate-400 font-sans text-sm italic">No other related concepts mapped.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {cleanRelated.map((c: any) => (
                                <Link href={`/concepts/${c.id}`} key={c.id}>
                                    <div className="p-3 wobbly-border border border-slate-100 hover:bg-sketch-primary/5 transition-colors font-display font-bold text-sm text-slate-700 flex justify-between items-center cursor-pointer">
                                        <span>{c.name}</span>
                                        <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

