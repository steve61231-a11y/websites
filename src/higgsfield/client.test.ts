import { describe, expect, it, vi } from 'vitest';

import {
  credentialsFromEnv,
  DEFAULT_BASE_URL,
  HiggsfieldClient,
} from './client.js';
import { CredentialsMissingError, HiggsfieldApiError } from './errors.js';
import { isTerminal } from './types.js';

const CREDENTIALS = { apiKey: 'key-id', apiSecret: 'key-secret' };

/** Builds a fetch stub that returns the given responses in order. */
function stubFetch(
  responses: Array<{ status?: number; body?: unknown }>,
): { fetchImpl: typeof fetch; calls: Array<{ url: URL; init: RequestInit }> } {
  const calls: Array<{ url: URL; init: RequestInit }> = [];
  let index = 0;

  const fetchImpl = vi.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: url as URL, init: init ?? {} });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    const status = next?.status ?? 200;
    return new Response(JSON.stringify(next?.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

function makeClient(
  fetchImpl: typeof fetch,
  overrides: Record<string, unknown> = {},
) {
  return new HiggsfieldClient({
    credentials: CREDENTIALS,
    fetchImpl,
    pollIntervalMs: 1,
    retryBackoffMs: 1,
    ...overrides,
  });
}

describe('credentialsFromEnv', () => {
  it('parses the combined HF_CREDENTIALS form', () => {
    expect(credentialsFromEnv({ HF_CREDENTIALS: 'abc:xyz' })).toEqual({
      apiKey: 'abc',
      apiSecret: 'xyz',
    });
  });

  it('falls back to the separate key and secret variables', () => {
    expect(
      credentialsFromEnv({ HF_API_KEY: 'abc', HF_API_SECRET: 'xyz' }),
    ).toEqual({ apiKey: 'abc', apiSecret: 'xyz' });
  });

  it('keeps colons that appear inside the secret', () => {
    expect(credentialsFromEnv({ HF_CREDENTIALS: 'abc:x:y:z' })).toEqual({
      apiKey: 'abc',
      apiSecret: 'x:y:z',
    });
  });

  it('throws when nothing usable is set', () => {
    expect(() => credentialsFromEnv({})).toThrow(CredentialsMissingError);
    expect(() => credentialsFromEnv({ HF_CREDENTIALS: 'no-separator' })).toThrow(
      CredentialsMissingError,
    );
  });
});

describe('submit', () => {
  it('posts the input to the endpoint with the Key auth header', async () => {
    const { fetchImpl, calls } = stubFetch([
      { status: 200, body: { request_id: 'req-1', status: 'queued' } },
    ]);

    const result = await makeClient(fetchImpl).submit('/v1/text2image/soul', {
      prompt: 'a lighthouse',
      width_and_height: '1536x1536',
      quality: '1080p',
      batch_size: 1,
    });

    expect(result.request_id).toBe('req-1');
    expect(calls).toHaveLength(1);

    const call = calls[0]!;
    expect(call.url.toString()).toBe(`${DEFAULT_BASE_URL}/v1/text2image/soul`);
    expect(call.init.method).toBe('POST');
    expect((call.init.headers as Record<string, string>).Authorization).toBe(
      'Key key-id:key-secret',
    );
    // The input is the body itself, not wrapped in a params envelope.
    expect(JSON.parse(call.init.body as string)).toEqual({
      prompt: 'a lighthouse',
      width_and_height: '1536x1536',
      quality: '1080p',
      batch_size: 1,
    });
  });

  it('normalises an endpoint given without a leading slash', async () => {
    const { fetchImpl, calls } = stubFetch([
      { body: { request_id: 'req-1', status: 'queued' } },
    ]);

    await makeClient(fetchImpl).submit('v1/text2image/soul', { prompt: 'x' });

    expect(calls[0]!.url.pathname).toBe('/v1/text2image/soul');
  });

  it('passes a webhook URL as the hf_webhook query parameter', async () => {
    const { fetchImpl, calls } = stubFetch([
      { body: { request_id: 'req-1', status: 'queued' } },
    ]);

    await makeClient(fetchImpl).submit(
      '/v1/text2image/soul',
      { prompt: 'x' },
      { webhookUrl: 'https://example.com/api/webhook?a=1' },
    );

    expect(calls[0]!.url.searchParams.get('hf_webhook')).toBe(
      'https://example.com/api/webhook?a=1',
    );
  });
});

describe('status', () => {
  it('reads the documented status path', async () => {
    const { fetchImpl, calls } = stubFetch([
      { body: { request_id: 'req 1', status: 'in_progress' } },
    ]);

    await makeClient(fetchImpl).status('req 1');

    expect(calls[0]!.url.pathname).toBe('/requests/req%201/status');
    expect(calls[0]!.init.method).toBe('GET');
  });
});

describe('error handling', () => {
  it('surfaces a 422 immediately without retrying', async () => {
    const { fetchImpl, calls } = stubFetch([
      { status: 422, body: { detail: 'bad size' } },
    ]);

    await expect(
      makeClient(fetchImpl).submit('/v1/text2image/soul', { prompt: 'x' }),
    ).rejects.toBeInstanceOf(HiggsfieldApiError);

    expect(calls).toHaveLength(1);
  });

  it('retries a 5xx and returns the eventual success', async () => {
    const { fetchImpl, calls } = stubFetch([
      { status: 503, body: { detail: 'upstream busy' } },
      { status: 200, body: { request_id: 'req-2', status: 'queued' } },
    ]);

    const result = await makeClient(fetchImpl).submit('/v1/text2image/soul', {
      prompt: 'x',
    });

    expect(result.request_id).toBe('req-2');
    expect(calls).toHaveLength(2);
  });

  it('gives up after maxRetries and reports the last error', async () => {
    const { fetchImpl, calls } = stubFetch([{ status: 500, body: 'boom' }]);

    await expect(
      makeClient(fetchImpl, { maxRetries: 2 }).status('req-1'),
    ).rejects.toMatchObject({ status: 500 });

    expect(calls).toHaveLength(3); // initial attempt + 2 retries
  });
});

describe('generate', () => {
  it('polls until the request reaches a terminal status', async () => {
    const { fetchImpl, calls } = stubFetch([
      { body: { request_id: 'req-3', status: 'queued' } },
      { body: { request_id: 'req-3', status: 'in_progress' } },
      {
        body: {
          request_id: 'req-3',
          status: 'completed',
          images: [{ url: 'https://cdn.example.com/a.png' }],
        },
      },
    ]);

    const seen: string[] = [];
    const result = await makeClient(fetchImpl).generate(
      '/v1/text2image/soul',
      { prompt: 'x' },
      { onStatus: (status) => seen.push(status) },
    );

    expect(seen).toEqual(['queued', 'in_progress', 'completed']);
    expect(result.images?.[0]?.url).toBe('https://cdn.example.com/a.png');
    expect(calls).toHaveLength(3);
  });

  it('returns without polling when the submit call is already terminal', async () => {
    const { fetchImpl, calls } = stubFetch([
      { body: { request_id: 'req-4', status: 'nsfw' } },
    ]);

    const result = await makeClient(fetchImpl).generate('/v1/text2image/soul', {
      prompt: 'x',
    });

    expect(result.status).toBe('nsfw');
    expect(calls).toHaveLength(1);
  });

  it('stops polling on a failed status rather than waiting for a timeout', async () => {
    const { fetchImpl } = stubFetch([
      { body: { request_id: 'req-5', status: 'queued' } },
      { body: { request_id: 'req-5', status: 'failed' } },
    ]);

    const result = await makeClient(fetchImpl).generate('/v1/text2image/soul', {
      prompt: 'x',
    });

    expect(result.status).toBe('failed');
  });
});

describe('isTerminal', () => {
  it('treats completed, failed and nsfw as final', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('nsfw')).toBe(true);
    expect(isTerminal('queued')).toBe(false);
    expect(isTerminal('in_progress')).toBe(false);
  });
});
