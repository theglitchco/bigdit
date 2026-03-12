import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"]
]);

http
  .createServer(async (request, response) => {
    try {
      const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname;
      const filePath = resolveRequestPath(requestPath);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        sendFile(path.join(filePath, "index.html"), response);
        return;
      }

      sendFile(filePath, response);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  })
  .listen(port, host, () => {
    console.log(`Static server running at http://${host}:${port}`);
  });

function resolveRequestPath(requestPath) {
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(rootDir, normalized);

  if (existsSync(filePath)) {
    return filePath;
  }

  return path.join(rootDir, normalized, "index.html");
}

function sendFile(filePath, response) {
  const extension = path.extname(filePath);
  response.writeHead(200, {
    "content-type": contentTypes.get(extension) || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}
