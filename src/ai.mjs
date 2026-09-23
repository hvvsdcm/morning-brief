import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function claudeBinary() {
  if (process.env.MORNING_BRIEF_CLAUDE) return process.env.MORNING_BRIEF_CLAUDE;
  // 작업 스케줄러는 PATH가 짧을 수 있어 기본 설치 위치를 먼저 본다.
  const local = join(homedir(), '.local', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude');
  return existsSync(local) ? local : 'claude';
}

/**
 * claude CLI를 도구 없이 1회 실행하고 스키마로 검증된 JSON을 돌려준다.
 * --safe-mode: 사용자 CLAUDE.md·플러그인·훅이 신문 편집에 끼어들지 않게 한다.
 */
export function runClaude({ system, prompt, schema, timeoutMs = 20 * 60_000 }) {
  const args = [
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(schema),
    '--system-prompt', system,
    '--tools', '',
    '--safe-mode',
    '--no-session-persistence',
  ];
  if (process.env.MORNING_BRIEF_MODEL) args.push('--model', process.env.MORNING_BRIEF_MODEL);
  if (process.env.MORNING_BRIEF_EFFORT) args.push('--effort', process.env.MORNING_BRIEF_EFFORT);

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBinary(), args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude 응답 시간 초과(${Math.round(timeoutMs / 60000)}분)`));
    }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`claude 실행 실패: ${e.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      let res;
      try {
        res = JSON.parse(out);
      } catch {
        return reject(new Error(`claude 출력이 JSON이 아님 (exit ${code}): ${(err || out).slice(0, 500)}`));
      }
      if (res.is_error || !res.structured_output) {
        return reject(new Error(`claude 오류 (${res.subtype ?? 'unknown'}): ${String(res.result ?? err).slice(0, 500)}`));
      }
      resolve({ output: res.structured_output, meta: { model: Object.keys(res.modelUsage ?? {})[0] ?? null, durationMs: res.duration_ms } });
    });
    child.stdin.end(prompt);
  });
}
