import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Initialize Groq client if key is available
const groqApiKey = process.env.GROQ_API_KEY;
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export const client = {
    models: {
        async generateContent(params: {
            model?: string;
            contents: any;
            config?: {
                systemInstruction?: string;
                responseMimeType?: string;
                [key: string]: any;
            }
        }) {
            // 1. Try Gemini
            try {
                console.log(`[AI-Service] Attempting generation with Gemini (model: ${params.model || 'gemini-2.5-flash'})...`);
                const response = await geminiClient.models.generateContent({
                    model: params.model || 'gemini-2.5-flash',
                    contents: params.contents,
                    config: params.config
                });
                console.log(`[AI-Service] Gemini request successful.`);
                return response;
            } catch (error: any) {
                console.error(`[AI-Service] Gemini error encountered:`, error?.message || error);
                
                const isQuotaOrServiceError = 
                    error?.status === 429 ||
                    error?.status === 503 ||
                    error?.message?.includes('429') || 
                    error?.message?.includes('quota') || 
                    error?.message?.includes('limit') || 
                    error?.message?.includes('RESOURCE_EXHAUSTED') ||
                    error?.message?.includes('exhausted') ||
                    error?.message?.includes('User exceeded your current quota');
                
                if (isQuotaOrServiceError && groqClient) {
                    console.warn(`[AI-Service] Gemini quota exceeded or rate limited. Falling back to Groq...`);
                    try {
                        const groqModel = 'llama-3.3-70b-versatile';
                        
                        const systemPrompt = params.config?.systemInstruction || '';
                        
                        let userPrompt = '';
                        if (typeof params.contents === 'string') {
                            userPrompt = params.contents;
                        } else if (Array.isArray(params.contents)) {
                            userPrompt = params.contents.map((part: any) => {
                                if (typeof part === 'string') return part;
                                return part.text || JSON.stringify(part);
                            }).join('\n');
                        } else {
                            userPrompt = JSON.stringify(params.contents);
                        }

                        const messages: any[] = [];
                        if (systemPrompt) {
                            messages.push({ role: 'system', content: systemPrompt });
                        }
                        messages.push({ role: 'user', content: userPrompt });

                        const responseFormat = params.config?.responseMimeType === 'application/json' 
                            ? { type: 'json_object' as const } 
                            : undefined;

                        console.log(`[AI-Service] Calling Groq (model: ${groqModel}), jsonMode: ${!!responseFormat}...`);
                        const chatCompletion = await groqClient.chat.completions.create({
                            messages,
                            model: groqModel,
                            temperature: 0.2,
                            response_format: responseFormat,
                        });

                        const text = chatCompletion.choices[0]?.message?.content || '';
                        console.log(`[AI-Service] Groq request successful.`);
                        
                        // Return the same structure as Gemini API Client
                        return {
                            text,
                            candidates: [{ content: { parts: [{ text }] } }]
                        };
                    } catch (groqError: any) {
                        console.error(`[AI-Service] Groq fallback failed:`, groqError?.message || groqError);
                        throw new Error(`AI generation failed. Gemini: ${error?.message}. Groq: ${groqError?.message}`);
                    }
                }

                // If it's not a quota error or Groq client isn't configured, throw the original error
                throw error;
            }
        }
    }
};