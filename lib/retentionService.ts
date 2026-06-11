import { db } from "./db";
import { 
    revisionScheduleTable, 
    memoryStrengthTable, 
    revisionQuestionsTable, 
    conceptsTable, 
    conceptRelationshipsTable, 
    chapterConceptsTable,
    courseTable,
    chaptersTable,
    conceptMasteryTable,
    userProgressTable
} from "./schema";
import { eq, and, lte, sql, inArray, ne } from "drizzle-orm";
import { client } from "./gemini";

// Predefined Concepts list to seed the DB (fallback & bootstrap)
export const CORE_CONCEPTS = [
  // Programming Basics
  { id: "variables", name: "Variables & Scope", description: "Storage locations for data and their accessibility rules in execution contexts.", category: "Programming Basics", whyItMatters: "Fundamental building block of any program.", commonMistakes: "Using variables out of scope or referencing before initialization.", realWorldApps: "Every software application ever written." },
  { id: "loops", name: "Control Flow Loops", description: "Iterative execution blocks including for, while, and do-while loops.", category: "Programming Basics", whyItMatters: "Allows execution of code blocks repeatedly without duplication.", commonMistakes: "Infinite loops causing thread blocking or off-by-one errors.", realWorldApps: "Iterating through list items, game loops." },
  { id: "functions", name: "Functions & Scope", description: "Reusable blocks of code, parameters, return values, and closures.", category: "Programming Basics", whyItMatters: "Promotes code modularity, reuse, and encapsulation.", commonMistakes: "Side effects, nesting functions too deep, scope leakage.", realWorldApps: "Microservices, backend handlers, frontend components." },
  { id: "recursion", name: "Recursion", description: "A programming technique where a function calls itself to solve sub-problems.", category: "Programming Basics", whyItMatters: "Solves nested, tree-like, or fractal structures elegantly.", commonMistakes: "Stack overflow due to missing or incorrect base case.", realWorldApps: "JSON parsers, filesystem traversal, DOM rendering." },
  { id: "arrays", name: "Arrays", description: "Contiguous blocks of memory holding elements of the same type.", category: "Programming Basics", whyItMatters: "Provides O(1) random access to elements via indices.", commonMistakes: "Buffer overflows, index out of bounds, copying arrays in O(N).", realWorldApps: "Image buffers, database records memory pages." },
  { id: "time-complexity", name: "Time Complexity", description: "Computational complexity describing execution time of an algorithm (Big O).", category: "Programming Basics", whyItMatters: "Crucial for predicting application performance at scale.", commonMistakes: "Confusing average-case with worst-case complexity.", realWorldApps: "Performance profiling, choosing algorithms for high load." },
  { id: "space-complexity", name: "Space Complexity", description: "Computational complexity describing memory consumption of an algorithm.", category: "Programming Basics", whyItMatters: "Prevents Out-Of-Memory exceptions in limited environments.", commonMistakes: "Ignoring call-stack depth memory usage in recursion.", realWorldApps: "Embedded software, high-frequency ingestion streams." },

  // Data Structures
  { id: "linked-lists", name: "Linked Lists", description: "Linear collections of data nodes linked together via memory pointers.", category: "Data Structures", whyItMatters: "Efficient element insertion and deletion in O(1).", commonMistakes: "Losing the pointer reference, causing memory leaks.", realWorldApps: "LRU caches, undo history tracking." },
  { id: "stacks", name: "Stacks", description: "LIFO (Last In First Out) linear data structure supporting Push and Pop.", category: "Data Structures", whyItMatters: "Essential for backtracking algorithms and state storage.", commonMistakes: "Calling pop on an empty stack (Stack Underflow).", realWorldApps: "Undo-redo actions, call stack in runtimes." },
  { id: "queues", name: "Queues", description: "FIFO (First In First Out) linear data structure supporting Enqueue and Dequeue.", category: "Data Structures", whyItMatters: "Coordinates asynchronous execution queues between systems.", commonMistakes: "Circular queue buffer pointer errors.", realWorldApps: "Task queues, message brokers, printer spoolers." },
  { id: "hash-maps", name: "Hash Maps & Hash Tables", description: "Key-value pair data structures supporting average O(1) reads and writes.", category: "Data Structures", whyItMatters: "Allows near-instantaneous search and retrieval.", commonMistakes: "Poor hash functions causing excessive key collisions.", realWorldApps: "Symbol tables, caching keys, object lookups." },
  { id: "binary-trees", name: "Binary Trees", description: "Node-based tree structures where each node has at most two children.", category: "Data Structures", whyItMatters: "Base structure for hierarchical, sorted lookup algorithms.", commonMistakes: "Treating binary trees as BSTs without ensuring order.", realWorldApps: "File systems, compiler AST parser trees." },
  { id: "binary-search-trees", name: "Binary Search Trees (BST)", description: "Ordered binary trees where left subtree is smaller and right is larger.", category: "Data Structures", whyItMatters: "Fast O(log N) search, insert, and delete on sorted data.", commonMistakes: "Allowing trees to become unbalanced (degenerating to O(N)).", realWorldApps: "Symbol tables, databases indexing structures." },
  { id: "avl-trees", name: "AVL Trees", description: "Self-balancing binary search trees where height difference is at most 1.", category: "Data Structures", whyItMatters: "Guarantees strict O(log N) operations through auto-balancing.", commonMistakes: "Complex tree rotation logic implementation errors.", realWorldApps: "High-frequency lookup tables, database indexes." },
  { id: "red-black-trees", name: "Red-Black Trees", description: "Self-balancing binary search trees with color-coded nodes and validation rules.", category: "Data Structures", whyItMatters: "Less frequent rotations during inserts compared to AVL.", commonMistakes: "Violating the consecutive red nodes rule during balancing.", realWorldApps: "OS memory schedulers, Java TreeMap, C++ STL map." },
  { id: "trie", name: "Trie (Prefix Tree)", description: "Search trees used to store associative keys, often strings.", category: "Data Structures", whyItMatters: "Fast prefix-matching searches in O(L) length of word.", commonMistakes: "Extremely high memory footprint if not optimized.", realWorldApps: "Autocomplete search dropdowns, IP routing tables." },
  { id: "graphs", name: "Graphs", description: "Collections of vertices (nodes) connected together by directed or undirected edges.", category: "Data Structures", whyItMatters: "Models network routing, social connections, dependencies.", commonMistakes: "Infinite loops during traversal due to unvisited nodes.", realWorldApps: "Google Maps routing, Facebook friend network graph." },

  // Algorithms
  { id: "binary-search", name: "Binary Search", description: "O(log n) search algorithm running on sorted linear collections.", category: "Algorithms", whyItMatters: "Exponentially faster search than linear scanning.", commonMistakes: "Running binary search on unsorted array inputs.", realWorldApps: "Database index lookup, library search catalogs." },
  { id: "sorting-algorithms", name: "Sorting", description: "Reordering collections (e.g. Quick Sort, Merge Sort, Bubble Sort).", category: "Algorithms", whyItMatters: "Prepares collections for search and analytics operations.", commonMistakes: "Choosing O(N^2) bubble sort under performance constraints.", realWorldApps: "Excel sort column, eCommerce catalog filters." },
  { id: "divide-and-conquer", name: "Divide and Conquer", description: "Algorithm design paradigm recursively breaking problems into sub-problems.", category: "Algorithms", whyItMatters: "Parallelizes problems and reduces time complexities.", commonMistakes: "Excessive division overhead exceeding speed gain.", realWorldApps: "MapReduce, QuickSort, Fast Fourier Transform." },
  { id: "dfs-bfs", name: "DFS & BFS", description: "Depth-First and Breadth-First graph and tree traversal strategies.", category: "Algorithms", whyItMatters: "Core search algorithms for traversing relational maps.", commonMistakes: "Exhausting system call stack in deep DFS trees.", realWorldApps: "Web crawlers, game AI pathfinding paths." },
  { id: "dijkstra", name: "Dijkstra's Algorithm", description: "Algorithm for finding the shortest paths between nodes in a graph.", category: "Algorithms", whyItMatters: "Finds absolute shortest paths in weighted network topologies.", commonMistakes: "Running Dijkstra on graphs containing negative edge weights.", realWorldApps: "GPS navigation maps, network packet routing." },
  { id: "dynamic-programming", name: "Dynamic Programming", description: "Optimization technique utilizing memoization of overlapping sub-problems.", category: "Algorithms", whyItMatters: "Saves massive redundant computations via caching state.", commonMistakes: "Identifying wrong sub-problems or forgetting memo tables.", realWorldApps: "DNA sequence alignment, knapsack solutions." },
  { id: "greedy-algorithms", name: "Greedy Algorithms", description: "Algorithms making locally optimal choices at each step.", category: "Algorithms", whyItMatters: "Simple and fast heuristics that approximate solution keys.", commonMistakes: "Assuming local greedy choice always yields global optimum.", realWorldApps: "Huffman coding, Prim's Minimal Spanning Tree." },

  // Backend & Systems
  { id: "http-protocol", name: "HTTP Protocol", description: "Hypertext Transfer Protocol, requests, responses, headers, and status codes.", category: "Backend & Systems", whyItMatters: "The protocol backing modern web communications.", commonMistakes: "Confusing HTTP status codes (e.g., return 200 for error).", realWorldApps: "API backends, REST endpoints, web server logs." },
  { id: "rest-apis", name: "REST APIs", description: "Representational State Transfer stateless API design principles.", category: "Backend & Systems", whyItMatters: "Provides standardized resource interfaces between servers.", commonMistakes: "Violating idempotency rules of GET or PUT requests.", realWorldApps: "Public SaaS APIs, internal microservices." },
  { id: "graphql", name: "GraphQL", description: "Query language and runtime engine for APIs offering flexible data queries.", category: "Backend & Systems", whyItMatters: "Eliminates over-fetching and under-fetching by API clients.", commonMistakes: "The N+1 query execution problem in backend resolvers.", realWorldApps: "GitHub GraphQL API, complex web layouts." },
  { id: "caching-systems", name: "Caching & Redis", description: "In-memory caching patterns to speed up application data retrievals.", category: "Backend & Systems", whyItMatters: "Improves data latency by orders of magnitude under load.", commonMistakes: "Failing to expire keys, resulting in stale data states.", realWorldApps: "Redis session stores, CDN asset caching servers." },
  { id: "load-balancing", name: "Load Balancing", description: "Distributing network traffic across multiple computational instances.", category: "Backend & Systems", whyItMatters: "Prevents single server points of failure (spikes).", commonMistakes: "Failing to setup health checks for instance pools.", realWorldApps: "AWS ALB, NGINX load distribution proxies." },
  { id: "containerization-docker", name: "Docker & Containerization", description: "Packaging software and dependencies in isolated container processes.", category: "Backend & Systems", whyItMatters: "Eliminates 'works on my machine' environmental errors.", commonMistakes: "Leaving hardcoded secrets inside compiled image layers.", realWorldApps: "CI/CD deployments, cloud service platforms." },
  { id: "kubernetes", name: "Kubernetes & Orchestration", description: "Orchestrating containerized systems, scaling, and load routing.", category: "Backend & Systems", whyItMatters: "Automates scaling, rolling updates, and self-healing.", commonMistakes: "Misconfiguring memory limits causing OOM-kill loops.", realWorldApps: "Production cloud scaling systems, SaaS providers." },
  { id: "microservices", name: "Microservices", description: "Architectural style structuring an app as a collection of loose services.", category: "Backend & Systems", whyItMatters: "Enables independent team deployments and scaling bounds.", commonMistakes: "Distributed transaction loops causing cascade locks.", realWorldApps: "Netflix backend, large-scale fintech clusters." },

  // Databases
  { id: "sql-databases", name: "Relational SQL Databases", description: "Tabular databases, schemas, constraints, and relational joins.", category: "Databases", whyItMatters: "Guarantees data integrity and normalization of schemas.", commonMistakes: "Missing foreign key constraints or indexes on joins.", realWorldApps: "PostgreSQL, MySQL, bank transaction databases." },
  { id: "nosql-databases", name: "NoSQL Databases", description: "Document, key-value, column-family, or graph database systems.", category: "Databases", whyItMatters: "Scales horizontally to handle massive semi-structured feeds.", commonMistakes: "Trying to enforce SQL-like joins in document structures.", realWorldApps: "MongoDB, Cassandra, logging warehouses." },
  { id: "database-indexing", name: "Database Indexing", description: "B-Tree and Hash indexes to improve query search performance.", category: "Databases", whyItMatters: "Turns slow table scans into immediate key index seeks.", commonMistakes: "Creating too many indexes, slowing down write queries.", realWorldApps: "Postgres B-Trees, search index mapping arrays." },
  { id: "database-transactions", name: "ACID Transactions", description: "Atomicity, Consistency, Isolation, and Durability transaction guarantees.", category: "Databases", whyItMatters: "Ensures database remains valid even in case of crashes.", commonMistakes: "Setting wrong isolation levels causing dirty reads.", realWorldApps: "Payment processing ledgers, checkout inventory." },

  // Frontend
  { id: "dom-manipulation", name: "DOM Manipulation", description: "Interacting with and re-rendering Document Object Model nodes.", category: "Frontend", whyItMatters: "Direct control over page rendering structure dynamically.", commonMistakes: "Triggering expensive document layouts during animations.", realWorldApps: "Varying interactive elements, vanilla JS scripts." },
  { id: "react-framework", name: "React Framework", description: "Component-based declarative UI development using virtual DOM.", category: "Frontend", whyItMatters: "Encapsulates reusable components, syncing state to DOM.", commonMistakes: "Infinite re-render loops in hooks like useEffect.", realWorldApps: "Coursa Dashboard UI, SaaS interfaces." },
  { id: "state-management", name: "State Management", description: "Unidirectional and context-based state synchronization in frontend layouts.", category: "Frontend", whyItMatters: "Avoids props-drilling, sharing state across distant nodes.", commonMistakes: "Storing local states in global stores unnecessarily.", realWorldApps: "Redux Toolkit, Zustand stores, React Context." },
  { id: "nextjs-framework", name: "Next.js Framework", description: "Full-stack React framework supporting SSR, SSG, and routing.", category: "Frontend", whyItMatters: "SEO-friendly pre-rendering out-of-the-box.", commonMistakes: "Mixing client components and server code incorrectly.", realWorldApps: "Modern full-stack web applications, blogs." },

  // AI & Data Science
  { id: "machine-learning", name: "Machine Learning", description: "Training models to make predictions without explicit programming.", category: "AI & Data Science", whyItMatters: "Enables systems to recognize patterns and make decisions.", commonMistakes: "Overfitting model to train set, failing on test inputs.", realWorldApps: "Recommendation systems, fraud detectors." },
  { id: "neural-networks", name: "Neural Networks & Deep Learning", description: "Multi-layered network models modeled on brain architectures.", category: "AI & Data Science", whyItMatters: "Powers modern AI models, vision, and natural language.", commonMistakes: "Setting too high learning rate, causing gradient explosions.", realWorldApps: "Gemini AI model, automated self-driving cars." }
];

export const CORE_RELATIONSHIPS = [
  { source: "arrays", target: "binary-search", type: "PREREQUISITE" },
  { source: "sorting-algorithms", target: "binary-search", type: "PREREQUISITE" },
  { source: "binary-search", target: "binary-search-trees", type: "RELATED" },
  { source: "binary-search-trees", target: "avl-trees", type: "ADVANCED_TOPIC" },
  { source: "avl-trees", target: "red-black-trees", type: "ADVANCED_TOPIC" },
  { source: "linked-lists", target: "stacks", type: "USED_IN" },
  { source: "linked-lists", target: "queues", type: "USED_IN" },
  { source: "sorting-algorithms", target: "divide-and-conquer", type: "USED_IN" },
  { source: "dynamic-programming", target: "recursion", type: "PREREQUISITE" },
  { source: "sql-databases", target: "nosql-databases", type: "RELATED" },
  { source: "rest-apis", target: "graphql", type: "RELATED" },
  { source: "containerization-docker", target: "kubernetes", type: "PREREQUISITE" },
  { source: "react-framework", target: "nextjs-framework", type: "PREREQUISITE" },
  { source: "react-framework", target: "state-management", type: "USED_IN" },
  { source: "http-protocol", target: "rest-apis", type: "PREREQUISITE" },
  { source: "caching-systems", target: "load-balancing", type: "RELATED" },
  { source: "sql-databases", target: "database-indexing", type: "USED_IN" },
  { source: "sql-databases", target: "database-transactions", type: "USED_IN" }
];

let conceptsSeeded = false;

export const RetentionService = {
  /**
   * Seeds concepts and relationships into the database if not already done.
   */
  async seedCoreConcepts() {
    if (conceptsSeeded) return;
    try {
      const existing = await db.select().from(conceptsTable).limit(1);
      if (existing.length > 0) {
        conceptsSeeded = true;
        return;
      }

      console.log("Seeding core concepts into database...");
      await db.insert(conceptsTable).values(CORE_CONCEPTS);
      
      console.log("Seeding concept relationships...");
      await db.insert(conceptRelationshipsTable).values(
        CORE_RELATIONSHIPS.map(rel => ({
          sourceConceptId: rel.source,
          targetConceptId: rel.target,
          relationshipType: rel.type
        }))
      );

      conceptsSeeded = true;
      console.log("Concepts and relationships successfully seeded.");
    } catch (e) {
      console.error("Failed to seed concepts:", e);
    }
  },

  /**
   * Dynamic Concept Extraction Engine using Gemini.
   * Scans a chapter's content to extract new concepts, definitions, metadata, and relations.
   */
  async extractConceptsForChapter(chapterId: string, title: string, content: string) {
    await this.seedCoreConcepts();
    try {
      // Avoid duplicate linking
      const existingLinks = await db.select().from(chapterConceptsTable)
        .where(eq(chapterConceptsTable.chapterId, chapterId));
      if (existingLinks.length > 0) return;

      console.log(`Extracting concepts for chapter [${title}] dynamically using Gemini...`);

      // Fetch all existing concepts to provide as reference mapping to Gemini
      const existingConcepts = await db.select().from(conceptsTable);
      const knownIds = existingConcepts.map(c => c.id);

      const prompt = `
Analyze the computer science / software engineering chapter titled "${title}".
Chapter details / transcription summary:
${content.substring(0, 4000)}

Identify the core technical concepts, programming topics, or keywords covered.
For each concept, provide:
1. id: slug-style unique string (e.g. 'binary-search', 'nextjs-ssr', 'oauth2-tokens')
2. name: title of the concept (e.g. 'Binary Search')
3. description: a clear, concise definition of the concept
4. category: one of 'Programming Basics', 'Data Structures', 'Algorithms', 'Backend & Systems', 'Databases', 'Frontend', 'AI & Data Science'
5. whyItMatters: why a developer needs to know this topic
6. commonMistakes: typical pitfalls or bugs when implementing it
7. realWorldApps: where this concept is used in industry applications

Also, identify relationships between the concepts you extracted and the existing known concept IDs:
Known concept IDs: ${JSON.stringify(knownIds)}
Relationships can be:
- source: prerequisite concept ID
- target: dependent concept ID
- type: 'PREREQUISITE' | 'RELATED' | 'ADVANCED_TOPIC' | 'USED_IN'

Return ONLY a valid JSON object matching the schema:
{
  "concepts": [
    {
      "id": "slug-string",
      "name": "Concept Name",
      "description": "Definition...",
      "category": "...",
      "whyItMatters": "...",
      "commonMistakes": "...",
      "realWorldApps": "..."
    }
  ],
  "relationships": [
    {
      "source": "prerequisite-id",
      "target": "concept-id",
      "type": "PREREQUISITE"
    }
  ]
}
`;

      const resp = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const rawResult = resp.text || '';
      const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const payload = JSON.parse(sanitizedResult);

      const matchedConceptIds: string[] = [];

      if (payload.concepts && Array.isArray(payload.concepts)) {
        for (const concept of payload.concepts) {
          if (!concept.id || !concept.name || !concept.description) continue;
          
          const cleanId = concept.id.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
          matchedConceptIds.push(cleanId);

          // Check if it already exists
          const exists = existingConcepts.some(c => c.id === cleanId);
          if (!exists) {
            try {
              await db.insert(conceptsTable).values({
                id: cleanId,
                name: concept.name,
                description: concept.description,
                category: concept.category || "Programming Basics",
                whyItMatters: concept.whyItMatters || "",
                commonMistakes: concept.commonMistakes || "",
                realWorldApps: concept.realWorldApps || ""
              });
              console.log(`[DYNAMIC CONCEPT] Inserted concept: ${cleanId}`);
            } catch (err) {
              console.error(`Failed to dynamically insert concept ${cleanId}:`, err);
            }
          }
        }
      }

      if (payload.relationships && Array.isArray(payload.relationships)) {
        for (const rel of payload.relationships) {
          if (!rel.source || !rel.target || !rel.type) continue;
          const cleanSource = rel.source.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
          const cleanTarget = rel.target.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

          // Ensure source and target exist in DB before linking
          const sourceExists = (await db.select().from(conceptsTable).where(eq(conceptsTable.id, cleanSource)).limit(1)).length > 0;
          const targetExists = (await db.select().from(conceptsTable).where(eq(conceptsTable.id, cleanTarget)).limit(1)).length > 0;

          if (sourceExists && targetExists) {
            try {
              const relExists = await db.select().from(conceptRelationshipsTable)
                .where(
                  and(
                    eq(conceptRelationshipsTable.sourceConceptId, cleanSource),
                    eq(conceptRelationshipsTable.targetConceptId, cleanTarget)
                  )
                );
              if (relExists.length === 0) {
                await db.insert(conceptRelationshipsTable).values({
                  sourceConceptId: cleanSource,
                  targetConceptId: cleanTarget,
                  relationshipType: rel.type
                });
                console.log(`[DYNAMIC RELATIONSHIP] Connected: ${cleanSource} -> ${cleanTarget} (${rel.type})`);
              }
            } catch (err) {
              console.error("Failed to insert concept relationship:", err);
            }
          }
        }
      }

      // Link chapter to matched concepts
      const inserts = Array.from(new Set(matchedConceptIds)).map(cid => ({
        chapterId,
        conceptId: cid
      }));

      if (inserts.length > 0) {
        await db.insert(chapterConceptsTable).values(inserts);
      }
    } catch (e) {
      console.error(`Failed dynamically extracting concepts for chapter ${chapterId}:`, e);
      // Fallback keyword extraction
      await this.extractConceptsFallback(chapterId, title, content);
    }
  },

  /**
   * Fallback keyword matcher
   */
  async extractConceptsFallback(chapterId: string, title: string, content: string) {
    try {
      const matchedConceptIds: string[] = [];
      const textToScan = `${title} ${content}`.toLowerCase();

      for (const concept of CORE_CONCEPTS) {
        const keywords = [
          concept.name.toLowerCase(),
          concept.id.replace(/-/g, " "),
          concept.category.toLowerCase()
        ];
        if (concept.id === "recursion") keywords.push("recursive");
        if (concept.id === "arrays") keywords.push("array", "contiguous");
        if (concept.id === "linked-lists") keywords.push("linked list", "nodes");
        if (concept.id === "hash-maps") keywords.push("hashmap", "dictionary", "hash map");
        if (concept.id === "binary-search") keywords.push("binary search", "log n");

        if (keywords.some(kw => textToScan.includes(kw))) {
          matchedConceptIds.push(concept.id);
        }
      }

      if (matchedConceptIds.length === 0) {
        matchedConceptIds.push(textToScan.includes("code") ? "variables" : "time-complexity");
      }

      const inserts = Array.from(new Set(matchedConceptIds)).map(cid => ({
        chapterId,
        conceptId: cid
      }));
      if (inserts.length > 0) {
        await db.insert(chapterConceptsTable).values(inserts);
      }
    } catch (err) {
      console.error("Fallback extraction failed:", err);
    }
  },

  /**
   * Generates a pack of 4 revision questions (Definition, Concept, Scenario, True/False) using Gemini
   */
  async generateRevisionQuestions(chapterId: string, title: string, content: string) {
    try {
      const existing = await db.select().from(revisionQuestionsTable)
        .where(eq(revisionQuestionsTable.chapterId, chapterId))
        .limit(1);
      if (existing.length > 0) return;

      console.log(`Generating revision questions using Gemini for chapter: ${title}`);
      
      const prompt = `
Generate a revision question pack for the computer science/programming chapter titled "${title}".
Chapter context details:
${content}

Generate exactly 4 high-quality revision questions, one for each of these categories:
1. 'DEFINITION' - A question asking to define a term, keyword, or concept.
2. 'CONCEPT' - A question testing understanding of how a concept works or why it is used.
3. 'SCENARIO' - A scenario-based question asking how to apply this concept in a real-world project or design.
4. 'TRUE_FALSE' - A true or false question.

Assign a difficulty ('EASY', 'MEDIUM', 'HARD') to each question.
For the 'TRUE_FALSE' answer, it must start with "True" or "False" followed by a concise explanation of why.

Return the result as a raw JSON array of objects with the exact schema:
[
  {
    "question": "The question text...",
    "answer": "The correct answer explanation...",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "type": "DEFINITION" | "CONCEPT" | "SCENARIO" | "TRUE_FALSE"
  }
]
`;

      const resp = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const rawResult = resp.text || '';
      const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const list = JSON.parse(sanitizedResult);

      if (Array.isArray(list) && list.length > 0) {
        await db.insert(revisionQuestionsTable).values(
          list.map((q: any) => ({
            chapterId,
            question: q.question || "What is this concept?",
            answer: q.answer || "No explanation provided.",
            difficulty: q.difficulty || "MEDIUM",
            type: q.type || "CONCEPT"
          }))
        );
        console.log(`Successfully generated and saved ${list.length} questions for chapter ${title}.`);
      }
    } catch (e) {
      console.error(`Failed to generate revision questions for chapter ${chapterId}:`, e);
      try {
        await db.insert(revisionQuestionsTable).values([
          { chapterId, question: `What is the core definition of ${title}?`, answer: `The core concept details the fundamentals of ${title}.`, difficulty: "EASY", type: "DEFINITION" },
          { chapterId, question: `True or False: ${title} is used to optimize execution speed or simplify architectures.`, answer: "True. It provides systematic structures for solving software tasks.", difficulty: "EASY", type: "TRUE_FALSE" }
        ]);
      } catch (err) {
        console.error("Failed to insert static fallback questions:", err);
      }
    }
  },

  /**
   * Initializes the first Spaced Repetition Schedule (1 day in the future)
   */
  async initializeSchedule(userId: string, courseId: string, chapterId: string) {
    try {
      const existing = await db.select().from(revisionScheduleTable)
        .where(
          and(
            eq(revisionScheduleTable.userId, userId),
            eq(revisionScheduleTable.chapterId, chapterId),
            eq(revisionScheduleTable.reviewNumber, 1)
          )
        )
        .limit(1);

      if (existing.length > 0) return;

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await db.insert(revisionScheduleTable).values({
        userId,
        courseId,
        chapterId,
        reviewNumber: 1,
        scheduledAt: tomorrow,
        status: "PENDING",
        easeFactor: 2.5
      });
      
      // Seed concept structures and extract for this chapter
      const chapterDetails = await db.select().from(chaptersTable).where(eq(chaptersTable.chapterId, chapterId)).limit(1);
      if (chapterDetails.length > 0) {
        const text = JSON.stringify(chapterDetails[0].contentMaterials || {});
        await this.extractConceptsForChapter(chapterId, chapterDetails[0].chapterTitle, text);
        await this.generateRevisionQuestions(chapterId, chapterDetails[0].chapterTitle, text);

        // Initialize concept mastery score at 40 (Needs Review) for all concepts in this chapter
        const linkedConcepts = await db.select().from(chapterConceptsTable)
          .where(eq(chapterConceptsTable.chapterId, chapterId));
        
        for (const link of linkedConcepts) {
          const currentMastery = await db.select().from(conceptMasteryTable)
            .where(
              and(
                eq(conceptMasteryTable.userId, userId),
                eq(conceptMasteryTable.conceptId, link.conceptId)
              )
            )
            .limit(1);

          if (currentMastery.length === 0) {
            await db.insert(conceptMasteryTable).values({
              userId,
              conceptId: link.conceptId,
              masteryScore: 40, // Needs Review initial state
              lastReviewedAt: new Date()
            });
          }
        }
      }
      
      console.log(`Initialized revision schedule for user=${userId}, chapter=${chapterId}`);
    } catch (e) {
      console.error("Failed to initialize revision schedule:", e);
    }
  },

  /**
   * Logs a completed review session, adjusts concept mastery scores and memory strength, and schedules next review.
   */
  async completeReview(userId: string, chapterId: string, scheduleId: number, rating: 'EASY' | 'MEDIUM' | 'HARD') {
    try {
      // 1. Fetch current schedule
      const scheds = await db.select().from(revisionScheduleTable)
        .where(eq(revisionScheduleTable.id, scheduleId))
        .limit(1);
      if (scheds.length === 0) throw new Error("Schedule not found");
      const currentSched = scheds[0];

      // 2. Update memory strength score
      const memoryRows = await db.select().from(memoryStrengthTable)
        .where(
          and(
            eq(memoryStrengthTable.userId, userId),
            eq(memoryStrengthTable.chapterId, chapterId)
          )
        )
        .limit(1);

      let currentScore = memoryRows.length > 0 ? memoryRows[0].score : 50;
      let newScore = currentScore;
      if (rating === 'EASY' || rating === 'MEDIUM') {
        newScore = Math.min(100, currentScore + 10);
      } else {
        newScore = Math.max(0, currentScore - 15);
      }

      if (memoryRows.length > 0) {
        await db.update(memoryStrengthTable)
          .set({ score: newScore, lastReviewedAt: new Date() })
          .where(eq(memoryStrengthTable.id, memoryRows[0].id));
      } else {
        await db.insert(memoryStrengthTable).values({
          userId,
          chapterId,
          score: newScore,
          lastReviewedAt: new Date()
        });
      }

      // 3. Update concept mastery for all concepts linked to this chapter
      const linkedConcepts = await db.select().from(chapterConceptsTable)
        .where(eq(chapterConceptsTable.chapterId, chapterId));
      
      for (const link of linkedConcepts) {
        const masteryRows = await db.select().from(conceptMasteryTable)
          .where(
            and(
              eq(conceptMasteryTable.userId, userId),
              eq(conceptMasteryTable.conceptId, link.conceptId)
            )
          )
          .limit(1);

        let currentMastery = masteryRows.length > 0 ? masteryRows[0].masteryScore : 40;
        let newMastery = currentMastery;

        if (rating === 'EASY') {
          newMastery = Math.min(100, currentMastery + 20);
        } else if (rating === 'MEDIUM') {
          newMastery = Math.min(100, currentMastery + 10);
        } else { // HARD
          newMastery = Math.max(0, currentMastery - 15);
        }

        if (masteryRows.length > 0) {
          await db.update(conceptMasteryTable)
            .set({ 
              masteryScore: newMastery, 
              lastReviewedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(conceptMasteryTable.id, masteryRows[0].id));
        } else {
          await db.insert(conceptMasteryTable).values({
            userId,
            conceptId: link.conceptId,
            masteryScore: newMastery,
            lastReviewedAt: new Date()
          });
        }
      }

      // 4. Mark current schedule as COMPLETED
      const nextReviewDate = new Date();
      let nextIntervalDays = 1;
      let nextReviewNumber = currentSched.reviewNumber + 1;
      let nextEaseFactor = currentSched.easeFactor;

      const baseIntervals = [0, 1, 3, 7, 14, 30, 90]; // scheduled spacing
      const baseNextInterval = baseIntervals[currentSched.reviewNumber] || 90;

      if (rating === 'EASY') {
        nextEaseFactor = currentSched.easeFactor + 0.15;
        nextIntervalDays = Math.round(baseNextInterval * (nextEaseFactor / 2.5) * 1.2);
      } else if (rating === 'MEDIUM') {
        nextIntervalDays = Math.round(baseNextInterval * (nextEaseFactor / 2.5));
      } else { // HARD
        nextEaseFactor = Math.max(1.3, currentSched.easeFactor - 0.2);
        nextIntervalDays = 1; // 1 day
        nextReviewNumber = currentSched.reviewNumber; // retry same review stage
      }

      nextIntervalDays = Math.max(1, nextIntervalDays);
      const scheduledTime = new Date(Date.now() + nextIntervalDays * 24 * 60 * 60 * 1000);

      await db.update(revisionScheduleTable)
        .set({ 
          status: "COMPLETED", 
          completedAt: new Date(), 
          nextReviewDate: scheduledTime 
        })
        .where(eq(revisionScheduleTable.id, scheduleId));

      // 5. Schedule next review stage if we haven't completed review stage 6
      if (currentSched.reviewNumber < 6 || rating === 'HARD') {
        await db.insert(revisionScheduleTable).values({
          userId,
          courseId: currentSched.courseId,
          chapterId,
          reviewNumber: nextReviewNumber,
          scheduledAt: scheduledTime,
          status: "PENDING",
          easeFactor: nextEaseFactor
        });
      }

      console.log(`Completed review ${currentSched.reviewNumber} for chapter ${chapterId}. Next: #${nextReviewNumber} in ${nextIntervalDays} days.`);
      return { success: true, newScore, nextReviewDate: scheduledTime };
    } catch (e: any) {
      console.error("Failed to complete review:", e);
      throw e;
    }
  },

  /**
   * Updates overdue PENDING reviews to MISSED, penalizes scores, and reschedules them.
   */
  async updateOverdueReviews(userId: string) {
    try {
      const now = new Date();
      const limitTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const overdue = await db.select().from(revisionScheduleTable)
        .where(
          and(
            eq(revisionScheduleTable.userId, userId),
            eq(revisionScheduleTable.status, "PENDING"),
            lte(revisionScheduleTable.scheduledAt, limitTime)
          )
        );

      if (overdue.length === 0) return;

      console.log(`Processing ${overdue.length} overdue reviews for user: ${userId}`);

      for (const item of overdue) {
        // Mark as MISSED
        await db.update(revisionScheduleTable)
          .set({ status: "MISSED", completedAt: new Date() })
          .where(eq(revisionScheduleTable.id, item.id));

        // Penalty Memory Strength by -10
        const memoryRows = await db.select().from(memoryStrengthTable)
          .where(
            and(
              eq(memoryStrengthTable.userId, userId),
              eq(memoryStrengthTable.chapterId, item.chapterId)
            )
          )
          .limit(1);

        if (memoryRows.length > 0) {
          const newScore = Math.max(0, memoryRows[0].score - 10);
          await db.update(memoryStrengthTable)
            .set({ score: newScore, lastReviewedAt: new Date() })
            .where(eq(memoryStrengthTable.id, memoryRows[0].id));
        }

        // Penalty Concept Mastery by -10
        const linkedConcepts = await db.select().from(chapterConceptsTable)
          .where(eq(chapterConceptsTable.chapterId, item.chapterId));
        
        for (const link of linkedConcepts) {
          const masteryRows = await db.select().from(conceptMasteryTable)
            .where(
              and(
                eq(conceptMasteryTable.userId, userId),
                eq(conceptMasteryTable.conceptId, link.conceptId)
              )
            )
            .limit(1);
          if (masteryRows.length > 0) {
            const newMastery = Math.max(0, masteryRows[0].masteryScore - 10);
            await db.update(conceptMasteryTable)
              .set({ masteryScore: newMastery, lastReviewedAt: new Date(), updatedAt: new Date() })
              .where(eq(conceptMasteryTable.id, masteryRows[0].id));
          }
        }

        // Reschedule review level (PENDING in 1 day, lower ease factor)
        const nextEaseFactor = Math.max(1.3, item.easeFactor - 0.15);
        await db.insert(revisionScheduleTable).values({
          userId,
          courseId: item.courseId,
          chapterId: item.chapterId,
          reviewNumber: item.reviewNumber, // retry same review stage
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
          status: "PENDING",
          easeFactor: nextEaseFactor
        });
      }
    } catch (e) {
      console.error("Failed to update overdue reviews:", e);
    }
  },

  /**
   * Concept Readiness Engine: Determines nodes that are Mastered, Needs Review, Ready to Learn, or Locked.
   */
  async getConceptReadiness(userId: string) {
    // Make sure seeded
    await this.seedCoreConcepts();

    // 1. Fetch all concepts
    const concepts = await db.select().from(conceptsTable);

    // 2. Fetch all user masteries
    const masteries = await db.select().from(conceptMasteryTable)
      .where(eq(conceptMasteryTable.userId, userId));

    // 3. Fetch relationships
    const relationships = await db.select().from(conceptRelationshipsTable);

    // Create a map of conceptId -> masteryScore
    const masteryMap = new Map<string, number>();
    for (const m of masteries) {
      masteryMap.set(m.conceptId, m.masteryScore);
    }

    // Graph representation of prerequisites: targetId -> array of sourceIds
    const prereqMap = new Map<string, string[]>();
    for (const rel of relationships) {
      if (rel.relationshipType === "PREREQUISITE") {
        const list = prereqMap.get(rel.targetConceptId) || [];
        list.push(rel.sourceConceptId);
        prereqMap.set(rel.targetConceptId, list);
      }
    }

    const annotatedConcepts = concepts.map(c => {
      const score = masteryMap.get(c.id) ?? 0;
      const prs = prereqMap.get(c.id) || [];

      let status: 'Mastered' | 'Needs Review' | 'Ready to Learn' | 'Locked' = 'Locked';

      if (score >= 70) {
        status = 'Mastered';
      } else if (score > 0) {
        status = 'Needs Review';
      } else {
        // Score is 0 (unstarted). Check if all prerequisites are mastered
        const allPrereqsMastered = prs.every(prId => {
          const prScore = masteryMap.get(prId) ?? 0;
          return prScore >= 70;
        });

        if (allPrereqsMastered) {
          status = 'Ready to Learn';
        } else {
          status = 'Locked';
        }
      }

      return {
        ...c,
        masteryScore: score,
        status,
        prerequisites: prs
      };
    });

    // Calculate Summary Metrics
    const masteredCount = annotatedConcepts.filter(c => c.status === 'Mastered').length;
    const needsReviewCount = annotatedConcepts.filter(c => c.status === 'Needs Review').length;
    const readyToLearnCount = annotatedConcepts.filter(c => c.status === 'Ready to Learn').length;

    // Calculate RPG Skill Level
    let currentLevel = "Novice Coder";
    const categoryCounts: Record<string, number> = {};
    annotatedConcepts.forEach(c => {
      if (c.status === 'Mastered') {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      }
    });

    let primaryCategory = "";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryCategory = cat;
      }
    }

    const totalMastered = masteredCount;
    if (totalMastered >= 20) {
      currentLevel = `Senior ${primaryCategory || "Full Stack"} Architect 🧙‍♂️`;
    } else if (totalMastered >= 10) {
      currentLevel = `Intermediate ${primaryCategory || "Software"} Engineer 🛡️`;
    } else if (totalMastered >= 4) {
      currentLevel = `Junior ${primaryCategory || "Developer"} Practitioner ⚔️`;
    } else if (totalMastered > 0) {
      currentLevel = "Novice Apprentice 🪵";
    }

    return {
      concepts: annotatedConcepts,
      relationships,
      metrics: {
        conceptsMastered: masteredCount,
        needsRevision: needsReviewCount,
        readyToLearn: readyToLearnCount,
        learningLevel: currentLevel
      }
    };
  },

  /**
   * Calculates Course Evolution Status (Locked, In Progress, Completed) based on concept prerequisites.
   */
  async getCourseEvolution(userId: string) {
    const [userCourses, allProgress, readiness, chapters, chapterConcepts] = await Promise.all([
      db.select().from(courseTable).where(eq(courseTable.userId, userId)),
      db.select().from(userProgressTable).where(eq(userProgressTable.userId, userId)),
      this.getConceptReadiness(userId),
      db.select().from(chaptersTable),
      db.select().from(chapterConceptsTable)
    ]);

    const masteryMap = new Map(readiness.concepts.map(c => [c.id, c.masteryScore]));

    // Map courseId -> array of chapterIds
    const courseChapters = new Map<string, string[]>();
    chapters.forEach(ch => {
        if (!courseChapters.has(ch.courseId)) {
            courseChapters.set(ch.courseId, []);
        }
        courseChapters.get(ch.courseId)!.push(ch.chapterId);
    });

    // Map chapterId -> array of conceptIds
    const chapterConceptsMap = new Map<string, string[]>();
    chapterConcepts.forEach(cc => {
        if (!chapterConceptsMap.has(cc.chapterId)) {
            chapterConceptsMap.set(cc.chapterId, []);
        }
        chapterConceptsMap.get(cc.chapterId)!.push(cc.conceptId);
    });

    return userCourses.map(course => {
        const chIds = courseChapters.get(course.courseId) || [];
        const courseConcepts = new Set<string>();
        chIds.forEach(chId => {
            const cids = chapterConceptsMap.get(chId) || [];
            cids.forEach(cid => courseConcepts.add(cid));
        });

        // Find missing prerequisites
        const missingPrereqs: string[] = [];
        courseConcepts.forEach(cid => {
            const conceptDetails = readiness.concepts.find(c => c.id === cid);
            if (conceptDetails) {
                conceptDetails.prerequisites.forEach((prId: string) => {
                    const prScore = masteryMap.get(prId) ?? 0;
                    if (prScore < 70 && !courseConcepts.has(prId)) {
                        const prConcept = readiness.concepts.find(c => c.id === prId);
                        if (prConcept) missingPrereqs.push(prConcept.name);
                    }
                });
            }
        });

        const totalChapters = (course.courseLayout as any)?.chapters?.length || (course.courseLayout as any)?.totalChapters || 0;
        const completedChapters = allProgress.filter(p => p.courseId === course.courseId && p.status === 'COMPLETED').length;
        const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        let status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' = 'IN_PROGRESS';
        if (progressPercentage >= 100) {
            status = 'COMPLETED';
        } else if (missingPrereqs.length > 0) {
            status = 'LOCKED';
        }

        return {
            courseId: course.courseId,
            courseName: course.courseName,
            description: (course.courseLayout as any)?.courseDescription || "",
            status,
            progressPercentage,
            totalChapters,
            completedChapters,
            missingPrerequisites: Array.from(new Set(missingPrereqs))
        };
    });
  }
};
