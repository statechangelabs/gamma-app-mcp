#!/usr/bin/env node

const fs = require("fs");

try {
  const serverJson = JSON.parse(fs.readFileSync("server.json", "utf8"));

  const required = ["$schema", "name", "title", "description", "version"];
  const missing = required.filter((f) => !serverJson[f]);

  if (missing.length) {
    console.error("❌ Missing required fields:", missing.join(", "));
    process.exit(1);
  }

  if (
    !serverJson.packages ||
    !Array.isArray(serverJson.packages) ||
    serverJson.packages.length === 0
  ) {
    console.error("❌ packages array is required and must not be empty");
    process.exit(1);
  }

  // Validate package structure
  for (const pkg of serverJson.packages) {
    if (!pkg.registryType || !pkg.identifier || !pkg.version) {
      console.error(
        "❌ Each package must have registryType, identifier, and version"
      );
      process.exit(1);
    }

    if (!pkg.transport || !pkg.transport.type) {
      console.error("❌ Each package must have transport.type");
      process.exit(1);
    }

    // Check for environment variables
    if (pkg.env) {
      const requiredEnvVars = Object.entries(pkg.env)
        .filter(([_, config]) => config.required)
        .map(([name]) => name);
      if (requiredEnvVars.length > 0) {
        console.log(
          "📋 Required environment variables:",
          requiredEnvVars.join(", ")
        );
      }
    }
  }

  // Validate namespace format
  if (!serverJson.name.match(/^(io\.github\.[^\/]+|com\.[^\/]+)\/[^\/]+$/)) {
    console.error(
      '❌ Name must be in format "io.github.username/server" or "com.domain/server"'
    );
    process.exit(1);
  }

  console.log("✅ server.json structure is valid!");
  console.log("");
  console.log("  Schema:", serverJson.$schema);
  console.log("  Name:", serverJson.name);
  console.log("  Title:", serverJson.title);
  console.log("  Version:", serverJson.version);
  console.log("  Description:", serverJson.description);
  console.log("  Packages:", serverJson.packages.length);
  serverJson.packages.forEach((pkg, i) => {
    console.log(
      `    ${i + 1}. ${pkg.registryType}: ${pkg.identifier}@${pkg.version}`
    );
  });

  console.log("");
  console.log("✅ Ready to publish to MCP registry!");
} catch (error) {
  console.error("❌ Error validating server.json:", error.message);
  process.exit(1);
}
