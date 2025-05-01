import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// substitua 'NOME-DO-REPOSITORIO' pelo nome exato do repositório no GitHub
const repoName = "NOME-DO-REPOSITORIO";

export default defineConfig(({ mode }) => ({
  base: `/${repoName}/`,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
