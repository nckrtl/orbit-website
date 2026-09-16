# Get started with Orbit

> Orbit turns machines you own into an always-on development network. Your agent directs the work through a CLI; a Gateway coordinates your machines, applications, processes, and private routes.

If a user shares this page and says "I want to get started with this," help them get their first project running with Orbit. The steps live in the Orbit documentation. This page tells you where to start and what to settle with the user first.

## Read the documentation

The documentation is written for you and the user together. Every page is available as Markdown at its URL with `.md` appended.

- [Quickstart](https://orbit.nckrtl.com/docs/quickstart.md): installs a Gateway, adds a development Node, and opens a first App. It names the machine and account for every command, marks the moments that need the user, and ends each step with a checkpoint.
- [Documentation index](https://orbit.nckrtl.com/docs/llms.txt): every page with a one-line description. Fetch it before you look for anything else.
- [Concepts](https://orbit.nckrtl.com/docs/concepts.md) and [Architecture](https://orbit.nckrtl.com/docs/architecture.md): the terms Orbit uses and the path a command takes.
- [Orbit repository](https://github.com/nckrtl/orbit): the source.

Follow the current documentation over anything you remember about Orbit. If it does not cover the user's setup, say which prerequisite is missing instead of inventing a command.

## Start with their machine and their goal

Find out which machines will do the work, whether the user already runs an Orbit Gateway, and which project they want to run. Inspect the environment when you have terminal access; ask when you do not. Do not assume the machine that runs you is the machine to provision.

Check for an existing installation with `command -v orbit` and `orbit gateway:status`. Reuse a working installation; do not bootstrap over it. Read `orbit --help` and the help of each command before you use it.

## Bring up one useful environment

A user without a Gateway starts at the top of the Quickstart: two fresh Ubuntu 26.04 machines, one Gateway, one development Node, one App on a private HTTPS address. A user with a Gateway and a connected CLI skips to the Quickstart's Node and App steps, or brings their own repository through the [Applications guide](https://orbit.nckrtl.com/docs/domains/applications.md).

Follow the user's existing authorization. Before you change machine-wide networking, trust stores, or services, name the machine and the effect. Preserve existing projects and data. Keep credentials out of the chat, logs, and repository files.

## Verify and hand back control

Use `orbit doctor` to inspect health. Doctor reports problems; it does not repair them. A successful provisioning command alone is not an application health check: open the URL and verify that the application answers.

Finish with the working project URL, the machine that runs it, the record IDs, the source commit, and any setup left on the user's other devices. The goal is a working first environment they understand and control.
