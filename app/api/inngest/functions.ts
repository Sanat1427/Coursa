import { inngest } from "../../../config/inngest";
import { db } from "@/config/db";
import { chaptersTable } from "@/config/schema";
import { google } from "googleapis";
import { client } from "@/config/gemini";

export const generateVideoContentJob = inngest.createFunction(
    { id: "generate-video-content" },
    { event: "video/generate" },
    async ({ event, step }) => {
        const { chapter, courseId, courseName, language } = event.data;

        console.log("[BACKGROUND JOB] Starting video content generation for chapter:", chapter.chapterTitle, "in language:", language || 'English');
        const newChapterId = `${courseId}-${chapter.chapterId}`;

        // Step 1: Extract pre-generated YouTube search query
        const optimizedQuery = chapter.youtubeQuery || `${courseName || ''} ${chapter.chapterTitle} tutorial`;

        // Step 2: Fetch relevant YouTube Video
        const youtubeVideoId = await step.run("fetch-youtube-video", async () => {
            try {
                const youtube = google.youtube({
                    version: "v3",
                    auth: process.env.YOUTUBE_API_KEY,
                });

                const response = await youtube.search.list({
                    part: ["snippet"],
                    q: optimizedQuery,
                    maxResults: 3,
                    type: ["video"],
                    videoEmbeddable: "true",
                    videoSyndicated: "true",
                    videoDuration: "medium", // Filter out shorts, target 4-20 minute tutorials
                });

                const items = response.data.items;
                if (!items || items.length === 0) {
                    console.error("No YouTube video found for query:", optimizedQuery);
                    return null;
                }

                // Since we rely on the strictly pre-generated language query, just return the top result.
                return items[0].id?.videoId || null;
            } catch (error) {
                console.error("YouTube API Error:", error);
                return null;
            }
        });

        // Step 3: Generate Study Materials (GeeksforGeeks + W3Schools)
        const materials = await step.run("generate-chapter-materials", async () => {
            const articles: { source: string; title: string; url: string }[] = [];

            try {
                // Use pre-generated slug or fallback to basic string manipulation
                let slug = chapter.materialSlug || chapter.chapterTitle
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .trim()
                    .replace(/\s+/g, '-');

                console.log(`[MATERIALS] Chapter: "${chapter.chapterTitle}" → Slug: "${slug}"`);

                const fetchPromises = [];

                // 1. Try GeeksforGeeks
                fetchPromises.push((async () => {
                    const gfgUrl = `https://www.geeksforgeeks.org/${slug}/`;
                    try {
                        const gfgRes = await fetch(gfgUrl, { method: 'GET', redirect: 'follow' });
                        if (gfgRes.ok) {
                            const html = await gfgRes.text();
                            if (!html.includes("Whoops, that page is gone") && !html.includes("Page Not Found")) {
                                articles.push({ source: 'GeeksforGeeks', title: chapter.chapterTitle, url: gfgUrl });
                                console.log(`[MATERIALS] GFG OK: ${gfgUrl}`);
                            } else {
                                console.log(`[MATERIALS] GFG Soft 404 Detected: ${gfgUrl}`);
                            }
                        } else {
                            console.log(`[MATERIALS] GFG Error HTTP ${gfgRes.status}: ${gfgUrl}`);
                        }
                    } catch (e) {
                        console.error("[MATERIALS] GFG fetch error", e);
                    }
                })());

                const cleanSearch = slug.replace(/-/g, ' ');

                // 2. Try Wikipedia
                fetchPromises.push((async () => {
                    try {
                        console.log(`[MATERIALS] Searching Wikipedia for: ${cleanSearch}`);
                        let searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanSearch)}&utf8=&format=json&origin=*`);
                        let searchData = await searchRes.json();

                        // Fallback to courseName if specific chapter search yields 0 results
                        if (!searchData.query?.search?.length && courseName) {
                            console.log(`[MATERIALS] Wikipedia specific search empty. Falling back to course: ${courseName}`);
                            searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(courseName)}&utf8=&format=json&origin=*`);
                            searchData = await searchRes.json();
                        }

                        if (searchData.query?.search?.length > 0) {
                            const wikiTitle = searchData.query.search[0].title;
                            const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`;
                            articles.push({ source: 'Wikipedia', title: wikiTitle, url: wikiUrl });
                            console.log(`[MATERIALS] Wikipedia OK: ${wikiUrl}`);
                        } else {
                            console.log(`[MATERIALS] Wikipedia found no results for: ${cleanSearch} or ${courseName}`);
                        }
                    } catch (e) {
                        console.error("[MATERIALS] Wikipedia error", e);
                    }
                })());

                // 3. Try Mozilla Developer Network (MDN)
                fetchPromises.push((async () => {
                    try {
                        console.log(`[MATERIALS] Searching MDN Web Docs for: ${cleanSearch}`);
                        let searchRes = await fetch(`https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(cleanSearch)}`);
                        let searchData = await searchRes.json();

                        // Fallback to courseName if specific chapter search yields 0 results
                        if ((!searchData.documents || searchData.documents.length === 0) && courseName) {
                            console.log(`[MATERIALS] MDN specific search empty. Falling back to course: ${courseName}`);
                            searchRes = await fetch(`https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(courseName)}`);
                            searchData = await searchRes.json();
                        }

                        if (searchData.documents && searchData.documents.length > 0) {
                            // Take the top result from MDN
                            const doc = searchData.documents[0];
                            const mdnUrl = `https://developer.mozilla.org${doc.mdn_url}`;
                            articles.push({ source: 'MDN Web Docs', title: doc.title, url: mdnUrl });
                            console.log(`[MATERIALS] MDN OK: ${mdnUrl}`);
                        } else {
                            console.log(`[MATERIALS] MDN found no results for: ${cleanSearch} or ${courseName}`);
                        }
                    } catch (e) {
                        console.error("[MATERIALS] MDN error", e);
                    }
                })());

                // 3. Try W3Schools
                fetchPromises.push((async () => {
                    const w3slug = slug.replace(/-/g, '_');
                    const w3Candidates = [
                        `https://www.w3schools.com/js/js_${w3slug}.asp`,
                        `https://www.w3schools.com/python/python_${w3slug}.asp`,
                        `https://www.w3schools.com/${w3slug}/default.asp`,
                        `https://www.w3schools.com/sql/sql_${w3slug}.asp`,
                    ];
                    let w3Found = false;
                    for (const w3Url of w3Candidates) {
                        if (w3Found) break;
                        try {
                            const w3Res = await fetch(w3Url, { method: 'HEAD', redirect: 'follow' });
                            if (w3Res.ok || w3Res.status === 405) {
                                articles.push({ source: 'W3Schools', title: chapter.chapterTitle, url: w3Url });
                                console.log(`[MATERIALS] W3S OK: ${w3Url}`);
                                w3Found = true;
                            }
                        } catch (e) { /* silently try next */ }
                    }
                    if (!w3Found) console.log(`[MATERIALS] No W3Schools page found for slug: ${slug}`);
                })());

                await Promise.allSettled(fetchPromises);

            } catch (e) {
                console.error("[MATERIALS] Unexpected error in material generation", e);
            }

            return { articles };
        });

        // Step 4: Database Persist
        await step.run("persist-to-database", async () => {
            await db.insert(chaptersTable).values({
                courseId,
                chapterId: newChapterId,
                chapterTitle: chapter.chapterTitle || '',
                youtubeVideoId: youtubeVideoId,
                contentMaterials: materials,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        return { success: true, newChapterId, youtubeVideoId, materials };
    }
);

// Removed SaveAudioToStorage helper
