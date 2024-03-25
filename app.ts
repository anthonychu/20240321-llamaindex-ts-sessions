import { FunctionTool, OpenAI, ReActAgent } from "llamaindex";
import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SessionsPythonInterpreterTool } from "./azure-container-apps";

const rl = readline.createInterface({ input, output });

async function main() {

    const pythonInterpreterTool = new SessionsPythonInterpreterTool({
        poolManagementEndpoint: "https://westus2.acasessions.io/subscriptions/ef6e1243-d48a-417e-8e6d-40cd96e110fd/resourceGroups/test-sessions/sessionPools/antchu-test-wus2",
    });

    const azureOpenAILlm = new OpenAI({
        // model: "gpt-3.5-turbo",
        model: "gpt-4",
        temperature: 0,
        azure: {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: '2023-09-15-preview',
            // deploymentName: 'gpt-35-turbo',
            deploymentName: 'gpt-4',
        }
    });

    const agent = new ReActAgent({
        tools: [pythonInterpreterTool],
        verbose: true,
        llm: azureOpenAILlm,
    });

    const message = await rl.question("Question: ");

    const response = await agent.chat({
        message,
    });
    console.log(`Agent: ${String(response)}`);

}


main().then(() => {
    console.log("Done");
});
