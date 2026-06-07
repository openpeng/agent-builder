# Test PilotDeck Agent

**Version**: 1.0.0
**Description**: A PilotDeck-style agent with subagents

## Pipeline

## Parameters

Provide the following values when invoking this agent (use `$ARGUMENTS` or pass as key=value):

- `file_path`

**Step 1: read**
Read file: `{{file_path}}` Save result as `content`.

# Test PilotDeck Agent

A PilotDeck-style agent with subagents

## Workflows

This agent contains 2 sub-workflow(s):

- **worker** (`worker.yaml`): Main workflow for processing tasks
- **helper** (`helper.yaml`): Helper workflow for additional operations

Entry workflow: **worker**

## Usage

This agent is based on PilotDeck workflow orchestration. See individual `.yaml` files for detailed configuration.


---
*Adapted from Agent Market by agent-deploy v1.0.0*
