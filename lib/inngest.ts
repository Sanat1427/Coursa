import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "course-generator",
    // Bypass all event key strict checks when running in next.js dev mode
    isDev: process.env.NODE_ENV === "development",
    eventKey: process.env.INNGEST_EVENT_KEY || "local"
});
