const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const ts = require('typescript');
const geminiFile = fs.readFileSync('lib/gemini.ts', 'utf8');

const transpileResult = ts.transpileModule(geminiFile, {
    compilerOptions: { 
        module: ts.ModuleKind.CommonJS, 
        target: ts.ScriptTarget.ES2020 
    }
});

let compiledCode = transpileResult.outputText;

// Replace path alias with relative require
compiledCode = compiledCode.replace(/require\s*\(\s*['"]@\/data\/Prompt['"]\s*\)/g, 'require("./data/Prompt")');

const tempFile = path.join(__dirname, 'temp_gemini_test.cjs');
fs.writeFileSync(tempFile, compiledCode, 'utf8');

const { client } = require('./temp_gemini_test.cjs');

async function testClient() {
    try {
        console.log("Calling client.models.generateContent...");
        const result = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Course Topic is: C++ Basics, Course Type: fullcourse, Language: English',
            config: {
                systemInstruction: 'Generate a JSON structure.',
                responseMimeType: "application/json",
            }
        });
        console.log("SUCCEEDED! Result text length:", result.text.length);
        console.log("Result text:", result.text);
    } catch (e) {
        console.error("FAILED with error:", e);
    } finally {
        fs.unlinkSync(tempFile);
    }
}

testClient();
