// ─────────────────────────────────────────────────────────────────────────────
// The §2 table of docs/ai-workflow.md, printed from the git history.
//
// Why: every number about this project's history has to print the command that
// reproduces it (CLAUDE.md O8). Written by hand, that table goes stale in a
// week — the one in §2 was a snapshot of commit b141722 (2026-10-24) and was
// ~230 commits behind by 2026-11-18. So the table is generated, and §2 says
// which commit it was generated at.
//
//   node scripts/history-numbers.mjs              (markdown for §2, on HEAD)
//   node scripts/history-numbers.mjs --ref main
//
// Reads nothing but `git log`. No npm dependency.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process'

const arg = (name, fallback = null) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const REF = arg('ref', 'HEAD')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const count = (...args) => Number(git('rev-list', '--count', ...args, REF))

// One record per non-merge commit: sha, author date, subject, co-author trailers.
const UNIT = '\u001f'
const RECORD = '\u001e'
const commits = git(
  'log',
  '--no-merges',
  '--date=short',
  `--format=%H${UNIT}%ad${UNIT}%s${UNIT}%(trailers:key=Co-Authored-By,valueonly,separator=%x1f)${RECORD}`,
  REF,
)
  .split(RECORD)
  .map((record) => record.replace(/^\n/, ''))
  .filter(Boolean)
  .map((record) => {
    const [sha, date, subject, ...trailers] = record.split(UNIT)
    return { sha, date, subject, trailers: trailers.filter(Boolean) }
  })

const total = count()
const nonMerge = count('--no-merges')
const merges = count('--merges')

// Pull requests are counted from the history, not from the GitHub API, so the
// number reproduces in a clone. Two shapes exist, and counting only the first
// undercounts by 4: a merge commit naming the pull request, and a squashed
// commit whose subject ends in "(#N)" — PRs #3 to #6, merged that way in July.
// The merge commits left over are branch syncs ("Merge remote-tracking branch
// 'origin/main' into …"), which are not pull requests.
const mergeSubjects = git('log', '--merges', '--format=%s', REF).split('\n').filter(Boolean)
const mergedByCommit = new Set(
  mergeSubjects
    .map((subject) => subject.match(/Merge pull request #(\d+)/))
    .filter(Boolean)
    .map((match) => Number(match[1])),
)
const squashed = new Set(
  commits
    .map((commit) => commit.subject.match(/\(#(\d+)\)\s*$/))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .filter((number) => !mergedByCommit.has(number)),
)
const prNumbers = [...mergedByCommit, ...squashed].sort((a, b) => a - b)

const withClaudeTrailer = commits.filter((commit) =>
  commit.trailers.some((trailer) => /claude/i.test(trailer)),
)

// Group by the model named in the trailer: "Claude Opus 5 <noreply@…>" → "Claude Opus 5".
const byModel = new Map()
for (const commit of commits) {
  for (const trailer of commit.trailers) {
    if (!/claude/i.test(trailer)) continue
    const model = trailer.replace(/\s*<.*$/, '').trim()
    const seen = byModel.get(model) ?? { commits: 0, first: commit.date, last: commit.date }
    seen.commits += 1
    if (commit.date < seen.first) seen.first = commit.date
    if (commit.date > seen.last) seen.last = commit.date
    byModel.set(model, seen)
  }
}

const byType = new Map()
for (const { subject } of commits) {
  const match = subject.match(/^([a-z]+)(\([^)]*\))?!?:/)
  const type = match ? match[1] : 'others'
  byType.set(type, (byType.get(type) ?? 0) + 1)
}
const ranked = [...byType].sort((a, b) => b[1] - a[1])
const named = ranked.filter(([type]) => type !== 'others')
const others = (byType.get('others') ?? 0) + named.slice(6).reduce((sum, [, n]) => sum + n, 0)

const dates = commits.map((commit) => commit.date).sort()
const trailerNote =
  withClaudeTrailer.length === nonMerge ? `${nonMerge} (all of them)` : `${withClaudeTrailer.length}`
const prNote = prNumbers.length
  ? `${prNumbers.length} (#${prNumbers[0]} → #${prNumbers.at(-1)}): ${mergedByCommit.size} as a merge commit, ${squashed.size} squashed`
  : '0'
const mergeNote = `${merges}, of which ${merges - mergedByCommit.size} are branch syncs, not pull requests`

console.log(`Generated at commit ${git('rev-parse', '--short', REF)} (${git('log', '-1', '--date=short', '--format=%ad', REF)}).\n`)
console.log('| Measure | Value | Command |')
console.log('|---|---|---|')
console.log(`| Commits on \`main\` | ${total} | \`git rev-list --count HEAD\` |`)
console.log(`| Merged pull requests | ${prNote} | see §9 |`)
console.log(`| Merge commits | ${mergeNote} | \`git rev-list --merges --count HEAD\` |`)
console.log(`| Non-merge commits | ${nonMerge} | \`git rev-list --no-merges --count HEAD\` |`)
console.log(`| …with a \`Co-Authored-By: Claude …\` trailer | ${trailerNote} | see below |`)
console.log(`| First commit | ${dates[0]} | \`git log --reverse --format=%ad --date=short \| head -1\` |`)
console.log('')
console.log('| Model named in the trailer | Commits | First → last |')
console.log('|---|---|---|')
for (const [model, data] of [...byModel].sort((a, b) => b[1].commits - a[1].commits)) {
  console.log(`| ${model} | ${data.commits} | ${data.first} → ${data.last} |`)
}
console.log('')
console.log(
  `Commits by conventional-commit type (non-merge): ${named
    .slice(0, 6)
    .map(([type, n]) => `\`${type}\` ${n}`)
    .join(', ')}, others ${others}.`,
)
