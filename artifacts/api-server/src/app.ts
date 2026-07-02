import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.use("/api", router);

// In production, serve the built web frontend from the same origin so the
// frontend's relative "/api" calls hit this server. This lets the whole app
// run as a single service (e.g. one Railway service).
if (process.env["NODE_ENV"] === "production") {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = process.env["WEB_STATIC_DIR"]
    ? path.resolve(process.env["WEB_STATIC_DIR"])
    : path.resolve(here, "../../xbrainpro-web/dist/public");

  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    // SPA fallback: any non-API GET returns index.html.
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(staticDir, "index.html"));
    });
    logger.info({ staticDir }, "Serving web frontend from static dir");
  } else {
    logger.warn(
      { staticDir },
      "NODE_ENV=production but web static dir not found; serving API only",
    );
  }
}

export default app;
