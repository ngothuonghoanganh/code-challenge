import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();
const server = createServer(app);

server.listen(port, () => {
  console.log(`Problem 5 server listening on http://localhost:${port}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await app.locals.close();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
