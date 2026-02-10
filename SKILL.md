# OpenClaw Unreal Skill

Control Unreal Editor via OpenClaw AI assistant.

## Overview

This skill enables AI-assisted Unreal Engine development through the OpenClaw Unreal Plugin. The plugin communicates with OpenClaw Gateway via HTTP polling (`/unreal/*` endpoints).

## Architecture

```
┌──────────────────┐     HTTP      ┌─────────────────────┐
│  OpenClaw        │ ←──────────→  │  Unreal Editor      │
│  Gateway:18789   │  /unreal/*    │  (C++ Plugin)       │
└──────────────────┘               └─────────────────────┘
         ↑
         │ Extension
┌──────────────────┐
│  extension/      │
│  index.ts        │
└──────────────────┘
```

## Prerequisites

1. Unreal Engine 5.x project
2. OpenClaw Unreal Plugin installed in project
3. OpenClaw Gateway running (default port: 18789)

## Installation

### Plugin Installation

1. Copy `openclaw-unreal-plugin` folder to your project's `Plugins` directory
2. Restart Unreal Editor
3. Enable the plugin in Edit → Plugins → OpenClaw
4. Open Window → OpenClaw to see connection status

### Skill Installation

```bash
# Copy skill to OpenClaw workspace
cp -r openclaw-unreal-skill ~/.openclaw/workspace/skills/unreal-plugin
```

## Available Tools

### Level Management
- `level.getCurrent` - Get current level info
- `level.list` - List all levels
- `level.open` - Open level by path
- `level.save` - Save current level

### Actor Manipulation
- `actor.find` - Find actor by name
- `actor.getAll` - Get all actors
- `actor.create` - Spawn new actor (Cube, PointLight, Camera, etc.)
- `actor.delete` / `actor.destroy` - Remove actor
- `actor.getData` - Get actor details
- `actor.setProperty` - Modify actor property

### Transform
- `transform.getPosition` / `setPosition`
- `transform.getRotation` / `setRotation`
- `transform.getScale` / `setScale`

### Component
- `component.get` - Get actor components
- `component.add` - Add component
- `component.remove` - Remove component

### Editor Control
- `editor.play` - Start PIE (Play In Editor)
- `editor.stop` - Stop PIE
- `editor.pause` / `resume` - Pause/resume gameplay
- `editor.getState` - Check if playing/editing

### Debug
- `debug.hierarchy` - World outliner tree
- `debug.screenshot` - Capture viewport
- `debug.log` - Output log message

### Input Simulation
- `input.simulateKey` - Keyboard input (W, A, S, D, Space, etc.)
- `input.simulateMouse` - Mouse click/move/scroll
- `input.simulateAxis` - Gamepad/axis input

### Assets
- `asset.list` - Browse content browser
- `asset.import` - Import external asset

### Console
- `console.execute` - Run console command
- `console.getLogs` - Get output log messages

### Blueprint
- `blueprint.list` - List blueprints in project
- `blueprint.open` - Open blueprint in editor

## Example Usage

```
User: Create a cube at position (100, 200, 50)
AI: [Uses unreal_execute tool="actor.create" parameters={type:"Cube", x:100, y:200, z:50}]

User: Move the player start to the center
AI: [Uses unreal_execute tool="actor.find" parameters={name:"PlayerStart"}]
    [Uses unreal_execute tool="transform.setPosition" parameters={name:"PlayerStart", x:0, y:0, z:0}]

User: Take a screenshot
AI: [Uses unreal_execute tool="debug.screenshot"]

User: Start the game
AI: [Uses unreal_execute tool="editor.play"]
```

## Configuration

Create `openclaw.json` in project root (optional):

```json
{
  "host": "127.0.0.1",
  "port": 18789,
  "autoConnect": true
}
```

Or in `~/.openclaw/unreal-plugin.json` for global config.

## HTTP Endpoints

The extension registers these endpoints on OpenClaw Gateway:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/unreal/register` | POST | Register new session |
| `/unreal/poll` | GET | Poll for pending commands |
| `/unreal/heartbeat` | POST | Keep session alive |
| `/unreal/result` | POST | Send tool execution result |
| `/unreal/status` | GET | Get all sessions status |

## Troubleshooting

### Plugin not connecting
- Check Output Log for `[OpenClaw]` messages
- Verify gateway is running: `openclaw gateway status`
- Confirm port 18789 is accessible
- Try Window → OpenClaw to see connection status

### Session expired
- Plugin auto-reconnects on session expiry
- Check if gateway was restarted

### Tools not working
- Ensure plugin is enabled (Edit → Plugins)
- Check editor is not in PIE when modifying level actors
- Verify actor names match exactly (case-sensitive)

## 🔐 Security: Model Invocation Setting

When publishing to ClawHub, you can configure `disableModelInvocation`:

| Setting | AI Auto-Invoke | User Explicit Request |
|---------|---------------|----------------------|
| `false` (default) | ✅ Allowed | ✅ Allowed |
| `true` | ❌ Blocked | ✅ Allowed |

### Recommendation: **`false`** (default)

**Reason:** During Unreal development, it's useful for AI to autonomously perform supporting tasks like checking actor hierarchy, taking screenshots, and inspecting components.

**When to use `true`:** For sensitive tools (payments, deletions, message sending, etc.)

## CLI Commands

```bash
# Check Unreal connection status
openclaw unreal status
```

## License

MIT License - See LICENSE file
