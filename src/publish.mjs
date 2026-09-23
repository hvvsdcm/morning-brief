import { execFileSync } from 'node:child_process';

const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** 발행물(docs, data/editions)만 커밋하고 origin이 있으면 푸시한다. */
export function publish({ root, message }) {
  git(root, 'add', '--', 'docs', 'data/editions');
  const staged = git(root, 'diff', '--cached', '--name-only');
  if (staged) git(root, 'commit', '-m', message, '--', 'docs', 'data/editions');
  const remotes = git(root, 'remote');
  if (!remotes.split('\n').includes('origin')) return staged ? '커밋 완료 (origin 없음, 푸시 생략)' : '변경 없음 (origin 없음)';
  git(root, 'push', 'origin', 'HEAD');
  return staged ? '커밋·푸시 완료' : '변경 없음, 푸시 확인 완료';
}
