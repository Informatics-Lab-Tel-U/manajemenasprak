import { NextResponse } from 'next/server';
import http from 'node:http';

export async function GET() {
  // Test 1: console.log biasa (harus dicapture oleh bridge)
  console.log('[OTEL-TEST] Test log dari API route — INFO');
  console.warn('[OTEL-TEST] Test warn dari API route — WARN');
  console.error('[OTEL-TEST] Test error dari API route — ERROR');

  // Test 2: OTEL Logger API
  let otelDirect = 'skipped';
  let otelProviderName = 'unknown';
  let processorCount = -1;
  try {
    const { logs, SeverityNumber } = await import('@opentelemetry/api-logs');
    const logger = logs.getLogger('api-direct-test', '1.0.0');
    const provider = logs.getLoggerProvider();
    otelProviderName = provider?.constructor?.name ?? 'unknown';
    // @ts-expect-error internal state
    processorCount = provider?._sharedState?.registeredLogRecordProcessors?.length ?? -1;

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: '[OTEL-TEST] Direct OTEL emit dari API route',
      attributes: { 'test.source': 'api-direct' },
    });
    otelDirect = `OK — provider: ${otelProviderName}`;
  } catch (e) {
    otelDirect = `ERROR: ${String(e)}`;
  }

  // Test 3: Direct HTTP ke OpenObserve — bypass semua OTEL SDK
  const directHttpResult = await new Promise<string>((resolve) => {
    const token = process.env.OTEL_AUTH_TOKEN ?? '';
    const baseUrl = process.env.OTEL_ENDPOINT ?? 'http://localhost:5080/api/default';
    const payload = JSON.stringify({
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'manajemenasprak-app' } }] },
        scopeLogs: [{
          scope: { name: 'direct-http-test' },
          logRecords: [{
            timeUnixNano: String(Date.now() * 1_000_000),
            severityNumber: 9,
            severityText: 'INFO',
            body: { stringValue: '[OTEL-TEST] Direct HTTP dari API route — bypass SDK' },
            attributes: [{ key: 'test.source', value: { stringValue: 'direct-http' } }],
          }],
        }],
      }],
    });

    const urlObj = new URL(`${baseUrl}/v1/logs`);
    const options = {
      hostname: urlObj.hostname,
      port: Number(urlObj.port) || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Basic ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(`HTTP ${res.statusCode}: ${body || '(empty)'}`));
    });
    req.on('error', (e) => resolve(`REQUEST ERROR: ${e.message}`));
    req.write(payload);
    req.end();
  });

  process.stdout.write(`[OTEL-DEBUG] directHttpResult = ${directHttpResult}\n`);
  process.stdout.write(`[OTEL-DEBUG] otelProviderName = ${otelProviderName}\n`);

  return NextResponse.json({
    status: 'debug logs sent',
    timestamp: new Date().toISOString(),
    otelDirectEmit: otelDirect,
    processorCount,
    directHttpToOpenObserve: directHttpResult,
    message: 'Check OpenObserve Logs stream "default" for [OTEL-TEST] entries',
  });
}
