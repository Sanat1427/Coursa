import { Inngest } from "inngest";

async function main() {
    try {
        const inngest = new Inngest({
            id: "test",
            isDev: false,
            eventKey: "local"
        });

        await inngest.send({
            name: "video/generate",
            data: { test: true }
        });
        console.log("Success");
    } catch (e) {
        console.error("Caught error:", e.message);
    }
}
main();
