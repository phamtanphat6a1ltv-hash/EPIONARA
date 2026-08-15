import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Custom Vite plugin to calculate and log bundle size statistics during the build phase.
 */
const bundleSizeAnalyzerPlugin = () => {
  return {
    name: "bundle-size-analyzer",
    generateBundle(options, bundle) {
      console.log("\n===== BUNDLE SIZE ANALYSIS =====");
      let totalSize = 0;
      const chunks = [];
      for (const [fileName, fileInfo] of Object.entries(bundle)) {
        if (fileInfo.type === "chunk") {
          const sizeKb = (fileInfo.code.length / 1024).toFixed(2);
          chunks.push({ name: fileName, size: parseFloat(sizeKb) });
          totalSize += fileInfo.code.length;
        }
      }
      chunks.sort((a, b) => b.size - a.size);
      chunks.forEach((c) => {
        console.log(`- ${c.name.padEnd(35)} : ${c.size.toString().padStart(8)} KB`);
      });
      console.log(`Total Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log("=================================\n");
    },
  };
};

/**
 * Custom Vite plugin to preload the first route page chunk (HomePage) dynamically.
 */
const preloadHomePlugin = () => {
  return {
    name: "preload-home-plugin",
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;

      // Look for the HomePage chunk
      const homeChunk = Object.values(ctx.bundle).find(
        (chunk) => chunk.name && chunk.name.includes("HomePage")
      );

      if (homeChunk) {
        const url = `/${homeChunk.fileName}`;
        const preloadTag = `<link rel="modulepreload" href="${url}">`;
        return html.replace("</head>", `  ${preloadTag}\n</head>`);
      }
      return html;
    },
  };
};

export default defineConfig({
  plugins: [react(), preloadHomePlugin(), bundleSizeAnalyzerPlugin()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) {
              return "vendor-react";
            }
            if (
              id.includes("recharts") ||
              id.includes("d3") ||
              id.includes("internmap") ||
              id.includes("victory-vendor")
            ) {
              return "vendor-charts";
            }
            if (id.includes("zustand")) {
              return "vendor-zustand";
            }
          }
        },
      },
    },
  },
});
