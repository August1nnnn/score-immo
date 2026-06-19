// OpenAI bot verifier for the CF Pages bot logger.
// A "ChatGPT-User" / "OAI-SearchBot" / "GPTBot" user-agent is trivially spoofable,
// so the UA alone is NOT proof. This checks the request's cf-connecting-ip against
// OpenAI's officially published CIDR ranges (fetched live, cached 24h in the
// isolate). UA match + IP in range = verified; UA alone = verified:false.
//
// Ranges (do NOT hardcode, the files rotate):
//   GPTBot        -> https://openai.com/gptbot.json        (training crawler)
//   OAI-SearchBot -> https://openai.com/searchbot.json     (search index)
//   ChatGPT-User  -> https://openai.com/chatgpt-user.json  (live in-conversation fetch)
// Format: { prefixes: [ { ipv4Prefix: "x.x.x.x/28" }, ... ] }

const OAI_SOURCES: Record<string, string> = {
  "GPTBot": "https://openai.com/gptbot.json",
  "OAI-SearchBot": "https://openai.com/searchbot.json",
  "ChatGPT-User": "https://openai.com/chatgpt-user.json",
};

type Net = { base: number; bits: number };
const cache: Record<string, { nets: Net[]; exp: number }> = {};
const TTL_MS = 24 * 3600 * 1000;

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null; // IPv6 not handled -> treated as unverified
  let n = 0;
  for (const o of parts) {
    const x = Number(o);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = (n << 8) | x;
  }
  return n >>> 0;
}

function inNet(ipInt: number, net: Net): boolean {
  const mask = net.bits === 0 ? 0 : (0xffffffff << (32 - net.bits)) >>> 0;
  return (ipInt & mask) === (net.base & mask);
}

async function nets(bot: string): Promise<Net[]> {
  const c = cache[bot];
  if (c && c.exp > Date.now()) return c.nets;
  const res = await fetch(OAI_SOURCES[bot], { cf: { cacheTtl: 86400 } } as RequestInit);
  const doc = (await res.json()) as { prefixes?: { ipv4Prefix?: string }[] };
  const list: Net[] = [];
  for (const p of doc.prefixes ?? []) {
    if (!p.ipv4Prefix) continue;
    const [ip, bitsStr] = p.ipv4Prefix.split("/");
    const base = ipv4ToInt(ip);
    if (base !== null) list.push({ base, bits: Number(bitsStr) });
  }
  // Only cache a non-empty result; a transient fetch failure shouldn't poison 24h.
  if (list.length > 0) cache[bot] = { nets: list, exp: Date.now() + TTL_MS };
  return list;
}

function detectUA(ua: string): string | null {
  const low = (ua || "").toLowerCase();
  for (const bot of Object.keys(OAI_SOURCES)) {
    if (low.includes(bot.toLowerCase())) return bot;
  }
  return null;
}

// Returns the matched OpenAI bot name (or null) and whether the source IP is in
// that bot's published ranges. Never throws.
export async function verifyOpenAIBot(
  ua: string,
  ip: string,
): Promise<{ bot: string | null; verified: boolean }> {
  try {
    const bot = detectUA(ua);
    if (!bot) return { bot: null, verified: false };
    const ipInt = ipv4ToInt(ip || "");
    if (ipInt === null) return { bot, verified: false };
    const verified = (await nets(bot)).some((n) => inNet(ipInt, n));
    return { bot, verified };
  } catch {
    return { bot: detectUA(ua), verified: false };
  }
}
