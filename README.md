# Gamma MCP Server

An MCP (Model Context Protocol) server that enables AI assistants to generate Gamma presentations, documents, and social media posts using the Gamma.app API.

## What is MCP?

The Model Context Protocol (MCP) allows AI assistants like Claude to interact with external tools and data sources. This server exposes Gamma's AI generation capabilities to any MCP-compatible client.

## Features

- 🎨 Generate presentations, documents, and social media posts
- 🤖 AI-powered content generation with customizable options
- 🎭 Theme support for consistent branding
- 📝 Multiple text modes: generate, condense, or preserve
- 🖼️ Image generation options (AI-generated or Unsplash)
- 📊 Export as PDF or PPTX
- 🌍 Multi-language support

## Prerequisites

- Node.js 18 or higher
- A Gamma.app account with API access
- Gamma API key (get one from [Gamma.app API settings](https://gamma.app/settings/api))

## Installation & Usage

### Production Mode (via NPM)

Once published to NPM, you can use the server directly with `npx`:

1. **Configure your MCP client** (e.g., Claude Desktop) by adding to your config file:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "gamma": {
         "command": "npx",
         "args": ["-y", "@raydeck/gamma-app-mcp"],
         "env": {
           "GAMMA_API_KEY": "your-gamma-api-key-here"
         }
       }
     }
   }
   ```

2. **Restart your MCP client** to load the server

### Local Development / Testing Mode

For testing and development before publishing:

1. **Clone/navigate to the repository**:
   ```bash
   cd /path/to/gamma-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Configure your MCP client** with the local path:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "gamma": {
         "command": "node",
         "args": ["/absolute/path/to/gamma-mcp/dist/index.js"],
         "env": {
           "GAMMA_API_KEY": "your-gamma-api-key-here"
         }
       }
     }
   }
   ```

   **Alternative using npm link**:
   ```bash
   # In the gamma-mcp directory
   npm link
   
   # Then in your MCP config:
   {
     "mcpServers": {
       "gamma": {
         "command": "gamma-mcp",
         "env": {
           "GAMMA_API_KEY": "your-gamma-api-key-here"
         }
       }
     }
   }
   ```

5. **Restart your MCP client**

### Development Mode (with auto-reload)

For active development with TypeScript hot-reloading:

```bash
npm run dev
```

This runs the server directly from TypeScript source using `tsx`.

## Configuration

### Environment Variables

- `GAMMA_API_KEY` (required): Your Gamma API key

## Available Tools

### `generate_gamma`

Generate AI-powered Gamma content (presentations, documents, or social posts).

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputText` | string | ✅ | The text content to generate from (1-400,000 characters). Can be a short prompt, messy notes, or polished content. |
| `textMode` | string | ❌ | How to process input: `generate`, `condense`, or `preserve` (default: `generate`) |
| `format` | string | ❌ | Output format: `presentation`, `document`, or `social` (default: `presentation`) |
| `themeName` | string | ❌ | Name of a specific theme to use. **Only use if the user explicitly requests a custom theme by name.** Theme must exist in your Gamma workspace. Omit this parameter to use Gamma's default theme selection. |
| `numCards` | number | ❌ | Number of cards/slides to generate (1-60 for Pro, 1-75 for Ultra, default: 10) |
| `cardSplit` | string | ❌ | How to split content: `auto` or `inputTextBreaks` (default: `auto`) |
| `additionalInstructions` | string | ❌ | Additional instructions for content and layout (1-500 characters) |
| `exportAs` | string | ❌ | Export format: `pdf` or `pptx` |

#### Text Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `textOptions.amount` | string | Amount of text per card: `brief`, `medium`, `detailed`, or `extensive` |
| `textOptions.tone` | string | Tone of voice for the content |
| `textOptions.audience` | string | Intended audience |
| `textOptions.language` | string | Output language code (e.g., 'en', 'es', 'fr') |

#### Image Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageOptions.source` | string | Image source: `aiGenerated` or `unsplash` |
| `imageOptions.model` | string | AI model to use for image generation |
| `imageOptions.style` | string | Artistic style for generated images |

#### Card Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `cardOptions.dimensions` | string | Card dimensions: `fluid`, `16x9`, or `4x3` |

#### Sharing Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `sharingOptions.workspaceAccess` | string | Workspace access level |

#### Example Usage

When using with Claude or another MCP client:

```
Create a 10-slide presentation about "The Future of AI" with a professional tone, 
targeted at business executives, using medium text amount and AI-generated images.
```

The AI will use the tool like this:
```json
{
  "inputText": "The Future of AI - covering trends, opportunities, and challenges",
  "format": "presentation",
  "numCards": 10,
  "textOptions": {
    "amount": "medium",
    "tone": "professional",
    "audience": "business executives"
  },
  "imageOptions": {
    "source": "aiGenerated"
  }
}
```

## Response Format

The tool returns a JSON response from the Gamma API containing:
- Generation ID
- Status
- Link to the generated content
- Export links (if requested)

## Development Workflow

### Project Structure

```
gamma-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # NPM package configuration (includes mcpName for registry validation)
├── server.json           # MCP registry metadata
├── tsconfig.json
└── README.md
```

**Note**: The `server.json` file is required for publishing to the [MCP Registry](https://github.com/modelcontextprotocol/registry). It contains metadata about your server including its namespace (`io.github.raydeck/gamma-app-mcp`), package information, and deployment configuration.

### Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Validating server.json

Before publishing to the MCP registry, you can validate your `server.json`:

```bash
npm run validate
```

This checks that your `server.json` has all required fields and is properly structured for the MCP registry.

### Testing Locally

1. Make changes to `src/index.ts`
2. Run `npm run build` to compile
3. Restart your MCP client to reload the server
4. Test with your AI assistant

### Publishing to NPM

When ready to publish:

1. **Update version** in `package.json` and `server.json`:
   ```bash
   npm version patch  # or minor, or major
   ```
   
   Then update the `version` field in `server.json` to match.

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Publish to NPM**:
   ```bash
   npm publish --access public
   ```

4. **Users can then install via**:
   ```bash
   npx @raydeck/gamma-app-mcp
   ```

### Publishing to the MCP Registry

After publishing to NPM, you can publish to the official MCP registry to make your server discoverable:

1. **Install the MCP Publisher CLI**:
   ```bash
   # macOS/Linux with Homebrew
   brew install mcp-publisher
   
   # Or download pre-built binaries from:
   # https://github.com/modelcontextprotocol/registry/releases
   ```

2. **Authenticate with GitHub** (for `io.github.*` namespaces):
   ```bash
   mcp-publisher login github
   ```

3. **Publish to the registry**:
   ```bash
   mcp-publisher publish
   ```

4. **Verify publication**:
   ```bash
   curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.raydeck/gamma-app-mcp"
   ```

For detailed instructions, see the [official publishing guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/publishing/publish-server.md).

## Troubleshooting

### Server not starting

- Verify `GAMMA_API_KEY` is set correctly in your MCP config
- Check that Node.js version is 18 or higher
- Ensure the path in your config is absolute and correct

### API Errors

- Verify your Gamma API key is valid
- Check that you have sufficient API credits
- Review Gamma API documentation for parameter requirements

### MCP Client Not Detecting Server

- Ensure the config JSON is valid (use a JSON validator)
- Restart your MCP client after config changes
- Check client logs for error messages

## Resources

- [Gamma.app API Documentation](https://gamma.app/docs/api)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## License

ISC

## Author

Ray Deck

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/raydeck/gamma-app-mcp/issues)
- Gamma API Support: [Gamma Help Center](https://gamma.app/help)

