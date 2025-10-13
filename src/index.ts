#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_API_BASE = "https://public-api.gamma.app/v0.2";

interface GenerateGammaParams {
  inputText: string;
  textMode?: "generate" | "condense" | "preserve";
  format?: "presentation" | "document" | "social";
  themeName?: string;
  numCards?: number;
  cardSplit?: "auto" | "inputTextBreaks";
  additionalInstructions?: string;
  exportAs?: "pdf" | "pptx";
  textOptions?: {
    amount?: "brief" | "medium" | "detailed" | "extensive";
    tone?: string;
    audience?: string;
    language?: string;
  };
  imageOptions?: {
    source?: string;
    model?: string;
    style?: string;
  };
  cardOptions?: {
    dimensions?: string;
  };
  sharingOptions?: {
    workspaceAccess?: string;
  };
}

async function generateGamma(params: GenerateGammaParams): Promise<any> {
  if (!GAMMA_API_KEY) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "GAMMA_API_KEY environment variable is not set"
    );
  }

  const response = await fetch(`${GAMMA_API_BASE}/generations`, {
    method: "POST",
    headers: {
      "X-API-KEY": GAMMA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new McpError(
      ErrorCode.InternalError,
      `Gamma API error (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

async function getGenerationStatus(
  generationId: string,
  pollUntilComplete: boolean = false,
  maxWaitSeconds: number = 300
): Promise<any> {
  if (!GAMMA_API_KEY) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "GAMMA_API_KEY environment variable is not set"
    );
  }

  const fetchStatus = async () => {
    const response = await fetch(
      `${GAMMA_API_BASE}/generations/${generationId}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": GAMMA_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new McpError(
        ErrorCode.InternalError,
        `Gamma API error (${response.status}): ${errorText}`
      );
    }

    return await response.json();
  };

  // If not polling, just return the current status
  if (!pollUntilComplete) {
    return await fetchStatus();
  }

  // Poll until complete or timeout
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds as recommended by Gamma API docs

  while (true) {
    const result = await fetchStatus();

    // Check if completed or failed
    if (result.status === "completed" || result.status === "failed") {
      return result;
    }

    // Check timeout
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    if (elapsedSeconds >= maxWaitSeconds) {
      throw new McpError(
        ErrorCode.InternalError,
        `Generation polling timed out after ${maxWaitSeconds} seconds. Current status: ${result.status}`
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

const server = new Server(
  {
    name: "gamma-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_gamma",
        description:
          "Generate a Gamma presentation, document, or social media post using AI. " +
          "Requires GAMMA_API_KEY environment variable to be set. " +
          "The inputText parameter is required and should contain the content you want in your slides. " +
          "Supports various customization options including format, theme, number of cards, text options, image options, and more.",
        inputSchema: {
          type: "object",
          properties: {
            inputText: {
              type: "string",
              description:
                "The text content to generate from (1-100,000 tokens / ~1-400,000 characters). " +
                "Can be a short prompt, messy notes, or polished content.",
            },
            textMode: {
              type: "string",
              enum: ["generate", "condense", "preserve"],
              description:
                "How to process the input text. 'generate' creates new content from a prompt, " +
                "'condense' summarizes the input, 'preserve' keeps the input text mostly as-is.",
              default: "generate",
            },
            format: {
              type: "string",
              enum: ["presentation", "document", "social"],
              description: "The output format type",
              default: "presentation",
            },
            themeName: {
              type: "string",
              description:
                "Name of a specific theme to use. ONLY use if the user explicitly requests a custom theme by name. " +
                "Theme must exist in your Gamma workspace. Omit this parameter to use Gamma's default theme selection.",
            },
            numCards: {
              type: "number",
              description:
                "Number of cards/slides to generate (1-60 for Pro, 1-75 for Ultra)",
              default: 10,
            },
            cardSplit: {
              type: "string",
              enum: ["auto", "inputTextBreaks"],
              description:
                "How to split content into cards. 'auto' lets AI decide, 'inputTextBreaks' uses line breaks in input.",
              default: "auto",
            },
            additionalInstructions: {
              type: "string",
              description:
                "Additional instructions to guide content and layout (1-500 characters)",
            },
            exportAs: {
              type: "string",
              enum: ["pdf", "pptx"],
              description: "Export the generated content as PDF or PPTX",
            },
            textOptions: {
              type: "object",
              description: "Options for text generation",
              properties: {
                amount: {
                  type: "string",
                  enum: ["brief", "medium", "detailed", "extensive"],
                  description: "Amount of text to generate per card",
                  default: "medium",
                },
                tone: {
                  type: "string",
                  description: "The tone of voice for the content",
                },
                audience: {
                  type: "string",
                  description: "The intended audience for the content",
                },
                language: {
                  type: "string",
                  description: "Output language code (e.g., 'en', 'es', 'fr')",
                  default: "en",
                },
              },
            },
            imageOptions: {
              type: "object",
              description: "Options for image generation/sourcing",
              properties: {
                source: {
                  type: "string",
                  description: "Image source (e.g., 'aiGenerated', 'unsplash')",
                  default: "aiGenerated",
                },
                model: {
                  type: "string",
                  description: "AI model to use for image generation",
                },
                style: {
                  type: "string",
                  description: "Artistic style for generated images",
                },
              },
            },
            cardOptions: {
              type: "object",
              description: "Card layout options",
              properties: {
                dimensions: {
                  type: "string",
                  description: "Card dimensions (e.g., 'fluid', '16x9', '4x3')",
                },
              },
            },
            sharingOptions: {
              type: "object",
              description: "Sharing and access options",
              properties: {
                workspaceAccess: {
                  type: "string",
                  description:
                    "Workspace access level for the generated content",
                },
              },
            },
          },
          required: ["inputText"],
        },
      },
      {
        name: "get_gamma_generation",
        description:
          "Retrieve the status and URLs of a Gamma generation. " +
          "By default, automatically polls every 5 seconds until generation is complete (recommended). " +
          "Returns the final URLs to the generated Gamma, plus PDF/PPTX export URLs if requested. " +
          "Supports both automatic polling (default) and single status checks.",
        inputSchema: {
          type: "object",
          properties: {
            generationId: {
              type: "string",
              description:
                "The generation ID returned from the generate_gamma tool. " +
                "This is used to check the status and retrieve URLs for the generated content.",
            },
            pollUntilComplete: {
              type: "boolean",
              description:
                "Whether to automatically poll every 5 seconds until the generation is complete. " +
                "Recommended: true (default). Set to false to only check status once.",
              default: true,
            },
            maxWaitSeconds: {
              type: "number",
              description:
                "Maximum time in seconds to wait for generation to complete when polling. " +
                "Default: 300 (5 minutes). Only used when pollUntilComplete is true.",
              default: 300,
            },
          },
          required: ["generationId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_gamma") {
    const params = request.params.arguments as unknown as GenerateGammaParams;

    try {
      const result = await generateGamma(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate gamma: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (request.params.name === "get_gamma_generation") {
    const {
      generationId,
      pollUntilComplete = true,
      maxWaitSeconds = 300,
    } = request.params.arguments as {
      generationId: string;
      pollUntilComplete?: boolean;
      maxWaitSeconds?: number;
    };

    try {
      const result = await getGenerationStatus(
        generationId,
        pollUntilComplete,
        maxWaitSeconds
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get generation status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  throw new McpError(
    ErrorCode.MethodNotFound,
    `Unknown tool: ${request.params.name}`
  );
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gamma MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
