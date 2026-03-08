import { serve } from "inngest/next";
import { inngest } from "../../../config/inngest";
import { generateVideoContentJob } from "./functions";

// Create an API that serves zero-downtime background functions
export const maxDuration = 60; // Allow 60 seconds execution time

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateVideoContentJob
    ],
});
