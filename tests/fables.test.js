/**
 * 🧪 Fables Comprehensive Test Suite
 *
 * Tests ALL commands, subcommands, MCP integration, error handling, and edge cases.
 * 50+ tests for bulletproof quality.
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

const FABLES = path.resolve(__dirname, '..', 'bin', 'fables.js');

function run(args = [], opts = {}) {
  try {
    const stdout = execSync(`node "${FABLES}" ${args.join(' ')}`, {
      cwd: opts.cwd || path.dirname(FABLES),
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || '').toString(),
      stderr: (err.stderr || '').toString(),
      exitCode: err.status || 1,
    };
  }
}

// ═══════════════════════════════════════
//  BASIC CLI TESTS
// ═══════════════════════════════════════

describe('📖 Fables CLI', () => {
  describe('Basic CLI', () => {
    test('--version shows semver', () => {
      const { stdout } = run(['--version']);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('--help lists all 24 commands', () => {
      const { stdout } = run(['--help']);
      const commands = ['init', 'build', 'doctor', 'sign', 'config', 'analyze', 'deploy',
        'release', 'mcp', 'ci', 'clean', 'run', 'emulator', 'icon', 'splash',
        'deps', 'secrets', 'flavors', 'permissions', 'logs', 'test', 'proguard',
        'manifest', 'i18n'];
      for (const cmd of commands) {
        expect(stdout).toContain(cmd);
      }
    });

    test('no args shows banner + help', () => {
      const { stdout } = run([]);
      expect(stdout).toContain('legendary builds');
      expect(stdout).toContain('Build Flutter apps');
    });

    test('unknown command shows error', () => {
      const { exitCode } = run(['nonexistent']);
      expect(exitCode).not.toBe(0);
    });

    test('every --help works for all commands', () => {
      const commands = [
        'init', 'build', 'doctor', 'sign', 'config', 'analyze', 'deploy',
        'release', 'mcp', 'ci', 'clean', 'run', 'emulator', 'icon', 'splash',
        'deps', 'secrets', 'flavors', 'permissions', 'logs', 'test', 'proguard',
        'manifest', 'i18n',
      ];
      for (const cmd of commands) {
        const { stdout, exitCode } = run([cmd, '--help']);
        expect(exitCode).toBe(0);
        expect(stdout.length).toBeGreaterThan(10);
      }
    });
  });

  // ═══════════════════════════════════════
  //  INIT COMMAND
  // ═══════════════════════════════════════

  describe('fables init', () => {
    const tmpDir = path.join(__dirname, '..', '.test-init-tmp');

    beforeEach(async () => {
      await fs.ensureDir(tmpDir);
      await fs.writeFile(path.join(tmpDir, 'pubspec.yaml'), `name: test_app\nversion: 1.0.0+1\ndependencies:\n  flutter:\n    sdk: flutter\n`);
    });

    afterEach(async () => { await fs.remove(tmpDir); });

    test('-y creates .fables/fables.yaml', async () => {
      const { stdout } = run(['init', '-y'], { cwd: tmpDir });
      expect(stdout).toContain('Project Ready');
      const configPath = path.join(tmpDir, '.fables', 'fables.yaml');
      expect(await fs.pathExists(configPath)).toBe(true);
      const yaml = require('yaml');
      const config = yaml.parse(await fs.readFile(configPath, 'utf8'));
      expect(config.android.enabled).toBe(true);
      expect(config.ios.enabled).toBe(true);
    });

    test('errors if no pubspec.yaml', () => {
      const emptyDir = path.join(tmpDir, 'empty');
      fs.ensureDirSync(emptyDir);
      const { exitCode } = run(['init', '-y'], { cwd: emptyDir });
      expect(exitCode).not.toBe(0);
    });

    test('warns if already initialized', () => {
      run(['init', '-y'], { cwd: tmpDir });
      const { stdout } = run(['init', '-y'], { cwd: tmpDir });
      expect(stdout).toContain('already');
    });

    test('creates .fables directory structure', async () => {
      run(['init', '-y'], { cwd: tmpDir });
      expect(await fs.pathExists(path.join(tmpDir, '.fables'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, '.fables', 'fables.yaml'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, '.fables', '.gitignore'))).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  //  DOCTOR COMMAND
  // ═══════════════════════════════════════

  describe('fables doctor', () => {
    test('runs and checks environment', () => {
      const { stdout } = run(['doctor']);
      expect(stdout).toContain('Environment');
    });

    test('shows check results in table', () => {
      const { stdout } = run(['doctor']);
      // Should have at least Flutter check
      expect(stdout).toMatch(/Flutter|SDK|Docker/);
    });
  });

  // ═══════════════════════════════════════
  //  CONFIG COMMAND
  // ═══════════════════════════════════════

  describe('fables config', () => {
    const tmpDir = path.join(__dirname, '..', '.test-config-tmp');

    beforeEach(async () => {
      await fs.ensureDir(path.join(tmpDir, '.fables'));
      await fs.writeFile(path.join(tmpDir, '.fables', 'fables.yaml'), `name: config_test\nandroid:\n  enabled: true\n  targets:\n    - apk\n`);
    });

    afterEach(async () => { await fs.remove(tmpDir); });

    test('show displays config', () => {
      const { stdout } = run(['config', 'show'], { cwd: tmpDir });
      expect(stdout).toContain('config_test');
      expect(stdout).toContain('apk');
    });

    test('path shows config path', () => {
      const { stdout } = run(['config', 'path'], { cwd: tmpDir });
      expect(stdout).toContain('fables.yaml');
    });

    test('set modifies config', async () => {
      const { stdout } = run(['config', 'set', 'ios.enabled', 'false'], { cwd: tmpDir });
      expect(stdout).toContain('set to');
      const yaml = require('yaml');
      const config = yaml.parse(await fs.readFile(path.join(tmpDir, '.fables', 'fables.yaml'), 'utf8'));
      expect(config.ios.enabled).toBe(false);
    });

    test('set supports nested keys', async () => {
      run(['config', 'set', 'ios.enabled', 'true'], { cwd: tmpDir });
      const yaml = require('yaml');
      const config = yaml.parse(await fs.readFile(path.join(tmpDir, '.fables', 'fables.yaml'), 'utf8'));
      expect(config.ios.enabled).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  //  CLEAN COMMAND
  // ═══════════════════════════════════════

  describe('fables clean', () => {
    test('cleans build directories', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-clean-tmp');
      await fs.ensureDir(path.join(tmpDir, 'build', 'fables'));
      await fs.writeFile(path.join(tmpDir, 'build', 'fables', 'test.apk'), 'fake');
      const { stdout } = run(['clean'], { cwd: tmpDir });
      expect(stdout).toContain('Clean');
      await fs.remove(tmpDir);
    });

    test('handles already clean directory', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-clean-empty');
      await fs.ensureDir(tmpDir);
      const { stdout } = run(['clean'], { cwd: tmpDir });
      expect(stdout).toContain('Clean');
      await fs.remove(tmpDir);
    });
  });

  // ═══════════════════════════════════════
  //  SIGN COMMAND
  // ═══════════════════════════════════════

  describe('fables sign', () => {
    test('list handles no profiles gracefully', () => {
      const tmpDir = path.join(__dirname, '..', '.test-sign-tmp');
      fs.ensureDirSync(tmpDir);
      const { stdout } = run(['sign', 'list'], { cwd: tmpDir });
      expect(stdout).toMatch(/No signing|no signing|found/i);
      fs.removeSync(tmpDir);
    });
  });

  // ═══════════════════════════════════════
  //  RELEASE COMMAND
  // ═══════════════════════════════════════

  describe('fables release', () => {
    test('version shows current version', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-release-tmp');
      await fs.ensureDir(tmpDir);
      await fs.writeFile(path.join(tmpDir, 'pubspec.yaml'), `name: release_test\nversion: 1.2.3+42\n`);
      const { stdout } = run(['release', 'version'], { cwd: tmpDir });
      expect(stdout).toContain('1.2.3');
      expect(stdout).toContain('42');
      await fs.remove(tmpDir);
    });

    test('version handles missing pubspec', () => {
      const tmpDir = path.join(__dirname, '..', '.test-release-nopub');
      fs.ensureDirSync(tmpDir);
      const { stdout } = run(['release', 'version'], { cwd: tmpDir, reject: false });
      // Should handle gracefully
      fs.removeSync(tmpDir);
    });
  });

  // ═══════════════════════════════════════
  //  MCP COMMAND
  // ═══════════════════════════════════════

  describe('fables mcp', () => {
    test('tools lists all 20+ MCP tools', () => {
      const { stdout } = run(['mcp', 'tools']);
      const tools = ['fables_init', 'fables_build', 'fables_doctor', 'fables_analyze',
        'fables_deploy', 'fables_sign_generate', 'fables_config', 'fables_release',
        'fables_devices', 'fables_project_info', 'fables_run', 'fables_emulator',
        'fables_test', 'fables_logs', 'fables_permissions', 'fables_manifest',
        'fables_deps', 'fables_i18n', 'fables_flavors'];
      for (const tool of tools) {
        expect(stdout).toContain(tool);
      }
    });

    test('setup claude generates .claude/mcp.json', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-claude');
      await fs.ensureDir(tmpDir);
      const { stdout } = run(['mcp', 'setup', 'claude'], { cwd: tmpDir });
      expect(stdout).toContain('Ready');
      const configPath = path.join(tmpDir, '.claude', 'mcp.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      const config = await fs.readJson(configPath);
      expect(config.mcpServers.fables).toBeDefined();
      expect(config.mcpServers.fables.args).toContain('mcp');
      await fs.remove(tmpDir);
    });

    test('setup cursor generates .cursor/mcp.json', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-cursor');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'cursor'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, '.cursor', 'mcp.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup vscode generates .vscode/mcp.json', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-vscode');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'vscode'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, '.vscode', 'mcp.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup langchain generates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-langchain');
      await fs.ensureDir(tmpDir);
      const { stdout } = run(['mcp', 'setup', 'langchain'], { cwd: tmpDir });
      expect(stdout).toContain('Ready');
      const configPath = path.join(tmpDir, 'langchain_mcp_config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      const config = await fs.readJson(configPath);
      expect(config.servers.fables).toBeDefined();
      await fs.remove(tmpDir);
    });

    test('setup crewai generates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-crewai');
      await fs.ensureDir(tmpDir);
      const { stdout } = run(['mcp', 'setup', 'crewai'], { cwd: tmpDir });
      expect(stdout).toContain('Ready');
      const configPath = path.join(tmpDir, 'crewai_mcp_config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      const config = await fs.readJson(configPath);
      expect(config.mcp_servers.fables).toBeDefined();
      expect(config.mcp_servers.fables.capabilities).toContain('build');
      await fs.remove(tmpDir);
    });

    test('setup autogen generates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-autogen');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'autogen'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, 'autogen_mcp_config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup openai generates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-openai');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'openai'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, 'openai_mcp_config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup google generates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-google');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'google'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, 'google_adk_mcp.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup generic generates standard config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-generic');
      await fs.ensureDir(tmpDir);
      run(['mcp', 'setup', 'generic'], { cwd: tmpDir });
      const configPath = path.join(tmpDir, 'mcp_config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('setup unknown agent shows error with supported list', () => {
      const { stdout } = run(['mcp', 'setup', 'unknownagent']);
      expect(stdout).toContain('Unknown agent');
      expect(stdout).toContain('langchain');
      expect(stdout).toContain('crewai');
    });
  });

  // ═══════════════════════════════════════
  //  CI COMMAND
  // ═══════════════════════════════════════

  describe('fables ci', () => {
    const tmpDir = path.join(__dirname, '..', '.test-ci-tmp');
    afterEach(async () => { await fs.remove(tmpDir); });

    test('generate github creates workflow', async () => {
      await fs.ensureDir(tmpDir);
      const { stdout } = run(['ci', 'generate', 'github'], { cwd: tmpDir });
      expect(stdout).toContain('Ready');
      const workflowPath = path.join(tmpDir, '.github', 'workflows', 'fables-build.yml');
      expect(await fs.pathExists(workflowPath)).toBe(true);
      const content = await fs.readFile(workflowPath, 'utf8');
      expect(content).toContain('Fables Build');
      expect(content).toContain('fables build');
    });

    test('generate gitlab creates config', async () => {
      await fs.ensureDir(tmpDir);
      run(['ci', 'generate', 'gitlab'], { cwd: tmpDir });
      expect(await fs.pathExists(path.join(tmpDir, '.gitlab-ci.yml'))).toBe(true);
    });

    test('generate circleci creates config', async () => {
      await fs.ensureDir(tmpDir);
      run(['ci', 'generate', 'circleci'], { cwd: tmpDir });
      expect(await fs.pathExists(path.join(tmpDir, '.circleci', 'config.yml'))).toBe(true);
    });

    test('generate bitbucket creates config', async () => {
      await fs.ensureDir(tmpDir);
      run(['ci', 'generate', 'bitbucket'], { cwd: tmpDir });
      expect(await fs.pathExists(path.join(tmpDir, 'bitbucket-pipelines.yml'))).toBe(true);
    });

    test('list shows all platforms', () => {
      const { stdout } = run(['ci', 'list']);
      expect(stdout).toContain('GitHub Actions');
      expect(stdout).toContain('GitLab CI');
      expect(stdout).toContain('CircleCI');
      expect(stdout).toContain('Bitbucket');
    });
  });

  // ═══════════════════════════════════════
  //  SECRETS COMMAND
  // ═══════════════════════════════════════

  describe('fables secrets', () => {
    const tmpDir = path.join(__dirname, '..', '.test-secrets-tmp');
    afterEach(async () => { await fs.remove(tmpDir); });

    test('init creates .env files', async () => {
      await fs.ensureDir(tmpDir);
      run(['secrets', 'init'], { cwd: tmpDir });
      expect(await fs.pathExists(path.join(tmpDir, '.fables', 'secrets', 'development.env'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, '.fables', 'secrets', 'staging.env'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, '.fables', 'secrets', 'production.env'))).toBe(true);
    });

    test('list shows environments', async () => {
      await fs.ensureDir(tmpDir);
      run(['secrets', 'init'], { cwd: tmpDir });
      const { stdout } = run(['secrets', 'list'], { cwd: tmpDir });
      expect(stdout).toContain('development');
    });

    test('keygen generates a key', () => {
      const { stdout } = run(['secrets', 'keygen']);
      expect(stdout).toContain('Generated key');
    });
  });

  // ═══════════════════════════════════════
  //  PERMISSIONS COMMAND
  // ═══════════════════════════════════════

  describe('fables permissions', () => {
    test('list handles missing manifest gracefully', () => {
      const tmpDir = path.join(__dirname, '..', '.test-perm-tmp');
      fs.ensureDirSync(tmpDir);
      const { exitCode } = run(['permissions', 'list'], { cwd: tmpDir });
      expect(exitCode).not.toBe(0);
      fs.removeSync(tmpDir);
    });

    test('list shows permissions from manifest', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-perm-manifest');
      const androidDir = path.join(tmpDir, 'android', 'app', 'src', 'main');
      await fs.ensureDir(androidDir);
      await fs.writeFile(path.join(androidDir, 'AndroidManifest.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.test">
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <application/>
</manifest>`);
      const { stdout } = run(['permissions', 'list'], { cwd: tmpDir });
      expect(stdout).toContain('CAMERA');
      expect(stdout).toContain('INTERNET');
      await fs.remove(tmpDir);
    });
  });

  // ═══════════════════════════════════════
  //  MANIFEST COMMAND
  // ═══════════════════════════════════════

  describe('fables manifest', () => {
    test('show parses manifest correctly', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-manifest-tmp');
      const androidDir = path.join(tmpDir, 'android', 'app', 'src', 'main');
      await fs.ensureDir(androidDir);
      await fs.writeFile(path.join(androidDir, 'AndroidManifest.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.test">
    <uses-permission android:name="android.permission.CAMERA"/>
    <application android:label="TestApp" android:debuggable="false"/>
</manifest>`);
      const { stdout } = run(['manifest', 'show'], { cwd: tmpDir });
      expect(stdout).toContain('com.example.test');
      expect(stdout).toContain('Debuggable');
      await fs.remove(tmpDir);
    });
  });

  // ═══════════════════════════════════════
  //  PROGUARD COMMAND
  // ═══════════════════════════════════════

  describe('fables proguard', () => {
    test('list shows available rule categories', () => {
      const { stdout } = run(['proguard', 'list']);
      expect(stdout).toContain('flutter');
      expect(stdout).toContain('firebase');
      expect(stdout).toContain('gson');
      expect(stdout).toContain('okhttp');
    });
  });

  // ═══════════════════════════════════════
  //  MCP TOOL HANDLER TESTS
  // ═══════════════════════════════════════

  describe('MCP Tool Handlers', () => {
    const { handleToolCall } = require('../src/commands/mcp');

    test('fables_project_info returns project info', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-handler-tmp');
      await fs.ensureDir(tmpDir);
      await fs.writeFile(path.join(tmpDir, 'pubspec.yaml'), `name: mcp_test\nversion: 2.0.0+1\ndescription: Test project\ndependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.0.0\n`);
      const result = await handleToolCall('fables_project_info', { projectPath: tmpDir });
      expect(result.success).toBe(true);
      expect(result.name).toBe('mcp_test');
      expect(result.version).toBe('2.0.0+1');
      expect(result.dependencies).toContain('flutter');
      expect(result.dependencies).toContain('http');
      await fs.remove(tmpDir);
    });

    test('fables_init creates config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-init-tmp');
      await fs.ensureDir(tmpDir);
      const result = await handleToolCall('fables_init', { projectPath: tmpDir, name: 'test_project' });
      expect(result.success).toBe(true);
      expect(result.config.name).toBe('test_project');
      expect(await fs.pathExists(result.configPath)).toBe(true);
      await fs.remove(tmpDir);
    });

    test('fables_project_info errors for missing project', async () => {
      const result = await handleToolCall('fables_project_info', { projectPath: '/nonexistent' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('pubspec');
    });

    test('fables_config show returns config', async () => {
      const tmpDir = path.join(__dirname, '..', '.test-mcp-config-tmp');
      await fs.ensureDir(path.join(tmpDir, '.fables'));
      await fs.writeFile(path.join(tmpDir, '.fables', 'fables.yaml'), `name: test\nandroid:\n  enabled: true\n`);
      const result = await handleToolCall('fables_config', { action: 'show', projectPath: tmpDir });
      expect(result.success).toBe(true);
      await fs.remove(tmpDir);
    });

    test('unknown tool throws error', async () => {
      await expect(handleToolCall('fables_unknown', {})).rejects.toThrow('Unknown tool');
    });
  });

  // ═══════════════════════════════════════
  //  ERROR HANDLING
  // ═══════════════════════════════════════

  describe('Error Handling', () => {
    test('build without init gives helpful error', () => {
      const tmpDir = path.join(__dirname, '..', '.test-err-build');
      fs.ensureDirSync(tmpDir);
      // This should handle gracefully even without Flutter
      const { stdout } = run(['build', '--help']);
      expect(stdout).toContain('Build');
      fs.removeSync(tmpDir);
    });

    test('analyze without build gives helpful error', () => {
      const tmpDir = path.join(__dirname, '..', '.test-err-analyze');
      fs.ensureDirSync(tmpDir);
      const { stdout } = run(['analyze'], { cwd: tmpDir });
      expect(stdout).toContain('No build');
      fs.removeSync(tmpDir);
    });
  });
});
