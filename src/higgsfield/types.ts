/**
 * Types mirroring the Higgsfield v2 REST API.
 *
 * Every model endpoint shares one lifecycle: POST the input to the endpoint,
 * get back a `request_id`, then poll `GET /requests/{request_id}/status` until
 * the status is terminal.
 */

/** Status values the API reports for a request. */
export type RequestStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'nsfw';

/** Statuses after which the request will not change again. */
const TERMINAL_STATUSES: ReadonlySet<RequestStatus> = new Set<RequestStatus>([
  'completed',
  'failed',
  'nsfw',
]);

export function isTerminal(status: RequestStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export interface GeneratedImage {
  url: string;
}

export interface GeneratedVideo {
  url: string;
}

/** Envelope returned by both the submit call and the status call. */
export interface HiggsfieldResponse {
  status: RequestStatus;
  request_id: string;
  status_url?: string;
  cancel_url?: string;
  images?: GeneratedImage[];
  video?: GeneratedVideo;
}

/** A reference to an image the API should read, by URL. */
export interface ImageUrlRef {
  type: 'image_url';
  image_url: string;
}

/** A reference to an audio file the API should read, by URL. */
export interface AudioUrlRef {
  type: 'audio_url';
  audio_url: string;
}

/** Input for `/v1/text2image/soul` (text to image). */
export interface SoulText2ImageInput {
  prompt: string;
  /** One of `SOUL_SIZES`, e.g. "1536x1536". */
  width_and_height: string;
  quality: '720p' | '1080p';
  batch_size: 1 | 4;
  style_id?: string;
  style_strength?: number;
  custom_reference_id?: string;
  custom_reference_strength?: number;
  image_reference?: ImageUrlRef;
  enhance_prompt?: boolean;
  seed?: number;
}

/** Input for `/v1/image2video/dop` (image to video). */
export interface DopImage2VideoInput {
  model: 'dop-lite' | 'dop-turbo' | 'dop-standard';
  prompt: string;
  input_images: ImageUrlRef[];
  motions?: Array<{ id: string; strength: number }>;
  enhance_prompt?: boolean;
  seed?: number;
}

/** Input for `/v1/speak/higgsfield` (image + audio to talking video). */
export interface SpeakVideoInput {
  input_image: ImageUrlRef;
  input_audio: AudioUrlRef;
  prompt: string;
  quality: 'mid' | 'high';
  duration: 5 | 10 | 15;
  seed?: number;
}

/**
 * Endpoints with a known input shape. The client accepts any endpoint string,
 * so newer models work before this map is updated.
 */
export interface EndpointInputMap {
  '/v1/text2image/soul': SoulText2ImageInput;
  '/v1/image2video/dop': DopImage2VideoInput;
  '/v1/speak/higgsfield': SpeakVideoInput;
}

export type KnownEndpoint = keyof EndpointInputMap;

/** Resolves to the typed input for a known endpoint, or a loose object. */
export type InputFor<E extends string> = E extends KnownEndpoint
  ? EndpointInputMap[E]
  : Record<string, unknown>;

/** The 13 resolutions Soul text-to-image accepts. */
export const SOUL_SIZES = [
  '2048x1152',
  '2048x1536',
  '2016x1344',
  '1696x960',
  '1632x1088',
  '1152x2048',
  '1536x2048',
  '1344x2016',
  '960x1696',
  '1088x1632',
  '1536x1536',
  '1536x1152',
  '1152x1536',
] as const;

export type SoulSize = (typeof SOUL_SIZES)[number];

export function isSoulSize(value: unknown): value is SoulSize {
  return (
    typeof value === 'string' && (SOUL_SIZES as readonly string[]).includes(value)
  );
}
