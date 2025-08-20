/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string
  // 可以在这里添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}