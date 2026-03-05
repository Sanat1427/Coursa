export interface Narration { fullText: string; }
export interface Slide {
    slideId: string;
    slideIndex: number;
    title: string;
    subtitle?: string;
    audioFileName: string;
    narration: Narration;
    html: string;
    revealData: string[];
}
export interface VideoSlideData {
    VideoContent: Slide[];
}

export const VideoSlides: VideoSlideData[] = [
    {
    "VideoContent": [
        {
            "slideId": "intro-to-nextjs-01",
            "slideIndex": 1,
            "title": "What is Next.js and why use it?",
            "subtitle": "Unlocking the Power of Modern Web Development",
            "audioFileName": "intro-to-nextjs-01.mp3",
            "narration": {
                "fullText": "Next.js is a powerful, open-source React framework designed for building production-ready web applications. It extends React's capabilities by offering features like routing, data fetching, and styling out-of-the-box. Developers choose Next.js for its ability to create fast, scalable, and SEO-friendly websites. It significantly improves developer experience with features like automatic code splitting and hot module replacement. Furthermore, Next.js applications can deliver exceptional user experiences due to their optimized performance. This framework is ideal for a wide range of projects, from personal blogs to complex e-commerce platforms. Its versatile nature makes it a cornerstone in contemporary web development practices."
            },
            "html": "<script src=\"https://cdn.tailwindcss.com\"></script><style>body { margin: 0; overflow: hidden; font-family: sans-serif; } .slide-container { width: 1280px; height: 720px; background: linear-gradient(135deg, #1f2937 0%, #0d1117 100%); color: #e5e7eb; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; } .reveal { opacity:0; transform:translateY(12px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; } .reveal.is-on { opacity:1; transform:translateY(0); }</style><div class=\"slide-container\"><div class=\"flex justify-between items-center text-gray-400 text-sm mb-8\"><span>Course: Next.js Fundamentals</span><span>Chapter: Introduction to Next.js</span></div><div class=\"flex-grow flex flex-col justify-center items-center text-center px-20\"><h1 class=\"text-6xl font-extrabold mb-4 leading-tight\">What is Next.js and why use it?</h1><p class=\"text-3xl text-blue-300 mb-12\">Unlocking the Power of Modern Web Development</p><div class=\"grid grid-cols-2 gap-8 w-full max-w-4xl\"><div data-reveal=\"r1\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">A Production-Ready React Framework</h3><p class=\"text-gray-300\">Extends React with powerful features for robust web applications.</p></div><div data-reveal=\"r2\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Enhanced Performance & SEO</h3><p class=\"text-gray-300\">Builds fast, scalable, and search-engine friendly websites.</p></div><div data-reveal=\"r3\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Improved Developer Experience</h3><p class=\"text-gray-300\">Offers features like automatic code splitting and hot module replacement.</p></div><div data-reveal=\"r4\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Versatility for Any Project</h3><p class=\"text-gray-300\">Suitable for personal blogs to complex e-commerce platforms.</p></div></div></div></div>",
            "revealData": [
                "r1",
                "r2",
                "r3",
                "r4"
            ]
        },
        {
            "slideId": "intro-to-nextjs-02",
            "slideIndex": 2,
            "title": "Key features: Server-Side Rendering (SSR) and Static Site Generation (SSG).",
            "subtitle": "Building Dynamic and Performant Web Applications",
            "audioFileName": "intro-to-nextjs-02.mp3",
            "narration": {
                "fullText": "Next.js stands out with its powerful data fetching strategies, primarily Server-Side Rendering and Static Site Generation. Server-Side Rendering, or SSR, allows pages to be rendered on the server for each request, ensuring up-to-date data for dynamic content. This method is excellent for pages requiring frequent data updates, like dashboards or personalized content. Static Site Generation, or SSG, pre-renders pages at build time, serving them as static HTML files. SSG is ideal for content that doesn't change often, such as blog posts or marketing pages. Both SSR and SSG significantly improve page load times and SEO compared to client-side rendering. Understanding these techniques is crucial for optimizing your Next.js application's performance and user experience. They provide flexibility to choose the best rendering strategy for different parts of your website."
            },
            "html": "<script src=\"https://cdn.tailwindcss.com\"></script><style>body { margin: 0; overflow: hidden; font-family: sans-serif; } .slide-container { width: 1280px; height: 720px; background: linear-gradient(135deg, #1f2937 0%, #0d1117 100%); color: #e5e7eb; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; } .reveal { opacity:0; transform:translateY(12px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; } .reveal.is-on { opacity:1; transform:translateY(0); }</style><div class=\"slide-container\"><div class=\"flex justify-between items-center text-gray-400 text-sm mb-8\"><span>Course: Next.js Fundamentals</span><span>Chapter: Introduction to Next.js</span></div><div class=\"flex-grow flex flex-col justify-center items-center text-center px-20\"><h1 class=\"text-6xl font-extrabold mb-4 leading-tight\">Key Features: SSR & SSG</h1><p class=\"text-3xl text-blue-300 mb-12\">Building Dynamic and Performant Web Applications</p><div class=\"grid grid-cols-2 gap-8 w-full max-w-4xl\"><div data-reveal=\"r1\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Server-Side Rendering (SSR)</h3><p class=\"text-gray-300\">Pages rendered on the server for each request, ensuring fresh data.</p></div><div data-reveal=\"r2\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Benefits of SSR</h3><p class=\"text-gray-300\">Ideal for dynamic content, dashboards, and personalized user experiences.</p></div><div data-reveal=\"r3\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Static Site Generation (SSG)</h3><p class=\"text-gray-300\">Pages pre-rendered at build time, served as static HTML files.</p></div><div data-reveal=\"r4\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Benefits of SSG</h3><p class=\"text-gray-300\">Excellent for static content like blogs, ensuring lightning-fast loads and SEO.</p></div></div></div></div>",
            "revealData": [
                "r1",
                "r2",
                "r3",
                "r4"
            ]
        },
        {
            "slideId": "intro-to-nextjs-03",
            "slideIndex": 3,
            "title": "Setting up your first Next.js project.",
            "subtitle": "Getting Started with Next.js Development",
            "audioFileName": "intro-to-nextjs-03.mp3",
            "narration": {
                "fullText": "Starting a new Next.js project is straightforward and quickly gets you into development. First, ensure you have Node.js and npm (or Yarn) installed on your system. The simplest way to create a new Next.js application is by using `create-next-app`. This command scaffolds a new project with all the necessary configurations. You'll be prompted to choose various options like TypeScript, ESLint, and Tailwind CSS, making initial setup highly customizable. Once the project is created, navigate into your new project directory. Finally, you can launch the development server with `npm run dev` or `yarn dev`. This command will start your application, usually accessible on `localhost:3000`, allowing you to immediately see your changes as you code. Congratulations, you're ready to build amazing web experiences!"
            },
            "html": "<script src=\"https://cdn.tailwindcss.com\"></script><style>body { margin: 0; overflow: hidden; font-family: sans-serif; } .slide-container { width: 1280px; height: 720px; background: linear-gradient(135deg, #1f2937 0%, #0d1117 100%); color: #e5e7eb; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; } .reveal { opacity:0; transform:translateY(12px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; } .reveal.is-on { opacity:1; transform:translateY(0); }</style><div class=\"slide-container\"><div class=\"flex justify-between items-center text-gray-400 text-sm mb-8\"><span>Course: Next.js Fundamentals</span><span>Chapter: Introduction to Next.js</span></div><div class=\"flex-grow flex flex-col justify-center items-center text-center px-20\"><h1 class=\"text-6xl font-extrabold mb-4 leading-tight\">Setting Up Your First Project</h1><p class=\"text-3xl text-blue-300 mb-12\">Getting Started with Next.js Development</p><div class=\"grid grid-cols-2 gap-8 w-full max-w-4xl\"><div data-reveal=\"r1\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Prerequisites: Node.js & npm/Yarn</h3><p class=\"text-gray-300\">Ensure you have a modern JavaScript runtime and package manager installed.</p></div><div data-reveal=\"r2\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Create New Project: `npx create-next-app`</h3><p class=\"text-gray-300\">Use the official command to scaffold a new Next.js application quickly.</p></div><div data-reveal=\"r3\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Navigate & Install Dependencies</h3><p class=\"text-gray-300\">Change into your new project directory to manage its dependencies.</p></div><div data-reveal=\"r4\" class=\"reveal bg-gray-800/60 p-6 rounded-lg shadow-xl text-left\"><h3 class=\"text-2xl font-semibold mb-2 text-white\">Run Development Server: `npm run dev`</h3><p class=\"text-gray-300\">Launch your application locally to begin developing and seeing real-time changes.</p></div></div></div></div>",
            "revealData": [
                "r1",
                "r2",
                "r3",
                "r4"
            ]
        }
    ]
}
]