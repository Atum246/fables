/**
 * 🤖 fables mcp — AI Agent Integration (MCP Server)
 *
 * Exposes Fables as tools for AI agents like OpenClaw, Claude Code, Cursor, etc.
 * Implements the Model Context Protocol (MCP) for seamless agent integration.
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { showBanner } = require('../ui/banner');
const { log, infoBox, createTable, spinner, successSpinner, failSpinner } = require('../ui/components');

// ═══════════════════════════════════════
//  MCP TOOL DEFINITIONS
//  These are what AI agents see & call
// ═══════════════════════════════════════

const FABLES_TOOLS = [
  {
    name: 'fables_init',
    description: 'Initialize Fables in a Flutter project. Creates .fables/ config directory with fables.yaml.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to Flutter project (default: current directory)' },
        name: { type: 'string', description: 'Project name' },
        androidTargets: {
          type: 'array',
          items: { type: 'string', enum: ['apk', 'aab', 'split-apk'] },
          description: 'Android build targets',
          default: ['apk', 'aab'],
        },
        iosEnabled: { type: 'boolean', description: 'Enable iOS builds', default: true },
        obfuscate: { type: 'boolean', description: 'Enable code obfuscation', default: true },
      },
      required: [],
    },
  },
  {
    name: 'fables_build',
    description: 'Build a Flutter app to APK, AAB, or iOS. Handles signing, obfuscation, and optimization automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['apk', 'aab', 'ios', 'all'],
          description: 'Build target',
          default: 'all',
        },
        mode: {
          type: 'string',
          enum: ['release', 'profile', 'debug'],
          description: 'Build mode',
          default: 'release',
        },
        projectPath: { type: 'string', description: 'Path to Flutter project' },
        clean: { type: 'boolean', description: 'Clean before build', default: false },
        splitPerAbi: { type: 'boolean', description: 'Generate per-ABI APKs', default: false },
        flavor: { type: 'string', description: 'Build flavor' },
        dartDefines: { type: 'object', description: 'Dart defines as key-value pairs' },
        sign: { type: 'boolean', description: 'Sign the build', default: true },
        obfuscate: { type: 'boolean', description: 'Obfuscate code', default: true },
        outputDir: { type: 'string', description: 'Output directory', default: 'build/fables' },
      },
      required: [],
    },
  },
  {
    name: 'fables_doctor',
    description: 'Check the build environment. Reports Flutter SDK, Android SDK, Docker, Xcode, Java status.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['android', 'ios', 'all'],
          description: 'Platform to check',
          default: 'all',
        },
      },
      required: [],
    },
  },
  {
    name: 'fables_analyze',
    description: 'Analyze an APK or AAB file. Returns size breakdown, ABI info, resource counts, and optimization tips.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to APK/AAB file (auto-detected if omitted)' },
        deep: { type: 'boolean', description: 'Deep analysis with dependency breakdown', default: false },
      },
      required: [],
    },
  },
  {
    name: 'fables_deploy',
    description: 'Deploy an APK to a connected Android device via ADB.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to APK file' },
        deviceId: { type: 'string', description: 'Target device ID' },
        uninstallFirst: { type: 'boolean', description: 'Uninstall existing app first', default: false },
      },
      required: [],
    },
  },
  {
    name: 'fables_sign_generate',
    description: 'Generate a new Android signing keystore.',
    inputSchema: {
      type: 'object',
      properties: {
        alias: { type: 'string', description: 'Key alias name' },
        cn: { type: 'string', description: 'Certificate common name' },
        password: { type: 'string', description: 'Keystore password (min 6 chars)' },
      },
      required: ['alias', 'password'],
    },
  },
  {
    name: 'fables_config',
    description: 'Get or set Fables configuration values.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'show'], description: 'Config action' },
        key: { type: 'string', description: 'Config key (dot notation supported)' },
        value: { type: 'string', description: 'Value to set (for set action)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_release',
    description: 'Bump app version across pubspec.yaml, Android build.gradle, and iOS Info.plist.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['major', 'minor', 'patch', 'build'],
          description: 'Version bump type',
        },
        tag: { type: 'boolean', description: 'Create git tag', default: false },
        changelog: { type: 'boolean', description: 'Generate changelog', default: false },
      },
      required: ['type'],
    },
  },
  {
    name: 'fables_devices',
    description: 'List connected Android/iOS devices.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'fables_project_info',
    description: 'Get Flutter project information (name, version, dependencies, flavors).',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to Flutter project' },
      },
      required: [],
    },
  },
  {
    name: 'fables_run',
    description: 'Run Flutter app on a connected device or emulator.',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Target device ID' },
        flavor: { type: 'string', description: 'Build flavor' },
        mode: { type: 'string', enum: ['debug', 'profile', 'release'], description: 'Run mode' },
      },
      required: [],
    },
  },
  {
    name: 'fables_emulator',
    description: 'List or launch Android emulators.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'launch', 'running'], description: 'Emulator action' },
        name: { type: 'string', description: 'Emulator name to launch' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_test',
    description: 'Run Flutter tests with optional filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['unit', 'widget', 'integration', 'all'], description: 'Test type' },
        file: { type: 'string', description: 'Specific test file' },
        coverage: { type: 'boolean', description: 'Generate coverage report' },
        name: { type: 'string', description: 'Filter by test name pattern' },
      },
      required: [],
    },
  },
  {
    name: 'fables_logs',
    description: 'View device logs with filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Filter by tag' },
        level: { type: 'string', enum: ['V', 'D', 'I', 'W', 'E'], description: 'Log level' },
        search: { type: 'string', description: 'Search text' },
        flutter: { type: 'boolean', description: 'Only Flutter/Dart logs' },
      },
      required: [],
    },
  },
  {
    name: 'fables_permissions',
    description: 'Manage app permissions. List, add, remove, or suggest permissions.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'add', 'remove', 'suggest'], description: 'Permission action' },
        permission: { type: 'string', description: 'Permission name (for add/remove)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_manifest',
    description: 'View or edit AndroidManifest.xml.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['show', 'validate', 'set'], description: 'Manifest action' },
        attribute: { type: 'string', description: 'Attribute to set' },
        value: { type: 'string', description: 'Value to set' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_deps',
    description: 'Manage Flutter dependencies. List, audit, add, or remove packages.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'audit', 'add', 'remove', 'update'], description: 'Dependency action' },
        packages: { type: 'array', items: { type: 'string' }, description: 'Package names (for add/remove)' },
        dev: { type: 'boolean', description: 'Add as dev dependency' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_i18n',
    description: 'Internationalization helpers. Init, list, extract strings, or validate translations.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['init', 'list', 'extract', 'validate'], description: 'i18n action' },
        locales: { type: 'string', description: 'Comma-separated locales (for init)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fables_flavors',
    description: 'Manage build flavors (dev, staging, production).',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'init', 'build'], description: 'Flavor action' },
        flavor: { type: 'string', description: 'Flavor name (for build)' },
        target: { type: 'string', description: 'Build target' },
      },
      required: ['action'],
    },
  },
];

// ═══════════════════════════════════════
//  MCP SERVER
// ═══════════════════════════════════════

function mcpCommand(program) {
  const cmd = program.command('mcp').description('🤖 AI Agent integration (MCP)');

  // Show available tools
  cmd
    .command('tools')
    .description('List available MCP tools for AI agents')
    .action(() => {
      showBanner();
      log.chapter('MCP Tools for AI Agents 🤖');

      const table = createTable(['Tool', 'Description']);
      for (const tool of FABLES_TOOLS) {
        table.push([
          chalk.cyan.bold(tool.name),
          chalk.white(tool.description),
        ]);
      }
      console.log(table.toString());

      console.log(
        infoBox(
          '🔌 Integration Guide',
          [
            chalk.white.bold('OpenClaw:'),
            chalk.gray('  Add fables to your TOOLS.md:'),
            chalk.cyan('    fables mcp serve --stdio'),
            '',
            chalk.white.bold('Claude Code:'),
            chalk.gray('  Add to .claude/mcp.json:'),
            chalk.cyan('    { "fables": { "command": "fables", "args": ["mcp", "serve"] } }'),
            '',
            chalk.white.bold('Cursor:'),
            chalk.gray('  Add to .cursor/mcp.json:'),
            chalk.cyan('    { "fables": { "command": "fables", "args": ["mcp", "serve"] } }'),
            '',
            chalk.white.bold('Generic MCP Client:'),
            chalk.cyan('    fables mcp serve --stdio'),
            chalk.cyan('    fables mcp serve --port 3000'),
          ].join('\n')
        )
      );
    });

  // Start MCP server
  cmd
    .command('serve')
    .description('Start MCP server for AI agent communication')
    .option('--stdio', 'Use stdio transport (for CLI agents)')
    .option('--port <port>', 'HTTP port for SSE transport', '3000')
    .option('--host <host>', 'Bind host', 'localhost')
    .action(async (opts) => {
      if (opts.stdio) {
        await startStdioServer();
      } else {
        await startHttpServer(opts.port, opts.host);
      }
    });

  // Generate config files for popular AI tools
  cmd
    .command('setup <agent>')
    .description('Generate MCP config for 20+ AI agents')
    .action(async (agent) => {
      showBanner();
      log.chapter(`MCP Setup for ${agent} 🤖`);

      const fablesPath = process.argv[1] || 'fables';

      // ═══════════════════════════════════════
      //  ALL SUPPORTED AI AGENT CONFIGS
      // ═══════════════════════════════════════

      const mcpServerConfig = {
        command: fablesPath,
        args: ['mcp', 'serve', '--stdio'],
      };

      const configs = {
        // ── OpenClaw ──
        openclaw: {
          file: 'TOOLS.md',
          content: [
            '### Fables (Flutter Builds)',
            '',
            'Tool: `fables`',
            'Command: `fables mcp serve --stdio`',
            'Use: Build Flutter apps to APK/AAB/iOS without Android Studio',
            '',
            'Available MCP tools: init, build, doctor, analyze, deploy, run, test, logs, permissions, manifest, deps, i18n, flavors, release, config, sign, secrets, emulator, icon, splash, proguard',
          ].join('\n'),
        },

        // ── Claude Code / Anthropic ──
        claude: {
          file: '.claude/mcp.json',
          content: JSON.stringify({ mcpServers: { fables: mcpServerConfig } }, null, 2),
        },

        // ── Cursor ──
        cursor: {
          file: '.cursor/mcp.json',
          content: JSON.stringify({ mcpServers: { fables: mcpServerConfig } }, null, 2),
        },

        // ── VS Code (GitHub Copilot) ──
        vscode: {
          file: '.vscode/mcp.json',
          content: JSON.stringify({ servers: { fables: mcpServerConfig } }, null, 2),
        },

        // ── Windsurf (Codeium) ──
        windsurf: {
          file: '.windsurf/mcp.json',
          content: JSON.stringify({ mcpServers: { fables: mcpServerConfig } }, null, 2),
        },

        // ── Cline (VS Code extension) ──
        cline: {
          file: '.cline/mcp.json',
          content: JSON.stringify({ mcpServers: { fables: mcpServerConfig } }, null, 2),
        },

        // ── Continue.dev ──
        continue: {
          file: '.continue/mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Aider ──
        aider: {
          file: '.aider.conf.yml',
          content: `# Fables MCP for Aider
# Add to your Aider config or run:
# fables mcp serve --port 3000
# Then configure Aider to connect to http://localhost:3000

mcp-server: fables mcp serve --stdio
`,
        },

        // ── Zed Editor ──
        zed: {
          file: '.zed/settings.json',
          content: JSON.stringify({
            language_servers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── JetBrains AI Assistant ──
        jetbrains: {
          file: '.idea/mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── LangChain / LangGraph ──
        langchain: {
          file: 'langchain_mcp_config.json',
          content: JSON.stringify({
            servers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── CrewAI ──
        crewai: {
          file: 'crewai_mcp_config.json',
          content: JSON.stringify({
            mcp_servers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
                description: 'Flutter build tool — APK, AAB, iOS without Android Studio',
                capabilities: ['build', 'analyze', 'deploy', 'test', 'release'],
              },
            },
          }, null, 2),
        },

        // ── AutoGen (Microsoft) ──
        autogen: {
          file: 'autogen_mcp_config.json',
          content: JSON.stringify({
            mcp_servers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
                description: 'Build Flutter apps to APK/AAB/iOS',
              },
            },
          }, null, 2),
        },

        // ── Semantic Kernel (Microsoft) ──
        semantickernel: {
          file: 'semantickernel_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── LlamaIndex ──
        llamaindex: {
          file: 'llamaindex_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Haystack (deepset) ──
        haystack: {
          file: 'haystack_mcp.yaml',
          content: `# Fables MCP for Haystack
mcp_servers:
  fables:
    transport: stdio
    command: ${fablesPath}
    args: ["mcp", "serve", "--stdio"]
`,
        },

        // ── OpenAI Agents SDK ──
        openai: {
          file: 'openai_mcp_config.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Google ADK (Agent Development Kit) ──
        google: {
          file: 'google_adk_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Amazon Bedrock Agents ──
        bedrock: {
          file: 'bedrock_mcp_config.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── n8n (workflow automation) ──
        n8n: {
          file: 'n8n_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Dify ──
        dify: {
          file: 'dify_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Coze (ByteDance) ──
        coze: {
          file: 'coze_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── FastGPT ──
        fastgpt: {
          file: 'fastgpt_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Flowise ──
        flowise: {
          file: 'flowise_mcp.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },

        // ── Continue (generic) ──
        generic: {
          file: 'mcp_config.json',
          content: JSON.stringify({
            mcpServers: {
              fables: {
                transport: 'stdio',
                command: fablesPath,
                args: ['mcp', 'serve', '--stdio'],
              },
            },
          }, null, 2),
        },
      };

      const config = configs[agent.toLowerCase()];
      if (!config) {
        log.error(`Unknown agent: ${agent}`);
        log.info('');
        log.info(chalk.hex('#F7C948').bold('Supported agents:'));
        log.info('');
        log.info(chalk.white.bold('  Editors & IDEs:'));
        log.info('    claude, cursor, vscode, windsurf, cline, continue, aider, zed, jetbrains');
        log.info('');
        log.info(chalk.white.bold('  AI Frameworks:'));
        log.info('    langchain, crewai, autogen, semantickernel, llamaindex, haystack, openai, google, bedrock');
        log.info('');
        log.info(chalk.white.bold('  Platforms:'));
        log.info('    openclaw, n8n, dify, coze, fastgpt, flowise');
        log.info('');
        log.info(chalk.white.bold('  Generic:'));
        log.info('    generic — standard MCP config for any client');
        process.exit(1);
      }

      const sp = spinner(`Creating ${config.file}... 📝`);
      await fs.ensureDir(path.dirname(config.file));
      await fs.writeFile(config.file, config.content);
      successSpinner(sp, `Config written to ${chalk.cyan(config.file)}! 🎉`);

      console.log(
        infoBox(
          `🤖 ${agent} Ready!`,
          [
            chalk.white('Config: ') + chalk.cyan(config.file),
            chalk.white('Tools:  ') + chalk.cyan(FABLES_TOOLS.length + ' available'),
            '',
            chalk.hex('#F7C948')('The AI agent can now:'),
            ...FABLES_TOOLS.slice(0, 8).map((t) => chalk.white('  ✅ ') + chalk.gray(t.name.replace('fables_', ''))),
            chalk.white('  ✅ ') + chalk.gray(`... and ${FABLES_TOOLS.length - 8} more`),
            '',
            chalk.hex('#F7C948')('Start MCP server:'),
            chalk.cyan('  fables mcp serve --stdio'),
            chalk.cyan('  fables mcp serve --port 3000'),
          ].join('\n')
        )
      );
    });
}

// ═══════════════════════════════════════
//  STDIO MCP SERVER (for CLI agents)
// ═══════════════════════════════════════

async function startStdioServer() {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendResponse = (id, result) => {
    const response = { jsonrpc: '2.0', id, result };
    process.stdout.write(JSON.stringify(response) + '\n');
  };

  const sendError = (id, code, message) => {
    const response = { jsonrpc: '2.0', id, error: { code, message } };
    process.stdout.write(JSON.stringify(response) + '\n');
  };

  // Log to stderr so it doesn't interfere with protocol
  const logStderr = (msg) => process.stderr.write(msg + '\n');

  logStderr('📖 Fables MCP Server started (stdio)');

  rl.on('line', async (line) => {
    let request;
    try {
      request = JSON.parse(line);
    } catch {
      return;
    }

    const { id, method, params } = request;

    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'fables', version: '0.1.0' },
        });
        break;

      case 'tools/list':
        sendResponse(id, { tools: FABLES_TOOLS });
        break;

      case 'tools/call':
        try {
          const result = await handleToolCall(params.name, params.arguments || {});
          sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        } catch (err) {
          sendError(id, -32000, err.message);
        }
        break;

      case 'notifications/initialized':
        // Client ack, no response needed
        break;

      default:
        if (id !== undefined) {
          sendError(id, -32601, `Unknown method: ${method}`);
        }
    }
  });

  rl.on('close', () => {
    logStderr('📖 Fables MCP Server stopped');
    process.exit(0);
  });
}

// ═══════════════════════════════════════
//  HTTP MCP SERVER (for remote agents)
// ═══════════════════════════════════════

async function startHttpServer(port, host) {
  const http = require('http');

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/sse') {
      // SSE endpoint for MCP
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      res.write(`data: ${JSON.stringify({ tools: FABLES_TOOLS })}\n\n`);

      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);

      req.on('close', () => clearInterval(keepAlive));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const request = JSON.parse(body);
          const { id, method, params } = request;

          let result;
          switch (method) {
            case 'tools/list':
              result = { tools: FABLES_TOOLS };
              break;
            case 'tools/call':
              result = { content: [{ type: 'text', text: JSON.stringify(await handleToolCall(params.name, params.arguments || {}), null, 2) }] };
              break;
            default:
              result = { error: `Unknown method: ${method}` };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32000, message: err.message } }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(parseInt(port), host, () => {
    console.log(
      infoBox(
        '🤖 Fables MCP Server',
        [
          chalk.white('URL:   ') + chalk.cyan(`http://${host}:${port}`),
          chalk.white('SSE:   ') + chalk.cyan(`http://${host}:${port}/sse`),
          chalk.white('Tools: ') + chalk.cyan(`${FABLES_TOOLS.length} available`),
          '',
          chalk.hex('#F7C948')('Ready for AI agent connections! 🔌'),
        ].join('\n')
      )
    );
  });
}

// ═══════════════════════════════════════
//  TOOL HANDLER
// ═══════════════════════════════════════

async function handleToolCall(toolName, args) {
  const { execa } = require('execa');
  const yaml = require('yaml');

  switch (toolName) {
    case 'fables_init': {
      const projectDir = args.projectPath || process.cwd();
      const fablesDir = path.join(projectDir, '.fables');
      await fs.ensureDir(fablesDir);

      const config = {
        name: args.name || path.basename(projectDir),
        version: '0.1.0',
        android: { enabled: true, targets: args.androidTargets || ['apk', 'aab'] },
        ios: { enabled: args.iosEnabled !== false },
        signing: { autoSign: true },
        build: { obfuscate: args.obfuscate !== false },
      };

      await fs.writeFile(path.join(fablesDir, 'fables.yaml'), yaml.stringify(config));
      return { success: true, configPath: path.join(fablesDir, 'fables.yaml'), config };
    }

    case 'fables_build': {
      const buildArgs = ['build'];
      if (args.target) buildArgs.push('--target', args.target);
      if (args.mode) buildArgs.push('--mode', args.mode);
      if (args.clean) buildArgs.push('--clean');
      if (args.splitPerAbi) buildArgs.push('--split-per-abi');
      if (args.flavor) buildArgs.push('--flavor', args.flavor);
      if (args.sign === false) buildArgs.push('--no-sign');
      if (args.obfuscate === false) buildArgs.push('--no-obfuscate');
      if (args.outputDir) buildArgs.push('--output', args.outputDir);
      buildArgs.push('--yes');

      if (args.dartDefines) {
        for (const [key, value] of Object.entries(args.dartDefines)) {
          buildArgs.push('--dart-define', `${key}=${value}`);
        }
      }

      const { stdout, stderr } = await execa('fables', buildArgs, { reject: false, all: true });
      return { success: true, output: stdout + stderr };
    }

    case 'fables_doctor': {
      const { stdout } = await execa('fables', ['doctor'], { reject: false, all: true });
      return { success: true, output: stdout };
    }

    case 'fables_analyze': {
      const analyzeArgs = ['analyze'];
      if (args.path) analyzeArgs.push(args.path);
      if (args.deep) analyzeArgs.push('--deep');

      const { stdout } = await execa('fables', analyzeArgs, { reject: false, all: true });
      return { success: true, output: stdout };
    }

    case 'fables_deploy': {
      const deployArgs = ['deploy'];
      if (args.path) deployArgs.push(args.path);
      if (args.deviceId) deployArgs.push('--device', args.deviceId);
      if (args.uninstallFirst) deployArgs.push('--uninstall-first');

      const { stdout } = await execa('fables', deployArgs, { reject: false, all: true });
      return { success: true, output: stdout };
    }

    case 'fables_sign_generate': {
      const signArgs = ['sign', 'generate', '--name', args.alias];
      const { stdout } = await execa('fables', signArgs, { reject: false, all: true });
      return { success: true, output: stdout };
    }

    case 'fables_config': {
      // Use config service directly instead of shelling out
      const configService = require('../services/config');
      const origCwd = process.cwd();
      if (args.projectPath) process.chdir(args.projectPath);
      try {
        if (args.action === 'show' || args.action === 'get') {
          const config = await configService.loadConfig();
          if (!config) return { success: false, error: 'No config found. Run fables init first.' };
          return { success: true, config };
        } else if (args.action === 'set') {
          const config = await configService.loadConfig();
          if (!config) return { success: false, error: 'No config found. Run fables init first.' };
          const keys = args.key.split('.');
          let obj = config;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
          }
          let parsedValue = args.value;
          if (args.value === 'true') parsedValue = true;
          else if (args.value === 'false') parsedValue = false;
          else if (!isNaN(args.value) && args.value.trim() !== '') parsedValue = Number(args.value);
          else if ((args.value.startsWith('[') && args.value.endsWith(']')) || (args.value.startsWith('{') && args.value.endsWith('}'))) {
            try { parsedValue = JSON.parse(args.value); } catch { /* keep as string */ }
          }
          obj[keys[keys.length - 1]] = parsedValue;
          await configService.saveConfig(config);
          return { success: true, key: args.key, value: parsedValue };
        }
        return { success: false, error: 'Unknown config action' };
      } finally {
        process.chdir(origCwd);
      }
    }

    case 'fables_release': {
      const releaseArgs = ['release', 'bump', args.type];
      if (args.tag) releaseArgs.push('--tag');
      if (args.changelog) releaseArgs.push('--changelog');

      const { stdout } = await execa('fables', releaseArgs, { reject: false, all: true });
      return { success: true, output: stdout };
    }

    case 'fables_devices': {
      const { stdout } = await execa('adb', ['devices', '-l'], { reject: false });
      return { success: true, output: stdout };
    }

    case 'fables_project_info': {
      const projectDir = args.projectPath || process.cwd();
      const pubspecPath = path.join(projectDir, 'pubspec.yaml');

      if (!(await fs.pathExists(pubspecPath))) {
        return { success: false, error: 'No pubspec.yaml found' };
      }

      const pubspec = yaml.parse(await fs.readFile(pubspecPath, 'utf8'));
      return {
        success: true,
        name: pubspec.name,
        version: pubspec.version,
        description: pubspec.description,
        dependencies: Object.keys(pubspec.dependencies || {}),
        devDependencies: Object.keys(pubspec.devDependencies || {}),
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

module.exports = { mcpCommand, FABLES_TOOLS, handleToolCall };
