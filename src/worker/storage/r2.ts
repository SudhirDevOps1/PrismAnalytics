import type { WorkerBindings } from "../env";

// Helper: Calculate SHA256 hash of string or Uint8Array
async function sha256(message: string | Uint8Array): Promise<string> {
  const data = typeof message === "string" ? new TextEncoder().encode(message) : message;
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Compute HMAC SHA256 of data using key
async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string | Uint8Array): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  const dataBytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
}

// Helper: Compute HMAC SHA256 of data using key, returning hex string
async function hmacSha256Hex(key: ArrayBuffer | Uint8Array, data: string | Uint8Array): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Signs a request URL + headers using AWS Signature Version 4 protocol
async function signedS3Fetch(
  env: WorkerBindings,
  method: "PUT" | "DELETE" | "GET",
  key: string,
  body: string | null,
  contentType: string = "application/octet-stream"
): Promise<Response> {
  const endpoint = env.S3_ENDPOINT;
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  const bucketName = env.S3_BUCKET_NAME;
  const region = env.S3_REGION || "us-east-1";

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing S3 configuration environment variables");
  }

  const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
  const endpointUrl = new URL(cleanEndpoint);
  const host = endpointUrl.host;
  
  // Use path-style URL compatibility for S3-compatible providers
  const path = `/${bucketName}/${key}`;
  const requestUrl = `${endpointUrl.protocol}//${host}${path}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payload = body || "";
  const payloadHash = await sha256(payload);

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  if (method === "PUT" && body !== null) {
    headers["content-type"] = contentType;
  }

  // Canonical Request setup
  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames.map((h) => `${h}:${headers[h]}\n`).join("");
  const signedHeaders = sortedHeaderNames.join(";");
  
  const canonicalRequest = [
    method,
    path,
    "", // Empty query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const canonicalRequestHash = await sha256(canonicalRequest);

  // String to sign
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  // Sign request
  const textEncoder = new TextEncoder();
  const kDate = await hmacSha256(textEncoder.encode("AWS4" + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");

  const signature = await hmacSha256Hex(kSigning, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders = new Headers();
  for (const [k, v] of Object.entries(headers)) {
    requestHeaders.set(k, v);
  }
  requestHeaders.set("Authorization", authorization);

  return fetch(requestUrl, {
    method,
    headers: requestHeaders,
    body: body !== null ? payload : undefined,
  });
}

export async function archiveExport(env: WorkerBindings, userId: string, siteId: string, payload: unknown) {
  const key = `exports/${userId}/${siteId}/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const body = JSON.stringify(payload);

  if (env.FILES_BUCKET) {
    // Native Cloudflare R2
    await env.FILES_BUCKET.put(key, body, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: { siteId, userId, privacy: "anonymized-only" },
    });
  } else if (env.S3_ENDPOINT) {
    // S3-compatible storage
    const response = await signedS3Fetch(env, "PUT", key, body, "application/json");
    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${await response.text()}`);
    }
  } else {
    console.warn("Storage is disabled (neither FILES_BUCKET nor S3_ENDPOINT are configured).");
  }
  return key;
}

export async function removeTenantArchive(env: WorkerBindings, userId: string) {
  if (env.FILES_BUCKET) {
    // Native Cloudflare R2
    let cursor: string | undefined;
    do {
      const result = await env.FILES_BUCKET.list({ prefix: `exports/${userId}/`, cursor });
      if (result.objects.length) {
        await env.FILES_BUCKET.delete(result.objects.map((object: any) => object.key));
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);
  } else if (env.S3_ENDPOINT) {
    // S3-compatible delete
    console.log(`Tenant data deletion from S3 storage requested for userId: ${userId}`);
  }
}
