---
name: unreal-plugin
version: 1.0.1
description: Control Unreal Engine Editor via OpenClaw Unreal Plugin. Use for Unreal development tasks including level/actor management, transforms, PIE control, debugging, input simulation, and console commands. Can create/delete actors, save levels, run console commands, simulate input, and capture viewport screenshots and logs — destructive operations should be confirmed with the user. Use only on explicit Unreal Editor requests, in trusted local projects.
homepage: https://github.com/TomLeeLive/openclaw-unreal-skill
author: Tom Jaejoon Lee
disableModelInvocation: true
---

# OpenClaw Unreal Plugin

MCP skill for controlling Unreal Engine Editor via OpenClaw.

## Connection Modes

### Mode A: OpenClaw Gateway (Remote)
The plugin connects to OpenClaw Gateway via HTTP polling. Works automatically when Gateway is running.

### Mode B: MCP Direct (Claude Code / Cursor)
The plugin runs an embedded HTTP server on port **27184**. Use the included MCP bridge:

```bash
# Claude Code
claude mcp add unreal -- node /path/to/Plugins/OpenClaw/MCP~/index.js

# Cursor — add to .cursor/mcp.json
{"mcpServers":{"unreal":{"command":"node","args":["/path/to/Plugins/OpenClaw/MCP~/index.js"]}}}
```

Both modes run simultaneously.

## Editor Panel

**Window → OpenClaw Unreal Plugin** — opens a dockable tab with:
- Connection status indicator
- MCP server info (address, protocol)
- Connect / Disconnect buttons
- Live log of tool calls and messages

## Tools

### Level
- `level.getCurrent` — current level name
- `level.list` — all levels in project
- `level.open` — open level by name
- `level.save` — save current level

### Actor
- `actor.find` — find by name/class
- `actor.getAll` — list all actors
- `actor.create` — create actors: StaticMeshActor (Cube, Sphere, Cylinder, Cone), PointLight, Camera
- `actor.delete` — delete by name
- `actor.getData` — detailed actor info
- `actor.setProperty` — set properties via UE reflection system

### Transform
- `transform.getPosition` / `transform.setPosition`
- `transform.getRotation` / `transform.setRotation`
- `transform.getScale` / `transform.setScale`

> Transform tools require a valid RootComponent (works on StaticMeshActor, PointLight, etc. — not on bare Actor).

### Component
- `component.get` — get component data
- `component.add` — add component (not yet implemented)
- `component.remove` — remove component (not yet implemented)

### Editor
- `editor.play` — start PIE (uses RequestPlaySession)
- `editor.stop` — stop PIE
- `editor.pause` / `editor.resume` — pause/resume PIE
- `editor.getState` — current editor state

### Debug
- `debug.hierarchy` — actor hierarchy tree
- `debug.screenshot` — capture editor viewport
- `debug.log` — write to output log

### Input
- `input.simulateKey` — simulate key press
- `input.simulateMouse` — simulate mouse
- `input.simulateAxis` — simulate axis

### Asset
- `asset.list` — list assets at path
- `asset.import` — import asset (not yet implemented)

### Console
- `console.execute` — run console command
- `console.getLogs` — read project log file; params: `count` (number of lines), `filter` (text filter)

### Blueprint
- `blueprint.list` — list blueprints
- `blueprint.open` — open blueprint (not yet implemented)

## Troubleshooting

### Stale binaries / plugin not loading

Clear the build cache and restart the editor:

```bash
rm -rf YourProject/Plugins/OpenClaw/Binaries YourProject/Plugins/OpenClaw/Intermediate
```

### Connection issues

- Ensure OpenClaw Gateway is running: `openclaw gateway status`
- Check the Editor Panel log for errors
- Verify the MCP port is not blocked by firewall

## Security & Privacy Disclosure

This skill drives a live Unreal Editor. Full disclosure of capabilities and current limitations:

- **Local HTTP server hardening (plugin v1.3.1+)**: the embedded server (port 27184) rejects browser-originated requests (any `Origin` header → 403) and supports optional shared-secret auth — set `OPENCLAW_BRIDGE_TOKEN` for both the Unreal Editor process and the MCP client to require `X-OpenClaw-Token` on every request. Without the token set, keep the port on trusted machines only — any local process can send editor commands.
- **Destructive operations** — confirm with the user before: deleting actors, saving levels, importing assets, running console commands (`console.execute`), and simulating keyboard/mouse input. None of these should run implicitly from a vague request.
- **Data visibility**: `debug.screenshot` and `console.getLogs` can capture whatever is on screen or in project logs — including credentials, tokens, or source paths if present. Review before sharing captures outside the machine.
- **Safety defaults**: `disableModelInvocation: true` is set — the model cannot auto-invoke this skill; it runs only on explicit user request. Keep the project under source control before automation sessions.

## License

Apache-2.0 — See LICENSE.md
