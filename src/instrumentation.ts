import { registerOTel } from '@vercel/otel';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export async function register() {
  const baseUrl =
    process.env.OTEL_ENDPOINT || 'http://localhost:5080/api/default';
  const token = process.env.OTEL_AUTH_TOKEN || '';
  const headers: Record<string, string> = token ? { Authorization: `Basic ${token}` } : {};

  const traceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/v1/traces`,
    headers,
  });

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import dinamis agar Turbopack tidak memindai isi file ini
    // saat mem-bundle Edge runtime. File .node.ts hanya ada di Node.js bundle.
    const { buildNodeOtelConfig, setupConsoleBridge, setupProcessMetrics } =
      await import('./instrumentation.node');

    const nodeConfig = buildNodeOtelConfig(baseUrl, headers);

    registerOTel({
      serviceName: 'manajemenasprak-app',
      spanProcessors: [new BatchSpanProcessor(traceExporter)],
      ...nodeConfig,
    });

    setupConsoleBridge(baseUrl, headers);
    setupProcessMetrics();

    console.log('[OTEL] Initialized: traces + logs + metrics →', baseUrl);
  } else {
    // Edge runtime: hanya traces (sdk-logs & sdk-metrics tidak support edge)
    registerOTel({
      serviceName: 'manajemenasprak-app',
      spanProcessors: [new BatchSpanProcessor(traceExporter)],
    });
  }
}