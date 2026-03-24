# Quickstart Guide

Get the easyDNS MCP server running in under 5 minutes.

## Prerequisites

- **Node.js 18+** (tested on 22.14.0)
- **easyDNS API credentials** (token + API key from your easyDNS control panel)

## 1. Install and build

```bash
cd easydns-mcp
npm install
npm run build
```

This compiles TypeScript to `dist/`. You should see no errors.

## 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
EASYDNS_TOKEN=your-token-here
EASYDNS_API_KEY=your-api-key-here
```

Everything else defaults to safe values (sandbox mode, writes disabled).

## 3. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "easydns": {
      "command": "node",
      "args": ["/full/path/to/easydns-mcp/dist/index.js"],
      "env": {
        "EASYDNS_TOKEN": "your-token-here",
        "EASYDNS_API_KEY": "your-api-key-here",
        "EASYDNS_SANDBOX": "true",
        "EASYDNS_ENABLE_WRITES": "false"
      }
    }
  }
}
```

A complete template is at `templates/claude-desktop-config.json`.

Restart Claude Desktop after saving.

## 4. Add to Claude Code

Add to your project's `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "easydns": {
      "command": "node",
      "args": ["/full/path/to/easydns-mcp/dist/index.js"],
      "env": {
        "EASYDNS_TOKEN": "your-token-here",
        "EASYDNS_API_KEY": "your-api-key-here",
        "EASYDNS_SANDBOX": "true"
      }
    }
  }
}
```

## 5. Verify it works

Ask Claude: **"List my domains"** or **"Get DNS records for example.com"**

You should see Claude call `domain_list` or `dns_records_list` and return results from the sandbox API.

You can also test directly via stdio:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## 6. Enable writes (when ready)

Change the env var:

```env
EASYDNS_ENABLE_WRITES=true
```

Or in your MCP config:

```json
"EASYDNS_ENABLE_WRITES": "true"
```

Write tools are now active. Destructive operations still require confirmation strings — the agent must pass `confirm: "DELETE"` (or `"RELOAD"`, `"UPDATE_NS"`) to execute them.

## 7. Move to production (when confident)

> **Don't put raw secrets in config files for production.** The sandbox examples above are fine for lab use, but for production, use a wrapper script that pulls credentials from your system keychain or secrets manager.

### Store credentials in macOS Keychain

```bash
security add-generic-password -s easydns-token -a easydns -w "your-token"
security add-generic-password -s easydns-apikey -a easydns -w "your-api-key"
```

### Create a production wrapper script

```bash
#!/usr/bin/env bash
# scripts/prod-start.sh
set -euo pipefail
export EASYDNS_TOKEN=$(security find-generic-password -s easydns-token -w)
export EASYDNS_API_KEY=$(security find-generic-password -s easydns-apikey -w)
export EASYDNS_SANDBOX=false
export EASYDNS_ALLOW_PRODUCTION=true
export EASYDNS_ENABLE_WRITES=true
export EASYDNS_PROTECTED_DOMAINS=critical-domain.com,dont-touch.org
exec node "$(dirname "$0")/../dist/index.js"
```

```bash
chmod +x scripts/prod-start.sh
```

### Point Claude Desktop at the wrapper

```json
{
  "mcpServers": {
    "easydns": {
      "command": "/path/to/easydns-mcp/scripts/prod-start.sh"
    }
  }
}
```

This also works with 1Password CLI (`op read "op://vault/easydns/token"`), `pass`, or any secrets manager that emits values to stdout.

Always set `EASYDNS_PROTECTED_DOMAINS` before enabling production. These domains can never be modified through the MCP server, regardless of other settings.

## Using the bash scripts directly

If you want to use the shell scripts without the MCP server:

```bash
# Set credentials
export EASYDNS_TOKEN="your-token"
export EASYDNS_API_KEY="your-key"
export EASYDNS_SANDBOX=true

# Read operations
./scripts/domain-info.sh example.com
./scripts/list-records.sh example.com

# Write operations (requires EASYDNS_ENABLE_WRITES=true)
export EASYDNS_ENABLE_WRITES=true
./scripts/add-record.sh example.com A www 1.2.3.4 600
./scripts/delete-record.sh example.com 12345  # prompts for confirmation
```

## Using as a Claude Code skill

The `SKILL.md` file at the project root contains curl examples that Claude Code can use directly in bash, without the MCP server running. Claude Code will pick this up automatically when working in the `easydns-mcp` directory.

## Troubleshooting

### "Required environment variable EASYDNS_TOKEN is not set"
Your `.env` file is missing or credentials aren't set. Check that `.env` exists in the project root with both `EASYDNS_TOKEN` and `EASYDNS_API_KEY`.

### "Write operations are disabled"
Set `EASYDNS_ENABLE_WRITES=true` in your `.env` or MCP config.

### "Production access requires EASYDNS_ALLOW_PRODUCTION=true"
You've set `EASYDNS_SANDBOX=false` but haven't explicitly opted into production. Add `EASYDNS_ALLOW_PRODUCTION=true`.

### "Domain X is on the protected list"
The domain is in `EASYDNS_PROTECTED_DOMAINS`. Remove it from the list if you need to modify it (think twice first).

### "Domain X is not on the allowed list"
You have `EASYDNS_ALLOWED_DOMAINS` set and this domain isn't included. Add it to the comma-separated list.

### API returns 403
Check your credentials. The sandbox and production APIs use different credential sets.

### API returns 420
Rate limited. Wait a moment and try again.

## Next steps

- Read [EXAMPLES.md](EXAMPLES.md) for common agent conversation patterns
- Review the [README](../README.md) for the full tool reference and security model
- Check `easydns-mcp-security-review.md` for the security architecture
