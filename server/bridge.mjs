/**
 * The LAN bridge - one process, no dependencies, run it on a machine in the same network as the devices.
 *
 *   npm run bridge
 *   BRIDGE_PORT=8788 BRIDGE_TOKEN=<a secret> CONSOLE_ORIGIN=http://localhost:3000 npm run bridge
 *
 * Endpoints (all JSON):
 *   GET  /api/lan/health                  which protocols this bridge can speak, and whether a token is required
 *   POST /api/lan/discover                { kind: "ssdp" | "tuya", timeoutMs? } -> the devices that answered
 *   POST /api/lan/udp                     { host | broadcast, port, text | payloadBase64, timeoutMs?, expectReplies? }
 *   POST /api/lan/tcp                     { host, port, text | payloadBase64, timeoutMs?, readBytes? }
 *
 * It is the only place in the project allowed to import "dgram" or "net": a browser has neither.
 */
import http from "node:http";
import dgram from "node:dgram";
import net from "node:net";
import crypto from "node:crypto";

const PORT = Number(process.env.BRIDGE_PORT || 8788);
const TOKEN = String(process.env.BRIDGE_TOKEN || "");
const ORIGIN = String(process.env.CONSOLE_ORIGIN || "*");
const MAX_BODY = 64 * 1024;
const MAX_TIMEOUT = 10_000;
const MAX_REPLIES = 32;
const MAX_READ = 256 * 1024;

/** The ranges this bridge may talk to. A LAN tool that forwards anywhere is an open proxy. */
const PRIVATE = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./,
  /^::1$/,
  /^fe80:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fc[0-9a-f]{2}:/i,
];

function targetProblem(host) {
  const value = String(host || "").trim();
  if (!value) return "no address given";
  if (value === "255.255.255.255" || value === "<broadcast>") return null;
  if (!PRIVATE.some((pattern) => pattern.test(value))) {
    return value + " is not an address on this network - the bridge only talks to private, link-local and loopback addresses";
  }
  return null;
}

function clampTimeout(value) {
  const ms = Number(value || 2000);
  if (!Number.isFinite(ms) || ms <= 0) return 2000;
  return Math.min(MAX_TIMEOUT, Math.round(ms));
}

function payloadOf(body) {
  if (typeof body.payloadBase64 === "string" && body.payloadBase64) {
    return Buffer.from(body.payloadBase64, "base64");
  }
  return Buffer.from(String(body.text || ""), "utf8");
}

function send(response, status, payload) {
  const text = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text),
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-headers": "content-type, x-bridge-token",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "cache-control": "no-store",
  });
  response.end(text);
}

function tokenOk(request) {
  if (!TOKEN) return true;
  const given = String(request.headers["x-bridge-token"] || "");
  const a = Buffer.from(given);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** One UDP exchange: send, then collect replies until the window closes. */
function udpExchange(options) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const replies = [];
    const done = (error) => {
      try { socket.close(); } catch {}
      resolve({ replies, error: error ? String(error.message || error) : null });
    };
    const timer = setTimeout(() => done(null), options.timeoutMs);
    socket.on("error", (error) => { clearTimeout(timer); done(error); });
    socket.on("message", (message, remote) => {
      if (replies.length >= MAX_REPLIES) return;
      replies.push({
        from: remote.address,
        port: remote.port,
        bytes: message.length,
        payloadBase64: message.toString("base64"),
        text: message.toString("utf8").replace(/[^\x20-\x7e]/g, ".").slice(0, 400),
      });
    });
    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        if (options.multicast) {
          try { socket.addMembership(options.multicast); } catch {}
        }
      } catch {}
      socket.send(options.payload, options.port, options.host, (error) => {
        if (error) { clearTimeout(timer); done(error); }
      });
    });
  });
}

/** One TCP exchange: connect, write, read until the peer closes or the window closes. */
function tcpExchange(options) {
  return new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    const socket = net.connect({ host: options.host, port: options.port });
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      const buffer = Buffer.concat(chunks);
      resolve({
        connected: !error,
        error: error ? String(error.message || error) : null,
        bytes: buffer.length,
        text: buffer.toString("utf8").replace(/[^\x20-\x7e]/g, ".").slice(0, 2000),
        payloadBase64: buffer.toString("base64"),
      });
    };
    const timer = setTimeout(() => finish(null), options.timeoutMs);
    socket.on("error", (error) => finish(error));
    socket.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_READ) { finish(null); return; }
      chunks.push(chunk);
    });
    socket.on("close", () => finish(null));
    socket.on("connect", () => {
      socket.write(options.payload);
      if (options.halfClose) socket.end();
    });
  });
}

/** The Tuya discovery frame: 0x000055aa, three zero words, a length, the (encrypted) payload, a CRC and 0x0000aa55. */
export function tuyaDiscoveryFrame(text) {
  const magic = crypto.createHash("md5").update("yGAdlopoPVldABfn").digest();
  const cipher = crypto.createCipheriv("aes-128-ecb", magic, null);
  const plain = Buffer.from(String(text || "{\"gwId\":\"\",\"ip\":\"\"}"), "utf8");
  const payload = Buffer.concat([cipher.update(plain), cipher.final()]);
  const header = Buffer.alloc(16);
  header.writeUInt32BE(0x000055aa, 0);
  header.writeUInt32BE(0x00000000, 4);
  header.writeUInt32BE(0x00000000, 8);
  header.writeUInt32BE(payload.length + 8, 12);
  const body = Buffer.concat([header, payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  const suffix = Buffer.alloc(4);
  suffix.writeUInt32BE(0x0000aa55, 0);
  return Buffer.concat([body, crc, suffix]);
}

let crcTable = null;
function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let value = i;
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      crcTable[i] = value;
    }
  }
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

/** The SSDP search: one M-SEARCH, and whatever answers within the window. */
function ssdpPayload() {
  return Buffer.from(
    [
      "M-SEARCH * HTTP/1.1",
      "HOST: 239.255.255.250:1900",
      'MAN: "ssdp:discover"',
      "MX: 2",
      "ST: ssdp:all",
      "",
      "",
    ].join("\r\n"),
    "utf8"
  );
}

async function handleDiscover(body) {
  const kind = String(body.kind || "ssdp").toLowerCase();
  const timeoutMs = clampTimeout(body.timeoutMs || 3000);
  if (kind === "ssdp") {
    const result = await udpExchange({ host: "239.255.255.250", port: 1900, payload: ssdpPayload(), multicast: "239.255.255.250", timeoutMs });
    const devices = result.replies.map((reply) => {
      const headers = {};
      for (const line of reply.text.split("\r\n")) {
        const index = line.indexOf(":");
        if (index > 0) headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
      }
      return { address: reply.from, port: reply.port, server: headers.server || "", location: headers.location || "", usn: headers.usn || "", st: headers.st || "" };
    });
    return { ok: true, kind, devices, replies: result.replies.length, error: result.error };
  }
  if (kind === "tuya") {
    // Tuya devices answer a broadcast on 6666/6667 (newer firmware 6668/6669). The reply is encrypted with the
    // vendor's own key, so what is reported here is the address it came from and its size - not a parsed device.
    const ports = [6666, 6667, 6668, 6669];
    const devices = [];
    for (const port of ports) {
      const result = await udpExchange({ host: "255.255.255.255", port, payload: tuyaDiscoveryFrame(), timeoutMs: Math.min(timeoutMs, 1500) });
      for (const reply of result.replies) {
        devices.push({ address: reply.from, port, bytes: reply.bytes, payloadBase64: reply.payloadBase64 });
      }
    }
    return {
      ok: true,
      kind,
      devices,
      note: devices.length
        ? "A device answered. Its reply is encrypted with the vendor key, so the local key still has to come from the Tuya cloud API before a command can be built."
        : "No device answered on 6666/6667/6668/6669 within " + timeoutMs + " ms. That means nothing was listening - check that the device is on this network and paired.",
    };
  }
  return { ok: false, error: "Unknown discovery kind: " + kind + ". Use ssdp or tuya." };
}

const server = http.createServer((request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, {});
    return;
  }
  if (!tokenOk(request)) {
    send(response, 401, { ok: false, error: "This bridge requires BRIDGE_TOKEN in the x-bridge-token header." });
    return;
  }
  const url = new URL(request.url || "/", "http://localhost");
  if (request.method === "GET" && url.pathname === "/api/lan/health") {
    send(response, 200, {
      ok: true,
      mode: "lan-bridge",
      protocols: ["udp", "tcp", "ssdp", "tuya"],
      tokenRequired: Boolean(TOKEN),
      limits: { maxBody: MAX_BODY, maxTimeoutMs: MAX_TIMEOUT, maxReplies: MAX_REPLIES },
    });
    return;
  }
  if (request.method !== "POST") {
    send(response, 404, { ok: false, error: "Use GET /api/lan/health or POST /api/lan/discover, /udp, /tcp." });
    return;
  }
  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      send(response, 413, { ok: false, error: "Request body over " + MAX_BODY + " bytes." });
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", async () => {
    let body = {};
    try {
      body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
    } catch (error) {
      send(response, 400, { ok: false, error: "The body is not JSON: " + String(error.message || error) });
      return;
    }
    try {
      if (url.pathname === "/api/lan/discover") {
        send(response, 200, await handleDiscover(body));
        return;
      }
      if (url.pathname === "/api/lan/udp") {
        const host = String(body.host || (body.broadcast ? "255.255.255.255" : ""));
        const problem = targetProblem(host);
        if (problem) { send(response, 400, { ok: false, error: problem }); return; }
        const port = Number(body.port);
        if (!Number.isInteger(port) || port <= 0 || port > 65535) {
          send(response, 400, { ok: false, error: "port must be a number between 1 and 65535" });
          return;
        }
        const result = await udpExchange({ host, port, payload: payloadOf(body), multicast: body.multicast, timeoutMs: clampTimeout(body.timeoutMs) });
        send(response, 200, { ok: !result.error, sentTo: host + ":" + port, replies: result.replies, error: result.error });
        return;
      }
      if (url.pathname === "/api/lan/tcp") {
        const host = String(body.host || "");
        const problem = targetProblem(host);
        if (problem) { send(response, 400, { ok: false, error: problem }); return; }
        const port = Number(body.port);
        if (!Number.isInteger(port) || port <= 0 || port > 65535) {
          send(response, 400, { ok: false, error: "port must be a number between 1 and 65535" });
          return;
        }
        const result = await tcpExchange({ host, port, payload: payloadOf(body), timeoutMs: clampTimeout(body.timeoutMs), halfClose: body.halfClose !== false });
        send(response, 200, { ok: result.connected, target: host + ":" + port, ...result });
        return;
      }
      send(response, 404, { ok: false, error: "Unknown endpoint: " + url.pathname });
    } catch (error) {
      send(response, 500, { ok: false, error: String((error && error.message) || error) });
    }
  });
});

server.listen(PORT, () => {
  console.log("[bridge] LAN bridge on http://0.0.0.0:" + PORT + (TOKEN ? " (token required)" : " (no token - local use only)"));
  console.log("[bridge] protocols: udp, tcp, ssdp, tuya; targets are limited to private, link-local and loopback addresses");
});
