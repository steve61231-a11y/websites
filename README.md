# websites

used for making.

## Higgsfield playground

A small Express app that talks to the [Higgsfield](https://higgsfield.ai) v2 REST
API. The API secret stays on the server; the browser only ever calls this app.

- **Text to image** via `/v1/text2image/soul`
- **Image to video** via `/v1/image2video/dop`

### Setup

```bash
npm install
cp .env.example .env   # then fill in your credentials
npm run dev            # http://localhost:3000
```

Credentials are read the same way the official SDK reads them — either
`HF_CREDENTIALS="keyId:keySecret"`, or `HF_API_KEY` plus `HF_API_SECRET`. Create
them in the Higgsfield console.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the server with reload on change |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the client unit tests |
| `npm run typecheck` | Typecheck without emitting |

### How the API works

Generation is asynchronous. You POST an input to a model endpoint, get back a
`request_id`, then poll `GET /requests/{request_id}/status` until the status is
terminal — `completed`, `failed`, or `nsfw`. Requests authenticate with a
`Authorization: Key <keyId>:<keySecret>` header against `https://api.higgsfield.ai`.

This app returns the `request_id` to the browser immediately and lets the page
poll, rather than holding a connection open for the minutes a video can take.

### Using the client on its own

`src/higgsfield/` is a dependency-free client (built on `fetch`) that is usable
without the web app:

```ts
import { HiggsfieldClient } from './src/higgsfield/index.js';

const client = new HiggsfieldClient(); // reads credentials from the environment

// submit + poll until the request reaches a terminal status
const result = await client.generate('/v1/text2image/soul', {
  prompt: 'A lighthouse on a cliff at dusk, long exposure',
  width_and_height: '1536x1536',
  quality: '1080p',
  batch_size: 1,
});

if (result.status === 'completed') {
  console.log(result.images?.map((image) => image.url));
}
```

`submit()` and `status()` are available separately if you want to drive polling
yourself. It retries network errors and 5xx responses with exponential backoff,
and surfaces 4xx responses immediately, since a rejected payload or bad
credentials will not succeed on a retry.

The client holds an API secret, so construct it only on the server.

### HTTP routes

| Route | Purpose |
| --- | --- |
| `POST /api/generate` | Starts a generation, responds `202` with a `request_id` |
| `GET /api/requests/:id` | Current status of a request |
| `POST /api/webhook` | Completion callback (see below) |
| `GET /api/health` | Liveness check |

### Webhooks

Polling works with no extra setup. If this server is reachable at a public HTTPS
URL, set `HIGGSFIELD_WEBHOOK_URL` to its `/api/webhook` route and generation
requests will ask Higgsfield to call back on completion. The handler currently
just logs — it is the place to persist results or notify a client.

Note that `/api/webhook` does not verify that a callback genuinely came from
Higgsfield. Add signature verification before relying on it in production.
