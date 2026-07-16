/**
 * instrumentation.node.ts
 *
 * File ini HANYA dieksekusi di Node.js runtime.
 * Dipisah dari instrumentation.ts agar Turbopack tidak menganalisis
 * process.memoryUsage() saat mem-bundle Edge runtime.
 */

import type { OTLPMetricExporter as OTLPMetricExporterType } from '@opentelemetry/exporter-metrics-otlp-http';
import type { PeriodicExportingMetricReader as PeriodicExportingMetricReaderType } from '@opentelemetry/sdk-metrics';
import type { LogRecordProcessor, ReadableLogRecord } from '@opentelemetry/sdk-logs';
import type { ExportResult } from '@opentelemetry/core';

// ─────────────────────────────────────────────────────────────────────────────
// Custom JSON Log Exporter
// OTLPLogExporter dari SDK menggunakan protobuf by default di Node.js.
// OpenObserve membutuhkan application/json. Kita buat sendiri yang terbukti
// bekerja (sama persis formatnya dengan manual test PowerShell yang sukses).
// ─────────────────────────────────────────────────────────────────────────────

class JsonLogExporter {
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(url: string, headers: Record<string, string>) {
    this.url = url;
    this.headers = headers;
  }

  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {

    if (logs.length === 0) {
      resultCallback({ code: 0 });
      return;
    }

    const resourceLogs = [
      {
        resource: {
          attributes: logs[0]?.resource?.attributes
            ? Object.entries(logs[0].resource.attributes).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) },
              }))
            : [],
        },
        scopeLogs: [
          {
            scope: { name: 'console-bridge' },
            logRecords: logs.map(log => ({
              timeUnixNano: String(
                log.hrTime
                  ? log.hrTime[0] * 1_000_000_000 + log.hrTime[1]
                  : Date.now() * 1_000_000,
              ),
              severityNumber: log.severityNumber ?? 9,
              severityText: log.severityText ?? 'INFO',
              body: { stringValue: String(log.body ?? '') },
              attributes: Object.entries(log.attributes ?? {}).map(
                ([key, value]) => ({
                  key,
                  value: { stringValue: String(value) },
                }),
              ),
            })),
          },
        ],
      },
    ];

    const payload = JSON.stringify({ resourceLogs });

    // Gunakan http module bawaan Node.js — terbukti lebih reliable di Next.js
    // daripada fetch() yang mungkin terikat ke Web API environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const https = require('node:https');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const http = require('node:http');

    const urlObj = new URL(this.url);
    const isHttps = urlObj.protocol === 'https:';
    const agent = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...this.headers,
      },
    };

    const req = agent.request(options, (res: { statusCode: number }) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resultCallback({ code: 0 }); // SUCCESS
      } else {
        resultCallback({ code: 1, error: new Error(`HTTP ${res.statusCode}`) });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resultCallback({ code: 1, error: new Error('Request timeout') });
    });

    req.on('error', (err: Error) => {
      resultCallback({ code: 1, error: err });
    });

    req.write(payload);
    req.end();
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build OTEL Node.js config (metrics only, logs bypassed @vercel/otel)
// ─────────────────────────────────────────────────────────────────────────────

export function buildNodeOtelConfig(baseUrl: string, headers: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics') as {
    PeriodicExportingMetricReader: typeof PeriodicExportingMetricReaderType;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http') as {
    OTLPMetricExporter: typeof OTLPMetricExporterType;
  };

  const metricExporter = new OTLPMetricExporter({ url: `${baseUrl}/v1/metrics`, headers });

  return {
    // logRecordProcessors: [] -> kita tangani manual di setupConsoleBridge
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 15_000,
      }),
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Console Bridge — intercept console.* → OTEL LoggerProvider → OpenObserve
// ─────────────────────────────────────────────────────────────────────────────

export function setupConsoleBridge(baseUrl: string, headers: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const util = require('node:util');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SeverityNumber } = require('@opentelemetry/api-logs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resourceFromAttributes } = require('@opentelemetry/resources');
  
  const logExporter = new JsonLogExporter(`${baseUrl}/v1/logs`, headers);
  
  // Kita buat LoggerProvider independen khusus untuk Console Bridge agar tidak mengganggu (override)
  // telemetry internal bawaan @vercel/otel dan Next.js (menghindari logs.disable() hack).
  const provider = new LoggerProvider({
    resource: resourceFromAttributes({ 'service.name': 'manajemenasprak-app' }),
    processors: [new SimpleLogRecordProcessor({ exporter: logExporter })]
  });
  
  const otelLogger = provider.getLogger('console-bridge', '1.0.0');

  const severityMap: Record<string, number> = {
    debug: SeverityNumber.DEBUG,
    log: SeverityNumber.INFO,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
    error: SeverityNumber.ERROR,
  };

  const originals: Record<string, (...a: unknown[]) => void> = {
    debug: console.debug.bind(console),
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  for (const [method, severityNumber] of Object.entries(severityMap)) {
    (console as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      originals[method](...args);
      try {
        const body = args
          .map(a => (typeof a === 'string' ? a : util.inspect(a, { depth: 4 })))
          .join(' ');
        otelLogger.emit({
          severityNumber,
          severityText: method.toUpperCase(),
          body,
          attributes: { 'log.type': 'console' },
        });
      } catch {
        /* jangan biarkan error OTEL mengganggu aplikasi */
      }
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Metrics — ObservableGauge untuk Node.js memory
// ─────────────────────────────────────────────────────────────────────────────

export function setupProcessMetrics() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { metrics } = require('@opentelemetry/api');
  const meter = metrics.getMeter('nodejs-process', '1.0.0');

  const heapUsed = meter.createObservableGauge(
    'process.runtime.nodejs.memory.heap.used',
    { description: 'Heap memory used (bytes)', unit: 'bytes' },
  );
  const heapTotal = meter.createObservableGauge(
    'process.runtime.nodejs.memory.heap.total',
    { description: 'Total heap allocated (bytes)', unit: 'bytes' },
  );
  const rssGauge = meter.createObservableGauge(
    'process.runtime.nodejs.memory.rss',
    { description: 'Resident Set Size (bytes)', unit: 'bytes' },
  );

  meter.addBatchObservableCallback(
    (observer: any) => {
      const mem = process.memoryUsage();
      observer.observe(heapUsed, mem.heapUsed);
      observer.observe(heapTotal, mem.heapTotal);
      observer.observe(rssGauge, mem.rss);
    },
    [heapUsed, heapTotal, rssGauge],
  );
}
