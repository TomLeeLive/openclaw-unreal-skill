# OpenClaw Unreal Skill

Control Unreal Editor via OpenClaw AI assistant.

## Overview

This skill enables AI-assisted Unreal Engine development through the OpenClaw Unreal Plugin.

## Prerequisites

1. Unreal Engine 5.x project
2. OpenClaw Unreal Plugin installed in project
3. OpenClaw Gateway running

## Installation

### Plugin Installation

1. Copy `openclaw-unreal-plugin` folder to your project's `Plugins` directory
2. Restart Unreal Editor
3. Enable the plugin in Edit → Plugins → OpenClaw

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
- `actor.create` - Spawn new actor
- `actor.delete` - Remove actor
- `actor.getData` - Get actor details

### Transform
- `transform.getPosition` / `setPosition`
- `transform.getRotation` / `setRotation`
- `transform.getScale` / `setScale`

### Editor Control
- `editor.play` - Start PIE
- `editor.stop` - Stop PIE
- `editor.pause` / `resume`
- `editor.getState`

### Debug
- `debug.hierarchy` - World outliner tree
- `debug.screenshot` - Capture viewport
- `debug.log` - Output log message

### Input Simulation
- `input.simulateKey` - Keyboard input
- `input.simulateMouse` - Mouse input
- `input.simulateAxis` - Gamepad/axis input

### Assets
- `asset.list` - Browse content
- `blueprint.list` / `open`

## Example Usage

```
User: Create a cube at position (100, 200, 50)
AI: [Uses actor.create with type="Cube", x=100, y=200, z=50]

User: Move the player start to the center
AI: [Uses actor.find name="PlayerStart", then transform.setPosition x=0, y=0, z=0]

User: Start the game
AI: [Uses editor.play]
```

## Configuration

Create `openclaw.json` in project root:

```json
{
  "host": "127.0.0.1",
  "port": 27742,
  "autoConnect": true
}
```

## Troubleshooting

### Plugin not connecting
- Check Output Log for `[OpenClaw]` messages
- Verify gateway is running: `openclaw gateway status`
- Confirm port 27742 is available

### Tools not working
- Ensure plugin is enabled
- Check editor is not in PIE when modifying actors
- Verify actor names match exactly

## 🔐 Security: Model Invocation Setting

When publishing to ClawHub, you can configure `disableModelInvocation`:

| Setting | AI Auto-Invoke | User Explicit Request |
|---------|---------------|----------------------|
| `false` (default) | ✅ Allowed | ✅ Allowed |
| `true` | ❌ Blocked | ✅ Allowed |

### Recommendation: **`true`**

**Reason:** During Unreal development, it's useful for AI to autonomously perform supporting tasks like checking actor hierarchy, taking screenshots, and inspecting components.

**When to use `true`:** For sensitive tools (payments, deletions, message sending, etc.)

## License

MIT License - See LICENSE file
