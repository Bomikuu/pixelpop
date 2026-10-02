import { ArrowLeft, ArrowUpRight, Check, Database, ShieldCheck, Workflow } from "lucide-react";
import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";

const databaseCode = `database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

if database_url:
    parsed_database_url = urlparse(database_url)
    if parsed_database_url.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL must use the postgres or postgresql scheme.")

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": unquote(parsed_database_url.path.lstrip("/")),
            "USER": unquote(parsed_database_url.username or ""),
            "PASSWORD": unquote(parsed_database_url.password or ""),
            "HOST": parsed_database_url.hostname or "",
            "PORT": parsed_database_url.port or "",
            "OPTIONS": dict(parse_qsl(parsed_database_url.query)),
            "CONN_MAX_AGE": 0,
        }
    }`;

const databaseEnv = `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`;

const neonMigrationPlan = `cd backendv2
read -r -s -p "Paste Neon connection string: " NEON_DATABASE_URL
printf '\\n'
DATABASE_URL="$NEON_DATABASE_URL" .venv/bin/python manage.py shell -c "from django.conf import settings; db = settings.DATABASES['default']; print(db['HOST'], db['NAME'])"
DATABASE_URL="$NEON_DATABASE_URL" .venv/bin/python manage.py migrate --plan`;

const neonMigrationApply = `DATABASE_URL="$NEON_DATABASE_URL" .venv/bin/python manage.py migrate --noinput
unset NEON_DATABASE_URL`;

const qstashCode = `if not (os.getenv("VERCEL") and not settings.DEBUG and push_configured()):
    return Response({"detail": "Reminder dispatch is unavailable."}, status=503)
signature = request.headers.get("Upstash-Signature")
if not signature:
    return Response({"detail": "Invalid scheduler signature."}, status=403)

from qstash import Receiver
from qstash.errors import SignatureError

try:
    Receiver(
        current_signing_key=settings.REMINDER_QSTASH_CURRENT_SIGNING_KEY,
        next_signing_key=settings.REMINDER_QSTASH_NEXT_SIGNING_KEY,
    ).verify(
        signature=signature,
        body=request.body.decode("utf-8"),
        url=settings.REMINDER_QSTASH_DESTINATION,
    )
except (SignatureError, UnicodeDecodeError):
    return Response({"detail": "Invalid scheduler signature."}, status=403)
return Response({"dispatched": dispatch_due(timezone.now())})`;

const reminderEnv = `REMINDER_QSTASH_DESTINATION=https://pixelpopup-backend.vercel.app/api/v1/finance/reminders/dispatch/
REMINDER_QSTASH_CURRENT_SIGNING_KEY=<current-signing-key>
REMINDER_QSTASH_NEXT_SIGNING_KEY=<next-signing-key>
REMINDER_VAPID_PUBLIC_KEY=<public-key>
REMINDER_VAPID_PRIVATE_KEY=<private-key>
REMINDER_VAPID_SUBJECT=mailto:<contact-email>`;

function CodeBlock({ title, children }) {
  return (
    <div className="my-7 overflow-hidden rounded-xl bg-[#0b1733] text-slate-100">
      <div className="border-b border-white/15 px-5 py-3 text-xs font-semibold text-blue-100">{title}</div>
      <pre className="overflow-x-auto px-5 py-5 text-[0.82rem] leading-6 sm:text-sm"><code>{children}</code></pre>
    </div>
  );
}

function ExternalReference({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2448d8] underline decoration-blue-200 underline-offset-4 hover:decoration-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">{children}<ArrowUpRight size={15} aria-hidden="true" /></a>;
}

function GuideScreenshot({ src, alt, caption, width = 705, height = 907 }) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <a href={src} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2f5bff]" aria-label={"Open full-size screenshot: " + alt}>
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="h-auto w-full" />
      </a>
      <figcaption className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600">{caption}</figcaption>
    </figure>
  );
}

export default function BackendSetupGuidePage() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ApplicationPageShell
      title="How I set up this backend"
      description="A concise walkthrough of this site's Django backend setup with Neon Postgres and signed QStash reminder dispatch."
      canonicalPath="/portfolio/how-tos/backend-setup"
      type="article"
    >
      <article>
        <header className="border-b border-slate-200 bg-white px-5 pb-14 pt-32 sm:px-8 sm:pb-16 sm:pt-40">
          <div className="mx-auto max-w-5xl">
            <Link to="/portfolio/how-tos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]"><ArrowLeft size={16} aria-hidden="true" /> All how-tos</Link>
            <h1 className="portfolio-display mt-8 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">How I set up this backend</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-600">Django stores persistent data in Neon Postgres. QStash calls a signed endpoint every 30 minutes to check which reminders are due.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-500"><span className="font-semibold text-slate-900">Mico Ang</span><span>Backend setup</span><span>Neon + QStash</span></div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[13rem_minmax(0,48rem)] lg:justify-center lg:gap-16">
          <nav aria-label="On this page" className="h-fit border-t border-slate-300 pt-5 text-sm lg:sticky lg:top-28">
            <p className="font-semibold text-slate-950">On this page</p>
            <a href="#neon" className="mt-4 block text-slate-600 hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">Neon database</a>
            <a href="#qstash" className="mt-3 block text-slate-600 hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">QStash schedule</a>
            <a href="#checklist" className="mt-3 block text-slate-600 hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">Setup checklist</a>
          </nav>

          <div className="min-w-0 text-lg leading-8 text-slate-700">
            <section id="neon" className="scroll-mt-28">
              <div className="flex items-center gap-3 text-[#2448d8]"><Database size={25} strokeWidth={1.7} aria-hidden="true" /><h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Neon for persistent data</h2></div>
              <p className="mt-5">The deployed Django backend reads a PostgreSQL connection string from <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">DATABASE_URL</code> (or <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">POSTGRES_URL</code>). Locally, when neither is set, it falls back to SQLite. This deployment uses Neon for persistent data across deployments.</p>
              <ol className="mt-6 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-[#2448d8]">
                <li>Connect the Neon database to the backend project in Vercel Storage. In this project, that integration supplied <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">DATABASE_URL</code> automatically.</li>
                <li>Check that <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">DATABASE_URL</code> appears under Vercel Environment Variables. For a manual connection, add the Neon URL as a Secret and keep the SSL query parameters Neon provides.</li>
                <li>Use the resource's Open in Neon button to copy the connection string for the temporary local migration commands below. Run them before using the deployed forms and reminders.</li>
              </ol>
              <GuideScreenshot
                src="/portfolio/assets/how-tos/vercel-neon-connected.png"
                alt="Vercel Neon resource connected to the pixelpopup-backend project, with connection values hidden"
                caption="The Neon resource is connected to the backend project. Vercel hides the connection values in this view."
              />
              <CodeBlock title="Backend Production environment (example only)">{databaseEnv}</CodeBlock>
              <GuideScreenshot
                src="/portfolio/assets/how-tos/vercel-database-url-form.png"
                alt="Vercel Add Environment Variable form with Secret selected, DATABASE_URL as the key, an empty value, and Production selected"
                caption="This is an unsaved example of the Vercel Secret form for a manual DATABASE_URL setup. The connected Neon integration already provides this variable in this project."
              />
              <h3 className="portfolio-display mt-10 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Run Neon migrations locally</h3>
              <p className="mt-4">Open a Bash terminal at the project root after installing the backend requirements. Paste the Neon connection string when prompted. The terminal hides your input. First, inspect the migration plan:</p>
              <CodeBlock title="Local Bash terminal: inspect first">{neonMigrationPlan}</CodeBlock>
              <p>Confirm the printed host and database name are your Neon database. Once the plan looks right, run the next block in the same terminal. If you decide not to migrate, run <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">unset NEON_DATABASE_URL</code> instead.</p>
              <CodeBlock title="Same terminal: apply to Neon">{neonMigrationApply}</CodeBlock>
              <p>Do not paste the Neon URL into the command itself or your regular <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">backendv2/.env</code>. Without a database URL, local Django continues to use SQLite. If you use <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">./dev-local.sh</code>, it runs migrations at startup against whichever database URL is active, so keep Neon scoped to the commands above.</p>
              <CodeBlock title="backendv2/core/settings.py (excerpt)">{databaseCode}</CodeBlock>
              <p>The URL query is passed to Django's PostgreSQL driver as connection options. This is where Neon's SSL settings are retained. The backend uses <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">psycopg</code> and closes connections after each request with <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">CONN_MAX_AGE: 0</code>.</p>
              <p className="mt-5 text-base">Reference: <ExternalReference href="https://neon.com/blog/python-django-and-neons-serverless-postgres">Neon's Django setup guide</ExternalReference>.</p>
            </section>

            <section id="qstash" className="mt-16 scroll-mt-28 border-t border-slate-200 pt-14">
              <div className="flex items-center gap-3 text-[#2448d8]"><Workflow size={25} strokeWidth={1.7} aria-hidden="true" /><h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">QStash for reminder checks</h2></div>
              <p className="mt-5">One QStash schedule sends a POST request with <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">{`{}`}</code> to the backend every 30 minutes. The endpoint verifies the QStash signature against the exact public URL and raw request body before it runs the due-reminder check.</p>
              <ol className="mt-6 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-[#2448d8]">
                <li>In Upstash QStash, create a schedule using <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">*/30 * * * *</code>.</li>
                <li>Set its destination to <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">https://pixelpopup-backend.vercel.app/api/v1/finance/reminders/dispatch/</code>, method POST, and body <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">{`{}`}</code>.</li>
                <li>Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]">REMINDER_QSTASH_DESTINATION</code> to that exact URL in the backend Production environment. Add the current and next signing keys there too.</li>
              </ol>
              <CodeBlock title="Backend Production environment (placeholders)">{reminderEnv}</CodeBlock>
              <GuideScreenshot
                src="/portfolio/assets/how-tos/vercel-qstash-signing-key-form.png"
                alt="Vercel Add Environment Variable form with Secret selected and REMINDER_QSTASH_CURRENT_SIGNING_KEY entered as the key, with no value shown"
                caption="An unsaved example for the QStash signing key. Add both current and next keys as Production secrets; never include their values in a screenshot."
              />
              <CodeBlock title="backendv2/finance/api/reminders.py (verification excerpt)">{qstashCode}</CodeBlock>
              <p>The production endpoint also checks that it is running on Vercel with debug off and that Web Push is configured. QStash schedules the check; the backend decides who is due and sends browser notifications through Web Push. The 30-minute cron runs in UTC by default, while the reminder window is evaluated in Asia/Manila.</p>
              <p className="mt-5 text-base">Reference: <ExternalReference href="https://upstash.com/docs/qstash/features/schedules">QStash schedules</ExternalReference> and <ExternalReference href="https://upstash.com/docs/qstash/howto/receiving">signed request delivery</ExternalReference>.</p>
            </section>

            <section id="checklist" className="mt-16 scroll-mt-28 border-t border-slate-200 pt-14">
              <div className="flex items-center gap-3 text-[#2448d8]"><ShieldCheck size={25} strokeWidth={1.7} aria-hidden="true" /><h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Setup checklist</h2></div>
              <ul className="mt-6 space-y-4">
                {[
                  "Keep DATABASE_URL and both QStash signing keys in Vercel Production, never in frontend code or Git.",
                  "Apply migrations to Neon before enabling the schedule.",
                  "Set REMINDER_VAPID_PUBLIC_KEY, REMINDER_VAPID_PRIVATE_KEY, and REMINDER_VAPID_SUBJECT for browser push.",
                  "Keep QStash's destination and REMINDER_QSTASH_DESTINATION identical, including the trailing slash.",
                ].map((item) => <li key={item} className="flex items-start gap-3"><Check className="mt-1 shrink-0 text-[#2448d8]" size={19} aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
              <p className="mt-7 text-base text-slate-600">No secret values are shown here. The snippets are excerpts from this project's backend, not a complete standalone Django configuration.</p>
            </section>

            <Link to="/portfolio/how-tos" className="mt-14 inline-flex items-center gap-2 text-sm font-semibold text-[#2448d8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]"><ArrowLeft size={16} aria-hidden="true" /> All how-tos</Link>
          </div>
        </div>
      </article>
    </ApplicationPageShell>
  );
}
