/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ISSUANCE_URL: string;
  readonly VITE_VERIFY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}