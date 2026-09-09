# Development environment section

Sources checked 2026-09-09. This section describes complementary workflows, not certified integrations or automatic installation of every desktop application.

- Orca: https://github.com/stablyai/orca and https://www.onorca.dev/docs/ssh — parallel agents, isolated worktrees, remote files and terminals over SSH. Assumed to be the Orca the user named.
- Superset: https://github.com/superset-sh/superset — isolated workspaces, CLI agents, remote hosts, and per-workspace previews.
- Codex desktop: https://learn.chatgpt.com/docs/remote-connections#connect-to-an-ssh-host — remote projects run against the host filesystem and shell; the desktop app starts the remote Codex app server through SSH. The former developers.openai.com/codex/app URL now redirects to the shared desktop app documentation.
- OpenCode: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/server.mdx — standalone server, clients, and server authentication.
- Orbit tools: https://github.com/nckrtl/orbit/blob/main/docs/reference/tools.md and https://github.com/nckrtl/orbit/blob/main/docs/decisions/0001-tool-management.md — supported managers install and update packages on managed Linux nodes; recorded version constraints gate updates. Desktop clients need their own supported installation workflow.

Rollback was requested, but the published Orbit contract explicitly says it does not downgrade automatically, and tool:update accepts no target version. Copy currently covers installation, updates, inventory and version drift. Confirm a newer rollback implementation before advertising rollback or a version-switching UI.

Each environment links to its own documentation from the section. The diagram is a conceptual illustration, not a screenshot or live service status.

## Generic stack revision

The per-environment tabs were replaced with a name-and-icon marquee and one conceptual agent workspace, supported by an Orbit foundation. The illustration reuses the website's orthographic hardware projection and connected preview devices. The copy now focuses on preparing machines, dependencies, workspaces/worktrees, services and private preview access. Workspace/worktree positioning follows the user's product direction.

Icons: Orca from stablyai/orca resources/logo.svg (MIT); Superset from superset-sh/superset packages/ui/src/assets/icons/preset-icons/superset.svg (upstream license included); Codex/OpenAI and OpenCode from LobeHub's lobe-icons (MIT). Assets and license notices are in public/assets/orbit/environments.
