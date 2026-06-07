# import_agent MCP Tool Guide

**Version**: 1.0  
**Status**: ✅ Implemented  
**Last Updated**: 2026-06-06

---

## Overview

The `import_agent` MCP tool enables importing agents from various AI coding tool formats back into the standardized `agent.json v2.0` format, completing the bidirectional agent ecosystem.

**Use Case**: Convert existing agents from Cursor, Claude Code, CodeBuddy, or GitHub Copilot into the agent-market format for sharing, versioning, and cross-platform deployment.

---

## Tool Definition

```typescript
{
  name: "import_agent",
  description: "Import an agent from an AI tool format to agent.json v2.0",
  inputSchema: {
    type: "object",
    properties: {
      source_path: {
        type: "string",
        description: "Path to the agent file or directory"
      },
      output_dir: {
        type: "string",
        description: "Output directory (default: ./imported-agents)"
      },
      tool: {
        type: "string",
        description: "Force specific adapter: cursor, claude_code, codebuddy, github_copilot"
      },
      dry_run: {
        type: "boolean",
        description: "Preview without writing files (default: false)"
      }
    },
    required: ["source_path"]
  }
}
```

---

## Usage Examples

### Example 1: Auto-detect and Import

**User prompt**:
> "Import the agent from .cursor/commands/code-reviewer.md"

**MCP Call**:
```json
{
  "name": "import_agent",
  "arguments": {
    "source_path": ".cursor/commands/code-reviewer.md"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "source_path": ".cursor/commands/code-reviewer.md",
  "output_path": "./imported-agents/code-reviewer/agent.json",
  "agent_dir": "./imported-agents/code-reviewer",
  "message": "✅ Successfully imported agent to: ./imported-agents/code-reviewer\n\nYou can now:\n1. Upload this agent to the market\n2. Deploy it to other AI tools with deploy_agent"
}
```

---

### Example 2: Dry-run (Preview)

**User prompt**:
> "Show me what would be imported from .claude/commands/my-skill.md without actually importing it"

**MCP Call**:
```json
{
  "name": "import_agent",
  "arguments": {
    "source_path": ".claude/commands/my-skill.md",
    "dry_run": true
  }
}
```

**Response**:
```json
{
  "status": "dry-run",
  "source_path": ".claude/commands/my-skill.md",
  "detected_tool": "auto",
  "agent": {
    "name": "my-skill",
    "version": "1.0.0",
    "display_name": "My Skill",
    "description": "A helpful coding assistant...",
    "author": "Imported from Claude Code",
    "tags": ["claude_code", "imported"]
  },
  "output_path": "./imported-agents/my-skill/agent.json",
  "message": "Dry-run successful. Use dry_run: false to write files."
}
```

---

### Example 3: Force Specific Adapter

**User prompt**:
> "Import this markdown file as a Cursor agent even though it's not in .cursor/commands/"

**MCP Call**:
```json
{
  "name": "import_agent",
  "arguments": {
    "source_path": "./docs/my-agent.md",
    "tool": "cursor",
    "output_dir": "./my-agents"
  }
}
```

---

### Example 4: Custom Output Directory

**User prompt**:
> "Import all my CodeBuddy skills to ./market-agents/"

**MCP Call** (repeated for each skill):
```json
{
  "name": "import_agent",
  "arguments": {
    "source_path": ".codebuddy/skills/skill-1/SKILL.md",
    "output_dir": "./market-agents"
  }
}
```

---

## Supported Platforms

| Platform | Source Pattern | Auto-detect |
|----------|---------------|-------------|
| **Cursor** | `.cursor/commands/*.md` | ✅ |
| **Claude Code** | `.claude/commands/*.md` | ✅ |
| **CodeBuddy** | `.codebuddy/skills/*/SKILL.md` | ✅ |
| **GitHub Copilot** | `.github/agents/*.md` | ✅ |

---

## Parameters

### source_path (required)

Path to the agent file or directory to import.

**Examples**:
- `.cursor/commands/my-agent.md`
- `.claude/commands/code-review.md`
- `.codebuddy/skills/test-skill/SKILL.md`
- `.github/agents/doc-generator.md`

**Auto-detection**: If `tool` parameter is omitted, the adapter is auto-detected based on the path pattern.

---

### output_dir (optional)

Directory where the imported agent will be created.

**Default**: `./imported-agents`

**Structure**:
```
output_dir/
└── agent-name/
    └── agent.json
```

---

### tool (optional)

Force a specific import adapter instead of auto-detection.

**Valid values**:
- `cursor`
- `claude_code`
- `codebuddy`
- `github_copilot`

**When to use**:
- File is not in standard location
- Manual override needed
- Testing specific adapter

---

### dry_run (optional)

Preview the import without writing files.

**Default**: `false`

**When to use**:
- Preview metadata extraction
- Verify correct adapter detected
- Check output before committing

**Dry-run response** includes:
- Detected tool
- Extracted agent metadata (name, version, description, author, tags)
- Where agent.json would be written

---

## Output Structure

### Success Response

```json
{
  "status": "success",
  "source_path": "/path/to/source",
  "output_path": "/path/to/agent.json",
  "agent_dir": "/path/to/agent-name",
  "message": "✅ Successfully imported agent..."
}
```

### Dry-run Response

```json
{
  "status": "dry-run",
  "source_path": "/path/to/source",
  "detected_tool": "cursor",
  "agent": {
    "name": "agent-name",
    "version": "1.0.0",
    "display_name": "Agent Name",
    "description": "Agent description...",
    "author": "Imported from Cursor",
    "tags": ["cursor", "imported"]
  },
  "output_path": "/path/to/agent.json",
  "message": "Dry-run successful..."
}
```

### Error Response

```json
{
  "error": "Import failed: No adapter found for: /path/to/file"
}
```

---

## Error Handling

### No Adapter Found

```json
{
  "error": "Import failed: No adapter found for: /unknown/file.txt\nTried 4 adapter(s). Supported formats: cursor, claude_code, codebuddy, github_copilot"
}
```

**Solution**: Check file path or specify `tool` parameter

---

### File Not Found

```json
{
  "error": "Import failed: Cursor command file not found: /path/to/nonexistent.md"
}
```

**Solution**: Verify file path exists

---

### Invalid Format

```json
{
  "error": "Import failed: CodeBuddy SKILL.md must have YAML frontmatter with 'name' field."
}
```

**Solution**: Ensure source file meets format requirements

---

### Missing source_path

```json
{
  "error": "source_path is required"
}
```

**Solution**: Provide `source_path` parameter

---

## Workflow Examples

### Complete Import-Deploy Cycle

**Step 1: Import from Cursor**
```json
{
  "name": "import_agent",
  "arguments": {
    "source_path": ".cursor/commands/my-agent.md",
    "output_dir": "./market-agents"
  }
}
```

**Step 2: Deploy to Claude Code**
```json
{
  "name": "deploy_agent",
  "arguments": {
    "agent_path": "./market-agents/my-agent",
    "target_tool": "claude_code"
  }
}
```

**Result**: Agent available in both Cursor and Claude Code

---

### Batch Import

**Import all Cursor commands**:
```bash
for file in .cursor/commands/*.md; do
  # Call import_agent for each file
done
```

**AI Assistant workflow**:
> "Import all agents from .cursor/commands/ to ./my-agents/"

The assistant will:
1. List files in `.cursor/commands/`
2. Call `import_agent` for each file
3. Report success/failure for each

---

### Migration Workflow

**Scenario**: Migrate from CodeBuddy to agent-market

1. **Dry-run first**:
   ```json
   {
     "name": "import_agent",
     "arguments": {
       "source_path": ".codebuddy/skills/my-skill/SKILL.md",
       "dry_run": true
     }
   }
   ```

2. **Review extracted metadata**

3. **Import for real**:
   ```json
   {
     "name": "import_agent",
     "arguments": {
       "source_path": ".codebuddy/skills/my-skill/SKILL.md",
       "output_dir": "./market-agents"
     }
   }
   ```

4. **Upload to market** (future feature)

5. **Deploy to other tools**:
   ```json
   {
     "name": "deploy_agent",
     "arguments": {
       "agent_path": "./market-agents/my-skill",
       "target_tool": "cursor"
     }
   }
   ```

---

## Implementation Details

### Architecture

```typescript
handleImportAgent(args)
  ├─ Create ImportManager
  ├─ Register all adapters
  │   ├─ CursorImportAdapter
  │   ├─ ClaudeImportAdapter
  │   ├─ CodeBuddyImportAdapter
  │   └─ GitHubImportAdapter
  ├─ if dry_run:
  │   └─ manager.dryRun(sourcePath, tool)
  └─ else:
      └─ manager.importAgent(sourcePath, outputDir, tool)
```

### Adapter Registration

```typescript
const manager = new ImportManager();
manager.registerAdapter(new CursorImportAdapter());
manager.registerAdapter(new ClaudeImportAdapter());
manager.registerAdapter(new CodeBuddyImportAdapter());
manager.registerAdapter(new GitHubImportAdapter());
```

All adapters are registered on every call to ensure complete platform support.

---

## Testing

**Test Coverage**: 11 integration tests

### Test Categories

1. **Dry-run mode** (3 tests)
   - Preview without writing
   - Auto-detect tool
   - Force specific adapter

2. **Real import mode** (3 tests)
   - Import Cursor agent
   - Import Claude Code agent
   - Default output directory

3. **Error handling** (3 tests)
   - Missing source_path
   - Non-existent file
   - No adapter found

4. **Tool parameter** (2 tests)
   - Force adapter
   - Invalid tool name

**Result**: 62/62 tests passing ✅

---

## Best Practices

### 1. Dry-run First

Always preview imports before writing:
```json
{ "dry_run": true }
```

### 2. Use Descriptive Output Dirs

Organize imported agents:
```json
{ "output_dir": "./imported-from-cursor" }
```

### 3. Batch Imports with Error Handling

Handle failures gracefully when importing multiple agents.

### 4. Verify agent.json

After import, verify the generated `agent.json` has correct metadata.

### 5. Version Control

Add imported agents to git for tracking:
```bash
git add ./imported-agents/
git commit -m "Import agents from Cursor"
```

---

## Limitations

1. **YAML Parsing**: Simple parser supports arrays and key-value pairs, not complex YAML
2. **Metadata Extraction**: Best-effort extraction; some manual edits may be needed
3. **Cross-platform Paths**: Normalizes Windows/Unix paths, but test on both
4. **No Binary Files**: Markdown and YAML only

---

## Future Enhancements

- [ ] Support more platforms (Windsurf, Aider, etc.)
- [ ] Bulk import API (import entire directory)
- [ ] Import from URLs (GitHub, gists)
- [ ] Metadata validation and enrichment
- [ ] Import history tracking

---

## References

- [ImportAdapter Spec](./IMPORT_ADAPTER_SPEC.md)
- [Phase 2 Plan](./PHASE2_PLAN.md)
- [MCP Server Code](../../agent-deploy/node/src/index.ts)

---

**Document Version**: 1.0  
**Implementation Status**: ✅ Complete  
**Tests**: 11/11 passing  
**Last Updated**: 2026-06-06
