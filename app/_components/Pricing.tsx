"use client";
import React from 'react';
import { Check, X } from 'lucide-react';
import { SignInButton, useUser } from '@clerk/nextjs';

const pricingTiers = [
    {
        name: "Doodler",
        price: "Free",
        description: "Perfect for testing ideas",
        features: [
            { name: "5 AI course generations/mo", included: true },
            { name: "Basic video rendering", included: true },
            { name: "Standard support", included: true },
            { name: "Custom voiceovers", included: false },
            { name: "Export to MP4", included: false },
        ],
        buttonText: "Start Sketching",
        isPopular: false
    },
    {
        name: "Masterstroke",
        price: "$19",
        billingStr: "/month",
        description: "For serious content creators",
        features: [
            { name: "Unlimited course generations", included: true },
            { name: "HD 1080p video rendering", included: true },
            { name: "Priority email support", included: true },
            { name: "Custom AI voiceovers", included: true },
            { name: "Export to MP4 & PDF", included: true },
        ],
        buttonText: "Upgrade to Master",
        isPopular: true
    }
];

export default function Pricing() {
    const { user } = useUser();

    return (
        <section id="pricing" className="w-full px-6 py-24 relative overflow-hidden">
            <div className="absolute top-0 w-full h-full dot-pattern opacity-50 pointer-events-none -z-10" />

            <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center mb-16 relative">
                    <h2 className="font-display text-5xl font-bold text-slate-900 mb-6">
                        Simple <span className="text-sketch-orange italic scribble-underline">Pricing</span>
                    </h2>
                    <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto">
                        Choose the perfect plan to fuel your learning and creation journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
                    {pricingTiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`wobbly-border hard-shadow bg-white p-8 md:p-10 flex flex-col relative ${tier.isPopular ? 'border-sketch-primary border-4 -translate-y-2' : 'rotate-1'}`}
                        >
                            {tier.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sketch-yellow text-slate-900 font-display font-bold px-4 py-1 wobbly-border text-lg rotate-[-2deg]">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="font-display text-3xl font-bold text-slate-900">{tier.name}</h3>
                                <p className="font-sans text-slate-600 mt-2">{tier.description}</p>
                            </div>

                            <div className="mb-8 flex items-end gap-1">
                                <span className="font-display text-6xl font-bold text-slate-900">{tier.price}</span>
                                {tier.billingStr && <span className="font-sans text-slate-500 mb-2 font-medium">{tier.billingStr}</span>}
                            </div>

                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                {tier.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-center gap-3 font-sans text-lg text-slate-700">
                                        {feature.included ? (
                                            <Check className="w-6 h-6 text-green-500 shrink-0" strokeWidth={3} />
                                        ) : (
                                            <X className="w-5 h-5 text-slate-300 shrink-0" strokeWidth={2.5} />
                                        )}
                                        <span className={feature.included ? '' : 'text-slate-400 line-through decoration-slate-300'}>
                                            {feature.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                {user ? (
                                    <button className={`w-full font-display text-2xl py-4 wobbly-border transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${tier.isPopular ? 'bg-sketch-primary text-white hard-shadow' : 'bg-slate-100 text-slate-800 hard-shadow-sm border-dashed'}`}>
                                        {tier.buttonText}
                                    </button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <button className={`w-full font-display text-2xl py-4 wobbly-border transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${tier.isPopular ? 'bg-sketch-primary text-white hard-shadow' : 'bg-slate-100 text-slate-800 hard-shadow-sm border-dashed'}`}>
                                            {tier.buttonText}
                                        </button>
                                    </SignInButton>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
