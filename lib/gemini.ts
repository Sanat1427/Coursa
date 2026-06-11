import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Initialize Groq client if key is available
const groqApiKey = process.env.GROQ_API_KEY;
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Clean and validate JSON string helper
function tryCleanJSON(text: string): { success: boolean; data: any; cleanText: string } {
    const sanitized = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    try {
        const data = JSON.parse(sanitized);
        return { success: true, data, cleanText: sanitized };
    } catch (e: any) {
        console.warn(`[AI-Service] Standard JSON.parse failed: ${e?.message || e}. Attempting substring cleanup...`);
        // Try to find first '{' or '[' and last '}' or ']'
        const startBrace = sanitized.indexOf('{');
        const startBracket = sanitized.indexOf('[');
        let startIdx = -1;
        let endIdx = -1;
        
        if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
            startIdx = startBrace;
            endIdx = sanitized.lastIndexOf('}');
        } else if (startBracket !== -1) {
            startIdx = startBracket;
            endIdx = sanitized.lastIndexOf(']');
        }
        
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const substring = sanitized.substring(startIdx, endIdx + 1);
            try {
                const data = JSON.parse(substring);
                console.log(`[AI-Service] Substring cleanup JSON parse succeeded.`);
                return { success: true, data, cleanText: substring };
            } catch (innerErr: any) {
                console.error(`[AI-Service] Substring JSON.parse also failed: ${innerErr?.message || innerErr}`);
            }
        }
        return { success: false, data: null, cleanText: sanitized };
    }
}

// Generate context-aware safe default JSON payloads
function getSafeFallbackJSON(prompt: string): string {
    const lower = prompt.toLowerCase();
    
    // 1. Course layout prompt
    if (lower.includes("course name") || lower.includes("course type") || lower.includes("layout")) {
        console.log("[AI-Service] Returning safe layout fallback JSON.");
        return JSON.stringify({
            "courseName": "Generated Course Layout",
            "courseDescription": "A structured curriculum generated under backup mode.",
            "level": "Beginner",
            "totalChapters": 3,
            "chapters": [
                {
                    "chapterId": "ch1",
                    "chapterTitle": "Foundations and Overview",
                    "subContent": ["Introduction to topics", "Core concepts"],
                    "youtubeQuery": "Introduction and basic overview",
                    "webSearchQuery": "Introduction and fundamentals docs"
                },
                {
                    "chapterId": "ch2",
                    "chapterTitle": "Core Implementations",
                    "subContent": ["Key features", "Common pitfalls"],
                    "youtubeQuery": "Core implementation tutorial",
                    "webSearchQuery": "Core implementation reference"
                },
                {
                    "chapterId": "ch3",
                    "chapterTitle": "Advanced Practices",
                    "subContent": ["Real-world examples", "Optimization rules"],
                    "youtubeQuery": "Advanced guide best practices",
                    "webSearchQuery": "Advanced guide reference docs"
                }
            ]
        });
    }
    
    // 2. Quiz generation prompt
    if (lower.includes("quiz") || (lower.includes("multiple_choice") && lower.includes("questions"))) {
        console.log("[AI-Service] Returning safe quiz fallback JSON.");
        return JSON.stringify({
            "title": "Concept Evaluation Quiz",
            "description": "Test your knowledge on the lesson materials.",
            "questions": [
                {
                    "type": "MULTIPLE_CHOICE",
                    "questionText": "What is a primary design benefit of loosely-coupled software structures?",
                    "options": ["Loose Coupling and Reuse", "Tight Integration", "Monolithic compilation", "Manual linking"],
                    "correctAnswer": "Loose Coupling and Reuse",
                    "explanation": "Decoupled structures interact via clean interfaces, reducing side-effects and promoting reuse."
                },
                {
                    "type": "TRUE_FALSE",
                    "questionText": "True or False: Active recall is a highly efficient learning technique.",
                    "options": null,
                    "correctAnswer": "True",
                    "explanation": "Active testing forces memory retrieval, which strengthens retention."
                }
            ]
        });
    }

    // 3. Chapter summary / worked examples prompt
    if (lower.includes("workedexamples") || lower.includes("summary")) {
        console.log("[AI-Service] Returning safe summary/examples fallback JSON.");
        return JSON.stringify({
            "summary": "This chapter introduces the core architectural principles, detailing how concepts interact and are applied in industry applications.",
            "workedExamples": [
                {
                    "title": "Basic Pattern",
                    "code": "// Example starter code",
                    "explanation": "Establishes standard structural boundaries."
                }
            ]
        });
    }

    // 4. Concept extraction prompt
    if (lower.includes("concepts") && lower.includes("relationships")) {
        console.log("[AI-Service] Returning safe concept extraction fallback JSON.");
        return JSON.stringify({
            "concepts": [
                {
                    "id": "variables",
                    "name": "Variables & Scope",
                    "description": "Storage locations for data and accessibility scope.",
                    "category": "Programming Basics",
                    "whyItMatters": "Fundamental building block.",
                    "commonMistakes": "Out of scope reference.",
                    "realWorldApps": "All applications."
                }
            ],
            "relationships": []
        });
    }
    
    // 5. Revision questions (usually array)
    if (lower.includes("definition") && lower.includes("scenario")) {
        console.log("[AI-Service] Returning safe revision questions list fallback JSON.");
        return JSON.stringify([
            {
                "question": "What is the core definition of the concepts covered in this module?",
                "answer": "It outlines the foundational principles and implementations.",
                "difficulty": "EASY",
                "type": "DEFINITION"
            },
            {
                "question": "True or False: Using standard practices simplifies software integration.",
                "answer": "True. Standards reduce complexity and cognitive overhead.",
                "difficulty": "EASY",
                "type": "TRUE_FALSE"
            }
        ]);
    }
    
    // Default fallback
    console.log("[AI-Service] Returning safe generic fallback JSON.");
    return JSON.stringify({});
}

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
            let rawText = '';
            try {
                console.log(`[AI-Service] Attempting generation with Gemini (model: ${params.model || 'gemini-2.5-flash'})...`);
                const response = await geminiClient.models.generateContent({
                    model: params.model || 'gemini-2.5-flash',
                    contents: params.contents,
                    config: params.config
                });
                rawText = response.text || '';
                console.log(`[AI-Service] Gemini request successful. Raw Text Length: ${rawText.length}`);
                
                // If JSON mode is requested, validate the output format
                if (params.config?.responseMimeType === 'application/json') {
                    console.log(`[AI-Service] Validating Gemini JSON output...`);
                    const parseResult = tryCleanJSON(rawText);
                    if (!parseResult.success) {
                        throw new Error(`Gemini returned invalid JSON payload.`);
                    }
                    console.log(`[AI-Service] Gemini JSON parsed successfully.`);
                    
                    // Return normalized response wrapper containing clean text
                    return {
                        text: parseResult.cleanText,
                        candidates: [{ content: { parts: [{ text: parseResult.cleanText }] } }]
                    };
                }
                
                return response;
            } catch (error: any) {
                console.error(`[AI-Service] Gemini error or validation failed:`, error?.message || error);
                
                // 2. Try Fallback to Groq
                if (groqClient) {
                    console.warn(`[AI-Service] Fallback: Groq. Launching model Llama-3.3-70b-versatile...`);
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

                        const groqRawText = chatCompletion.choices[0]?.message?.content || '';
                        console.log(`[AI-Service] Groq request successful. Raw Text Length: ${groqRawText.length}`);

                        if (params.config?.responseMimeType === 'application/json') {
                            console.log(`[AI-Service] Validating Groq JSON output...`);
                            const parseResult = tryCleanJSON(groqRawText);
                            if (!parseResult.success) {
                                console.error(`[AI-Service] Groq returned invalid JSON payload. rawText:`, groqRawText);
                                throw new Error(`Groq returned invalid JSON.`);
                            }
                            console.log(`[AI-Service] Groq JSON parsed successfully.`);
                            return {
                                text: parseResult.cleanText,
                                candidates: [{ content: { parts: [{ text: parseResult.cleanText }] } }]
                            };
                        }

                        return {
                            text: groqRawText,
                            candidates: [{ content: { parts: [{ text: groqRawText }] } }]
                        };
                    } catch (groqError: any) {
                        console.error(`[AI-Service] Groq fallback failed:`, groqError?.message || groqError);
                        
                        // 3. Ultimate Fallback: Return context-aware mock JSON defaults
                        if (params.config?.responseMimeType === 'application/json') {
                            console.warn(`[AI-Service] Both models failed or returned invalid JSON. Using safe default fallback JSON.`);
                            let userPrompt = '';
                            if (typeof params.contents === 'string') {
                                userPrompt = params.contents;
                            } else if (Array.isArray(params.contents)) {
                                userPrompt = params.contents.map((part: any) => part.text || JSON.stringify(part)).join('\n');
                            }
                            const fallbackJSON = getSafeFallbackJSON(userPrompt + "\n" + (params.config?.systemInstruction || ''));
                            return {
                                text: fallbackJSON,
                                candidates: [{ content: { parts: [{ text: fallbackJSON }] } }]
                            };
                        }
                        
                        return {
                            text: "",
                            candidates: [{ content: { parts: [{ text: "" }] } }]
                        };
                    }
                }

                // If Groq is not configured, but JSON was requested, try to recover using fallback JSON
                if (params.config?.responseMimeType === 'application/json') {
                    console.warn(`[AI-Service] Gemini failed and Groq is not configured. Using safe default fallback JSON.`);
                    let userPrompt = '';
                    if (typeof params.contents === 'string') {
                        userPrompt = params.contents;
                    } else if (Array.isArray(params.contents)) {
                        userPrompt = params.contents.map((part: any) => part.text || JSON.stringify(part)).join('\n');
                    }
                    const fallbackJSON = getSafeFallbackJSON(userPrompt + "\n" + (params.config?.systemInstruction || ''));
                    return {
                        text: fallbackJSON,
                        candidates: [{ content: { parts: [{ text: fallbackJSON }] } }]
                    };
                }

                // Default fallback if all else fails and not JSON mode
                return {
                    text: "",
                    candidates: [{ content: { parts: [{ text: "" }] } }]
                };
            }
        }
    }
};