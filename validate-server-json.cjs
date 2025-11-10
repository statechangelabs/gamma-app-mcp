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

  // Validate field length limits (based on MCP registry schema)
  const lengthLimits = {
    title: { max: 50, field: "title" },
    description: { max: 100, field: "description" },
    homepage: { max: 200, field: "homepage" },
  };

  for (const [field, { max }] of Object.entries(lengthLimits)) {
    if (serverJson[field] && serverJson[field].length > max) {
      console.error(
        `❌ ${
          field.charAt(0).toUpperCase() + field.slice(1)
        } must be ${max} characters or less (current: ${
          serverJson[field].length
        })`
      );
      console.error(`   "${serverJson[field]}"`);
      process.exit(1);
    }
  }

  // Validate title exists and is not empty
  if (!serverJson.title || serverJson.title.trim().length === 0) {
    console.error("❌ Title is required and cannot be empty");
    process.exit(1);
  }

  // Validate version format (should be semver-like)
  if (serverJson.version && !serverJson.version.match(/^\d+\.\d+\.\d+/)) {
    console.error(
      `❌ Version should follow semantic versioning (e.g., 1.0.0), got: ${serverJson.version}`
    );
    process.exit(1);
  }

  // Validate homepage URL format if present
  if (serverJson.homepage) {
    try {
      new URL(serverJson.homepage);
      if (
        !serverJson.homepage.startsWith("http://") &&
        !serverJson.homepage.startsWith("https://")
      ) {
        console.error(
          `❌ Homepage must be a valid HTTP(S) URL: ${serverJson.homepage}`
        );
        process.exit(1);
      }
    } catch (e) {
      console.error(`❌ Homepage must be a valid URL: ${serverJson.homepage}`);
      process.exit(1);
    }
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

    // Validate registryType values
    const validRegistryTypes = ["npm", "pypi", "nuget", "oci", "mcpb"];
    if (!validRegistryTypes.includes(pkg.registryType)) {
      console.error(
        `❌ Invalid registryType "${
          pkg.registryType
        }". Must be one of: ${validRegistryTypes.join(", ")}`
      );
      process.exit(1);
    }

    // Validate package identifier length (reasonable limit)
    if (pkg.identifier && pkg.identifier.length > 100) {
      console.error(
        `❌ Package identifier must be 100 characters or less (current: ${pkg.identifier.length})`
      );
      process.exit(1);
    }

    if (!pkg.transport || !pkg.transport.type) {
      console.error("❌ Each package must have transport.type");
      process.exit(1);
    }

    // Validate transport type
    const validTransportTypes = ["stdio", "sse", "streamable-http"];
    if (!validTransportTypes.includes(pkg.transport.type)) {
      console.error(
        `❌ Invalid transport type "${
          pkg.transport.type
        }". Must be one of: ${validTransportTypes.join(", ")}`
      );
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

      // Validate environment variable descriptions (max 200 chars)
      for (const [envName, envConfig] of Object.entries(pkg.env)) {
        if (envConfig.description && envConfig.description.length > 200) {
          console.error(
            `❌ Environment variable "${envName}" description must be 200 characters or less (current: ${envConfig.description.length})`
          );
          console.error(`   "${envConfig.description}"`);
          process.exit(1);
        }
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
  console.log(
    `  Title: ${serverJson.title} (${serverJson.title.length}/50 chars)`
  );
  console.log("  Version:", serverJson.version);
  console.log(
    `  Description: ${serverJson.description} (${serverJson.description.length}/100 chars)`
  );
  if (serverJson.homepage) {
    console.log(
      `  Homepage: ${serverJson.homepage} (${serverJson.homepage.length}/200 chars)`
    );
  }
  if (serverJson.license) {
    console.log("  License:", serverJson.license);
  }
  console.log("  Packages:", serverJson.packages.length);
  serverJson.packages.forEach((pkg, i) => {
    console.log(
      `    ${i + 1}. ${pkg.registryType}: ${pkg.identifier}@${pkg.version}`
    );
  });

  console.log("");
  console.log("📊 Validation Summary:");
  console.log("  ✅ All required fields present");
  console.log("  ✅ Field length limits validated");
  console.log("  ✅ Namespace format correct");
  console.log("  ✅ Package configuration valid");
  console.log("  ✅ Transport type valid");
  console.log("  ✅ Version format valid");
  if (serverJson.homepage) {
    console.log("  ✅ Homepage URL valid");
  }
  if (serverJson.packages.some((pkg) => pkg.env)) {
    console.log("  ✅ Environment variables validated");
  }
  console.log("");
  console.log("✅ Ready to publish to MCP registry!");
} catch (error) {
  console.error("❌ Error validating server.json:", error.message);
  process.exit(1);
}
