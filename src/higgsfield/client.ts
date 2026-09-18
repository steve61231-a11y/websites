import {
  CredentialsMissingError,
  HiggsfieldApiError,
  PollTimeoutError,
} from './errors.js';
import {
  isTerminal,
  type HiggsfieldResponse,
  type InputFor,
  type RequestStatus,
} from './types.js';

export const DEFAULT_BASE_URL = 'https://api.higgsfield.ai';

export interface Credentials {
  apiKey: string;
  apiSecret: string;
}

export interface ClientOptions {
  /** Defaults to credentials read from the environment. */
  credentials?: Credentials | string;
  /** Defaults to `HIGGSFIELD_BASE_URL` or `https://api.higgsfield.ai`. */
  baseUrl?: string;
  /** Per-request network timeout. Default 120s. */
  timeoutMs?: number;
  /** Delay between status polls. Default 2s. */
  pollIntervalMs?: number;
  /** Total time `generate` will poll before giving up. Default 5min. */
  maxPollMs?: number;
  /** Retries for network errors and 5xx responses. Default 3. */
  maxRetries?: number;
  /** Base delay for retry backoff, doubled each attempt. Default 1s. */
  retryBackoffMs?: number;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
}

export interface SubmitOptions {
  /**
   * Public HTTPS URL Higgsfield should POST to when the request finishes.
   * Sent as the `hf_webhook` query parameter.
   */
  webhookUrl?: string;
  signal?: AbortSignal;
}

export interface GenerateOptions extends SubmitOptions {
  /** Called on every status poll, including the terminal one. */
  onStatus?: (status: RequestStatus, response: HiggsfieldResponse) => void;
}

/**
 * Reads credentials from the environment, accepting both forms the official
 * SDK supports: a combined `HF_CREDENTIALS`/`HF_KEY` of "keyId:keySecret", or
 * separate `HF_API_KEY` and `HF_API_SECRET`.
 */
export function credentialsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): Credentials {
  const combined = env.HF_CREDENTIALS ?? env.HF_KEY;
  if (combined) {
    const separator = combined.indexOf(':');
    if (separator > 0 && separator < combined.length - 1) {
      return {
        apiKey: combined.slice(0, separator),
        apiSecret: combined.slice(separator + 1),
      };
    }
  }

  const apiKey = env.HF_API_KEY;
  const apiSecret = env.HF_API_SECRET;
  if (apiKey && apiSecret) {
    return { apiKey, apiSecret };
  }

  throw new CredentialsMissingError();
}

function parseCredentials(input: ClientOptions['credentials']): Credentials {
  if (!input) {
    return credentialsFromEnv();
  }
  if (typeof input !== 'string') {
    if (!input.apiKey || !input.apiSecret) {
      throw new CredentialsMissingError();
    }
    return input;
  }
  const separator = input.indexOf(':');
  if (separator <= 0 || separator >= input.length - 1) {
    throw new CredentialsMissingError();
  }
  return {
    apiKey: input.slice(0, separator),
    apiSecret: input.slice(separator + 1),
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Minimal server-side client for the Higgsfield v2 REST API.
 *
 * It holds an API secret, so it must never be constructed in a browser — route
 * calls through your own server instead.
 */
export class HiggsfieldClient {
  private readonly credentials: Credentials;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly maxPollMs: number;
  private readonly maxRetries: number;
  private readonly retryBackoffMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions = {}) {
    this.credentials = parseCredentials(options.credentials);
    this.baseUrl = (
      options.baseUrl ??
      process.env.HIGGSFIELD_BASE_URL ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.pollIntervalMs = options.pollIntervalMs ?? 2_000;
    this.maxPollMs = options.maxPollMs ?? 300_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryBackoffMs = options.retryBackoffMs ?? 1_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  /**
   * Submits a generation request and returns as soon as the API accepts it.
   * The response carries a `request_id` to poll with {@link status}.
   */
  async submit<E extends string>(
    endpoint: E,
    input: InputFor<E>,
    options: SubmitOptions = {},
  ): Promise<HiggsfieldResponse> {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(this.baseUrl + path);
    if (options.webhookUrl) {
      url.searchParams.set('hf_webhook', options.webhookUrl);
    }

    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(input),
      signal: options.signal,
    });
  }

  /** Fetches the current status of a previously submitted request. */
  async status(
    requestId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<HiggsfieldResponse> {
    const url = new URL(
      `${this.baseUrl}/requests/${encodeURIComponent(requestId)}/status`,
    );
    return this.request(url, { method: 'GET', signal: options.signal });
  }

  /**
   * Cancels a queued request using the `cancel_url` the API returned for it.
   * The URL is taken from a response rather than reconstructed, so this keeps
   * working if the API moves the route.
   */
  async cancel(
    cancelUrl: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<HiggsfieldResponse> {
    return this.request(new URL(cancelUrl, this.baseUrl), {
      method: 'POST',
      signal: options.signal,
    });
  }

  /**
   * Submits a request and polls until it reaches a terminal status.
   *
   * A `completed` result is not guaranteed — inspect `status` on the result,
   * which may also be `failed` or `nsfw`.
   */
  async generate<E extends string>(
    endpoint: E,
    input: InputFor<E>,
    options: GenerateOptions = {},
  ): Promise<HiggsfieldResponse> {
    const submitted = await this.submit(endpoint, input, options);
    options.onStatus?.(submitted.status, submitted);
    if (isTerminal(submitted.status)) {
      return submitted;
    }
    return this.poll(submitted.request_id, options);
  }

  /** Polls an existing request until it reaches a terminal status. */
  async poll(
    requestId: string,
    options: GenerateOptions = {},
  ): Promise<HiggsfieldResponse> {
    const deadline = Date.now() + this.maxPollMs;

    for (;;) {
      await sleep(this.pollIntervalMs);

      const current = await this.status(requestId, { signal: options.signal });
      options.onStatus?.(current.status, current);
      if (isTerminal(current.status)) {
        return current;
      }

      if (Date.now() >= deadline) {
        throw new PollTimeoutError(requestId, this.maxPollMs);
      }
    }
  }

  private authHeader(): string {
    return `Key ${this.credentials.apiKey}:${this.credentials.apiSecret}`;
  }

  /**
   * Performs one API call, retrying network failures and 5xx responses with
   * exponential backoff. 4xx responses are surfaced immediately — retrying a
   * rejected payload or bad credentials only wastes time.
   */
  private async request(
    url: URL,
    init: { method: string; body?: string; signal?: AbortSignal },
  ): Promise<HiggsfieldResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (attempt > 0) {
        await sleep(Math.min(this.retryBackoffMs * 2 ** (attempt - 1), 60_000));
      }

      const timeout = AbortSignal.timeout(this.timeoutMs);
      const signal = init.signal
        ? AbortSignal.any([init.signal, timeout])
        : timeout;

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: init.method,
          headers: {
            Authorization: this.authHeader(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          ...(init.body === undefined ? {} : { body: init.body }),
          signal,
        });
      } catch (error) {
        // The caller aborting is intentional, not a transient failure.
        if (init.signal?.aborted) {
          throw error;
        }
        lastError = error;
        continue;
      }

      if (response.ok) {
        return (await response.json()) as HiggsfieldResponse;
      }

      const body = await readBody(response);
      const error = new HiggsfieldApiError(
        describeFailure(response.status, body),
        response.status,
        body,
      );
      if (error.isClientError) {
        throw error;
      }
      lastError = error;
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Higgsfield request to ${url.pathname} failed`);
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function describeFailure(status: number, body: unknown): string {
  const detail =
    typeof body === 'string'
      ? body
      : body && typeof body === 'object'
        ? JSON.stringify(body)
        : '';
  const suffix = detail ? `: ${detail}` : '';

  switch (status) {
    case 401:
      return `Higgsfield rejected the credentials (401)${suffix}`;
    case 403:
      return `Higgsfield denied access to this resource (403)${suffix}`;
    case 422:
      return `Higgsfield rejected the request input (422)${suffix}`;
    case 429:
      return `Higgsfield rate limit reached (429)${suffix}`;
    default:
      return `Higgsfield request failed (${status})${suffix}`;
  }
}
