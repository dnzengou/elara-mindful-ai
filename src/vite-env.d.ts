/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_API_URL?: string;
  readonly VITE_LLM_API_KEY?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_LLM_MODEL?: string;
  readonly VITE_XAI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
