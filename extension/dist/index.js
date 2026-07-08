const sessions = /* @__PURE__ */ new Map();
function generateId() {
  return `unreal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function cleanupStaleSessions() {
  const now = Date.now();
  const staleThreshold = 12e4;
  for (const [id, session] of sessions) {
    if (now - session.lastHeartbeat > staleThreshold) {
      sessions.delete(id);
    }
  }
}
async function readJsonBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let total = 0;
  return new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (!raw.trim()) {
          resolve({});
          return;
        }
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.end(JSON.stringify(data));
}
async function handleUnrealHttpRequest(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  if (!path.startsWith("/unreal/")) {
    return false;
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.statusCode = 204;
    res.end();
    return true;
  }
  const endpoint = path.replace("/unreal/", "");
  try {
    switch (endpoint) {
      case "register": {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return true;
        }
        const body = await readJsonBody(req);
        const { project, version, platform, tools } = body;
        const sessionId = generateId();
        const session = {
          sessionId,
          registeredAt: Date.now(),
          lastHeartbeat: Date.now(),
          projectName: project || "Unknown",
          engineVersion: version || "Unknown",
          platform: platform || "UnrealEditor",
          toolCount: tools || 0,
          pendingCommands: [],
          results: /* @__PURE__ */ new Map()
        };
        sessions.set(sessionId, session);
        console.log(`[Unreal] Registered: ${project} (UE ${version}) - Session: ${sessionId}`);
        sendJson(res, 200, { sessionId, status: "connected" });
        return true;
      }
      case "heartbeat": {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return true;
        }
        const body = await readJsonBody(req);
        const { sessionId } = body;
        const session = sessions.get(sessionId);
        if (!session) {
          sendJson(res, 404, { error: "Session not found" });
          return true;
        }
        session.lastHeartbeat = Date.now();
        sendJson(res, 200, { ok: true });
        return true;
      }
      case "poll": {
        const sessionId = url.searchParams.get("sessionId");
        const session = sessions.get(sessionId || "");
        if (!session) {
          sendJson(res, 404, { error: "Session not found" });
          return true;
        }
        session.lastHeartbeat = Date.now();
        if (session.pendingCommands.length > 0) {
          const command = session.pendingCommands.shift();
          sendJson(res, 200, command);
        } else {
          res.statusCode = 204;
          res.end();
        }
        return true;
      }
      case "result": {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return true;
        }
        const body = await readJsonBody(req);
        const { sessionId, toolCallId, result } = body;
        const session = sessions.get(sessionId);
        if (!session) {
          sendJson(res, 404, { error: "Session not found" });
          return true;
        }
        session.results.set(toolCallId, result);
        console.log(`[Unreal] Tool result received for: ${toolCallId}`);
        sendJson(res, 200, { ok: true });
        return true;
      }
      case "status": {
        const activeSessions = Array.from(sessions.values()).map((s) => ({
          sessionId: s.sessionId,
          project: s.projectName,
          version: s.engineVersion,
          platform: s.platform,
          connectedAt: new Date(s.registeredAt).toISOString(),
          lastSeen: new Date(s.lastHeartbeat).toISOString(),
          pendingCommands: s.pendingCommands.length
        }));
        sendJson(res, 200, {
          enabled: true,
          sessions: activeSessions,
          sessionCount: activeSessions.length
        });
        return true;
      }
      default:
        sendJson(res, 404, { error: "Unknown endpoint" });
        return true;
    }
  } catch (err) {
    console.error("[Unreal] HTTP error:", err);
    sendJson(res, 500, { error: err.message });
    return true;
  }
}
const plugin = {
  id: "unreal",
  name: "Unreal Plugin",
  description: "Connect Unreal Engine 5.x Editor to OpenClaw AI assistant",
  register(api) {
    const logger = api.logger;
    setInterval(cleanupStaleSessions, 3e4);
    const httpApi = api;
    if (typeof httpApi.registerHttpRoute === "function") {
      httpApi.registerHttpRoute({
        path: "/unreal",
        auth: "plugin",
        match: "prefix",
        handler: handleUnrealHttpRequest
      });
    } else {
      httpApi.registerHttpHandler(handleUnrealHttpRequest);
    }
    api.registerTool({
      name: "unreal_execute",
      description: "Execute a tool in the connected Unreal Editor. Available tools: level.getCurrent, level.list, level.open, level.save, actor.find, actor.getAll, actor.create, actor.delete, actor.getData, actor.setProperty, transform.getPosition, transform.setPosition, transform.getRotation, transform.setRotation, transform.getScale, transform.setScale, component.get, component.add, component.remove, editor.play, editor.stop, editor.pause, editor.resume, editor.getState, debug.hierarchy, debug.screenshot, debug.log, input.simulateKey, input.simulateMouse, input.simulateAxis, asset.list, asset.import, console.execute, console.getLogs, blueprint.list, blueprint.open, and more.",
      parameters: {
        type: "object",
        properties: {
          tool: { type: "string", description: "The Unreal tool to execute (e.g., 'debug.hierarchy', 'actor.find')" },
          parameters: { type: "object", description: "Parameters for the tool (varies by tool)" },
          sessionId: { type: "string", description: "Optional: specific Unreal session ID" }
        },
        required: ["tool"]
      },
      execute: async (toolCallId, args) => {
        const jsonResult = (payload) => ({
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          details: payload
        });
        const tool = args?.tool;
        const parameters = args?.parameters;
        const sessionId = args?.sessionId;
        if (!tool) {
          return jsonResult({
            success: false,
            error: "Missing 'tool' parameter. Specify which Unreal tool to execute (e.g., 'debug.hierarchy', 'actor.find')."
          });
        }
        let session;
        if (sessionId) {
          session = sessions.get(sessionId);
        } else {
          const firstSession = sessions.values().next();
          session = firstSession.done ? void 0 : firstSession.value;
        }
        if (!session) {
          return jsonResult({
            success: false,
            error: "No Unreal session connected. Make sure Unreal Editor is running with OpenClaw plugin enabled (Window > OpenClaw)."
          });
        }
        const requestId = generateId();
        session.pendingCommands.push({
          toolCallId: requestId,
          tool,
          arguments: parameters || {},
          createdAt: Date.now()
        });
        logger.info(`[Unreal] Queued command: ${tool} (request: ${requestId})`);
        const timeout = 6e4;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          if (session.results.has(requestId)) {
            const result = session.results.get(requestId);
            session.results.delete(requestId);
            return jsonResult({
              success: true,
              result
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return jsonResult({
          success: false,
          error: "Timeout waiting for Unreal response. Make sure the OpenClaw plugin is enabled in Unreal Editor (Window > OpenClaw)."
        });
      }
    });
    api.registerTool({
      name: "unreal_sessions",
      description: "List all connected Unreal Editor sessions",
      parameters: {
        type: "object",
        properties: {
          _dummy: { type: "string", description: "Unused parameter" }
        },
        required: []
      },
      execute: async (_toolCallId, _args) => {
        const activeSessions = Array.from(sessions.values()).map((s) => ({
          sessionId: s.sessionId,
          project: s.projectName,
          version: s.engineVersion,
          platform: s.platform,
          tools: s.toolCount
        }));
        const payload = {
          success: true,
          sessions: activeSessions,
          count: activeSessions.length
        };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          details: payload
        };
      }
    });
    api.registerCli(
      ({ program }) => {
        const unrealCmd = program.command("unreal").description("Unreal Plugin commands");
        unrealCmd.command("status").description("Show Unreal connection status").action(() => {
          console.log("\n\u{1F3AE} Unreal Plugin Status\n");
          if (sessions.size === 0) {
            console.log("  No Unreal sessions connected.\n");
            console.log("  To connect Unreal:");
            console.log("  1. Copy OpenClaw plugin to Plugins/ folder");
            console.log("  2. Enable in Edit > Plugins > OpenClaw");
            console.log("  3. Open Window > OpenClaw to connect\n");
            return;
          }
          for (const [id, session] of sessions) {
            const age = Math.round((Date.now() - session.registeredAt) / 1e3);
            const lastSeen = Math.round((Date.now() - session.lastHeartbeat) / 1e3);
            console.log(`  \u2705 ${session.projectName}`);
            console.log(`     Engine: UE ${session.engineVersion}`);
            console.log(`     Platform: ${session.platform}`);
            console.log(`     Session: ${id}`);
            console.log(`     Connected: ${age}s ago`);
            console.log(`     Last seen: ${lastSeen}s ago`);
            console.log(`     Pending: ${session.pendingCommands.length} commands
`);
          }
        });
      },
      { commands: ["unreal"] }
    );
    logger.info("[Unreal] Plugin loaded - HTTP endpoints at /unreal/*");
  }
};
var extension_default = plugin;
export {
  extension_default as default
};
