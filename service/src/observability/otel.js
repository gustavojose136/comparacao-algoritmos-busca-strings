import { metrics, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const serviceName = process.env.OTEL_SERVICE_NAME || "busca-strings-service";
const serviceVersion = process.env.npm_package_version || "2.0.0";
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [
    new BatchLogRecordProcessor(new OTLPLogExporter({ url: `${endpoint}/v1/logs` }))
  ]
});
logs.setGlobalLoggerProvider(loggerProvider);

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
    exportIntervalMillis: 5000
  })
});

const startResult = sdk.start();
if (startResult && typeof startResult.catch === "function") {
  startResult.catch(error => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "opentelemetry startup failed",
      error: error.message
    }));
  });
}

const meter = metrics.getMeter(serviceName);
const tracer = trace.getTracer(serviceName);
const otelLogger = logs.getLogger(serviceName);

export const instruments = {
  executions: meter.createCounter("search_executions_total", {
    description: "Quantidade de execucoes por algoritmo"
  }),
  duration: meter.createHistogram("search_duration_ms", {
    description: "Tempo de execucao da busca em milissegundos",
    unit: "ms"
  }),
  comparisons: meter.createCounter("search_comparisons_total", {
    description: "Quantidade de comparacoes de caracteres"
  }),
  processedChars: meter.createCounter("search_processed_chars_total", {
    description: "Quantidade de caracteres processados"
  }),
  matches: meter.createCounter("search_matches_total", {
    description: "Quantidade de ocorrencias encontradas"
  })
};

export { tracer };

export function currentTraceId() {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId || null;
}

export function logEvent(severityText, body, attributes = {}) {
  const severity = severityText === "ERROR" ? SeverityNumber.ERROR : SeverityNumber.INFO;
  const activeSpan = trace.getActiveSpan();
  const traceId = activeSpan?.spanContext().traceId;
  const spanId = activeSpan?.spanContext().spanId;
  const record = {
    severityNumber: severity,
    severityText,
    body,
    attributes: {
      ...attributes,
      trace_id: traceId,
      span_id: spanId
    }
  };

  otelLogger.emit(record);
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: severityText.toLowerCase(),
    message: body,
    trace_id: traceId,
    span_id: spanId,
    ...attributes
  }));
}

process.on("SIGTERM", async () => {
  await sdk.shutdown();
  await loggerProvider.shutdown();
  process.exit(0);
});
