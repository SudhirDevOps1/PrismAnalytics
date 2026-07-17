#!/usr/bin/env node
/**
 * PrismAnalytics D1-only one-click Cloudflare setup.
 * No R2 subscription, no KV setup, no resource ID copy/paste.
 */
const readline = require("readline");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m", cyan: "\x1b[36m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", magenta: "\x1b[35m",
};
const log = console.log;
const info = (message) => log(`${C.cyan}ℹ${C.reset}  ${message}`);
const success = (message) => log(`${C.green}✔${C.reset}  ${message}`);
const warn = (message) => log(`${C.yellow}⚠${C.reset}  ${message}`);
const fail = (message) => log(`${C.red}✖${C.reset}  ${message}`);
const step = (number, message) => log(`\n${C.magenta}${C.bold}STEP ${number}${C.reset}  ${C.bold}${message}${C.reset}`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question, fallback) => new Promise((resolve) => {
  rl.question(`${C.bold}?${C.reset} ${question} ${C.dim}(${fallback})${C.reset}: `, (answer) => resolve(answer.trim() || fallback));
});

function capture(command) {
  try {
    return { ok: true, output: execSync(command, { cwd: __dirname, encoding: "utf8", stdio: "pipe" }) };
  } catch (error) {
    return { ok: false, output: String(error.stdout || error.stderr || error.message) };
  }
}

function run(command) {
  try {
    execSync(command, { cwd: __dirname, stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function pipeSecret(secret) {
  return new Promise((resolve) => {
    const shell = process.platform === "win32" ? "cmd" : "sh";
    const args = process.platform === "win32"
      ? ["/c", "npx wrangler secret put JWT_SECRET"]
      : ["-c", "npx wrangler secret put JWT_SECRET"];
    const child = spawn(shell, args, { cwd: __dirname, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (data) => { output += data.toString(); });
    child.stderr.on("data", (data) => { output += data.toString(); });
    setTimeout(() => { child.stdin.write(secret + "\n"); child.stdin.end(); }, 500);
    child.on("close", (code) => resolve({ ok: code === 0, output }));
  });
}

function updateWorkerName(name) {
  const file = path.join(__dirname, "wrangler.toml");
  const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, source.replace(/^name\s*=\s*"[^"]+"/m, `name = "${name}"`), "utf8");
}

async function main() {
  log(`\n${C.magenta}${C.bold}╔══════════════════════════════════════════════════════╗`);
  log(`║      PrismAnalytics — Free D1 One-Click Setup       ║`);
  log(`║  No R2 • No credit card • No ID copy/paste          ║`);
  log(`╚══════════════════════════════════════════════════════╝${C.reset}\n`);

  step(1, "Checking Wrangler and Cloudflare login");
  const version = capture("npx wrangler --version");
  if (!version.ok) {
    fail("Wrangler is unavailable. Run npm install first.");
    process.exit(1);
  }
  success(`Wrangler ${version.output.trim()} ready`);

  let whoami = capture("npx wrangler whoami");
  if (!whoami.ok || /not authenticated/i.test(whoami.output)) {
    info("Opening Cloudflare login in your browser...");
    if (!run("npx wrangler login")) {
      fail("Cloudflare login failed. Run npx wrangler login and retry.");
      process.exit(1);
    }
    whoami = capture("npx wrangler whoami");
  }
  success("Cloudflare authentication ready");

  const appName = await ask("Worker name", "prism-analytics");
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(appName)) {
    fail("Worker name must contain lowercase letters, numbers, and hyphens only.");
    process.exit(1);
  }
  updateWorkerName(appName);

  step(2, "Building React/Vite dashboard assets");
  if (!run("npx vite build")) {
    fail("Vite build failed. Fix the errors above and retry.");
    process.exit(1);
  }
  success("Production assets built in dist/");

  step(3, "Deploying Worker and auto-provisioning free D1 database");
  info("Checking/Creating D1 database...");
  const d1Create = capture("npx wrangler d1 create prism-analytics-db");
  let dbId = "";
  if (d1Create.ok) {
    const match = d1Create.output.match(/database_id\s*=\s*"([^"]+)"/);
    if (match) {
      dbId = match[1];
      success(`D1 database created successfully with ID: ${dbId}`);
    }
  } else {
    const d1List = capture("npx wrangler d1 list");
    if (d1List.ok) {
      const listMatch = d1List.output.match(/prism-analytics-db\s+([a-f0-9-]+)/);
      if (listMatch) {
        dbId = listMatch[1];
        success(`D1 database "prism-analytics-db" already exists with ID: ${dbId}`);
      }
    }
  }

  if (dbId) {
    const file = path.join(__dirname, "wrangler.toml");
    let source = fs.readFileSync(file, "utf8");
    if (!source.includes("database_id")) {
      source = source.replace(
        /database_name\s*=\s*"prism-analytics-db"/,
        `database_name = "prism-analytics-db"\ndatabase_id = "${dbId}"`
      );
      fs.writeFileSync(file, source, "utf8");
      success("Updated wrangler.toml with database_id");
    }
  } else {
    warn("Could not retrieve D1 database_id. Make sure to update wrangler.toml manually.");
  }

  const deploy = capture("npx wrangler deploy");
  log(deploy.output);
  if (!deploy.ok) {
    fail("Worker deployment failed. Review the Wrangler output above.");
    process.exit(1);
  }
  success("Worker deployed; D1 binding provisioned automatically");

  step(4, "Applying D1 schema safely");
  if (run("npx wrangler d1 migrations apply DB --remote")) {
    success("D1 migrations applied");
  } else {
    warn("Migration command was skipped; the Worker self-bootstrap creates the same schema on first API request.");
  }

  step(5, "Configure optional file storage (R2 / S3-compatible)");
  log(`${C.bold}Choose storage option:${C.reset}`);
  log(`  [1] D1-only free-tier (default)`);
  log(`  [2] Cloudflare R2 Bucket (automated creation & binding)`);
  log(`  [3] External S3-Compatible (MinIO, Backblaze B2, AWS S3, Wasabi, etc.)`);
  const storageOption = await ask("Enter option (1, 2, or 3)", "1");

  if (storageOption === "2") {
    const bucketName = await ask("Enter R2 Bucket Name", "prism-analytics-storage");
    info(`Provisioning R2 bucket "${bucketName}"...`);
    if (run(`npx wrangler r2 bucket create ${bucketName}`)) {
      success(`R2 bucket "${bucketName}" created successfully!`);
      const wranglerPath = path.join(__dirname, "wrangler.toml");
      const wranglerContent = fs.readFileSync(wranglerPath, "utf8");
      if (!wranglerContent.includes("FILES_BUCKET")) {
        const r2Block = `\n\n[[r2_buckets]]\nbinding = "FILES_BUCKET"\nbucket_name = "${bucketName}"\n`;
        fs.appendFileSync(wranglerPath, r2Block, "utf8");
        success("Added R2 bucket binding to wrangler.toml");
      }
    } else {
      warn("R2 bucket creation failed. It may already exist or required permissions are missing.");
    }
  } else if (storageOption === "3") {
    const s3Endpoint = await ask("Enter S3 Endpoint (e.g. https://s3.us-west-002.backblazeb2.com)", "");
    const s3AccessKeyId = await ask("Enter S3 Access Key ID", "");
    const s3SecretAccessKey = await ask("Enter S3 Secret Access Key", "");
    const s3BucketName = await ask("Enter S3 Bucket Name", "prism-analytics-storage");
    const s3Region = await ask("Enter S3 Region", "us-east-1");

    if (s3Endpoint && s3AccessKeyId && s3SecretAccessKey && s3BucketName) {
      info("Storing S3 environment variables and secrets...");
      const putSecret = (name, value) => {
        return new Promise((resolve) => {
          const shell = process.platform === "win32" ? "cmd" : "sh";
          const args = process.platform === "win32"
            ? ["/c", `npx wrangler secret put ${name}`]
            : ["-c", `npx wrangler secret put ${name}`];
          const child = spawn(shell, args, { cwd: __dirname, stdio: ["pipe", "pipe", "pipe"] });
          setTimeout(() => { child.stdin.write(value + "\n"); child.stdin.end(); }, 500);
          child.on("close", (code) => resolve(code === 0));
        });
      };
      
      await putSecret("S3_ACCESS_KEY_ID", s3AccessKeyId);
      await putSecret("S3_SECRET_ACCESS_KEY", s3SecretAccessKey);
      
      const wranglerPath = path.join(__dirname, "wrangler.toml");
      let wranglerContent = fs.readFileSync(wranglerPath, "utf8");
      const s3Vars = `\nS3_ENDPOINT = "${s3Endpoint}"\nS3_BUCKET_NAME = "${s3BucketName}"\nS3_REGION = "${s3Region}"\n`;
      if (wranglerContent.includes("[vars]")) {
        wranglerContent = wranglerContent.replace("[vars]", `[vars]${s3Vars}`);
      } else {
        wranglerContent += `\n[vars]${s3Vars}`;
      }
      fs.writeFileSync(wranglerPath, wranglerContent, "utf8");
      success("Stored S3 configuration variables in wrangler.toml & wrangler secrets");
    } else {
      warn("S3 values cannot be empty. Skipping S3 storage setup.");
    }
  }

  step(6, "Creating encrypted JWT signing secret");
  const jwtSecret = crypto.randomBytes(48).toString("hex");
  const secretResult = await pipeSecret(jwtSecret);
  if (secretResult.ok) {
    success("JWT_SECRET stored in Cloudflare encrypted secret storage");
  } else {
    warn("Secret upload was unavailable; the Worker will securely create and persist a random signing key in private D1 storage.");
  }

  const envLocal = path.join(__dirname, ".env.local");
  const existingEnv = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : "";
  if (!existingEnv.includes("JWT_SECRET=")) {
    fs.appendFileSync(envLocal, `\nJWT_SECRET=${jwtSecret}\n`, "utf8");
  }

  const urlMatch = deploy.output.match(/https:\/\/[^\s]+\.workers\.dev/);
  const liveUrl = urlMatch ? urlMatch[0] : `https://${appName}.YOUR_SUBDOMAIN.workers.dev`;

  log(`\n${C.green}${C.bold}╔══════════════════════════════════════════════════════╗`);
  log(`║                 Setup complete                      ║`);
  log(`╚══════════════════════════════════════════════════════╝${C.reset}`);
  log(`\nDashboard: ${C.cyan}${liveUrl}${C.reset}`);
  log(`Health:    ${C.cyan}${liveUrl}/api/health${C.reset}`);
  log(`\nStorage: D1 SQLite only (free tier; no R2 subscription).\n`);
  rl.close();
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  rl.close();
  process.exit(1);
});
