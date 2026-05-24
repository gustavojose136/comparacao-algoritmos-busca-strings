import { SpanStatusCode } from "@opentelemetry/api";
import { algorithmKeys, createStrategy } from "./algorithms/index.js";
import { currentTraceId, instruments, logEvent, tracer } from "./observability/otel.js";

export function executeSearch({ text, pattern, algorithm = "all", source = "api" }) {
  const selected = algorithm === "all" ? algorithmKeys : [algorithm];
  const results = [];

  return tracer.startActiveSpan("search.request", {
    attributes: {
      "search.algorithm": algorithm,
      "search.pattern.length": pattern.length,
      "search.text.length": text.length,
      "search.source": source
    }
  }, rootSpan => {
    try {
      for (const key of selected) {
        const strategy = createStrategy(key);
        const result = tracer.startActiveSpan("search.algorithm", {
          attributes: {
            "search.algorithm": strategy.key,
            "search.algorithm.name": strategy.name,
            "search.pattern.length": pattern.length,
            "search.text.length": text.length
          }
        }, span => {
          try {
            const searchResult = strategy.execute(text, pattern, currentTraceId());
            span.setAttributes({
              "search.matches": searchResult.matchCount,
              "search.comparisons": searchResult.comparisons,
              "search.duration_ms": searchResult.durationMs
            });

            const attrs = {
              algorithm: strategy.key,
              algorithm_name: strategy.name,
              source
            };
            instruments.executions.add(1, attrs);
            instruments.duration.record(searchResult.durationMs, attrs);
            instruments.comparisons.add(searchResult.comparisons, attrs);
            instruments.processedChars.add(text.length, attrs);
            instruments.matches.add(searchResult.matchCount, attrs);

            logEvent("INFO", "search completed", {
              ...attrs,
              duration_ms: Number(searchResult.durationMs.toFixed(4)),
              comparisons: searchResult.comparisons,
              matches: searchResult.matchCount,
              text_length: text.length,
              pattern_length: pattern.length
            });

            return searchResult;
          } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
          } finally {
            span.end();
          }
        });
        results.push(result);
      }

      rootSpan.setAttributes({
        "search.result.count": results.length,
        "search.trace_id": currentTraceId()
      });
      return {
        traceId: currentTraceId(),
        results
      };
    } catch (error) {
      rootSpan.recordException(error);
      rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      logEvent("ERROR", "search failed", { error: error.message, algorithm, source });
      throw error;
    } finally {
      rootSpan.end();
    }
  });
}
