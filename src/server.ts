import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CredentialsMissingError,
  HiggsfieldApiError,
  HiggsfieldClient,
  isSoulSize,
  SOUL_SIZES,
  type DopImage2VideoInput,
  type SoulText2ImageInput,
} from './higgsfield/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'public');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

/**
 * Built lazily so the server still boots (and serves a clear error) when
 * credentials are missing, instead of crashing at import time.
 */
let client: HiggsfieldClient | undefined;
function getClient(): HiggsfieldClient {
  client ??= new HiggsfieldClient();
  return client;
}

/** Rejects anything that is not a non-empty string. */
function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestError(`"${field}" must be a non-empty string`);
  }
  return value.trim();
}

function requireHttpUrl(value: unknown, field: string): string {
  const raw = requireString(value, field);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new BadRequestError(`"${field}" must be a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestError(`"${field}" must be an http(s) URL`);
  }
  return parsed.toString();
}

class BadRequestError extends Error {}

/** Set only when the server is reachable at a public HTTPS URL. */
const webhookUrl = process.env.HIGGSFIELD_WEBHOOK_URL;

/**
 * Starts a generation and returns immediately with a request id. The browser
 * polls `/api/requests/:id` rather than holding a connection open for the
 * minutes a video can take.
 */
app.post('/api/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = body.kind === 'video' ? 'video' : 'image';
    const prompt = requireString(body.prompt, 'prompt');

    const submitted =
      kind === 'image'
        ? await getClient().submit(
            '/v1/text2image/soul',
            buildSoulInput(prompt, body),
            { webhookUrl },
          )
        : await getClient().submit(
            '/v1/image2video/dop',
            buildDopInput(prompt, body),
            { webhookUrl },
          );

    res.status(202).json({
      kind,
      request_id: submitted.request_id,
      status: submitted.status,
    });
  } catch (error) {
    next(error);
  }
});

function buildSoulInput(
  prompt: string,
  body: Record<string, unknown>,
): SoulText2ImageInput {
  const size = body.size ?? '1536x1536';
  if (!isSoulSize(size)) {
    throw new BadRequestError(
      `"size" must be one of: ${SOUL_SIZES.join(', ')}`,
    );
  }
  const quality = body.quality === '720p' ? '720p' : '1080p';
  const batchSize = body.batch_size === 4 ? 4 : 1;

  return {
    prompt,
    width_and_height: size,
    quality,
    batch_size: batchSize,
    enhance_prompt: body.enhance_prompt !== false,
  };
}

function buildDopInput(
  prompt: string,
  body: Record<string, unknown>,
): DopImage2VideoInput {
  const imageUrl = requireHttpUrl(body.image_url, 'image_url');
  const model =
    body.model === 'dop-lite' || body.model === 'dop-standard'
      ? body.model
      : 'dop-turbo';

  return {
    model,
    prompt,
    input_images: [{ type: 'image_url', image_url: imageUrl }],
    enhance_prompt: body.enhance_prompt !== false,
  };
}

/** Status passthrough for the browser's polling loop. */
app.get('/api/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = requireString(req.params.id, 'id');
    const result = await getClient().status(requestId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Completion callback. Higgsfield POSTs here when HIGGSFIELD_WEBHOOK_URL is
 * configured. Acknowledge fast; this demo only logs.
 */
app.post('/api/webhook', (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { request_id?: string; status?: string };
  console.log(
    `[webhook] request ${body.request_id ?? 'unknown'} -> ${body.status ?? 'unknown'}`,
  );
  res.status(204).end();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, webhookConfigured: Boolean(webhookUrl) });
});

// Error handler. Credentials and upstream failures get accurate status codes
// so the page can show something better than "something went wrong".
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof BadRequestError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof CredentialsMissingError) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
    return;
  }
  if (error instanceof HiggsfieldApiError) {
    console.error(error.message);
    // 4xx from upstream is usually this request's fault; 5xx is theirs.
    res.status(error.isClientError ? 400 : 502).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Unexpected server error' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
  if (!webhookUrl) {
    console.log('HIGGSFIELD_WEBHOOK_URL not set — using polling only.');
  }
});

export { app };
