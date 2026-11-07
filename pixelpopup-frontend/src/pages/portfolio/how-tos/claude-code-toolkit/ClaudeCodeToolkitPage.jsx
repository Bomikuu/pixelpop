import { useLayoutEffect, useRef, useState } from "react";
import { Dialog, Tabs } from "radix-ui";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Coins, Copy, Layers3, Network, Palette, PenLine, Play, Rocket, Search, Terminal, TrendingUp, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ApplicationPageShell from "../../application/ApplicationPageShell";
import { toolkitCategories, toolkitSource, toolkitTools } from "./toolkitContent";
import "./claudeCodeToolkit.css";

const categoryIcons = { tokens: Coins, design: Palette, content: PenLine, codebases: Network, research: TrendingUp, shipping: Rocket, foundation: Layers3 };

function ExternalLink({ href, children }) {
  return <a className="cct-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
}

function CopyBlock({ text, label }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch {
      setStatus("Copy unavailable. Select and copy the text below.");
    }
  };
  return <div className="cct-copy-block">
    <div className="cct-copy-heading"><span>{label}</span><button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>{status === "Copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{status === "Copied" ? "Copied" : "Copy"}</button></div>
    <p className={status && status !== "Copied" ? "cct-copy-error" : "sr-only"} role="status">{status}</p>
    <pre tabIndex={0} aria-label={label}><code>{text}</code></pre>
  </div>;
}

function ToolDetails({ tool, category, headingRef, onCloseAutoFocus }) {
  const Icon = categoryIcons[category.icon];
  const repoUrl = `https://github.com/${tool.repo}`;
  return <Dialog.Portal>
    <Dialog.Overlay className="cct-overlay" />
    <Dialog.Content className="cct-dialog" onOpenAutoFocus={(event) => { event.preventDefault(); headingRef.current?.focus(); }} onCloseAutoFocus={onCloseAutoFocus}>
      <header className="cct-dialog-header">
        <span className="cct-detail-icon"><Icon size={25} aria-hidden="true" /></span>
        <div><p className="cct-detail-category">{category.title} · {tool.kind}</p><Dialog.Title asChild><h2 tabIndex={-1} ref={headingRef}>{tool.name}</h2></Dialog.Title></div>
        <Dialog.Close asChild><button type="button" className="cct-icon-button" aria-label="Close tool guide"><X size={21} aria-hidden="true" /></button></Dialog.Close>
      </header>
      <div className="cct-dialog-body">
        <Dialog.Description className="cct-detail-summary">{tool.summary}</Dialog.Description>
        <div className="cct-detail-layout">
          <div className="cct-overview">
            <section aria-labelledby="cct-overview-title"><h3 id="cct-overview-title"><BookOpen size={19} aria-hidden="true" />What it does</h3><p>{tool.detail}</p><dl><div><dt>A useful fit</dt><dd>{tool.bestFor}</dd></div><div><dt>What you need</dt><dd>{tool.requirements}</dd></div></dl></section>
            <aside className="cct-tool-note" aria-labelledby="cct-note-title"><h3 id="cct-note-title">Keep in mind</h3><p>{tool.note}</p></aside>
            <section className="cct-tool-sources" aria-labelledby="cct-tool-sources-title"><h3 id="cct-tool-sources-title">Source & setup reference</h3><ExternalLink href={repoUrl}>{tool.repo}</ExternalLink>{tool.extraSource && <ExternalLink href={tool.extraSource.href}>{tool.extraSource.label}</ExternalLink>}<p>Installation checked against the maintainer’s README on {toolkitSource.reviewed}. Usage prompts are examples written for this guide.</p></section>
          </div>
          <div className="cct-instructions">
            <section aria-labelledby="cct-install-title"><h3 id="cct-install-title"><Terminal size={19} aria-hidden="true" />Installation</h3><p className="cct-install-location">{tool.install.where}</p><CopyBlock text={tool.install.code} label="Setup instructions" /><ol className="cct-steps">{tool.install.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
            <section aria-labelledby="cct-use-title"><h3 id="cct-use-title"><Play size={19} aria-hidden="true" />How to use it</h3><CopyBlock text={tool.prompt} label="Example prompt" /><ol className="cct-steps">{tool.use.map((step) => <li key={step}>{step}</li>)}</ol><div className="cct-outcome"><Check size={18} aria-hidden="true" /><p><strong>What to look for</strong>{tool.outcome}</p></div></section>
          </div>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Portal>;
}

export default function ClaudeCodeToolkitPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const headingRef = useRef(null);
  const lastTrigger = useRef(null);
  const tabListRef = useRef(null);
  const selectedTool = toolkitTools.find((tool) => tool.id === params.get("tool"));
  const category = toolkitCategories.find((item) => item.id === (selectedTool?.category || params.get("category"))) || toolkitCategories[0];
  const categoryTools = toolkitTools.filter((tool) => tool.category === category.id);
  const search = query.trim().toLowerCase();
  const visibleTools = categoryTools.filter((tool) => `${tool.name} ${tool.kind} ${tool.summary} ${tool.bestFor}`.toLowerCase().includes(search));
  const CategoryIcon = categoryIcons[category.icon];

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  const chooseCategory = (value) => {
    const next = new URLSearchParams(params);
    next.set("category", value);
    next.delete("tool");
    setQuery("");
    setParams(next, { preventScrollReset: true });
  };
  const chooseTool = (tool, event) => {
    lastTrigger.current = event.currentTarget;
    const next = new URLSearchParams(params);
    next.set("category", tool.category);
    next.set("tool", tool.id);
    setParams(next, { preventScrollReset: true });
  };
  const closeTool = () => {
    const next = new URLSearchParams(params);
    next.set("category", category.id);
    next.delete("tool");
    setParams(next, { preventScrollReset: true });
  };

  return <ApplicationPageShell title="25 Claude Code tools, organized by the job" description="Explore 25 Claude Code skills, plugins, and tools in seven categories, with summaries, installation instructions, and practical usage examples." canonicalPath="/portfolio/how-tos/claude-code-toolkit" type="article">
    <article className="cct-page">
      <header className="cct-page-header"><div className="cct-container">
        <Link className="cct-back" to="/portfolio/how-tos"><ArrowLeft size={16} aria-hidden="true" />All how-tos</Link>
        <h1>Choose the tool<br className="cct-title-break" /> for the job.</h1>
        <p className="cct-intro">A practical guide to the <strong>25 Claude Code add-ons</strong> in David Iya’s video. Find your category, explore a tool, and learn how to put it to work.</p>
        <div className="cct-source-line"><span>7 categories</span><span>Setup & usage examples</span><ExternalLink href={toolkitSource.href}>Watch the source video</ExternalLink></div>
      </div></header>
      <div className="cct-container cct-explorer">
        <Tabs.Root value={category.id} onValueChange={chooseCategory} activationMode="manual">
          <Tabs.List className="cct-tabs" aria-label="Tool categories" ref={tabListRef}>{toolkitCategories.map((item) => {
            const Icon = categoryIcons[item.icon];
            return <Tabs.Trigger key={item.id} value={item.id} onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}><Icon size={17} aria-hidden="true" /><span>{item.title}</span><small>{toolkitTools.filter((tool) => tool.category === item.id).length}</small></Tabs.Trigger>;
          })}</Tabs.List>
          <Tabs.Content key={category.id} value={category.id} className="cct-panel" tabIndex={0}>
            <div className="cct-category-heading"><div><h2><CategoryIcon size={25} aria-hidden="true" />{category.title}</h2><p>{category.description}</p></div><label className="cct-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search tools in {category.title}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${categoryTools.length} tools`} /></label></div>
            <p className="sr-only" role="status">{visibleTools.length} tools shown in {category.title}.</p>
            <ul className="cct-cards">{visibleTools.map((tool) => <li key={tool.id}><button type="button" className="cct-tool-card" onClick={(event) => chooseTool(tool, event)} aria-haspopup="dialog" aria-label={`Open ${tool.name} installation and usage guide`}><span className="cct-card-top"><span className="cct-card-icon"><CategoryIcon size={23} aria-hidden="true" /></span><span className="cct-card-kind">{tool.kind}</span></span><strong className="cct-card-name">{tool.name}</strong><span className="cct-card-summary">{tool.summary}</span><span className="cct-card-action">Installation & guide<ArrowRight size={17} aria-hidden="true" /></span></button></li>)}</ul>
            {!visibleTools.length && <div className="cct-empty"><Search size={26} aria-hidden="true" /><h3>No matching tools in {category.title}.</h3><p>Try a tool name or browse another category.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
            <aside className="cct-category-tip"><span className="cct-tip-icon"><CategoryIcon size={21} aria-hidden="true" /></span><div><h3>{category.question}</h3><p>{category.guidance}</p></div></aside>
          </Tabs.Content>
        </Tabs.Root>
        <section className="cct-get-started" aria-labelledby="cct-get-started-title"><h2 id="cct-get-started-title">Try one tool on one real task.</h2><p>Choose a small job you already understand. Install the relevant tool, use the example as a starting point, and compare the result with your usual workflow. Keep the addition if it makes that work easier.</p><dl><div><dt>Skill</dt><dd>Instructions and supporting files that teach an agent a repeatable task.</dd></div><div><dt>Plugin</dt><dd>A package that can bundle skills, commands, hooks, or integrations.</dd></div><div><dt>CLI / service</dt><dd>A program that needs a working runtime connection, beyond copying instructions.</dd></div></dl></section>
        <footer className="cct-provenance"><h2>From the video to a usable reference.</h2><p>The seven categories and 25 tool names come from <ExternalLink href={toolkitSource.href}>{toolkitSource.author}’s video</ExternalLink>. This guide expands the short descriptions with maintainer-linked setup notes and authored usage examples. The video calls the collection “plugins”; the labels here distinguish the different types.</p><p>Setup references were reviewed on {toolkitSource.reviewed}. The video’s popularity counts and implied savings are not reproduced as verified measurements. Installation and usage commands are provided for you to run; this page does not install software.</p><details><summary>Video category timestamps</summary><ul>{toolkitCategories.map((item) => <li key={item.id}><span>{item.time}</span>{item.title}</li>)}</ul><p>Approximate windows for the on-screen category reveals in the 40-second video.</p></details></footer>
      </div>
    </article>
    <Dialog.Root open={Boolean(selectedTool)} onOpenChange={(open) => { if (!open) closeTool(); }}>
      {selectedTool && <ToolDetails key={selectedTool.id} tool={selectedTool} category={category} headingRef={headingRef} onCloseAutoFocus={(event) => {
        event.preventDefault();
        const target = lastTrigger.current?.isConnected ? lastTrigger.current : tabListRef.current?.querySelector('[data-state="active"]');
        target?.focus({ preventScroll: true });
      }} />}
    </Dialog.Root>
  </ApplicationPageShell>;
}
