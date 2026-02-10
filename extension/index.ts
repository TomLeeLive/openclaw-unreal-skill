/**
 * OpenClaw Unreal Plugin Extension
 * Provides tools for AI-assisted Unreal Engine development
 */

import type { OpenClawPlugin, ToolCallResult } from "openclaw";

interface UnrealSession {
  sessionId: string;
  projectName: string;
  lastSeen: number;
}

let sessions: Map<string, UnrealSession> = new Map();

const TOOLS = [
  // Level tools
  "level.getCurrent",
  "level.list",
  "level.open",
  "level.save",
  // Actor tools
  "actor.find",
  "actor.getAll",
  "actor.create",
  "actor.delete",
  "actor.destroy",
  "actor.getData",
  "actor.setProperty",
  // Transform tools
  "transform.getPosition",
  "transform.setPosition",
  "transform.getRotation",
  "transform.setRotation",
  "transform.getScale",
  "transform.setScale",
  // Component tools
  "component.get",
  "component.add",
  "component.remove",
  // Editor tools
  "editor.play",
  "editor.stop",
  "editor.pause",
  "editor.resume",
  "editor.getState",
  // Debug tools
  "debug.hierarchy",
  "debug.screenshot",
  "debug.log",
  // Input tools
  "input.simulateKey",
  "input.simulateMouse",
  "input.simulateAxis",
  // Asset tools
  "asset.list",
  "asset.import",
  // Console tools
  "console.execute",
  "console.getLogs",
  // Blueprint tools
  "blueprint.list",
  "blueprint.open",
] as const;

type ToolName = (typeof TOOLS)[number];

function getToolDescription(tool: ToolName): string {
  const descriptions: Record<ToolName, string> = {
    "level.getCurrent": "Get current level info",
    "level.list": "List all levels in project",
    "level.open": "Open a level by path",
    "level.save": "Save current level",
    "actor.find": "Find actor by name",
    "actor.getAll": "Get all actors in level",
    "actor.create": "Create new actor",
    "actor.delete": "Delete actor by name",
    "actor.destroy": "Delete actor by name (alias)",
    "actor.getData": "Get detailed actor data",
    "actor.setProperty": "Set actor property",
    "transform.getPosition": "Get actor position",
    "transform.setPosition": "Set actor position",
    "transform.getRotation": "Get actor rotation",
    "transform.setRotation": "Set actor rotation",
    "transform.getScale": "Get actor scale",
    "transform.setScale": "Set actor scale",
    "component.get": "Get actor components",
    "component.add": "Add component to actor",
    "component.remove": "Remove component from actor",
    "editor.play": "Start Play in Editor (PIE)",
    "editor.stop": "Stop Play in Editor",
    "editor.pause": "Pause game execution",
    "editor.resume": "Resume game execution",
    "editor.getState": "Get editor state (playing/editing)",
    "debug.hierarchy": "Get world actor hierarchy",
    "debug.screenshot": "Take screenshot",
    "debug.log": "Log message to output",
    "input.simulateKey": "Simulate keyboard input",
    "input.simulateMouse": "Simulate mouse input",
    "input.simulateAxis": "Simulate axis input",
    "asset.list": "List assets in path",
    "asset.import": "Import external asset",
    "console.execute": "Execute console command",
    "console.getLogs": "Get output log messages",
    "blueprint.list": "List blueprints in project",
    "blueprint.open": "Open blueprint in editor",
  };
  return descriptions[tool] || tool;
}

function getToolParameters(tool: ToolName): Record<string, any> {
  const params: Record<string, Record<string, any>> = {
    "level.open": {
      path: { type: "string", description: "Level asset path", required: true },
    },
    "actor.find": {
      name: { type: "string", description: "Actor name or label", required: true },
    },
    "actor.create": {
      type: { type: "string", description: "Actor type (Cube, PointLight, Camera, etc.)" },
      name: { type: "string", description: "Actor label" },
      x: { type: "number", description: "X position" },
      y: { type: "number", description: "Y position" },
      z: { type: "number", description: "Z position" },
    },
    "actor.delete": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "actor.destroy": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "actor.getData": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "transform.getPosition": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "transform.setPosition": {
      name: { type: "string", description: "Actor name", required: true },
      x: { type: "number", description: "X position" },
      y: { type: "number", description: "Y position" },
      z: { type: "number", description: "Z position" },
    },
    "transform.getRotation": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "transform.setRotation": {
      name: { type: "string", description: "Actor name", required: true },
      pitch: { type: "number", description: "Pitch (degrees)" },
      yaw: { type: "number", description: "Yaw (degrees)" },
      roll: { type: "number", description: "Roll (degrees)" },
    },
    "transform.getScale": {
      name: { type: "string", description: "Actor name", required: true },
    },
    "transform.setScale": {
      name: { type: "string", description: "Actor name", required: true },
      x: { type: "number", description: "X scale" },
      y: { type: "number", description: "Y scale" },
      z: { type: "number", description: "Z scale" },
    },
    "component.get": {
      actor: { type: "string", description: "Actor name", required: true },
      component: { type: "string", description: "Component name filter" },
    },
    "debug.hierarchy": {
      depth: { type: "number", description: "Max depth to traverse" },
    },
    "debug.screenshot": {
      filename: { type: "string", description: "Screenshot filename" },
    },
    "debug.log": {
      message: { type: "string", description: "Message to log", required: true },
      level: { type: "string", description: "Log level (log/warning/error)" },
    },
    "input.simulateKey": {
      key: { type: "string", description: "Key name (W, A, S, D, Space, etc.)", required: true },
      pressed: { type: "boolean", description: "True for press, false for release" },
    },
    "input.simulateMouse": {
      action: { type: "string", description: "Mouse action (click/move/scroll)", required: true },
      x: { type: "number", description: "X coordinate" },
      y: { type: "number", description: "Y coordinate" },
      button: { type: "string", description: "Mouse button (left/right/middle)" },
    },
    "input.simulateAxis": {
      axis: { type: "string", description: "Axis name", required: true },
      value: { type: "number", description: "Axis value (-1 to 1)", required: true },
    },
    "asset.list": {
      path: { type: "string", description: "Asset path (default: /Game)" },
      type: { type: "string", description: "Asset type filter" },
    },
    "console.execute": {
      command: { type: "string", description: "Console command", required: true },
    },
    "blueprint.list": {
      path: { type: "string", description: "Path to search (default: /Game)" },
    },
    "blueprint.open": {
      path: { type: "string", description: "Blueprint asset path", required: true },
    },
  };
  return params[tool] || {};
}

const plugin: OpenClawPlugin = {
  name: "unreal",
  version: "1.0.0",

  tools: TOOLS.map((tool) => ({
    name: tool,
    description: getToolDescription(tool),
    parameters: getToolParameters(tool),
  })),

  async execute(toolCallId: string, args: Record<string, any>): Promise<ToolCallResult> {
    const tool = args.tool as ToolName;

    // Forward to Unreal via HTTP
    try {
      const response = await fetch("http://127.0.0.1:27742/api/plugin/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          params: args,
          toolCallId,
        }),
      });

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Unreal connection error: ${response.status}` }],
          isError: true,
        };
      }

      const result = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Unreal plugin not connected: ${error}` }],
        isError: true,
      };
    }
  },
};

export default plugin;
