import { google } from "googleapis";

// Obvious low-quality keywords to reject
const LOW_QUALITY_TERMS = ["shorts", "clickbait", "teaser", "trailer", "reaction", "review", "gameplay", "unboxing", "tiktok"];

// Common stop words to exclude from keyword comparison
const STOP_WORDS = new Set([
    "how", "to", "the", "and", "a", "an", "for", "with", "in", "on", 
    "of", "at", "by", "tutorial", "course", "video", "guide", "introduction", "basics"
]);

export interface TechGroup {
    name: string;
    matches: string[];
    incompatibleWith: string[];
}

export const TECH_GROUPS: TechGroup[] = [
    {
        name: "ASP.NET Core",
        matches: ["asp.net core", ".net core", "asp.net", "c#", "dotnet core", "aspnet"],
        incompatibleWith: ["node.js", "nodejs", "express", "nestjs", "nest.js", "spring boot", "springboot", "django", "flask", "fastapi", "laravel", "php", "ruby on rails", "rails"]
    },
    {
        name: "Node.js",
        matches: ["node.js", "nodejs", "express", "nestjs", "nest.js"],
        incompatibleWith: ["asp.net core", ".net core", "asp.net", "c#", "dotnet core", "spring boot", "springboot", "django", "flask", "fastapi", "laravel", "php", "ruby on rails", "rails", "java", "spring", "csharp"]
    },
    {
        name: "Spring Boot",
        matches: ["spring boot", "springboot", "java"],
        incompatibleWith: ["node.js", "nodejs", "express", "nestjs", "nest.js", "django", "flask", "fastapi", "laravel", "php", "ruby on rails", "rails", "c#", ".net core", "asp.net core", "dotnet core"]
    },
    {
        name: "Django",
        matches: ["django", "flask", "fastapi", "python"],
        incompatibleWith: ["node.js", "nodejs", "express", "nestjs", "nest.js", "spring boot", "springboot", "laravel", "php", "ruby on rails", "rails", "c#", ".net core", "asp.net core", "dotnet core", "java", "spring"]
    },
    {
        name: "Laravel",
        matches: ["laravel", "php", "symfony"],
        incompatibleWith: ["node.js", "nodejs", "express", "nestjs", "nest.js", "spring boot", "springboot", "django", "flask", "fastapi", "ruby on rails", "rails", "c#", ".net core", "asp.net core", "dotnet core", "java", "spring", "python"]
    },
    {
        name: "React",
        matches: ["react", "react.js", "reactjs"],
        incompatibleWith: ["angular", "vue", "vuejs", "vue.js", "svelte"]
    },
    {
        name: "Angular",
        matches: ["angular", "angularjs"],
        incompatibleWith: ["react", "react.js", "reactjs", "vue", "vuejs", "vue.js", "svelte"]
    },
    {
        name: "Vue",
        matches: ["vue", "vuejs", "vue.js"],
        incompatibleWith: ["react", "react.js", "reactjs", "angular", "angularjs", "svelte"]
    },
    {
        name: "Svelte",
        matches: ["svelte"],
        incompatibleWith: ["react", "react.js", "reactjs", "angular", "angularjs", "vue", "vuejs", "vue.js"]
    },
    {
        name: "PostgreSQL",
        matches: ["postgresql", "postgres"],
        incompatibleWith: ["mysql", "mongodb", "sqlite", "oracle", "mssql", "sql server"]
    },
    {
        name: "MySQL",
        matches: ["mysql"],
        incompatibleWith: ["postgresql", "postgres", "mongodb", "sqlite", "oracle", "mssql", "sql server"]
    },
    {
        name: "MongoDB",
        matches: ["mongodb", "mongo"],
        incompatibleWith: ["postgresql", "postgres", "mysql", "sqlite", "oracle", "mssql", "sql server"]
    }
];

export function hasTechMatch(text: string, tech: string): boolean {
    const cleanText = text.toLowerCase();
    const cleanTech = tech.toLowerCase();
    
    if (cleanTech === "node.js") {
        return cleanText.includes("node.js") || cleanText.includes("nodejs");
    }
    if (cleanTech === "asp.net core") {
        return cleanText.includes("asp.net core") || cleanText.includes(".net core") || cleanText.includes("dotnet core") || cleanText.includes("aspnet core");
    }
    if (cleanTech === "spring boot") {
        return cleanText.includes("spring boot") || cleanText.includes("springboot");
    }
    if (cleanTech === "ruby on rails") {
        return cleanText.includes("ruby on rails") || cleanText.includes("rails");
    }
    
    const escaped = cleanTech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    return pattern.test(cleanText);
}

export function validateYouTubeVideo(videoTitle: string, videoDescription: string, topic: string): boolean {
    const cleanTitle = videoTitle.toLowerCase();
    
    if (LOW_QUALITY_TERMS.some(term => cleanTitle.includes(term))) {
        return false;
    }

    const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const keywords = cleanTopic.split(/\s+/).filter(k => k.length > 2 && !STOP_WORDS.has(k));

    if (keywords.length === 0) return true;

    const matchesTitle = keywords.some(kw => cleanTitle.includes(kw));
    return matchesTitle;
}

export function detectLanguage(title: string, description: string, channelTitle: string): string {
    const text = `${title} ${description} ${channelTitle}`.toLowerCase();

    // 1. Japanese
    const jpRegex = /[\u3040-\u30ff\u4e00-\u9faf]/;
    if (jpRegex.test(title) || jpRegex.test(description) || text.includes("日本語") || text.includes("nihongo") || text.includes("入門")) {
        return "Japanese";
    }

    // 2. Hindi
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(title) || hindiRegex.test(description)) {
        return "Hindi";
    }

    // 3. Hinglish
    const hinglishKeywords = [
        "hindi me", "hindi mein", "tutorial in hindi", "hindi tutorial", "kaise", "sikhe", 
        "sikhye", "banaen", "kya hai", "in hindi", "hinglish", "urdu", "learn in hindi"
    ];
    if (hinglishKeywords.some(kw => text.includes(kw))) {
        return "Hindi";
    }

    // 4. Spanish
    const spanishKeywords = ["español", "espanol", "en español", "en espanol", "para principiantes", "curso gratis", "cómo", "como", "tutorial de"];
    const spanishStopwords = [" del ", " con ", " para ", " por ", " cómo ", " curso ", " de ", " la ", " los ", " en "];
    if (spanishKeywords.some(kw => text.includes(kw)) || spanishStopwords.some(sw => text.includes(sw))) {
        return "Spanish";
    }

    // 5. French
    const frenchKeywords = ["français", "francais", "cours complet", "tutoriel", "apprendre", "débutant", "comment", "pour débutants"];
    const frenchStopwords = [" pour ", " avec ", " dans ", " sur ", " les ", " des ", " comment ", " cours "];
    if (frenchKeywords.some(kw => text.includes(kw)) || frenchStopwords.some(sw => text.includes(sw))) {
        return "French";
    }

    // 6. German
    const germanKeywords = ["deutsch", "kurs", "einführung", "anfänger", "wie man", "auf deutsch"];
    const germanStopwords = [" für ", " mit ", " und ", " das ", " der ", " die ", " wie ", "kurs"];
    if (germanKeywords.some(kw => text.includes(kw)) || germanStopwords.some(sw => text.includes(sw))) {
        return "German";
    }

    return "English";
}

export function validateFrameworkMatch(
    videoTitle: string,
    videoDescription: string,
    context: { courseName?: string; chapterTitle: string; learningObjective?: string; keywords: string[] }
): { isValid: boolean; reason?: string } {
    const combinedContextText = [
        context.courseName || '',
        context.chapterTitle,
        context.learningObjective || '',
        ...(context.keywords || [])
    ].join(' ').toLowerCase();

    const activeGroups: TechGroup[] = [];
    for (const group of TECH_GROUPS) {
        const isActive = group.matches.some(match => hasTechMatch(combinedContextText, match));
        if (isActive) {
            activeGroups.push(group);
        }
    }

    if (activeGroups.length === 0) {
        return { isValid: true };
    }

    for (const group of activeGroups) {
        for (const incompatibleTech of group.incompatibleWith) {
            if (hasTechMatch(videoTitle, incompatibleTech)) {
                return {
                    isValid: false,
                    reason: `Framework mismatch in title: contains "${incompatibleTech}" which is incompatible with "${group.name}".`
                };
            }
        }
    }

    return { isValid: true };
}

export function calculateVideoScoreDetailed(
    video: { title: string; description: string; channelTitle: string; publishedAt: string },
    context: { chapterTitle: string; learningObjective: string; keywords: string[]; userLanguage: string },
    activeGroups: TechGroup[]
) {
    const cleanTitle = video.title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const cleanTopic = context.chapterTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "");

    // 1. Exact topic match (+5)
    let exactTopicMatch = cleanTitle.includes(cleanTopic);
    if (!exactTopicMatch) {
        const topicWords = cleanTopic.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        if (topicWords.length > 0 && topicWords.every(w => cleanTitle.includes(w))) {
            exactTopicMatch = true;
        }
    }
    const exactTopicScore = exactTopicMatch ? 5 : 0;

    // 2. Keyword match (+3)
    const keywords = context.keywords || [];
    const keywordMatches = keywords.filter(kw => hasTechMatch(video.title, kw));
    const keywordScore = keywordMatches.length > 0 ? 3 : 0;

    // 3. Framework match (+3)
    const matchesFramework = activeGroups.some(group => 
        group.matches.some(match => hasTechMatch(video.title, match))
    );
    const frameworkScore = matchesFramework ? 3 : 0;

    // 4. Learning objective match (+2)
    const cleanObjective = (context.learningObjective || "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const objectiveWords = cleanObjective.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const matchesObjective = objectiveWords.some(w => cleanTitle.includes(w));
    const objectiveScore = matchesObjective ? 2 : 0;

    // 5. Keyword presence in description (+3)
    const descKeywordMatches = keywords.filter(kw => hasTechMatch(video.description, kw));
    const descKeywordScore = descKeywordMatches.length > 0 ? 3 : 0;

    // 6. Topic presence in description (+3)
    const cleanDesc = video.description.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    let descTopicMatch = cleanDesc.includes(cleanTopic);
    if (!descTopicMatch) {
        const topicWords = cleanTopic.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        if (topicWords.length > 0 && topicWords.some(w => cleanDesc.includes(w))) {
            descTopicMatch = true;
        }
    }
    const descTopicScore = descTopicMatch ? 3 : 0;

    const total = exactTopicScore + keywordScore + frameworkScore + objectiveScore + descKeywordScore + descTopicScore;

    return {
        total,
        breakdown: {
            exactTopicScore,
            keywordScore,
            frameworkScore,
            objectiveScore,
            descKeywordScore,
            descTopicScore
        }
    };
}

export function calculateVideoScore(
    video: { title: string; description: string; channelTitle: string; publishedAt: string },
    context: { chapterTitle: string; learningObjective: string; keywords: string[]; userLanguage: string }
): number {
    const combinedContextText = [
        context.chapterTitle,
        context.learningObjective || '',
        ...(context.keywords || [])
    ].join(' ').toLowerCase();

    const activeGroups: TechGroup[] = [];
    for (const group of TECH_GROUPS) {
        const isActive = group.matches.some(match => hasTechMatch(combinedContextText, match));
        if (isActive) {
            activeGroups.push(group);
        }
    }

    return calculateVideoScoreDetailed(video, context, activeGroups).total;
}

export async function fetchValidatedYouTubeVideo(
    chapterOrQuery: string | {
        chapterTitle: string;
        language?: string;
        learningObjective?: string;
        youtubeQuery?: string;
        fallbackQueries?: string[];
        keywords?: string[];
        subContent?: string[];
    },
    chapterTitleOrUserLanguage?: string,
    courseName?: string
): Promise<any> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn("[YouTube] YOUTUBE_API_KEY missing.");
        return typeof chapterOrQuery === "string" 
            ? "No suitable video found" 
            : { videoId: null, fallbackMessage: "No suitable video found", alternativeVideos: [] };
    }

    let chapter: any;
    let targetLang = "English";

    if (typeof chapterOrQuery === "string") {
        // Legacy call: fetchValidatedYouTubeVideo(optimizedQuery, chapterTitle)
        chapter = {
            chapterTitle: chapterTitleOrUserLanguage || "Chapter",
            youtubeQuery: chapterOrQuery,
            fallbackQueries: [],
            keywords: [],
        };
        const queryLower = chapterOrQuery.toLowerCase();
        if (queryLower.includes("hindi")) targetLang = "Hindi";
        else if (queryLower.includes("spanish") || queryLower.includes("español") || queryLower.includes("espanol")) targetLang = "Spanish";
        else if (queryLower.includes("french") || queryLower.includes("français") || queryLower.includes("francais")) targetLang = "French";
        else if (queryLower.includes("german") || queryLower.includes("deutsch")) targetLang = "German";
        else if (queryLower.includes("japanese") || queryLower.includes("日本語")) targetLang = "Japanese";
    } else {
        chapter = chapterOrQuery;
        targetLang = chapterTitleOrUserLanguage || chapter.language || "English";
    }

    const learningObj = chapter.learningObjective || chapter.chapterTitle;
    const keywords = chapter.keywords || [];

    // Detect active groups from context
    const combinedContextText = [
        courseName || '',
        chapter.chapterTitle,
        learningObj,
        ...keywords
    ].join(' ').toLowerCase();

    const activeGroups: TechGroup[] = [];
    for (const group of TECH_GROUPS) {
        const isActive = group.matches.some(match => hasTechMatch(combinedContextText, match));
        if (isActive) {
            activeGroups.push(group);
        }
    }

    // Prioritized search queries fallback order
    const queriesToTry: string[] = [];

    // 1. Primary Query
    const primaryQuery = chapter.youtubeQuery || `${courseName || ''} ${chapter.chapterTitle}`;
    queriesToTry.push(primaryQuery);

    // 2. Fallbacks
    if (chapter.fallbackQueries && chapter.fallbackQueries.length > 0) {
        chapter.fallbackQueries.forEach((q: string) => {
            if (!queriesToTry.includes(q)) queriesToTry.push(q);
        });
    }

    // 3. Fallback: Topic Only
    const topicOnlyQuery = `${courseName || ''} ${chapter.chapterTitle} tutorial`;
    if (!queriesToTry.includes(topicOnlyQuery)) {
        queriesToTry.push(topicOnlyQuery);
    }

    const youtube = google.youtube({
        version: "v3",
        auth: apiKey,
    });

    const allCandidateVideos: Array<any> = [];
    const rejectedVideos: Array<{ title: string; reason: string; score?: number }> = [];
    let selectedVideo = null;

    // Multi-stage search: try one query, check if best meets threshold (>= 8). If so, stop.
    for (let i = 0; i < queriesToTry.length; i++) {
        const query = queriesToTry[i];
        console.log(`[YouTube] Running search stage ${i + 1}/${queriesToTry.length} with query: "${query}"`);

        try {
            const response = await youtube.search.list({
                part: ["snippet"],
                q: query,
                maxResults: 10,
                type: ["video"],
                videoEmbeddable: "true",
                videoSyndicated: "true",
                videoDuration: "medium",
            });

            const items = response.data.items || [];
            const queryCandidates: any[] = [];

            for (const item of items) {
                const videoId = item.id?.videoId;
                if (!videoId) continue;

                // Deduplicate
                if (allCandidateVideos.some(v => v.videoId === videoId)) continue;

                const title = item.snippet?.title || '';
                const description = item.snippet?.description || '';
                const channelTitle = item.snippet?.channelTitle || '';
                const publishedAt = item.snippet?.publishedAt || '';

                // Quality checks
                if (LOW_QUALITY_TERMS.some(term => title.toLowerCase().includes(term))) {
                    rejectedVideos.push({ title, reason: "Contains low quality terms" });
                    continue;
                }

                // Framework check
                const frameworkCheck = validateFrameworkMatch(title, description, {
                    courseName,
                    chapterTitle: chapter.chapterTitle,
                    learningObjective: learningObj,
                    keywords
                });

                if (!frameworkCheck.isValid) {
                    rejectedVideos.push({ title, reason: frameworkCheck.reason || "Framework mismatch" });
                    continue;
                }

                const scoreResult = calculateVideoScoreDetailed(
                    { title, description, channelTitle, publishedAt },
                    { chapterTitle: chapter.chapterTitle, learningObjective: learningObj, keywords, userLanguage: targetLang },
                    activeGroups
                );

                const detectedLanguage = detectLanguage(title, description, channelTitle);

                const candidate = {
                    videoId,
                    title,
                    description,
                    channelTitle,
                    publishedAt,
                    score: scoreResult.total,
                    breakdown: scoreResult.breakdown,
                    queryUsed: query,
                    detectedLanguage
                };

                queryCandidates.push(candidate);
                allCandidateVideos.push(candidate);
            }

            // Sort by score desc for this query
            queryCandidates.sort((a, b) => b.score - a.score);

            if (queryCandidates.length > 0 && queryCandidates[0].score >= 8) {
                selectedVideo = queryCandidates[0];
                // Record the rest as below threshold or simply alternatives
                for (const v of queryCandidates.slice(1)) {
                    rejectedVideos.push({ title: v.title, reason: `Not selected (score ${v.score})`, score: v.score });
                }
                break; // Stop querying fallback queries
            } else {
                // Record all candidates as rejected due to being below threshold
                for (const v of queryCandidates) {
                    rejectedVideos.push({ title: v.title, reason: `Score ${v.score} below threshold [8]`, score: v.score });
                }
            }

        } catch (err: any) {
            console.error(`[YouTube] Error searching query "${query}":`, err?.message || err);
        }
    }

    // --- LOGGING ---
    console.log("==================================================");
    console.log("YOUTUBE VIDEO RETRIEVAL LOGS");
    console.log("==================================================");
    console.log(`Course Name:        "${courseName || 'N/A'}"`);
    console.log(`Chapter Title:      "${chapter.chapterTitle}"`);
    console.log(`Learning Objective: "${learningObj}"`);
    console.log(`Keywords:           [${keywords.join(", ")}]`);
    console.log(`Target Language:    "${targetLang}"`);
    console.log(`Selected Query:     "${selectedVideo ? selectedVideo.queryUsed : (queriesToTry[0] || 'N/A')}"`);
    console.log("--------------------------------------------------");
    console.log("Top 10 Candidates:");
    const sortedCandidates = [...allCandidateVideos].sort((a, b) => b.score - a.score).slice(0, 10);
    sortedCandidates.forEach((c, idx) => {
        console.log(`[${idx + 1}] Title: "${c.title}"`);
        console.log(`    Channel: "${c.channelTitle}"`);
        console.log(`    Score: ${c.score} (Exact Topic: ${c.breakdown.exactTopicScore}, Keyword: ${c.breakdown.keywordScore}, Framework: ${c.breakdown.frameworkScore}, Objective: ${c.breakdown.objectiveScore}, Desc Keyword: ${c.breakdown.descKeywordScore}, Desc Topic: ${c.breakdown.descTopicScore})`);
        console.log(`    Language: ${c.detectedLanguage} | Query: "${c.queryUsed}"`);
    });
    console.log("--------------------------------------------------");
    console.log("Rejected Videos:");
    rejectedVideos.slice(0, 15).forEach((r, idx) => {
        console.log(`[${idx + 1}] Title: "${r.title}"`);
        console.log(`    Reason: ${r.reason}`);
    });
    console.log("--------------------------------------------------");
    if (selectedVideo) {
        console.log("Selected Video:");
        console.log(`  Title:    "${selectedVideo.title}"`);
        console.log(`  Video ID: "${selectedVideo.videoId}"`);
        console.log(`  Score:    ${selectedVideo.score}`);
    } else {
        console.log("Selected Video: NONE (No suitable video found)");
    }
    console.log("==================================================");

    if (typeof chapterOrQuery === "string") {
        return selectedVideo ? selectedVideo.videoId : "No suitable video found";
    }

    if (!selectedVideo) {
        // Build alternative list using candidates that were found but didn't meet the threshold (or any valid candidate)
        const alternativeVideos = allCandidateVideos
            .slice(0, 4)
            .map(v => ({
                videoId: v.videoId,
                title: v.title,
                channelTitle: v.channelTitle,
                language: v.detectedLanguage,
                score: v.score
            }));

        return {
            videoId: null,
            videoLanguage: targetLang,
            isFallback: false,
            fallbackMessage: "No suitable video found",
            alternativeVideos
        };
    }

    const detectedLang = selectedVideo.detectedLanguage;
    const isTargetNonEnglish = targetLang.toLowerCase() !== "english";
    const selectedMatchesTarget = (targetLang.toLowerCase() === detectedLang.toLowerCase()) ||
                                  ((targetLang.toLowerCase() === "hindi" || targetLang.toLowerCase() === "hinglish") && 
                                   (detectedLang.toLowerCase() === "hindi" || detectedLang.toLowerCase() === "hinglish"));

    let isFallback = false;
    let fallbackMessage = "";

    if (isTargetNonEnglish && !selectedMatchesTarget) {
        isFallback = true;
        fallbackMessage = `We couldn't find a high-quality ${targetLang} video for this chapter. Showing the best English alternative.`;
    }

    const alternativeVideos = allCandidateVideos
        .filter(v => v.videoId !== selectedVideo?.videoId)
        .slice(0, 4)
        .map(v => ({
            videoId: v.videoId,
            title: v.title,
            channelTitle: v.channelTitle,
            language: v.detectedLanguage,
            score: v.score
        }));

    return {
        videoId: selectedVideo.videoId,
        videoLanguage: detectedLang,
        isFallback,
        fallbackMessage,
        alternativeVideos
    };
}
