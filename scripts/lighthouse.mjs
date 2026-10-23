// Auditoria Lighthouse reproduzível (CHALLENGE, seção 10).
//
//   npm run audit:lighthouse
//
// - gera o build de produção (com os mocks ligados, o cenário padrão da entrega);
// - sobe o `vite preview` desse build;
// - mede Início e detalhe do NFT, em perfis mobile e desktop, 3 vezes cada, cada medição em
//   um Chrome novo (sem cache nem estado de uma medição para a outra);
// - guarda a mediana de cada categoria, LCP, CLS e TBT, e os relatórios HTML/JSON da
//   medição mediana (em reports/lighthouse/).
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const PORT = 4179
const BASE_URL = `http://localhost:${PORT}`
// Variáveis só para experimentos locais; a auditoria oficial usa os padrões (3 medições, tudo).
const RUNS = Number(process.env.LH_RUNS ?? 3)
const OUT_DIR = path.resolve(process.env.LH_OUT ?? 'reports/lighthouse')
const ONLY_PROFILE = process.env.LH_PROFILE
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const pages = [
  { id: 'inicio', name: 'Início', path: '/' },
  { id: 'detalhe', name: 'Detalhe do NFT', path: '/nft/nft-03' },
]

const profiles = [
  { id: 'mobile', name: 'Mobile', config: undefined },
  { id: 'desktop', name: 'Desktop', config: desktopConfig },
]

const activeProfiles = () => (ONLY_PROFILE ? profiles.filter((profile) => profile.id === ONLY_PROFILE) : profiles)

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(BASE_URL)

      if (response.ok) {
        return
      }
    } catch {
      // Ainda subindo.
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error('O servidor de preview não respondeu a tempo.')
}

async function measure(url, profile) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  })

  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, logLevel: 'error', output: ['json', 'html'], onlyCategories: CATEGORIES },
      profile.config,
    )
    const { lhr, report } = result

    return {
      scores: Object.fromEntries(
        CATEGORIES.map((category) => [category, Math.round((lhr.categories[category].score ?? 0) * 100)]),
      ),
      metrics: {
        lcpMs: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
        cls: Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
        tbtMs: Math.round(lhr.audits['total-blocking-time'].numericValue),
        fcpMs: Math.round(lhr.audits['first-contentful-paint'].numericValue),
        speedIndexMs: Math.round(lhr.audits['speed-index'].numericValue),
      },
      environment: {
        lighthouse: lhr.lighthouseVersion,
        userAgent: lhr.environment.hostUserAgent,
        benchmarkIndex: lhr.environment.benchmarkIndex,
        throttlingMethod: lhr.configSettings.throttlingMethod,
        throttling: lhr.configSettings.throttling,
        formFactor: lhr.configSettings.formFactor,
        screenEmulation: lhr.configSettings.screenEmulation,
      },
      reports: { json: report[0], html: report[1] },
    }
  } finally {
    await chrome.kill()
  }
}

async function main() {
  console.log('> Gerando o build de produção…')
  const build = spawnSync(npm, ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })

  if (build.status !== 0) {
    throw new Error('O build falhou.')
  }

  console.log(`> Subindo o preview em ${BASE_URL}…`)
  const preview = spawn(npx, ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })

  try {
    await waitForServer()
    await rm(OUT_DIR, { recursive: true, force: true })
    await mkdir(OUT_DIR, { recursive: true })

    const results = []

    for (const page of pages) {
      for (const profile of activeProfiles()) {
        const runs = []

        for (let index = 1; index <= RUNS; index++) {
          console.log(`> ${page.name} · ${profile.name} · medição ${index}/${RUNS}`)
          runs.push(await measure(`${BASE_URL}${page.path}`, profile))
        }

        // A medição "representativa" é a de performance mediana (mesmo critério do Lighthouse).
        const ranked = [...runs].sort((a, b) => a.scores.performance - b.scores.performance)
        const representative = ranked[Math.floor(ranked.length / 2)]
        const base = `${page.id}-${profile.id}`

        await writeFile(path.join(OUT_DIR, `${base}.json`), representative.reports.json)
        await writeFile(path.join(OUT_DIR, `${base}.html`), representative.reports.html)

        results.push({
          page: page.name,
          path: page.path,
          profile: profile.name,
          median: {
            ...Object.fromEntries(CATEGORIES.map((category) => [category, median(runs.map((run) => run.scores[category]))])),
            lcpMs: median(runs.map((run) => run.metrics.lcpMs)),
            cls: median(runs.map((run) => run.metrics.cls)),
            tbtMs: median(runs.map((run) => run.metrics.tbtMs)),
            fcpMs: median(runs.map((run) => run.metrics.fcpMs)),
            speedIndexMs: median(runs.map((run) => run.metrics.speedIndexMs)),
          },
          runs: runs.map((run) => ({ scores: run.scores, metrics: run.metrics })),
          environment: representative.environment,
        })
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      runsPerPageAndProfile: RUNS,
      host: {
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        cpu: os.cpus()[0]?.model,
        cpuCores: os.cpus().length,
        memoryGb: Math.round(os.totalmem() / 1024 ** 3),
        node: process.version,
      },
      results,
    }

    await writeFile(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2))
    await writeFile(path.join(OUT_DIR, 'SUMMARY.md'), renderSummary(summary))
    console.log(`> Pronto. Relatórios em ${OUT_DIR}`)
  } finally {
    preview.kill()

    if (process.platform === 'win32' && preview.pid) {
      spawnSync('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    }
  }
}

function renderSummary(summary) {
  const goals = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
  const mark = (value, category) => (value >= goals[category] ? `${value}` : `**${value}** ⚠️`)

  const lines = [
    '# Resultados do Lighthouse (gerado por `npm run audit:lighthouse`)',
    '',
    `Gerado em ${summary.generatedAt}. Mediana de ${summary.runsPerPageAndProfile} medições por página e perfil.`,
    'Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.',
    '',
    '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) | FCP (ms) | Speed Index (ms) |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]

  for (const { page, profile, median: m } of summary.results) {
    lines.push(
      `| ${page} | ${profile} | ${mark(m.performance, 'performance')} | ${mark(m.accessibility, 'accessibility')} | ${mark(m['best-practices'], 'best-practices')} | ${mark(m.seo, 'seo')} | ${m.lcpMs} | ${m.cls} | ${m.tbtMs} | ${m.fcpMs} | ${m.speedIndexMs} |`,
    )
  }

  lines.push('', '## Todas as medições', '')

  for (const { page, profile, runs } of summary.results) {
    lines.push(`### ${page} · ${profile}`, '', '| # | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) |', '| --- | --- | --- | --- | --- | --- | --- | --- |')
    runs.forEach((run, index) => {
      lines.push(
        `| ${index + 1} | ${run.scores.performance} | ${run.scores.accessibility} | ${run.scores['best-practices']} | ${run.scores.seo} | ${run.metrics.lcpMs} | ${run.metrics.cls} | ${run.metrics.tbtMs} |`,
      )
    })
    lines.push('')
  }

  const first = summary.results[0]

  lines.push(
    '## Ambiente',
    '',
    `- Sistema: ${summary.host.os}; CPU: ${summary.host.cpu} (${summary.host.cpuCores} núcleos); RAM: ${summary.host.memoryGb} GB`,
    `- Node ${summary.host.node}; Lighthouse ${first.environment.lighthouse}`,
    `- Navegador: ${first.environment.userAgent}`,
    `- Índice de benchmark da CPU (Lighthouse): ${first.environment.benchmarkIndex}`,
    '',
  )

  return lines.join('\n')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
