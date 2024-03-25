import { AccessToken, DefaultAzureCredential } from '@azure/identity';
import { BaseTool, ToolMetadata } from 'llamaindex';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

export type SessionsPythonInterpreterToolParams = {
    metadata?: ToolMetadata;
    poolManagementEndpoint: string;
    sessionId?: string;
};

const DEFAULT_META_DATA: ToolMetadata = {
    name: "sessions_python_interpreter_tool",
    description: "A Python shell for running Python code. " +
        "Use it whenever you need to perform calculations and computations. " +
        "Returns the result, stdout, and stderr of the Python code execution.",
    parameters: {
        type: "object",
        properties: {
            code: {
                type: "string",
                description: "The Python code to execute",
            },
        },
        required: ["code"],
    },
};

export class SessionsPythonInterpreterTool implements BaseTool {

    metadata: ToolMetadata;
    sessionId: string;
    poolManagementEndpoint: string;
    private accessToken?: AccessToken;

    constructor(params: SessionsPythonInterpreterToolParams) {
        this.metadata = params.metadata || DEFAULT_META_DATA;
        this.sessionId = params.sessionId || uuidv4();
        this.poolManagementEndpoint = params?.poolManagementEndpoint;
    }

    async call({ code }: { code: string }): Promise<string> {

        await this.ensureAccessToken();

        // TODO: use proper logging
        console.log(`Running Python code in session: ${this.sessionId}`);

        const apiUrl = `${this.poolManagementEndpoint}/python/execute`;
        const headers = {
            "Authorization": `Bearer ${this.accessToken?.token}`,
            "Content-Type": "application/json",
        };
        const body = {
            "properties": {
                "identifier": this.sessionId,
                "codeInputType": "inline",
                "executionType": "synchronous",
                "pythonCode": code,
            }
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return "Error: Failed to execute Python code. " + response.statusText;
        }

        const { result, stdout, stderr } = await response.json() as { result: string | Number, stdout: string, stderr: string };

        return `result:\n${result}\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}`;
    }

    private async ensureAccessToken(): Promise<void> {
        // TODO: also check if the token is expired or close to expiration
        if (!this.accessToken) {
            const credential = new DefaultAzureCredential();
            this.accessToken = await credential.getToken("https://acasessions.io/.default");
        }
    }
}