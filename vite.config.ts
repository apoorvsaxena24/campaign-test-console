import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import http from "node:http";
import https from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";

function ctcProxyPlugin(): Plugin {
  return {
    name: "ctc-proxy",
    configureServer(server) {
      server.middlewares.use("/ctc-proxy", (req: IncomingMessage, res: ServerResponse) => {
        const targetBase = req.headers["x-target-base"] as string | undefined;
        if (!targetBase) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing X-Target-Base header" }));
          return;
        }

        let targetUrl: URL;
        try {
          const apiPath = (req.url ?? "/").replace(/^\/ctc-proxy/, "");
          targetUrl = new URL(apiPath, targetBase.replace(/\/$/, "") + "/");
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid target URL" }));
          return;
        }

        const forwardHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(req.headers)) {
          const k = key.toLowerCase();
          if (k === "host" || k === "x-target-base" || k === "origin" || k === "referer") continue;
          if (typeof val === "string") forwardHeaders[key] = val;
        }
        forwardHeaders["host"] = targetUrl.host;

        const isHttps = targetUrl.protocol === "https:";
        const transport = isHttps ? https : http;

        const proxyReq = transport.request(
          targetUrl,
          {
            method: req.method ?? "GET",
            headers: forwardHeaders,
            rejectUnauthorized: false,
          },
          (proxyRes) => {
            const respHeaders: Record<string, string | string[]> = {};
            for (const [key, val] of Object.entries(proxyRes.headers)) {
              if (val != null) {
                const k = key.toLowerCase();
                if (k === "transfer-encoding") continue;
                respHeaders[key] = val as string | string[];
              }
            }
            res.writeHead(proxyRes.statusCode ?? 502, respHeaders);
            proxyRes.pipe(res);
          },
        );

        proxyReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
        });

        req.pipe(proxyReq);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ctcProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5180,
  },
});
