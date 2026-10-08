import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { datedResumeEntries, documentSections, sectionContent } from "./documentSections";
import "./resume.css";

function ResumeText({ children, inline = false }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
    img: () => null,
    // Old drafts may contain tables. Keep their text in row order, not columns.
    table: ({ children: text }) => <div>{text}</div>,
    thead: ({ children: text }) => <>{text}</>,
    tbody: ({ children: text }) => <>{text}</>,
    tr: ({ children: text }) => <p>{text}</p>,
    th: ({ children: text }) => <span>{text}{"; "}</span>,
    td: ({ children: text }) => <span>{text}{"; "}</span>,
    ...(inline ? { p: ({ children: text }) => <>{text}</> } : {}),
  }}>{children}</ReactMarkdown>;
}

export default function ResumeDocument({ body, profile, pageRef, layout = "original" }) {
  const heading = body.match(/^#\s+([^\r\n]+)(?:\r?\n|$)/);
  const content = heading ? body.slice(heading[0].length) : body;
  const contacts = [profile?.phone, profile?.email, profile?.location, profile?.portfolio_url].filter(Boolean);
  return <article ref={pageRef} className={`application-resume${layout === "original" ? " application-resume--original" : ""}`} aria-label={`Tailored résumé preview · ${layout === "original" ? "Original layout" : "ATS layout"}`}>
    <header className="resume-header">{(heading || profile?.full_name) && <h1>{heading ? <ReactMarkdown skipHtml components={{ p: ({ children }) => <>{children}</>, img: () => null }}>{heading[1]}</ReactMarkdown> : profile.full_name}</h1>}{contacts.length > 0 && <p>{contacts.join(layout === "original" ? ", " : " | ")}</p>}</header>
    {documentSections(content).filter((section) => section.body.trim()).map((section) => {
      const text = sectionContent(section), entries = datedResumeEntries(text);
      const label = section.title === "Header & introduction" ? "Introduction" : section.title === "Whole document" ? "Résumé" : section.title;
      const skills = /^skills(?:\s*&\s*speciali[sz]ation)?$/i.test(section.title.trim());
      return <section className={`resume-section${entries ? " resume-section--dated" : ""}${skills ? " resume-section--skills" : ""}`} key={section.id}>
        <h2 className="resume-label">{label}</h2>
        {entries ? entries.map((entry) => <div className="resume-entry" key={entry.id}>{layout === "original" && <p className="resume-date">{entry.date}</p>}<div className="resume-content">{entry.title && <h3><ResumeText inline>{entry.title}</ResumeText></h3>}{layout !== "original" && entry.date && <p className="resume-date">{entry.date}</p>}<ResumeText>{entry.body}</ResumeText></div></div>) : <div className="resume-content"><ResumeText>{text}</ResumeText></div>}
      </section>;
    })}
  </article>;
}
