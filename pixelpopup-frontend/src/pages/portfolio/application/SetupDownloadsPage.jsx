import {
  ArrowLeft,
  Download,
  FileCode2,
  FileText,
  TerminalSquare,
} from "lucide-react";
import ApplicationPageShell from "./ApplicationPageShell";

const setupFiles = [
  {
    name: "README.md",
    title: "Setup guide",
    description: "Start here for the export, install, and import order, with the commands to run.",
    icon: FileText,
  },
  {
    name: "setup-ubuntu.sh",
    title: "Ubuntu installer",
    description: "Prepare a new Ubuntu workstation with development tools and desktop apps.",
    icon: TerminalSquare,
  },
  {
    name: "export-profiles.sh",
    title: "Export profiles",
    description: "Create a private archive of Codex and Antigravity profiles from the old drive.",
    icon: TerminalSquare,
  },
  {
    name: "import-profiles.sh",
    title: "Import profiles",
    description: "Restore the profile archive on the destination workstation.",
    icon: TerminalSquare,
  },
  {
    name: "migrate-profiles.py",
    title: "Migration helper",
    description: "The Python helper required by the export and import scripts.",
    icon: FileCode2,
  },
];

export default function SetupDownloadsPage() {
  return (
    <ApplicationPageShell
      title="Ubuntu Setup Downloads"
      description="Download the Ubuntu workstation setup and profile migration files."
      canonicalPath="/portfolio/setup-downloads"
    >
      <section className="border-b border-[#dbe7f3] bg-white px-5 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <a href="/portfolio/work-setup" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#2448d8] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
            <ArrowLeft size={17} aria-hidden="true" /> Work setup
          </a>
          <h1 className="portfolio-display mt-7 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-7xl">Ubuntu setup files</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-[#536b86] sm:text-2xl sm:leading-9">Download the files you need to set up a new workstation and move your Codex and Antigravity profiles.</p>
        </div>
      </section>

      <section className="bg-[#f8fbff] px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="setup-files-title">
        <div className="mx-auto max-w-7xl">
          <h2 id="setup-files-title" className="portfolio-display text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Choose your files</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#536b86]">Download each file separately. Keep the scripts and Python helper together in one folder before running them.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setupFiles.map(({ name, title, description, icon: Icon }) => (
              <article key={name} className="flex min-h-64 flex-col rounded-xl border border-[#d7e3ef] bg-white p-6">
                <span className="grid size-12 place-items-center bg-[#edf4ff] text-[#2f5bff]">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="portfolio-display mt-6 text-2xl font-semibold leading-tight tracking-[-0.025em] text-slate-950">{title}</h3>
                <p className="mt-1 break-all text-sm font-medium text-[#536b86]">{name}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-[#536b86]">{description}</p>
                <a
                  href={`/portfolio/ubuntu-setup/${name}`}
                  download={name}
                  className="group mt-6 inline-flex min-h-12 items-center justify-between gap-3 border border-[#2f5bff] bg-[#2f5bff] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                  aria-label={`Download ${name}`}
                >
                  Download file
                  <Download size={18} className="transition-transform group-hover:translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
          <div className="mt-8 max-w-3xl space-y-3 text-sm leading-6 text-[#536b86]">
            <p>After downloading, make the shell scripts executable with <code className="rounded-sm bg-[#edf4ff] px-1.5 py-0.5 text-[#2448d8]">chmod +x *.sh</code>.</p>
            <p>Read the guide before running the scripts. Profile archives can contain tokens and private conversations, so keep any exported archive private.</p>
          </div>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
