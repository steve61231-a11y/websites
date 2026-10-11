// hls.js stand-in for the single-file preview. The preview has no protected
// streams (streams.json is aliased to {} and there's no /api), so the player
// never asks for hls.js; this just keeps the real library out of the file.
export default class Hls {
  static isSupported() {
    return false;
  }
}
