// Fonts come from Google Fonts in preview/index.html; the CSS variables the
// app expects are defined there too.
type FontOptions = { variable?: string };
const font = (o: FontOptions = {}) => ({ variable: "", className: "", style: { fontFamily: o.variable ?? "" } });
export const Inter = font;
export const Instrument_Serif = font;
