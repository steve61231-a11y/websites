/** Base class for every error this client raises. */
export class HiggsfieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** No usable API credentials were found in the environment or options. */
export class CredentialsMissingError extends HiggsfieldError {
  constructor() {
    super(
      'Higgsfield credentials missing. Set HF_CREDENTIALS="keyId:keySecret", ' +
        'or set HF_API_KEY and HF_API_SECRET.',
    );
  }
}

/** The API answered with a non-2xx status. */
export class HiggsfieldApiError extends HiggsfieldError {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }

  /** True for statuses that will not succeed if retried as-is. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/** Polling ran past `maxPollMs` without reaching a terminal status. */
export class PollTimeoutError extends HiggsfieldError {
  readonly requestId: string;

  constructor(requestId: string, maxPollMs: number) {
    super(
      `Request ${requestId} did not finish within ${maxPollMs}ms. ` +
        'It may still complete — poll its status again later.',
    );
    this.requestId = requestId;
  }
}
