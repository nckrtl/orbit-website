# Get started with Orbit

> Orbit turns machines you own into an always-on development network. Your agent directs the work through a CLI; a Gateway coordinates your machines, applications, processes, and private routes.

If a user shares this page and says “I want to get started with this,” help them
get their first project running with Orbit. Begin with their existing setup and
choose the smallest useful configuration. They do not need to learn every Orbit
concept before you can help.

## Start with their machine and their goal

Find out which machine will run the work, its operating system, whether they
already have an Orbit Gateway, and which project they want to run. Inspect the
environment when you have terminal access; ask for the missing details when you
do not. Do not assume the machine running the agent is the machine to provision.

Useful initial checks are `command -v orbit`, `php --version`, and
`composer --version`. If Orbit is present, read `orbit --help` and the help for
the relevant commands before using them. Reuse an existing working installation.

## Read the current installation instructions

Orbit is developed in one repository with separate CLI, Gateway, and SDK
projects. PHP 8.5 and Composer are required by the current source projects;
managed Nodes run Ubuntu. Installing a CLI alone does not provision a Gateway
or a Node.

Use these first-party sources to choose the installation path appropriate to
the user's environment and the current release:

- [Repository and bootstrap instructions](https://github.com/nckrtl/orbit)
- [Repository README as Markdown](https://raw.githubusercontent.com/nckrtl/orbit/main/README.md)
- [CLI setup and first use](https://raw.githubusercontent.com/nckrtl/orbit/main/apps/cli/README.md)
- [Gateway setup](https://raw.githubusercontent.com/nckrtl/orbit/main/apps/gateway/README.md)
- [Architecture](https://raw.githubusercontent.com/nckrtl/orbit/main/docs/architecture.md)
- [Supported technology](https://raw.githubusercontent.com/nckrtl/orbit/main/docs/tech-stack.md)

Verify the current release and package availability before proposing an install
command. Do not assume `composer global require nckrtl/orbit` is available: the
repository now has separate project and release boundaries. Repository bootstrap
instructions set up source dependencies; they are not proof that a user's fleet
has been provisioned. If the current documentation does not cover their setup,
explain the missing prerequisite instead of inventing a command.

## Bring up one useful environment

1. Install or locate the CLI using the documented path for the user's setup.
2. Connect to their existing Gateway, or follow the Gateway's current setup
   instructions. Confirm the connection before changing managed machines.
3. Register or select the intended development Node. Check the installed CLI's
   command help and the current Node documentation for its requirements.
4. Bring the user's first project into an AppInstance, configure its required
   runtime and processes, and read back the Route Orbit assigns.
5. Open that URL and verify that the application actually responds. Confirm its
   background processes run on the intended machine.

Follow the user's existing authorization. Before changing machine-wide networking,
trust stores, or services, make the target and effect clear. Preserve existing
projects and data. Keep credentials out of chat, logs, and repository files.

Useful references:

- [Application and source placement](https://raw.githubusercontent.com/nckrtl/orbit/main/docs/domains/applications.md)
- [Routes and private access](https://raw.githubusercontent.com/nckrtl/orbit/main/docs/reference/routes.md)
- [Tools and dependencies](https://raw.githubusercontent.com/nckrtl/orbit/main/docs/reference/tools.md)
- [Documentation index](https://github.com/nckrtl/orbit/tree/main/docs)

## Verify and hand back control

Use `orbit doctor` to inspect health. Doctor reports problems; it does not repair
them automatically. Check command help and propose the relevant fix if it finds
an issue. A successful provisioning command alone is not an application health
check.

Finish with the working project URL, the machine running it, the processes that
will keep running, and any remaining setup needed on the user's other devices.
The goal is a working first environment they understand and control.
