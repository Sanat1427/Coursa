"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const genai_1 = require("@google/genai");
const groq_sdk_1 = require("groq-sdk");
const db_1 = require("./db");
const schema_1 = require("./schema");
const drizzle_orm_1 = require("drizzle-orm");
const geminiClient = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
// Initialize Groq client if key is available
const groqApiKey = process.env.GROQ_API_KEY;
const groqClient = groqApiKey ? new groq_sdk_1.default({ apiKey: groqApiKey }) : null;
// Clean and validate JSON string helper
function tryCleanJSON(text) {
    const sanitized = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    try {
        const data = JSON.parse(sanitized);
        return { success: true, data, cleanText: sanitized };
    }
    catch (e) {
        console.warn(`[AI-Service] Standard JSON.parse failed: ${e?.message || e}. Attempting substring cleanup...`);
        // Try to find first '{' or '[' and last '}' or ']'
        const startBrace = sanitized.indexOf('{');
        const startBracket = sanitized.indexOf('[');
        let startIdx = -1;
        let endIdx = -1;
        if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
            startIdx = startBrace;
            endIdx = sanitized.lastIndexOf('}');
        }
        else if (startBracket !== -1) {
            startIdx = startBracket;
            endIdx = sanitized.lastIndexOf(']');
        }
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const substring = sanitized.substring(startIdx, endIdx + 1);
            try {
                const data = JSON.parse(substring);
                console.log(`[AI-Service] Substring cleanup JSON parse succeeded.`);
                return { success: true, data, cleanText: substring };
            }
            catch (innerErr) {
                console.error(`[AI-Service] Substring JSON.parse also failed: ${innerErr?.message || innerErr}`);
            }
        }
        return { success: false, data: null, cleanText: sanitized };
    }
}
// Generate context-aware safe default JSON payloads
function getSafeFallbackJSON(prompt) {
    const lower = prompt.toLowerCase();
    // 1. Course layout prompt
    if (lower.includes("course name") || lower.includes("course type") || lower.includes("layout")) {
        console.log("[AI-Service] Dynamically constructing fallback course layout...");
        // Extract topic
        let topic = "Selected Topic";
        const topicMatch = prompt.match(/course topic is:\s*([^,\n]+)/i);
        if (topicMatch && topicMatch[1]) {
            topic = topicMatch[1].trim();
        }
        else {
            const userInputMatch = prompt.match(/userInput:\s*([^,\n]+)/i);
            if (userInputMatch && userInputMatch[1]) {
                topic = userInputMatch[1].trim();
            }
        }
        // Clean topic string
        topic = topic.replace(/['"{}]+/g, '').trim();
        const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
        // Classify topic category
        const topicLower = topic.toLowerCase();
        let category = "General Tech";
        const langKeywords = ["c++", "csharp", "c#", "java", "python", "javascript", "typescript", "ruby", "rust", "golang", "php", "swift", "kotlin", "html", "css", "programming", "coding"];
        const dbKeywords = ["postgres", "sql", "mysql", "mongodb", "redis", "oracle", "sqlite", "mariadb", "cassandra", "database", "nosql"];
        const fwKeywords = ["react", "angular", "vue", "next.js", "nextjs", "spring boot", "springboot", "django", "laravel", "express", "nestjs", "svelte", "flutter", "framework"];
        const mlKeywords = ["machine learning", "ml", "deep learning", "ai", "artificial intelligence", "pytorch", "tensorflow", "neural", "nlp", "llm"];
        const sdKeywords = ["system design", "architecture", "microservices", "distributed", "scalability", "load balancer"];
        const devopsKeywords = ["docker", "kubernetes", "ansible", "terraform", "cicd", "devops", "containerization", "jenkins"];
        if (langKeywords.some(kw => {
            if (kw === "c++")
                return topicLower.includes("c++");
            if (kw === "c#")
                return topicLower.includes("c#") || topicLower.includes("csharp");
            return topicLower.includes(kw);
        })) {
            category = "Programming Language";
        }
        else if (dbKeywords.some(kw => topicLower.includes(kw))) {
            category = "Database";
        }
        else if (fwKeywords.some(kw => topicLower.includes(kw))) {
            category = "Framework";
        }
        else if (mlKeywords.some(kw => topicLower.includes(kw))) {
            category = "Machine Learning";
        }
        else if (sdKeywords.some(kw => topicLower.includes(kw))) {
            category = "System Design";
        }
        else if (devopsKeywords.some(kw => topicLower.includes(kw))) {
            category = "DevOps";
        }
        console.log(`[AI-Service] Fallback topic: "${capitalizedTopic}", Category: "${category}"`);
        // Define blueprint based on category
        let chaptersBlueprint = [];
        if (category === "Programming Language") {
            chaptersBlueprint = [
                {
                    chapterTitle: `Introduction and Environment Setup for ${capitalizedTopic}`,
                    learningObjective: `Learn how to install compilers, set up the development environment, and write a simple hello-world program in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} environment setup and basic syntax tutorial`,
                    fallbackQueries: [
                        `Getting started with ${capitalizedTopic}`,
                        `Install and configure ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "syntax", "environment", "compiler", "setup"],
                    webSearchQuery: `${capitalizedTopic} official installation developer documentation`,
                    subContent: ["Setting up tools", "Basic file structures", "Compiling first code"]
                },
                {
                    chapterTitle: `Variables, Data Types, and Operators in ${capitalizedTopic}`,
                    learningObjective: `Understand how variables are declared, the basic built-in data types, and arithmetic/logical operations in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} variables data types operators tutorial`,
                    fallbackQueries: [
                        `Variables and constants in ${capitalizedTopic}`,
                        `${capitalizedTopic} operators lesson`
                    ],
                    keywords: [topicLower, "variables", "data types", "operators"],
                    webSearchQuery: `${capitalizedTopic} variables types reference documentation`,
                    subContent: ["Declaring variables", "Type conversion rules", "Operator precedence"]
                },
                {
                    chapterTitle: `Control Flow and Decision Making in ${capitalizedTopic}`,
                    learningObjective: `Implement conditional branching statements and loops to control program execution flow in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} control flow loops if else tutorial`,
                    fallbackQueries: [
                        `${capitalizedTopic} loops while for switch`,
                        `Conditional statements in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "loops", "conditionals", "if-else", "switch"],
                    webSearchQuery: `${capitalizedTopic} control structures documentation guide`,
                    subContent: ["If-else switch blocks", "For, while, and do-while loops", "Branching scope"]
                },
                {
                    chapterTitle: `Functions and Code Reusability in ${capitalizedTopic}`,
                    learningObjective: `Write modular code using functions, parameters passing by value and reference, and return types in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} functions arguments scope tutorial`,
                    fallbackQueries: [
                        `Defining functions in ${capitalizedTopic}`,
                        `Function parameters ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "functions", "parameters", "scope", "return type"],
                    webSearchQuery: `${capitalizedTopic} functions developer reference guide`,
                    subContent: ["Declaring functions", "Pass-by-value vs pass-by-reference", "Recursive functions"]
                },
                {
                    chapterTitle: `Memory Management and Pointers in ${capitalizedTopic}`,
                    learningObjective: `Understand the heap vs stack memory model, pointer/reference semantics, and dynamic allocations in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} pointers memory allocation stack heap`,
                    fallbackQueries: [
                        `Understanding pointers in ${capitalizedTopic}`,
                        `Dynamic memory management in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "pointers", "memory", "allocation", "references"],
                    webSearchQuery: `${capitalizedTopic} memory management guide docs`,
                    subContent: ["Pointers and addresses", "Dynamic memory allocation", "Smart pointers and memory leaks"]
                },
                {
                    chapterTitle: `Object-Oriented Programming (OOP) in ${capitalizedTopic}`,
                    learningObjective: `Implement encapsulation, inheritance, polymorphism, and classes to structure applications in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} object oriented programming classes oop`,
                    fallbackQueries: [
                        `${capitalizedTopic} classes and objects`,
                        `Inheritance polymorphism in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "oop", "classes", "inheritance", "polymorphism", "encapsulation"],
                    webSearchQuery: `${capitalizedTopic} oop class structure concepts docs`,
                    subContent: ["Classes and Constructors", "Inheritance and access modifiers", "Polymorphism and abstract interfaces"]
                }
            ];
        }
        else if (category === "Database") {
            chaptersBlueprint = [
                {
                    chapterTitle: `Introduction and Core Architecture of ${capitalizedTopic}`,
                    learningObjective: `Understand the client-server database architecture and core installation processes for ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} database setup architecture tutorial`,
                    fallbackQueries: [
                        `Getting started with ${capitalizedTopic}`,
                        `Install ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "database", "architecture", "setup"],
                    webSearchQuery: `${capitalizedTopic} official documentation architecture guide`,
                    subContent: ["Relational vs NoSQL", "Installing the server engine", "Connecting via shell/GUI clients"]
                },
                {
                    chapterTitle: `Schema Design, Tables, and Constraints in ${capitalizedTopic}`,
                    learningObjective: `Design data tables, primary/foreign key relationships, and specify referential constraints in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} schema design tables constraints DDL`,
                    fallbackQueries: [
                        `Table relationships in ${capitalizedTopic}`,
                        `Data integrity and schemas in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "schema", "tables", "constraints", "keys"],
                    webSearchQuery: `${capitalizedTopic} tables schema design reference documentation`,
                    subContent: ["DDL commands (CREATE, ALTER)", "Defining column constraints", "Data normalization rules"]
                },
                {
                    chapterTitle: `Data Retrieval and SQL Querying in ${capitalizedTopic}`,
                    learningObjective: `Write complex SQL queries leveraging SELECT, filters, grouping, joins, and aggregates in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} SQL query select joins aggregates`,
                    fallbackQueries: [
                        `Writing queries in ${capitalizedTopic}`,
                        `${capitalizedTopic} joins tutorial`
                    ],
                    keywords: [topicLower, "sql", "select", "joins", "group by", "aggregates"],
                    webSearchQuery: `${capitalizedTopic} queries select statements reference guide`,
                    subContent: ["Filtering with WHERE and HAVING", "Inner, Left, and Outer Joins", "Subqueries and Common Table Expressions"]
                },
                {
                    chapterTitle: `Indexing and Query Performance Tuning in ${capitalizedTopic}`,
                    learningObjective: `Create database indexes (B-Tree, Hash, etc.) to optimize query response times and analyze execution plans in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} index optimization explain plan performance`,
                    fallbackQueries: [
                        `Creating indexes in ${capitalizedTopic}`,
                        `Performance tuning ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "index", "optimization", "explain", "performance"],
                    webSearchQuery: `${capitalizedTopic} indexing performance guide documentation`,
                    subContent: ["Query planning and EXPLAIN ANALYZE", "B-Tree, Hash, and GIST indexes", "Scan types: sequential, index, and heap scans"]
                },
                {
                    chapterTitle: `Transactions, Concurrency, and ACID Properties in ${capitalizedTopic}`,
                    learningObjective: `Implement transactions (BEGIN, COMMIT, ROLLBACK) and understand isolation levels and locking mechanisms in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} transactions locking ACID concurrency isolation`,
                    fallbackQueries: [
                        `Transaction isolation levels in ${capitalizedTopic}`,
                        `${capitalizedTopic} concurrency control`
                    ],
                    keywords: [topicLower, "transactions", "locking", "acid", "concurrency", "isolation"],
                    webSearchQuery: `${capitalizedTopic} transactions concurrency control reference`,
                    subContent: ["ACID principles", "Isolation levels: Read Committed, Serializable", "Shared and Exclusive locks"]
                }
            ];
        }
        else if (category === "Framework" || category === "Frontend" || category === "Backend") {
            chaptersBlueprint = [
                {
                    chapterTitle: `Core Concepts and Application Lifecycle of ${capitalizedTopic}`,
                    learningObjective: `Understand the fundamental architecture, design patterns, and application boot lifecycle of ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} architecture project structure walkthrough`,
                    fallbackQueries: [
                        `Getting started with ${capitalizedTopic}`,
                        `${capitalizedTopic} configuration`
                    ],
                    keywords: [topicLower, "architecture", "lifecycle", "configuration"],
                    webSearchQuery: `${capitalizedTopic} core architectural guide developer docs`,
                    subContent: ["Platform paradigm", "Project directory skeleton", "Configuring application parameters"]
                },
                {
                    chapterTitle: `Components, UI Templates, and Routing in ${capitalizedTopic}`,
                    learningObjective: `Build user interfaces and views using components, templating, and path-based router engines in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} components views routing navigation`,
                    fallbackQueries: [
                        `Creating components in ${capitalizedTopic}`,
                        `${capitalizedTopic} router setup`
                    ],
                    keywords: [topicLower, "components", "routing", "views", "navigation"],
                    webSearchQuery: `${capitalizedTopic} components routing documentation guide`,
                    subContent: ["Declaring reusable layout components", "Passing parameters between views", "Defining dynamic route endpoints"]
                },
                {
                    chapterTitle: `State Management and Dynamic Data Flow in ${capitalizedTopic}`,
                    learningObjective: `Implement local and global state storage models to manage data bindings and updates in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} state management context hooks redux data flow`,
                    fallbackQueries: [
                        `Managing state in ${capitalizedTopic}`,
                        `${capitalizedTopic} data binding`
                    ],
                    keywords: [topicLower, "state", "context", "store", "binding", "hooks"],
                    webSearchQuery: `${capitalizedTopic} state management documentation reference`,
                    subContent: ["Local component state bindings", "Global application state stores", "Unidirectional data updates"]
                },
                {
                    chapterTitle: `API Integration, Fetching, and Services in ${capitalizedTopic}`,
                    learningObjective: `Fetch remote datasets from rest endpoints and map response models within ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} HTTP fetch api client endpoints tutorial`,
                    fallbackQueries: [
                        `Calling backend services in ${capitalizedTopic}`,
                        `${capitalizedTopic} axios fetch rest client`
                    ],
                    keywords: [topicLower, "api", "fetch", "axios", "http", "rest", "services"],
                    webSearchQuery: `${capitalizedTopic} fetching networking guide developer docs`,
                    subContent: ["Configuring HTTP clients", "Handling promise-based operations", "Mapping API outputs to models"]
                },
                {
                    chapterTitle: `Production Deployments and Optimization in ${capitalizedTopic}`,
                    learningObjective: `Bundle, build, and optimize applications for high-performance production hosting of ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} production build compilation optimization deployment`,
                    fallbackQueries: [
                        `Deploying ${capitalizedTopic} app`,
                        `Vercel AWS Docker deployment for ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "production", "build", "deployment", "optimization"],
                    webSearchQuery: `${capitalizedTopic} production optimization guidelines docs`,
                    subContent: ["Compiling production bundles", "Asset minification and lazy loading", "Environment configuration parameters"]
                }
            ];
        }
        else if (category === "DevOps") {
            chaptersBlueprint = [
                {
                    chapterTitle: `Foundations and Core Architecture of ${capitalizedTopic}`,
                    learningObjective: `Understand the fundamental design principles and architectural components of ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} architecture fundamentals tutorial`,
                    fallbackQueries: [
                        `Introduction to ${capitalizedTopic}`,
                        `Core concepts of ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "architecture", "fundamentals", "container", "infrastructure"],
                    webSearchQuery: `${capitalizedTopic} core engine architecture overview documentation`,
                    subContent: ["Problems solved", "Architecture components", "Installation and basic settings"]
                },
                {
                    chapterTitle: `Images, Configurations, and Declarative Assets in ${capitalizedTopic}`,
                    learningObjective: `Write configuration manifests, run containers/images, and manage parameters in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} configuration files manifests tutorial`,
                    fallbackQueries: [
                        `Writing declarative files for ${capitalizedTopic}`,
                        `${capitalizedTopic} assets and definitions`
                    ],
                    keywords: [topicLower, "manifest", "configuration", "images", "dockerfile"],
                    webSearchQuery: `${capitalizedTopic} declarative manifests guide docs`,
                    subContent: ["Syntax specs", "State configurations", "Packaging code assets"]
                },
                {
                    chapterTitle: `Networking and Volume Management in ${capitalizedTopic}`,
                    learningObjective: `Configure network ports, routing tables, and persistent storage volumes in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} networking routing storage volumes`,
                    fallbackQueries: [
                        `${capitalizedTopic} networks bridge overlay`,
                        `Persistent storage configurations in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "networking", "ports", "routing", "volumes", "storage"],
                    webSearchQuery: `${capitalizedTopic} network storage administration docs`,
                    subContent: ["Setting up network bridges", "Mapping local directories to containers", "Data persistence strategies"]
                },
                {
                    chapterTitle: `Multi-Service Orchestration and Clusters in ${capitalizedTopic}`,
                    learningObjective: `Orchestrate multiple interacting systems, deploy local clusters, and manage scale in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} compose orchestration scaling cluster`,
                    fallbackQueries: [
                        `Deploying multi-service apps with ${capitalizedTopic}`,
                        `${capitalizedTopic} orchestration tutorial`
                    ],
                    keywords: [topicLower, "compose", "orchestration", "scaling", "cluster"],
                    webSearchQuery: `${capitalizedTopic} orchestration clusters administrator reference`,
                    subContent: ["Deploying multi-container graphs", "Scaling replication counts", "Service discovery mechanisms"]
                },
                {
                    chapterTitle: `Security and Production Operations in ${capitalizedTopic}`,
                    learningObjective: `Apply secure configurations, manage secrets, and configure production monitoring for ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} production security monitoring best practices`,
                    fallbackQueries: [
                        `Production checklist for ${capitalizedTopic}`,
                        `Security audit for ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "production", "security", "monitoring", "secrets"],
                    webSearchQuery: `${capitalizedTopic} production security hardening reference docs`,
                    subContent: ["Handling private variables and credentials", "Healthchecks and self-healing", "Resource limits and isolation settings"]
                }
            ];
        }
        else if (category === "System Design") {
            chaptersBlueprint = [
                {
                    chapterTitle: "Foundations of Scalability and High Availability",
                    learningObjective: "Understand vertical vs horizontal scaling, SLA metrics (99.999% uptime), latency vs throughput, and SLA agreements.",
                    youtubeQuery: "system design vertical horizontal scaling SLA latency throughput",
                    fallbackQueries: [
                        "Foundations of distributed system scaling",
                        "High availability metrics system design"
                    ],
                    keywords: ["scalability", "availability", "sla", "latency", "throughput"],
                    webSearchQuery: "scalability system design metrics architecture documentation",
                    subContent: ["Vertical vs Horizontal scaling models", "Latency vs Throughput trade-offs", "Redundancy and High Availability math"]
                },
                {
                    chapterTitle: "Load Balancing, Reverse Proxies, and API Gateways",
                    learningObjective: "Implement load balancing algorithms (Round Robin, Least Connections), reverse proxies, SSL termination, and API gateway routing.",
                    youtubeQuery: "system design load balancing reverse proxy API gateway SSL",
                    fallbackQueries: [
                        "Load balancer algorithms system design",
                        "API gateway vs reverse proxy architecture"
                    ],
                    keywords: ["load balancing", "reverse proxy", "api gateway", "ssl"],
                    webSearchQuery: "load balancing reverse proxy routing architecture guide",
                    subContent: ["Layer 4 vs Layer 7 load balancing", "SSL termination and caching", "API gateway pattern benefits"]
                },
                {
                    chapterTitle: "Database Scaling: Replication, Sharding, and Caching",
                    learningObjective: "Scale persistence layers using master-slave replication, database partitioning/sharding strategies, and distributed cache invalidation (Redis/Memcached).",
                    youtubeQuery: "system design database replication sharding caching redis partition",
                    fallbackQueries: [
                        "Database scaling sharding replication design",
                        "Distributed caching strategies system design"
                    ],
                    keywords: ["replication", "sharding", "caching", "database", "redis"],
                    webSearchQuery: "database scaling replication sharding design patterns",
                    subContent: ["Write scaling via partitioning/sharding", "Read scaling via read-replicas", "Cache policies: Write-Through vs Cache-Aside"]
                },
                {
                    chapterTitle: "Message Queues and Event-Driven Architectures",
                    learningObjective: "Implement asynchronous messaging using queues (RabbitMQ, Kafka), publish-subscribe patterns, and handle eventual consistency.",
                    youtubeQuery: "system design message queues kafka rabbitmq event driven consistency",
                    fallbackQueries: [
                        "Kafka pub sub message patterns design",
                        "Asynchronous processing system design"
                    ],
                    keywords: ["message queues", "kafka", "rabbitmq", "event-driven", "consistency"],
                    webSearchQuery: "event driven message queue patterns documentation reference",
                    subContent: ["Synchronous vs Asynchronous architectures", "At-least-once vs Exactly-once delivery", "Eventual consistency and saga pattern"]
                },
                {
                    chapterTitle: "Real-World Architecture Case Studies",
                    learningObjective: "Analyze architectural blueprints of large-scale systems (like Netflix, Uber, or Twitter) and design trade-offs.",
                    youtubeQuery: "system design netflix uber twitter scale case study",
                    fallbackQueries: [
                        "System design interview large scale case studies",
                        "Designing twitter or netflix architecture"
                    ],
                    keywords: ["case study", "netflix", "uber", "twitter", "architecture"],
                    webSearchQuery: "large scale system design interview case studies templates",
                    subContent: ["Designing a photo-sharing newsfeed (Instagram)", "Designing a ride-sharing dispatch (Uber)", "Designing a video streaming platform (Netflix)"]
                }
            ];
        }
        else if (category === "Machine Learning") {
            chaptersBlueprint = [
                {
                    chapterTitle: `Data Preprocessing and Feature Engineering in ${capitalizedTopic}`,
                    learningObjective: `Clean data arrays, normalize dimensions, encode categorical factors, and split datasets inside ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} data cleaning preprocessing feature engineering`,
                    fallbackQueries: [
                        `Feature scaling and normalization in ${capitalizedTopic}`,
                        `Handling missing values ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "preprocessing", "feature engineering", "data", "cleaning"],
                    webSearchQuery: `${capitalizedTopic} data preprocessing pipelines developer docs`,
                    subContent: ["Dimensionality normalization", "Handling null and categorical data", "Train-test-validation splits"]
                },
                {
                    chapterTitle: `Supervised Learning: Regression and Classification in ${capitalizedTopic}`,
                    learningObjective: `Implement linear regression, logistic regression, decision trees, and SVMs using ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} supervised learning regression classification algorithms`,
                    fallbackQueries: [
                        `Regression and decision trees in ${capitalizedTopic}`,
                        `Classification models ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "supervised", "regression", "classification", "svm"],
                    webSearchQuery: `${capitalizedTopic} supervised models algorithms docs`,
                    subContent: ["Mathematical bases of linear/logistic regression", "Random Forests and Ensemble models", "Support Vector Machines (SVM) boundaries"]
                },
                {
                    chapterTitle: `Unsupervised Learning and Dimensionality Reduction in ${capitalizedTopic}`,
                    learningObjective: `Perform K-Means clustering, hierarchical clustering, and PCA dimensionality reduction in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} unsupervised learning clustering PCA k-means`,
                    fallbackQueries: [
                        `Clustering and PCA in ${capitalizedTopic}`,
                        `Dimensionality reduction ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "unsupervised", "clustering", "pca", "kmeans"],
                    webSearchQuery: `${capitalizedTopic} unsupervised clustering methods guide`,
                    subContent: ["K-Means and hierarchical clustering", "Principal Component Analysis (PCA)", "Autoencoders basics"]
                },
                {
                    chapterTitle: `Neural Networks and Deep Learning in ${capitalizedTopic}`,
                    learningObjective: `Build neural networks, customize activation functions, backpropagation weights, and layers in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} neural networks backpropagation deep learning`,
                    fallbackQueries: [
                        `Building deep networks in ${capitalizedTopic}`,
                        `Convolutional and Recurrent neural nets in ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "neural networks", "backpropagation", "deep learning", "layers"],
                    webSearchQuery: `${capitalizedTopic} neural networks deep learning API docs`,
                    subContent: ["Perceptron and multi-layer networks", "Activation functions: ReLU, Sigmoid", "Optimizers: SGD, Adam backpropagation"]
                },
                {
                    chapterTitle: `Model Evaluation and Parameter Tuning in ${capitalizedTopic}`,
                    learningObjective: `Compute confusion matrices, accuracy, precision, F1-scores, and perform GridSearch hyperparameter tuning in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} model evaluation metrics grid search tuning`,
                    fallbackQueries: [
                        `Hyperparameter tuning in ${capitalizedTopic}`,
                        `Cross validation and F1 score metrics ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "evaluation", "tuning", "f1-score", "gridsearch", "cross-validation"],
                    webSearchQuery: `${capitalizedTopic} model metrics tuning guidelines`,
                    subContent: ["Precision, Recall, F1, and ROC-AUC metrics", "Cross-validation folds", "GridSearch and RandomSearch tuning"]
                }
            ];
        }
        else {
            chaptersBlueprint = [
                {
                    chapterTitle: `Fundamentals and Basics of ${capitalizedTopic}`,
                    learningObjective: `Understand the foundational concepts, history, and primary applications of ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} fundamentals introduction basics tutorial`,
                    fallbackQueries: [
                        `Getting started with ${capitalizedTopic}`,
                        `${capitalizedTopic} overview`
                    ],
                    keywords: [topicLower, "fundamentals", "basics", "introduction"],
                    webSearchQuery: `${capitalizedTopic} official developer documentation foundations guide`,
                    subContent: ["Core concepts", "History and evolution", "Setting up initial tools"]
                },
                {
                    chapterTitle: `Core Workflows and Implementation in ${capitalizedTopic}`,
                    learningObjective: `Implement core workflows, write code/configurations, and apply patterns in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} implementation patterns core workflow`,
                    fallbackQueries: [
                        `How to implement ${capitalizedTopic}`,
                        `${capitalizedTopic} step by step tutorial`
                    ],
                    keywords: [topicLower, "implementation", "workflow", "patterns"],
                    webSearchQuery: `${capitalizedTopic} implementation best practices documentation`,
                    subContent: ["Defining parameters", "Common coding techniques", "Executing standard methods"]
                },
                {
                    chapterTitle: `Advanced Techniques and Best Practices in ${capitalizedTopic}`,
                    learningObjective: `Optimize execution, configure security, and apply industry best practices in ${capitalizedTopic}.`,
                    youtubeQuery: `${capitalizedTopic} advanced techniques best practices optimization`,
                    fallbackQueries: [
                        `Advanced guide to ${capitalizedTopic}`,
                        `Hardening and optimizing ${capitalizedTopic}`
                    ],
                    keywords: [topicLower, "advanced", "optimization", "security", "best practices"],
                    webSearchQuery: `${capitalizedTopic} advanced developers reference docs`,
                    subContent: ["Performance fine-tuning", "Common security gotchas", "Production architecture integration"]
                }
            ];
        }
        const courseIdMatch = prompt.match(/courseid:\s*([^,\n]+)/i) || prompt.match(/courseId:\s*([^,\n]+)/i);
        const courseId = courseIdMatch ? courseIdMatch[1].trim() : "backup-course";
        const languageMatch = prompt.match(/language:\s*([^,\n]+)/i) || prompt.match(/language:\s*([^,\n]+)/i);
        const lang = languageMatch ? languageMatch[1].trim() : "English";
        const finalChapters = chaptersBlueprint.map((ch, index) => {
            const chId = `ch${index + 1}`;
            const targetLangSuffix = lang.toLowerCase() !== "english" ? ` in ${lang}` : "";
            return {
                chapterId: chId,
                chapterTitle: ch.chapterTitle,
                chapterDescription: ch.learningObjective,
                learningObjective: ch.learningObjective,
                language: lang,
                youtubeQuery: ch.youtubeQuery + targetLangSuffix,
                fallbackQueries: ch.fallbackQueries.map(q => q + targetLangSuffix),
                keywords: ch.keywords,
                webSearchQuery: ch.webSearchQuery,
                subContent: ch.subContent
            };
        });
        return JSON.stringify({
            courseId: courseId,
            courseName: `${capitalizedTopic} Course`,
            courseDescription: `A comprehensive guide covering the architecture, syntax, and best practices of ${capitalizedTopic}.`,
            level: "Beginner",
            totalChapters: finalChapters.length,
            chapters: finalChapters
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
const globalForHealth = global;
if (!globalForHealth._aiProviderHealth) {
    globalForHealth._aiProviderHealth = {
        gemini: { status: 'healthy', consecutiveFailures: 0, lastFailureTime: null },
        groq: { status: 'healthy', consecutiveFailures: 0, lastFailureTime: null }
    };
}
const healthRegistry = globalForHealth._aiProviderHealth;
const COOLDOWN_MS = 30000; // 30 seconds cooldown
function isProviderHealthy(provider) {
    const health = healthRegistry[provider];
    if (health.status === 'healthy')
        return true;
    // Check if cooldown has elapsed
    if (health.lastFailureTime && (Date.now() - health.lastFailureTime > COOLDOWN_MS)) {
        console.log(`[AI-Router] Cooldown elapsed for unhealthy provider ${provider}. Resetting status to healthy.`);
        health.status = 'healthy';
        health.consecutiveFailures = 0;
        return true;
    }
    return false;
}
function recordSuccess(provider) {
    const health = healthRegistry[provider];
    health.status = 'healthy';
    health.consecutiveFailures = 0;
    health.lastFailureTime = null;
}
function recordFailure(provider) {
    const health = healthRegistry[provider];
    health.consecutiveFailures += 1;
    health.lastFailureTime = Date.now();
    if (health.consecutiveFailures >= 3) {
        health.status = 'unhealthy';
        console.warn(`[AI-Router] Provider ${provider} marked UNHEALTHY due to ${health.consecutiveFailures} consecutive failures.`);
    }
}
function detectMetadata(contents, systemInstruction) {
    const text = (typeof contents === 'string' ? contents : JSON.stringify(contents)) + '\n' + (systemInstruction || '');
    const textLower = text.toLowerCase();
    // 1. Detect contentType
    let contentType = 'general';
    if (textLower.includes('quiz') || textLower.includes('multiple_choice') || textLower.includes('questiontext')) {
        contentType = 'quiz';
    }
    else if (textLower.includes('flashcard') || textLower.includes('front') || textLower.includes('back') || textLower.includes('leitner')) {
        contentType = 'flashcard';
    }
    else if (textLower.includes('course name') || textLower.includes('chapters') || textLower.includes('course description') || textLower.includes('learningobjective')) {
        contentType = 'course';
    }
    else if (textLower.includes('summary') || textLower.includes('workedexamples') || textLower.includes('worked examples')) {
        contentType = 'summary';
    }
    else if (textLower.includes('concept') || textLower.includes('concepts') || textLower.includes('whyitmatters')) {
        contentType = 'concept';
    }
    else if (/\b(relationship|graph|nodes|edges)\b/i.test(textLower) || (textLower.includes('relationship') && !textLower.includes('paragraphs'))) {
        contentType = 'graph';
    }
    else if (textLower.includes('transcript') || textLower.includes('subtitles') || textLower.includes('video transcript')) {
        contentType = 'transcript';
    }
    // 2. Detect language
    let language = 'English';
    const langMatch = text.match(/language:\s*([a-zA-Z]+)/i) || text.match(/in\s+([a-zA-Z]+)\s+language/i);
    if (langMatch && langMatch[1]) {
        language = langMatch[1].trim();
    }
    // 3. Detect difficulty
    let difficulty = 'Beginner';
    if (textLower.includes('difficulty: advanced') || textLower.includes('advanced level') || textLower.includes('level: advanced')) {
        difficulty = 'Advanced';
    }
    else if (textLower.includes('difficulty: intermediate') || textLower.includes('intermediate level') || textLower.includes('level: intermediate')) {
        difficulty = 'Intermediate';
    }
    // 4. Detect topic
    let topic = 'General';
    const topicMatch = text.match(/topic is:\s*([^,\n]+)/i) ||
        text.match(/topic:\s*([^,\n]+)/i) ||
        text.match(/userInput:\s*([^,\n]+)/i);
    if (topicMatch && topicMatch[1]) {
        topic = topicMatch[1].replace(/['"{}]+/g, '').trim();
    }
    else {
        // Try to find double-quoted string of length >= 3 first
        const quotedMatch = text.match(/"([^"]{3,})"/);
        if (quotedMatch && quotedMatch[1]) {
            topic = quotedMatch[1].trim();
        }
        else {
            const singleQuotedMatch = text.match(/'([^']{3,})'/);
            if (singleQuotedMatch && singleQuotedMatch[1]) {
                topic = singleQuotedMatch[1].trim();
            }
            else {
                const cleanText = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText.length > 0) {
                    topic = cleanText.split(' ').slice(0, 4).join(' ');
                }
            }
        }
    }
    return { contentType, language, difficulty, topic };
}
function normalizeKey(str) {
    return str.trim().toLowerCase();
}
async function lookupResponseCache(meta) {
    try {
        const normTopic = normalizeKey(meta.topic);
        const normLanguage = normalizeKey(meta.language);
        const normDifficulty = normalizeKey(meta.difficulty);
        const normContentType = normalizeKey(meta.contentType);
        console.log(`[AI-Router] Cache lookup: topic="${normTopic}", lang="${normLanguage}", diff="${normDifficulty}", type="${normContentType}"...`);
        const cached = await db_1.db.select()
            .from(schema_1.aiResponseCacheTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.topic, normTopic), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.language, normLanguage), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.difficulty, normDifficulty), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.contentType, normContentType)))
            .limit(1);
        if (cached.length > 0) {
            console.log(`[AI-Router] Cache HIT! Returning cached response.`);
            return cached[0].response;
        }
        console.log(`[AI-Router] Cache MISS.`);
        return null;
    }
    catch (e) {
        console.error(`[AI-Router] Cache lookup error:`, e?.message || e);
        return null;
    }
}
async function saveResponseCache(meta, responseText) {
    try {
        const normTopic = normalizeKey(meta.topic);
        const normLanguage = normalizeKey(meta.language);
        const normDifficulty = normalizeKey(meta.difficulty);
        const normContentType = normalizeKey(meta.contentType);
        console.log(`[AI-Router] Saving successful response to cache...`);
        await db_1.db.delete(schema_1.aiResponseCacheTable).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.topic, normTopic), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.language, normLanguage), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.difficulty, normDifficulty), (0, drizzle_orm_1.eq)(schema_1.aiResponseCacheTable.contentType, normContentType)));
        await db_1.db.insert(schema_1.aiResponseCacheTable).values({
            topic: normTopic,
            language: normLanguage,
            difficulty: normDifficulty,
            contentType: normContentType,
            response: responseText,
            updatedAt: new Date()
        });
        console.log(`[AI-Router] Cached response saved successfully.`);
    }
    catch (e) {
        console.error(`[AI-Router] Saving to cache error:`, e?.message || e);
    }
}
function mapModelId(model) {
    if (model === 'qwen3-32b')
        return 'qwen/qwen3-32b';
    return model;
}
function getRoutingSequence(contentType) {
    const isGroqFirst = ['course', 'quiz', 'flashcard'].includes(contentType);
    // Preferred order for models inside each provider
    const geminiModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    const groqModels = ['qwen3-32b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    const sequence = [];
    if (isGroqFirst) {
        groqModels.forEach(m => sequence.push({ provider: 'groq', model: m }));
        geminiModels.forEach(m => sequence.push({ provider: 'gemini', model: m }));
    }
    else {
        geminiModels.forEach(m => sequence.push({ provider: 'gemini', model: m }));
        groqModels.forEach(m => sequence.push({ provider: 'groq', model: m }));
    }
    return sequence;
}
async function executeWithRetry(provider, modelName, action, maxRetries = 1, initialDelay = 1000) {
    let attempts = 0;
    while (attempts <= maxRetries) {
        try {
            attempts++;
            return await action();
        }
        catch (error) {
            const errorMsg = error?.message || String(error);
            const isTransient = error?.status === 429 ||
                error?.status === 503 ||
                error?.statusCode === 429 ||
                error?.statusCode === 503 ||
                errorMsg.toLowerCase().includes('429') ||
                errorMsg.toLowerCase().includes('503') ||
                errorMsg.toLowerCase().includes('rate limit') ||
                errorMsg.toLowerCase().includes('resource_exhausted') ||
                errorMsg.toLowerCase().includes('overloaded');
            if (attempts <= maxRetries && isTransient) {
                const backoff = initialDelay * Math.pow(2, attempts - 1);
                console.warn(`[AI-Router] Transient error on provider ${provider} (model: ${modelName}). Retrying in ${backoff}ms... (Attempt ${attempts}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            }
            else {
                throw error;
            }
        }
    }
    throw new Error(`Execution failed after ${maxRetries} retries`);
}
exports.client = {
    models: {
        async generateContent(params) {
            // 1. Detect prompt metadata
            const detected = detectMetadata(params.contents, params.config?.systemInstruction);
            const topic = params.config?.topic || params.topic || detected.topic;
            const language = params.config?.language || params.language || detected.language;
            const difficulty = params.config?.difficulty || params.difficulty || detected.difficulty;
            const contentType = params.config?.contentType || params.contentType || detected.contentType;
            const meta = { topic, language, difficulty, contentType };
            console.log(`[AI-Router] Parsed Request metadata:`, JSON.stringify(meta));
            // 2. Check Cache first (Cache-Aside)
            const cachedResultText = await lookupResponseCache(meta);
            if (cachedResultText) {
                return {
                    text: cachedResultText,
                    candidates: [{ content: { parts: [{ text: cachedResultText }] } }]
                };
            }
            // 3. Determine Routing Sequence
            const routeSequence = getRoutingSequence(contentType);
            console.log(`[AI-Router] Routing sequence for type "${contentType}":`, routeSequence.map(r => `${r.provider}:${r.model}`).join(' -> '));
            let finalResultText = '';
            let success = false;
            let lastError = null;
            for (let i = 0; i < routeSequence.length; i++) {
                const route = routeSequence[i];
                // Health Check
                if (!isProviderHealthy(route.provider)) {
                    console.warn(`[AI-Router] Skipping unhealthy provider: ${route.provider} (model: ${route.model})`);
                    continue;
                }
                if (route.provider === 'groq' && !groqClient) {
                    console.warn(`[AI-Router] Skipping Groq route because groqClient is not configured.`);
                    continue;
                }
                try {
                    console.log(`[AI-Router] Attempting execution: provider=${route.provider}, model=${route.model} (Step ${i + 1}/${routeSequence.length})...`);
                    if (route.provider === 'gemini') {
                        const response = await executeWithRetry('gemini', route.model, async () => {
                            return await geminiClient.models.generateContent({
                                model: route.model,
                                contents: params.contents,
                                config: params.config
                            });
                        });
                        finalResultText = response.text || '';
                    }
                    else {
                        // Groq execution
                        const mappedModel = mapModelId(route.model);
                        const systemPrompt = params.config?.systemInstruction || '';
                        let userPrompt = '';
                        if (typeof params.contents === 'string') {
                            userPrompt = params.contents;
                        }
                        else if (Array.isArray(params.contents)) {
                            userPrompt = params.contents.map((part) => part.text || JSON.stringify(part)).join('\n');
                        }
                        else {
                            userPrompt = JSON.stringify(params.contents);
                        }
                        const messages = [];
                        if (systemPrompt) {
                            messages.push({ role: 'system', content: systemPrompt });
                        }
                        messages.push({ role: 'user', content: userPrompt });
                        const responseFormat = params.config?.responseMimeType === 'application/json'
                            ? { type: 'json_object' }
                            : undefined;
                        const chatCompletion = await executeWithRetry('groq', route.model, async () => {
                            return await groqClient.chat.completions.create({
                                messages,
                                model: mappedModel,
                                temperature: 0.2,
                                response_format: responseFormat,
                            });
                        });
                        finalResultText = chatCompletion.choices[0]?.message?.content || '';
                    }
                    // Validate output format if JSON is requested
                    if (params.config?.responseMimeType === 'application/json') {
                        console.log(`[AI-Router] Validating JSON response from provider=${route.provider}, model=${route.model}...`);
                        const parseResult = tryCleanJSON(finalResultText);
                        if (!parseResult.success) {
                            throw new Error(`Invalid JSON format generated by model.`);
                        }
                        console.log(`[AI-Router] JSON response successfully validated.`);
                        finalResultText = parseResult.cleanText;
                    }
                    // Log success and reset provider health
                    console.log(`[AI-Router] Execution SUCCESS with provider=${route.provider}, model=${route.model}`);
                    recordSuccess(route.provider);
                    success = true;
                    break;
                }
                catch (error) {
                    lastError = error;
                    console.error(`[AI-Router] Error with provider=${route.provider}, model=${route.model}:`, error?.message || error);
                    recordFailure(route.provider);
                }
            }
            // 4. Handle Router Failures
            if (success) {
                // Save successful result to Cache asynchronously
                saveResponseCache(meta, finalResultText).catch(e => {
                    console.error(`[AI-Router] Async cache save failed:`, e);
                });
                return {
                    text: finalResultText,
                    candidates: [{ content: { parts: [{ text: finalResultText }] } }]
                };
            }
            // Fallback Order step 4: Check Cache as a final safety net
            console.error(`[AI-Router] All providers failed. Querying Cache as final safety net...`);
            const fallbackCachedText = await lookupResponseCache(meta);
            if (fallbackCachedText) {
                console.log(`[AI-Router] Safety net Cache HIT. Returning cached payload.`);
                return {
                    text: fallbackCachedText,
                    candidates: [{ content: { parts: [{ text: fallbackCachedText }] } }]
                };
            }
            // If no cache, fall back to mock default responses depending on prompt type
            console.error(`[AI-Router] All providers and Cache failed. Falling back to local blueprint mock JSON.`);
            if (params.config?.responseMimeType === 'application/json') {
                let userPrompt = '';
                if (typeof params.contents === 'string') {
                    userPrompt = params.contents;
                }
                else if (Array.isArray(params.contents)) {
                    userPrompt = params.contents.map((part) => part.text || JSON.stringify(part)).join('\n');
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
};
