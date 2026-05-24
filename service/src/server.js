import "./observability/otel.js";
import cors from "cors";
import express from "express";
import { algorithmKeys } from "./algorithms/index.js";
import { logEvent } from "./observability/otel.js";
import { executeSearch } from "./searchService.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const maxPayload = process.env.MAX_PAYLOAD || "25mb";

app.use(cors());
app.use(express.json({ limit: maxPayload }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "busca-strings-service",
    algorithms: algorithmKeys
  });
});

app.get("/algorithms", (_req, res) => {
  res.json({ algorithms: ["all", ...algorithmKeys] });
});

app.post("/search", (req, res) => {
  const { text, pattern, algorithm = "all", source = "api" } = req.body || {};

  if (typeof text !== "string" || typeof pattern !== "string") {
    res.status(400).json({ error: "Campos obrigatorios: text e pattern como string." });
    return;
  }
  if (algorithm !== "all" && !algorithmKeys.includes(algorithm)) {
    res.status(400).json({ error: `Algoritmo invalido. Use: all, ${algorithmKeys.join(", ")}.` });
    return;
  }

  const payload = executeSearch({ text, pattern, algorithm, source });
  res.json(payload);
});

app.listen(port, () => {
  logEvent("INFO", "service started", { port });
});
