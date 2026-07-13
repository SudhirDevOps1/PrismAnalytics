import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { AuthUser } from "../shared/types";

export type WorkerBindings = {
  DB: D1Database;
  KV?: KVNamespace;
  ASSETS?: { fetch(input: string): Promise<Response> };
  JWT_SECRET?: string;
  APP_URL?: string;
  VERSION?: string;
  ENVIRONMENT?: string;

  // Optional Storage Bindings
  FILES_BUCKET?: any; // Cloudflare R2 Bucket binding

  // Optional S3-compatible credentials
  S3_ENDPOINT?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_BUCKET_NAME?: string;
  S3_REGION?: string;
};

export type AppEnv = {
  Bindings: WorkerBindings;
  Variables: { user: AuthUser };
};
