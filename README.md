<div align="center">

```
███████╗ █████╗ ██████╗ ██╗     ███████╗███████╗
██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
█████╗  ███████║██████╔╝██║     █████╗  ███████╗
██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
██║     ██║  ██║██████╔╝███████╗███████╗███████║
╚═╝     ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝
```

# 📖 Fables

### **Turn Flutter apps into legendary builds.**

Build **APK**, **AAB** & **iOS** — no Android Studio required. ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3+-blue.svg)](https://flutter.dev/)
[![Tests](https://img.shields.io/badge/Tests-50%2F50-brightgreen.svg)](#-testing)
[![MCP](https://img.shields.io/badge/MCP-26%20Agents-purple.svg)](#-ai-agent-integration)
[![Commands](https://img.shields.io/badge/Commands-24-orange.svg)](#-commands)

---

[Installation](#-installation) · [Quick Start](#-quick-start) · [Commands](#-commands) · [AI Agents](#-ai-agent-integration) · [CI/CD](#-cicd-integration) · [Guide](#-comprehensive-guide)

</div>

---

## 📖 Table of Contents

- [Why Fables?](#-why-fables)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
  - [Core Commands](#core-commands)
  - [Build & Deploy](#build--deploy)
  - [Device & Testing](#device--testing)
  - [Assets & Resources](#assets--resources)
  - [Configuration & Secrets](#configuration--secrets)
  - [Quality & Analysis](#quality--analysis)
  - [Release & CI/CD](#release--cicd)
  - [AI Integration](#ai-integration)
- [Comprehensive Guide](#-comprehensive-guide)
  - [Building for Android](#building-for-android)
  - [Building for iOS](#building-for-ios)
  - [Managing Signing Keys](#managing-signing-keys)
  - [Build Flavors & Environments](#build-flavors--environments)
  - [App Icons & Splash Screens](#app-icons--splash-screens)
  - [Dependency Management](#dependency-management)
  - [Secrets & Environment Variables](#secrets--environment-variables)
  - [Internationalization (i18n)](#internationalization-i18n)
  - [Permissions Management](#permissions-management)
  - [ProGuard/R8 Configuration](#proguardr8-configuration)
  - [Device Logs & Debugging](#device-logs--debugging)
  - [Version Management](#version-management)
- [AI Agent Integration](#-ai-agent-integration)
  - [Supported Agents](#supported-agents)
  - [OpenClaw](#openclaw)
  - [Claude Code](#claude-code)
  - [Cursor](#cursor)
  - [VS Code / GitHub Copilot](#vs-code--github-copilot)
  - [Windsurf (Codeium)](#windsurf-codeium)
  - [Cline](#cline)
  - [Continue.dev](#continuedev)
  - [Aider](#aider)
  - [Zed Editor](#zed-editor)
  - [JetBrains IDEs](#jetbrains-ides)
  - [LangChain](#langchain)
  - [CrewAI](#crewai)
  - [AutoGen (Microsoft)](#autogen-microsoft)
  - [Semantic Kernel](#semantic-kernel)
  - [LlamaIndex](#llamaindex)
  - [Haystack (deepset)](#haystack-deepset)
  - [OpenAI Agents SDK](#openai-agents-sdk)
  - [Google ADK](#google-adk)
  - [Amazon Bedrock](#amazon-bedrock)
  - [n8n](#n8n)
  - [Dify](#dify)
  - [Coze (ByteDance)](#coze-bytedance)
  - [FastGPT](#fastgpt)
  - [Flowise](#flowise)
  - [Generic MCP Client](#generic-mcp-client)
  - [MCP Protocol Reference](#mcp-protocol-reference)
  - [MCP Tools Reference](#mcp-tools-reference)
- [CI/CD Integration](#-cicd-integration)
  - [GitHub Actions](#github-actions)
  - [GitLab CI](#gitlab-ci)
  - [CircleCI](#circleci)
  - [Bitbucket Pipelines](#bitbucket-pipelines)
- [Docker Support](#-docker-support)
- [Configuration Reference](#-configuration-reference)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🤔 Why Fables?

Setting up Flutter for Android builds is a **nightmare**:

| Without Fables ❌ | With Fables ✅ |
|---|---|
| 📥 Install Android Studio (~2GB) | 📦 `npm install -g fables` |
| 📥 Install Android SDK separately | 🐳 Auto-managed via Docker |
| 📥 Install Java/JDK | ✅ Included |
| 🔧 Configure PATH variables | ✅ Zero config |
| 😭 Pray nothing conflicts | 🚀 Just works |
| 🤖 No AI agent support | 🔌 26 agents supported |
| 📝 Manual CI/CD setup | 🔧 One-command CI generation |
| 🎨 Manual icon/splash creation | 🎨 Auto-generate everything |

**Fables** is a single CLI that replaces Android Studio, manages your SDK, handles signing, generates icons, creates CI/CD pipelines, and integrates with every major AI agent — all from your terminal.

---

## ✨ Features

### Core 🏗️
- 🚀 **Build APK, AAB, Split APKs** — no Android Studio
- 🍎 **iOS builds** — IPA generation on macOS
- 🐳 **Docker-powered SDK** — auto-manages Android SDK
- 🔐 **Keystore management** — generate & manage signing keys
- 🔒 **Code obfuscation** — protect your app (on by default)
- ⚡ **Build flavors** — dev, staging, production
- 📊 **Beautiful CLI** — gradient ASCII art, book-themed spinners

### Assets & Resources 🎨
- 🖼️ **App icon generator** — one 1024x1024 image → all platforms
- 🌊 **Splash screen generator** — Android + iOS launch screens
- 📦 **Asset optimization** — size analysis & recommendations

### Quality & Analysis 📊
- 📏 **APK/AAB size analysis** — with optimization tips
- 📋 **Permission manager** — list, add, remove, auto-suggest
- 📄 **Manifest viewer** — AndroidManifest.xml inspection
- 🛡️ **ProGuard helper** — rule templates & validation
- 🧪 **Test runner** — beautiful Flutter test output

### Developer Experience 💻
- 📱 **Device deployment** — install APK via ADB
- 🖥️ **Emulator management** — create, list, launch emulators
- 📜 **Log viewer** — colorized, filtered device logs
- 🔄 **Version bumping** — sync pubspec + Android + iOS
- 📝 **Changelog generation** — from git history
- 🌍 **i18n support** — localization setup & string extraction
- 📦 **Dependency auditor** — security & update checks
- 🔐 **Secrets manager** — per-environment .env files

### AI Agent Integration 🤖
- 🔌 **MCP Protocol** — Model Context Protocol server
- 🤖 **26 supported agents** — Claude, Cursor, LangChain, CrewAI, and more
- 📡 **stdio & HTTP transports** — for CLI and remote agents
- 🛠️ **19 MCP tools** — every Fables command as an AI tool

### CI/CD 🔧
- 🐙 **GitHub Actions** — one-command workflow generation
- 🦊 **GitLab CI** — Docker-based pipeline
- ⭕ **CircleCI** — multi-stage builds
- 🔵 **Bitbucket Pipelines** — ready-to-push config

---

## 📦 Installation

### Prerequisites

- **Node.js** 16 or later → [Download](https://nodejs.org/)
- **Flutter SDK** 3+ → [Download](https://docs.flutter.dev/get-started/install)

### Install Fables

```bash
# Install globally (recommended)
npm install -g fables

# Or use with npx (no install)
npx fables --help
```

### Verify Installation

```bash
fables --version
# → 0.1.0

fables doctor
# → Checks Flutter, SDK, Docker, Xcode, Java
```

---

## 🚀 Quick Start

```bash
# 1. Navigate to your Flutter project
cd my_flutter_app

# 2. Initialize Fables
fables init

# 3. Check your environment
fables doctor

# 4. Build your app!
fables build --target apk

# 5. Deploy to device
fables deploy build/fables/app-release.apk
```

That's it. No Android Studio. No SDK configuration. Just Fables. 📖✨

---

## 📖 Commands

### Core Commands

| Command | Description |
|---|---|
| `fables init` 🏗️ | Initialize Fables in your Flutter project |
| `fables doctor` 🔍 | Check your build environment |
| `fables config` ⚙️ | View/edit Fables configuration |
| `fables clean` 🧹 | Clean build artifacts & caches |

### Build & Deploy

| Command | Description |
|---|---|
| `fables build` 🚀 | Build APK, AAB, Split APKs, or iOS IPA |
| `fables deploy` 📱 | Deploy APK to connected device via ADB |
| `fables run` 📱 | Run app on device/emulator with hot reload |

### Device & Testing

| Command | Description |
|---|---|
| `fables emulator` 🖥️ | Create, list, launch Android emulators |
| `fables logs` 📜 | View device logs with smart filtering |
| `fables test` 🧪 | Run Flutter tests with beautiful output |

### Assets & Resources

| Command | Description |
|---|---|
| `fables icon` 🎨 | Generate app icons from a single image |
| `fables splash` 🌊 | Generate splash screen assets |

### Configuration & Secrets

| Command | Description |
|---|---|
| `fables flavors` 🍦 | Manage build flavors (dev/staging/prod) |
| `fables secrets` 🔐 | Manage environment variables & secrets |
| `fables deps` 📦 | Dependency management & auditing |
| `fables permissions` 📋 | Manage app permissions |
| `fables i18n` 🌍 | Internationalization helpers |

### Quality & Analysis

| Command | Description |
|---|---|
| `fables analyze` 📊 | APK/AAB size analysis & optimization |
| `fables manifest` 📄 | AndroidManifest.xml viewer & editor |
| `fables proguard` 🛡️ | ProGuard/R8 configuration helper |
| `fables sign` 🔐 | Keystore generation & signing profiles |

### Release & CI/CD

| Command | Description |
|---|---|
| `fables release` 🔄 | Version bumping & changelog generation |
| `fables ci` 🔧 | Generate CI/CD configs (GitHub, GitLab, etc.) |

### AI Integration

| Command | Description |
|---|---|
| `fables mcp` 🤖 | MCP server for AI agent integration |

---

## 📖 Comprehensive Guide

### Building for Android

#### APK (Installable)

```bash
# Universal APK
fables build --target apk

# Per-architecture APKs (smaller download per device)
fables build --target apk --split-per-abi

# Debug build
fables build --target apk --mode debug

# Profile build (performance testing)
fables build --target apk --mode profile
```

#### AAB (Play Store)

```bash
# App Bundle for Google Play
fables build --target aab

# With flavor
fables build --target aab --flavor production
```

#### Build Options

```bash
fables build --target apk \
  --mode release \           # release | profile | debug
  --flavor production \      # Build flavor
  --split-per-abi \          # Per-architecture APKs
  --obfuscate \              # Code obfuscation (default: on)
  --dart-define ENV=prod \   # Dart defines
  --dart-define API_KEY=xxx \
  --clean \                  # Clean before build
  --output build/fables \    # Output directory
  --yes                      # Skip confirmation
```

### Building for iOS

```bash
# Build IPA (requires macOS with Xcode)
fables build --target ios

# With flavor
fables build --target ios --flavor staging

# Without code signing (for CI/CD)
fables build --target ios --no-sign
```

**Requirements:**
- macOS 12+ (Monterey or later)
- Xcode 14+
- CocoaPods (`sudo gem install cocoapods`)

### Managing Signing Keys

```bash
# Generate a new keystore
fables sign generate

# Interactive prompts for:
# - Key alias
# - Certificate details (CN, O, OU, L, ST, C)
# - Password

# List signing profiles
fables sign list
```

Keystores are stored in `.fables/keystores/` (gitignored by default).

### Build Flavors & Environments

```bash
# Initialize flavors interactively
fables flavors init

# Creates configurations for:
# - dev (Development)
# - staging (Staging)
# - prod (Production)

# List configured flavors
fables flavors list

# Build a specific flavor
fables build --target apk --flavor production
```

Flavors are saved in `.fables/fables.yaml` and auto-generate Android product flavors.

### App Icons & Splash Screens

#### Icons

```bash
# Generate all icons from a single 1024x1024 image
fables icon path/to/icon.png

# Android only
fables icon path/to/icon.png --android

# With adaptive icons
fables icon path/to/icon.png --adaptive --background "#FF6B35"

# iOS only
fables icon path/to/icon.png --ios

# Web (PWA + favicon)
fables icon path/to/icon.png --web
```

**Generates:**
- Android: 5 density buckets (mdpi → xxxhdpi) + adaptive icons
- iOS: 15 sizes including App Store icon
- Web: 192px, 512px, maskable, favicon

#### Splash Screens

```bash
# Generate splash screens
fables splash path/to/splash.png

# With custom background
fables splash path/to/splash.png --background "#FFFFFF"

# With dark mode support
fables splash path/to/splash.png --dark-background "#1A1A1A"
```

### Dependency Management

```bash
# List all dependencies
fables deps list

# Include dev dependencies
fables deps list --dev

# Audit for issues
fables deps audit
# Checks: unpinned versions, git deps, supply chain risks

# Add packages
fables deps add http dio provider

# Remove packages
fables deps remove http

# Check for updates
fables deps update --dry-run
```

### Secrets & Environment Variables

```bash
# Initialize secrets management
fables secrets init
# Creates .env files for dev, staging, production

# List environments
fables secrets list

# Set a secret
fables secrets set API_KEY sk_live_xxxxx --env production

# Load secrets as dart-defines
fables secrets load production

# Generate encryption key
fables secrets keygen
```

**File structure:**
```
.fables/secrets/
├── development.env
├── staging.env
└── production.env
```

### Internationalization (i18n)

```bash
# Initialize i18n with locales
fables i18n init --locales en,es,fr,de,ja,zh

# List configured locales
fables i18n list

# Extract hardcoded strings from Dart code
fables i18n extract

# Validate translations
fables i18n validate
```

### Permissions Management

```bash
# List current permissions
fables permissions list

# Add a permission
fables permissions add CAMERA

# Remove a permission
fables permissions remove READ_CONTACTS

# Auto-suggest permissions based on dependencies
fables permissions suggest
```

### ProGuard/R8 Configuration

```bash
# List available rule categories
fables proguard list

# Add rules for common libraries
fables proguard add flutter
fables proguard add firebase
fables proguard add gson
fables proguard add okhttp

# Show current rules
fables proguard show

# Validate configuration
fables proguard validate
```

### Device Logs & Debugging

```bash
# View all logs
fables logs

# Flutter-only logs
fables logs --flutter

# Filter by tag
fables logs --filter FlutterEngine

# Filter by level (V/D/I/W/E)
fables logs --level E

# Search for text
fables logs --search "error"

# Last 50 lines
fables logs --lines 50
```

### Version Management

```bash
# Show current version
fables release version

# Bump version
fables release bump patch    # 1.0.0 → 1.0.1
fables release bump minor    # 1.0.0 → 1.1.0
fables release bump major    # 1.0.0 → 2.0.0
fables release bump build    # 1.0.0+1 → 1.0.0+2

# Bump + create git tag
fables release bump minor --tag

# Bump + generate changelog
fables release bump patch --changelog

# Generate changelog from git history
fables release changelog
```

Updates version in:
- `pubspec.yaml`
- `android/app/build.gradle` (versionCode + versionName)
- `ios/Runner/Info.plist` (CFBundleVersion + CFBundleShortVersionString)

---

## 🤖 AI Agent Integration

Fables implements the **Model Context Protocol (MCP)**, making it compatible with every major AI coding assistant and agent framework.

### Supported Agents

| Category | Agents |
|---|---|
| **Editors & IDEs** | Claude Code, Cursor, VS Code/Copilot, Windsurf, Cline, Continue.dev, Aider, Zed, JetBrains |
| **AI Frameworks** | LangChain, CrewAI, AutoGen, Semantic Kernel, LlamaIndex, Haystack, OpenAI Agents, Google ADK, Amazon Bedrock |
| **Platforms** | OpenClaw, n8n, Dify, Coze, FastGPT, Flowise |
| **Generic** | Any MCP-compatible client |

### Setup Commands

```bash
# One command to configure any agent
fables mcp setup <agent>

# Examples:
fables mcp setup claude
fables mcp setup cursor
fables mcp setup langchain
fables mcp setup crewai

# List all available MCP tools
fables mcp tools

# Start MCP server
fables mcp serve --stdio    # For CLI agents
fables mcp serve --port 3000  # For remote agents
```

---

### OpenClaw

```bash
fables mcp setup openclaw
```

Creates `TOOLS.md` with Fables integration. Add to your OpenClaw workspace.

**Usage in OpenClaw:**
```
Build my Flutter app as an APK
→ OpenClaw calls fables_build tool with target: "apk"
```

---

### Claude Code

```bash
fables mcp setup claude
```

Creates `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "fables": {
      "command": "fables",
      "args": ["mcp", "serve", "--stdio"]
    }
  }
}
```

**Usage in Claude Code:**
```
User: "Build my Flutter app for Android release"
Claude: [calls fables_build with target: "apk", mode: "release"]
```

---

### Cursor

```bash
fables mcp setup cursor
```

Creates `.cursor/mcp.json`. Fables tools appear in Cursor's AI panel.

---

### VS Code / GitHub Copilot

```bash
fables mcp setup vscode
```

Creates `.vscode/mcp.json`. Works with GitHub Copilot Chat and VS Code extensions.

---

### Windsurf (Codeium)

```bash
fables mcp setup windsurf
```

Creates `.windsurf/mcp.json`.

---

### Cline

```bash
fables mcp setup cline
```

Creates `.cline/mcp.json`.

---

### Continue.dev

```bash
fables mcp setup continue
```

Creates `.continue/mcp.json` with stdio transport.

---

### Aider

```bash
fables mcp setup aider
```

Creates `.aider.conf.yml` with MCP server configuration.

---

### Zed Editor

```bash
fables mcp setup zed
```

Creates `.zed/settings.json`.

---

### JetBrains IDEs

```bash
fables mcp setup jetbrains
```

Creates `.idea/mcp.json` for IntelliJ, Android Studio, WebStorm, etc.

---

### LangChain

```bash
fables mcp setup langchain
```

Creates `langchain_mcp_config.json` for use with LangChain's MCP adapter.

**Python usage:**
```python
from langchain_mcp import MCPServer

server = MCPServer.from_config("langchain_mcp_config.json")
tools = server.get_tools()

# Use in LangChain agent
agent = create_react_agent(llm, tools)
agent.invoke({"input": "Build my Flutter app as an APK"})
```

---

### CrewAI

```bash
fables mcp setup crewai
```

Creates `crewai_mcp_config.json` with capabilities metadata.

**Python usage:**
```python
from crewai import Agent, Task, Crew
from crewai_tools import MCPServerToolKit

toolkit = MCPServerToolKit.from_config("crewai_mcp_config.json")

developer = Agent(
    role="Mobile Developer",
    goal="Build and deploy Flutter apps",
    tools=toolkit.get_tools(),
    backstory="Expert Flutter developer"
)

task = Task(
    description="Build the Flutter app as a release APK",
    agent=developer
)

crew = Crew(agents=[developer], tasks=[task])
crew.kickoff()
```

---

### AutoGen (Microsoft)

```bash
fables mcp setup autogen
```

Creates `autogen_mcp_config.json`.

---

### Semantic Kernel

```bash
fables mcp setup semantickernel
```

Creates `semantickernel_mcp.json`.

---

### LlamaIndex

```bash
fables mcp setup llamaindex
```

Creates `llamaindex_mcp.json`.

---

### Haystack (deepset)

```bash
fables mcp setup haystack
```

Creates `haystack_mcp.yaml`.

---

### OpenAI Agents SDK

```bash
fables mcp setup openai
```

Creates `openai_mcp_config.json`.

---

### Google ADK

```bash
fables mcp setup google
```

Creates `google_adk_mcp.json`.

---

### Amazon Bedrock

```bash
fables mcp setup bedrock
```

Creates `bedrock_mcp_config.json`.

---

### n8n

```bash
fables mcp setup n8n
```

Creates `n8n_mcp.json` for n8n workflow automation.

---

### Dify

```bash
fables mcp setup dify
```

Creates `dify_mcp.json`.

---

### Coze (ByteDance)

```bash
fables mcp setup coze
```

Creates `coze_mcp.json`.

---

### FastGPT

```bash
fables mcp setup fastgpt
```

Creates `fastgpt_mcp.json`.

---

### Flowise

```bash
fables mcp setup flowise
```

Creates `flowise_mcp.json`.

---

### Generic MCP Client

For any MCP-compatible client:

```bash
fables mcp setup generic
```

Creates `mcp_config.json` with standard MCP configuration.

---

### MCP Protocol Reference

**stdio Transport (for CLI agents):**
```bash
fables mcp serve --stdio
```

**HTTP/SSE Transport (for remote agents):**
```bash
fables mcp serve --port 3000 --host localhost
```

**Endpoints:**
- `GET /sse` — Server-Sent Events stream
- `POST /` — JSON-RPC requests

---

### MCP Tools Reference

| Tool | Description |
|---|---|
| `fables_init` | Initialize Fables in a Flutter project |
| `fables_build` | Build Flutter app (APK, AAB, iOS) |
| `fables_doctor` | Check build environment |
| `fables_analyze` | Analyze APK/AAB size |
| `fables_deploy` | Deploy APK to device |
| `fables_run` | Run app on device/emulator |
| `fables_test` | Run Flutter tests |
| `fables_logs` | View device logs |
| `fables_permissions` | Manage app permissions |
| `fables_manifest` | View/edit AndroidManifest.xml |
| `fables_deps` | Manage dependencies |
| `fables_i18n` | Internationalization |
| `fables_flavors` | Manage build flavors |
| `fables_config` | Get/set configuration |
| `fables_sign_generate` | Generate signing keystore |
| `fables_release` | Bump version |
| `fables_devices` | List connected devices |
| `fables_project_info` | Get project information |
| `fables_emulator` | Manage emulators |

---

## 🔧 CI/CD Integration

### GitHub Actions

```bash
fables ci generate github
```

Creates `.github/workflows/fables-build.yml` with:
- Android APK + AAB builds
- iOS build
- Size analysis
- Artifact uploads
- Manual dispatch with target selection

### GitLab CI

```bash
fables ci generate gitlab
```

Creates `.gitlab-ci.yml` with Docker-based builds.

### CircleCI

```bash
fables ci generate circleci
```

Creates `.circleci/config.yml` with multi-stage pipeline.

### Bitbucket Pipelines

```bash
fables ci generate bitbucket
```

Creates `bitbucket-pipelines.yml`.

---

## 🐳 Docker Support

Fables can auto-manage the Android SDK via Docker — no Android Studio needed:

```bash
# First build sets up Docker SDK (may take a few minutes)
fables build --target apk

# Subsequent builds are fast ⚡
```

**Docker image includes:**
- Ubuntu 22.04
- Java 17 (OpenJDK)
- Android SDK (API 34)
- Android Build Tools (34.0.0)
- Flutter SDK (stable)

---

## ⚙️ Configuration Reference

`.fables/fables.yaml`:

```yaml
name: my_app
version: 0.1.0

android:
  enabled: true
  targets:
    - apk
    - aab

ios:
  enabled: true

signing:
  autoSign: true

build:
  mode: release
  obfuscate: true
  splitDebugInfo: true

flavors:
  - name: dev
    appName: My App Dev
    bundleId: com.example.app.dev
    environment: dev
  - name: staging
    appName: My App Staging
    bundleId: com.example.app.staging
    environment: staging
  - name: prod
    appName: My App
    bundleId: com.example.app
    environment: production
```

---

## 📁 Project Structure

```
my_flutter_app/
├── .fables/
│   ├── fables.yaml          # Fables configuration
│   ├── keystores/           # Signing keystores (gitignored)
│   ├── profiles/            # Signing profiles (gitignored)
│   ├── secrets/             # Environment files (gitignored)
│   │   ├── development.env
│   │   ├── staging.env
│   │   └── production.env
│   └── .gitignore
├── lib/                     # Your Flutter code
├── pubspec.yaml
├── l10n.yaml                # i18n config (if initialized)
├── lib/l10n/                # Localization files (if initialized)
└── build/
    └── fables/              # Build output
        ├── app-release.apk
        ├── app-release.aab
        └── Runner.ipa
```

---

## 🧪 Testing

Fables has a comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npx jest --testNamePattern="fables mcp"
```

**Test coverage:**
- 50 test cases
- All 24 commands tested
- MCP tool handlers tested
- Error handling tested
- Edge cases covered

---

## 🤝 Contributing

Contributions welcome! 🎉

```bash
# 1. Fork the repo
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/fables.git

# 3. Install dependencies
cd fables && npm install

# 4. Create a branch
git checkout -b feature/amazing-feature

# 5. Make your changes
# 6. Run tests
npm test

# 7. Commit
git commit -m 'feat: add amazing feature'

# 8. Push
git push origin feature/amazing-feature

# 9. Open a PR 🎉
```

### Development

```bash
# Run locally
node bin/fables.js --help

# Run tests
npm test

# Watch mode
npx jest --watch
```

---

## 📄 License

MIT © Fables Contributors

---

<div align="center">

**📖 Fables — where every build is a happy ending. ✨**

[Report Bug](https://github.com/fables-cli/fables/issues) · [Request Feature](https://github.com/fables-cli/fables/issues) · [Discord](https://discord.gg/fables)

</div>
