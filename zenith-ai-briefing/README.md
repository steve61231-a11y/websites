# Zenith AI Morning Intelligence Engine

A personal business-intelligence and content-research engine. Every morning it reads
the AI, tech and business news, works out what a **Kenyan business owner** should
actually care about, and emails you a briefing you can record a video from:

> **ZENITH AI BUSINESS BRIEFING — Thursday, September 24**
> Today's signal → 3 biggest developments (what happened, what changed, why it matters,
> who should care, Kenyan example, opportunity, content angle, **READ SOURCE →**) →
> Kenya/Africa → AI tool to watch → business opportunity → watchlist → **today's video**
> (hook, talking points, ending, source links).

It runs on a free GitHub Actions schedule. Once it's set up it needs no Claude Code,
no server and no one to operate it.

---

## 1. How it works

```
 RSS/Atom · company blogs · news search (Google/Bing News) · Reddit · YouTube
 GitHub releases · research papers (HF Daily Papers) · JSON APIs · web pages · sitemaps
                                   │
                          MASS DISCOVERY          app/ingestion/  (one adapter per source type)
                                   ↓
                     NORMALIZE (URL, date, text)   app/utils/
                                   ↓
         DEDUPLICATE → one STORY per event         app/analysis/deduplicator.py
         (canonical URL · title similarity · shared entities · LLM event names)
                                   ↓
     AI RELEVANCE FILTER (cheap model, batched)    app/analysis/classifier.py
     free keyword pre-ranking decides what's even sent
                                   ↓
          FULL-TEXT EXTRACTION (trafilatura)       app/extraction/
                                   ↓
     DEEP ANALYSIS (strong model, 1 call/story)    app/analysis/analyst.py
     what changed · departments · Kenya/Africa lens · opportunity · content · quality gate
                                   ↓
     RANKING (internal weighted scores, repeat penalty, event dedupe)   ranking.py
                                   ↓
     EDITOR (signal, opportunity, watchlist, today's video)   app/briefing/generator.py
                                   ↓
            HTML + plain-text EMAIL (SMTP)          app/delivery/email_service.py
```

**Resilience.** A dead source, a failed extraction, a model outage or an email failure
never stops the run. Without any AI key it still produces a (degraded, clearly marked)
briefing from headlines. Source links always come from the database. The model only
refers to stories by ID, so **it cannot invent a URL**.

**Cost.** Deduplication and free keyword ranking happen before any AI call. The cheap
model sees at most 150 headlines in batches of 20. The strong model sees at most 20
stories (truncated to 10k characters). A typical day is roughly 10 cheap calls plus
about 21 strong calls. Everything is cached, so a dry run followed by a real run
doesn't pay twice.

### Project layout

```
zenith-ai-briefing/
├── app/
│   ├── main.py / __main__.py     CLI  (python -m app …)
│   ├── config.py                  env + YAML settings (only place config is read)
│   ├── database.py                SQLite schema + helpers
│   ├── pipeline.py                the daily run, manual URL ingestion
│   ├── ingestion/                 base.py (adapter registry) · rss.py · webpage.py · sitemap.py
│   │                              json_api.py · search.py · collector.py
│   ├── extraction/                article_extractor.py
│   ├── analysis/                  classifier · deduplicator · analyst · ranking · prompts
│   │                              kenya_lens · opportunity · content_strategy · watchlist
│   ├── llm/                       provider.py (retries/fallback/cache) · openai_provider.py
│   ├── briefing/                  generator.py + templates/ (email.html, email.txt)
│   ├── delivery/                  email_service.py
│   └── dashboard/                 web.py (FastAPI) + templates/
├── config/sources.yaml            ← add/remove sources here
├── config/settings.yaml           ← limits, watchlist, ranking weights, lookback
├── data/                          SQLite state (zenith.db is committed by the scheduler)
├── scripts/test_pipeline.py       end-to-end dry run
├── tests/                         pytest suite (offline, fixtures + fake model)
└── .github/workflows/daily_briefing.yml   (at the repository root)
```

---

## 2. Local setup (5 minutes)

Requires Python 3.11+.

```bash
cd zenith-ai-briefing
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # then edit .env
python -m app --init-db
python -m app --check-sources                          # which feeds work from your network
python -m app --dry-run                                # full briefing, no email
python -m app --send-test                              # one test email
python -m app --run                                    # the real thing
```

The dry run writes `data/briefings/dry-run-YYYY-MM-DD.html`. Open it in a browser to see
the email exactly as it will look.

## 3. Environment variables

All secrets live in `.env` locally and in GitHub Secrets in production. Never commit them.

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | AI key. Empty = heuristic mode (no AI cost, degraded briefing). |
| `OPENAI_BASE_URL` | Optional. Any OpenAI-compatible API (OpenRouter, Groq, Together, local Ollama). |
| `CHEAP_MODEL` | Filtering/classification (default `gpt-5-mini`). |
| `ANALYSIS_MODEL` | Deep analysis + editor (default `gpt-5`). `PRIMARY_MODEL` is accepted as an alias. |
| `FALLBACK_MODEL` | Optional. Tried when the main model keeps failing. |
| `OPENAI_REASONING_EFFORT` | Optional for reasoning models: `minimal`/`low`/`medium`/`high`. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USERNAME` `SMTP_PASSWORD` | SMTP server. Port 465 = SSL, 587 = STARTTLS (auto). |
| `EMAIL_FROM` `EMAIL_TO` | Sender; recipients (comma-separated). |
| `TIMEZONE` `DAILY_RUN_TIME` | Default `Africa/Nairobi`, `06:30`. |
| `DATABASE_PATH` | Default `data/zenith.db`. `.env.example` uses `data/local.db` so local runs never clash with the committed state. |
| `MAX_ARTICLES_DISCOVERED` `MAX_ARTICLES_EXTRACTED` `MAX_ARTICLES_DEEP_ANALYZED` `MAX_FINAL_STORIES` | Optional overrides of `settings.yaml` limits. |
| `DASHBOARD_USERNAME` `DASHBOARD_PASSWORD` | Basic auth. Required if the dashboard listens beyond localhost. |

Non-secret tuning (lookback window, limits, watchlist, ranking weights) lives in
`config/settings.yaml`.

## 4. Adding sources

Edit `config/sources.yaml`. No code changes are needed. You can also use the dashboard's
**Sources** page.

```yaml
  - name: Business Daily Tech          # unique
    type: rss                          # rss | atom | youtube | reddit | github_releases | webpage | sitemap | json | search
    url: https://example.com/feed
    category: kenya                    # ai_lab | ai_news | business | africa | kenya | tools | research | community | search
    priority: 8                        # 1–10, trust/importance; official sources win duplicates
```

Recipes:

- **No RSS?** Use `type: webpage` with `link_pattern: "/news/[a-z0-9-]+$"` (a regex that article
  URLs match). The first fetch records existing links as a baseline, so only new links count as news.
- **News search:** `type: search`, `engine: google_news` (or `bing_news`), `region: KE`, and a
  `queries:` list. This catches outlets you don't follow directly.
- **Reddit:** `type: reddit` with a subreddit `.rss` URL. Posts are unwrapped to the article they link to.
- **YouTube:** `type: youtube`, `url: UC…` (the channel ID).
- **GitHub releases:** `type: github_releases`, `url: https://github.com/OWNER/REPO/releases.atom`.
- **JSON APIs:** `type: json` with `items_path`, `fields` and an optional `url_template` (see the Hugging Face example).

Then run `python -m app --check-sources`.

> **Feeds move.** This source list was written without live network access to most of
> these sites. Run `--check-sources` once and disable or fix anything marked ✗. After
> that, the dashboard's **Sources** page (or the run summary) shows health every day.

### Social media

No fragile browser scraping. If an Instagram/LinkedIn/X post matters, it usually shows up
via news search or the original source. If not, use **manual ingestion**:

```bash
python -m app --url "https://www.linkedin.com/posts/…"
```

This fetches, extracts and analyses the page, prints the business implications and
content angles, and queues the story for tomorrow's briefing. Pages behind a login may
fail to extract. In that case paste the original article's URL instead.

## 5. Changing models / providers

Set `CHEAP_MODEL`, `ANALYSIS_MODEL` and `FALLBACK_MODEL` (in `.env`, or as GitHub
**Variables**). No code changes are needed. To use a cheaper provider with an
OpenAI-compatible API, set `OPENAI_BASE_URL` plus that provider's key and model names.

To add a completely different provider, subclass `LLMProvider` in `app/llm/`, implement
`complete()`, and add it to `PROVIDERS` in `app/llm/provider.py`. Then set
`LLM_PROVIDER=<name>`.

## 6. Running manually

| Command | What it does |
|---|---|
| `python -m app --dry-run` | Full pipeline. Saves briefing to `data/briefings/`. **No email**; doesn't mark articles as used. |
| `python -m app --run` | Full pipeline + email. If today's briefing was already emailed it does nothing; if it was generated but the email failed it resends it. |
| `python -m app --run --force` | Regenerate and resend today's briefing. |
| `python -m app --send-test` | Sends a sample briefing to check SMTP. |
| `python -m app --url URL` | Manual story ingestion. |
| `python -m app --check-sources` | Fetch every source once and show health. |
| `python -m app --dashboard` | Dashboard at http://127.0.0.1:8000 |
| `python -m app --cron 07:00` | Prints the UTC cron line for a local delivery time. |

## 7. Testing

```bash
pytest -q                                   # ~70 offline tests (no network, no API key)
python scripts/test_pipeline.py --offline   # end-to-end dry run on fixtures with a fake model
python scripts/test_pipeline.py             # end-to-end dry run on real sources + your model (no email)
```

The tests cover RSS/Atom/Reddit/search/webpage/sitemap/JSON parsing, article extraction,
URL normalization, duplicate detection, AI JSON parsing and repair, retries and fallback,
source failure isolation, empty sources, email rendering and SMTP, date/time and cron
conversion, database operations, model outages (degraded mode) and the dashboard.

## 8. Email configuration

Any SMTP server works:

- **Gmail:** `smtp.gmail.com`, port 587, your address as username, and an **App Password**
  (Google Account → Security → 2-Step Verification → App passwords). Your normal password won't work.
- **Outlook / Microsoft 365:** `smtp.office365.com`, port 587.
- **Zoho:** `smtp.zoho.com`, port 465.
- **Brevo / Mailgun / SendGrid / Amazon SES / Resend:** use their SMTP credentials. These deliver
  more reliably if you later send to subscribers.

Run `python -m app --send-test` and check spam the first time. Mark the message "not spam".

## 9. GitHub Actions deployment (runs every morning)

The workflow is in `.github/workflows/daily_briefing.yml` at the **repository root**. It
runs the app from the `zenith-ai-briefing/` folder.

1. Push the repository to GitHub. **Use a private repository.** The committed database
   contains your briefings. Private repos get 2,000 free Actions minutes/month; this uses ~5/day.
2. **Settings → Secrets and variables → Actions → Secrets:** add
   `OPENAI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_TO`
   (and optionally `OPENAI_BASE_URL`).
3. **… → Variables** (optional): `CHEAP_MODEL`, `ANALYSIS_MODEL`, `FALLBACK_MODEL`,
   `OPENAI_REASONING_EFFORT`, `MAX_FINAL_STORIES`, `MAX_ARTICLES_DEEP_ANALYZED`.
4. **Settings → Actions → General → Workflow permissions:** "Read and write permissions"
   (so the job can commit its state).
5. **Actions tab → Daily AI Briefing → Run workflow:** pick `send-test` first, then `dry-run`, then `run`.

After that it runs by itself. Each run's summary appears on the run page, and the
briefing HTML is attached as an artifact. A failed run turns red, and GitHub emails you
about failed scheduled runs.

If you move the project to its own repository, move `.github/` into the project root and
delete the `defaults.run.working-directory` line plus the `zenith-ai-briefing/` prefixes
in the workflow.

### Known GitHub Actions limitations (and what's done about them)

- **Delays:** scheduled jobs can start 5–30+ minutes late at busy times. The primary run
  is scheduled for 06:00 EAT so the email lands around 06:30.
- **Dropped runs:** a backup schedule at 07:00 EAT re-sends if the first run didn't
  deliver, and does nothing if it did.
- **60-day inactivity:** GitHub disables schedules in *public* repos after 60 days without
  repository activity. The daily state commit normally counts as activity. If the
  schedule is ever disabled, you'll see a banner on the Actions tab. Click **Enable
  workflow**. Monthly habit: open the Actions tab and check the last run is green.
- **Replaceable scheduler:** nothing in the app depends on GitHub. Any scheduler that runs
  `python -m app --run` works. Examples: cron on a VPS/Raspberry Pi
  (`0 3 * * * cd /path/zenith-ai-briefing && .venv/bin/python -m app --run`), Windows Task
  Scheduler, or the Docker image.

## 10. Changing the delivery time

1. `python -m app --cron 07:00` prints the UTC cron line (Nairobi = UTC+3, no daylight saving).
2. Edit both `cron:` lines in `.github/workflows/daily_briefing.yml`. Schedule the primary
   ~30 minutes before you want the email, and the backup an hour after that.
3. Update `DAILY_RUN_TIME` in `.env` / `settings.yaml` (used for display and `--cron`).

## 11. Database / state

- SQLite, one file. Tables: `sources` (health), `articles`, `stories`, `article_analysis`,
  `daily_briefings`, `content_ideas`, `watchlist`, `system_runs`, `llm_cache`.
- GitHub runners are ephemeral, so the workflow commits `data/zenith.db` after every run.
  It contains only public article data and generated briefings, never secrets.
- It stays small: articles are pruned after 45 days (featured ones are kept), full text
  after 7 days, and the file is VACUUMed each run.
- An empty or missing database is fine. The first run creates everything.
- Local runs use `data/local.db` (see `.env.example`), so they never conflict with the
  scheduler's file.
- Later you can move to a hosted database by replacing `app/database.py`'s `connect()`.

## 12. Dashboard

```bash
python -m app --dashboard          # http://127.0.0.1:8000
```

The pages are **Today** (latest briefing, run now), **Stories** (analysed stories, why each
was selected, first-pass filter decisions, paste a URL to analyse), **Content** (history of
angles), **Watchlist** (add/pause topics), **Sources** (health ✓ ⚠ ✗; add/disable/remove,
written to `sources.yaml`), **Runs** (run summaries and errors), **Archive** (previous
emails) and **Settings** (effective config with secrets hidden, test email).

To see the production state locally, `git pull` and run with `DATABASE_PATH=data/zenith.db`.
The dashboard refuses to bind to a public interface unless `DASHBOARD_USERNAME` and
`DASHBOARD_PASSWORD` are set.

## 13. Adding a new source adapter (e.g. Instagram, LinkedIn, X, TikTok)

```python
# app/ingestion/instagram.py
from app.ingestion.base import RawItem, SourceAdapter, register

@register("instagram")
class InstagramAdapter(SourceAdapter):
    def fetch(self, source):
        data = self.get(source.url).text          # self.get records HTTP status for health
        return [RawItem(title=..., url=..., published_at=..., description=...)]
```

Then import the module in `get_adapter()` in `app/ingestion/base.py`, add the type name to
`SOURCE_TYPES` in `app/config.py`, and use `type: instagram` in `sources.yaml`. Raise
`FetchError` for failures. Everything else (dedup, health, analysis) works automatically.
Only build adapters for platforms with a stable public endpoint.

## 14. Troubleshooting

| Symptom | Fix |
|---|---|
| Briefing says "degraded" | The model failed or no key is set. See **Runs → summary** for the exact error (bad key, unknown model, rate limit). |
| `LLM … empty response (finish_reason=length)` | The reasoning model used its whole budget. Raise `llm.max_output_tokens_analysis` in settings.yaml or set `OPENAI_REASONING_EFFORT=low`. |
| `bad request: … model` | The model name is wrong or not available to your key. Change `ANALYSIS_MODEL`/`CHEAP_MODEL`. |
| `SMTP authentication failed` | Use an app password (Gmail), and check the username is the full address. |
| No email but run is green | It was probably already delivered today (`status: skipped`). Use `--force`. |
| A source shows ✗ | The feed URL changed or the site blocks bots. Fix the URL or `enabled: false`. |
| "No development cleared the quality bar" | Sources are failing (check health) or it's genuinely a quiet day. Try `LOOKBACK_HOURS=48`. |
| Workflow can't push state | Set Workflow permissions to "Read and write". |
| Schedule stopped | Actions tab → Daily AI Briefing → Enable workflow. |

## 15. Designed for later (not built yet)

Public subscribers, WhatsApp/Telegram/Slack delivery, weekly reports, industry-specific
briefings and social adapters all slot in without restructuring:

- delivery providers → `app/delivery/`
- adapters → `app/ingestion/`
- recipients → currently `EMAIL_TO`, later a `subscribers` table
