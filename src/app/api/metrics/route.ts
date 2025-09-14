import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

export async function GET(req: Request) {
  const metrics = await client.register.metrics();
  return new Response(metrics, {
    status: 200,
    headers: { 'Content-Type': client.register.contentType },
  });
}
