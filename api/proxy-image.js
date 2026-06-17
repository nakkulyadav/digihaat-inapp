// Vercel serverless function: proxies brand logo images from storage.googleapis.com
// to avoid canvas taint when drawing cross-origin images onto an HTML5 Canvas.
// Only requests to *.googleapis.com are forwarded — all others are rejected.
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "url param required" });
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: "invalid url" });
    return;
  }

  if (!parsed.hostname.endsWith("googleapis.com")) {
    res.status(403).json({ error: "domain not allowed" });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(url);
  } catch {
    res.status(502).json({ error: "upstream unreachable" });
    return;
  }

  if (!upstream.ok) {
    res.status(502).json({ error: "upstream fetch failed" });
    return;
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const buffer = await upstream.arrayBuffer();
  res.status(200).send(Buffer.from(buffer));
}
