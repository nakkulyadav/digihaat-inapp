import dns from "dns";
const dnsPromises = dns.promises;

const PRIVATE_IP_RE = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isPrivateIp(ip) {
  return PRIVATE_IP_RE.some((re) => re.test(ip));
}

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

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    res.status(400).json({ error: "only http and https urls are allowed" });
    return;
  }

  // Use dns.lookup (OS native resolver) so CNAME chains and all DNS setups work
  // correctly — this is the same resolution path the fetch() call would use.
  let addresses;
  try {
    addresses = await dnsPromises.lookup(parsed.hostname, { all: true });
  } catch {
    res.status(502).json({ error: "hostname could not be resolved" });
    return;
  }

  if (!addresses || addresses.length === 0) {
    res.status(502).json({ error: "hostname could not be resolved" });
    return;
  }

  if (addresses.some(({ address }) => isPrivateIp(address))) {
    res.status(403).json({ error: "private or internal addresses are not allowed" });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    res.status(502).json({ error: "upstream unreachable" });
    return;
  }

  if (!upstream.ok) {
    res.status(502).json({ error: "upstream fetch failed" });
    return;
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    res.status(502).json({ error: "upstream did not return an image" });
    return;
  }
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const buffer = await upstream.arrayBuffer();
  res.status(200).send(Buffer.from(buffer));
}
