import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ScanEye } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import ApplicationPageShell from "../../application/ApplicationPageShell";
import { designStyles, designStylesSource } from "../designStyles";
import { styleCategories, styleImagePath, styleRecipes } from "./styleRecipes";
import StylePromptBuilder from "./StylePromptBuilder";
import "./designStylesGuide.css";

export default function DesignStylesGuidePage() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const [category, setCategory] = useState("all");
  const workbenchRef = useRef(null);
  const requestedStyle = params.get("style") || hash.replace("#design-style-", "");
  const selectedStyle = designStyles.find((style) => style.slug === requestedStyle) || designStyles[0];
  const recipe = styleRecipes[selectedStyle.slug];
  const visibleStyles = designStyles.filter((style) => category === "all" || styleRecipes[style.slug].category === category);

  useLayoutEffect(() => {
    if (hash === "#style-workbench" || hash.startsWith("#design-style-")) workbenchRef.current?.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
  }, []);

  const chooseStyle = (slug) => {
    const next = new URLSearchParams(params);
    next.set("style", slug);
    setParams(next, { replace: true, preventScrollReset: true });
    workbenchRef.current?.focus({ preventScroll: true });
    workbenchRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return <ApplicationPageShell title="Design styles to recognize" description="Compare 14 illustrated design styles, learn their visual traits and tradeoffs, and build copyable prompts for interfaces and illustrations." canonicalPath="/portfolio/how-tos/design-styles" type="article">
    <article className="design-styles-guide">
      <header className="dsg-header"><div className="dsg-container"><Link className="dsg-back" to="/portfolio/how-tos"><ArrowLeft size={16} aria-hidden="true" />All how-tos</Link><h1>Design styles to recognize</h1><p className="dsg-lead">Compare the same learning workspace in 14 styles, then turn the visual traits into a prompt.</p><nav className="dsg-page-links" aria-label="Guide sections"><a href="#style-gallery">Explore the examples<ArrowRight size={16} aria-hidden="true" /></a><a href="#style-workbench">Build a prompt<ArrowRight size={16} aria-hidden="true" /></a><a href="#prompt-method">Learn the method<ArrowRight size={16} aria-hidden="true" /></a></nav></div></header>
      <div className="dsg-container">
        <section id="style-gallery" className="dsg-gallery-section" aria-labelledby="dsg-gallery-title"><div className="dsg-section-heading"><h2 id="dsg-gallery-title">Choose a style to explore.</h2><p>Select an example to learn its visual traits and build a matching prompt.</p></div>
          <div className="dsg-filters" role="group" aria-label="Filter design styles">{styleCategories.map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.title}<span>{item.id === "all" ? designStyles.length : designStyles.filter((style) => styleRecipes[style.slug].category === item.id).length}</span></button>)}</div>
          <p className="sr-only" role="status">{visibleStyles.length} styles shown.</p>
          <ul className="dsg-style-gallery">{visibleStyles.map((style) => <li key={style.slug} id={`design-style-${style.slug}`}><button type="button" aria-pressed={selectedStyle.slug === style.slug} aria-label={`Explore ${style.title} and build a prompt`} onClick={() => chooseStyle(style.slug)}><span className={`dsg-preview${style.slug === "pixel-art" ? " dsg-pixel" : ""}`}><img src={styleImagePath(style.slug)} width="768" height="512" alt="" loading="lazy" decoding="async" /></span><span className="dsg-preview-name"><strong>{style.title}</strong>{selectedStyle.slug === style.slug ? <Check size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</span><small>{styleRecipes[style.slug].traits[0]}</small></button></li>)}</ul>
        </section>
        <section className="dsg-introduction" aria-labelledby="dsg-understand-title"><h2 id="dsg-understand-title">Look for the choices behind the name.</h2><p>These labels describe different things. Some name a material, others a layout or a visual world. They are useful starting points, and you can combine them.</p><dl className="dsg-families"><div><dt>Surfaces & materials</dt><dd>How something feels: soft clay, frosted glass, or a control pressed into a surface.</dd></div><div><dt>Layout & typography</dt><dd>How information is arranged: a modular grid, precise alignment, or an editorial reading rhythm.</dd></div><div><dt>Visual worlds</dt><dd>The broader character: pixel games, early-web gloss, paper collage, or a terminal screen.</dd></div></dl></section>
        <section id="style-workbench" className="dsg-workbench" aria-labelledby="dsg-selected-title" ref={workbenchRef} tabIndex={-1}>
          <div className="dsg-style-details"><div className="dsg-section-heading"><h2 id="dsg-selected-title">{selectedStyle.title}</h2><p>{selectedStyle.description}</p></div>
            <figure className={`dsg-selected-figure${selectedStyle.slug === "pixel-art" ? " dsg-pixel" : ""}`} key={selectedStyle.slug}><a href={styleImagePath(selectedStyle.slug)} target="_blank" rel="noopener noreferrer" aria-label={`Open the ${selectedStyle.title} example at full size in a new tab`}><img src={styleImagePath(selectedStyle.slug)} width="768" height="512" alt={`Study studio interpreted in ${selectedStyle.title}: ${recipe.traits.join(", ").toLowerCase()}.`} loading="lazy" decoding="async" /></a><figcaption>Generated teaching example. Select the image to see it full size.</figcaption></figure>
            <section className="dsg-recognize" aria-labelledby="dsg-recognize-title"><h3 id="dsg-recognize-title"><ScanEye size={21} aria-hidden="true" />How to recognize it</h3><ul>{recipe.traits.map((trait) => <li key={trait}><Check size={17} aria-hidden="true" /><span>{trait}</span></li>)}</ul></section>
            <dl className="dsg-style-notes"><div><dt>Try it for</dt><dd>{selectedStyle.useCase}</dd></div><div><dt>Keep in mind</dt><dd>{selectedStyle.caution}</dd></div><div><dt>Words that help a prompt</dt><dd>{recipe.recipe}.</dd></div></dl>
            <a className="dsg-text-link" href="#style-gallery"><ArrowLeft size={16} aria-hidden="true" />Compare another style</a>
          </div>
          <StylePromptBuilder style={selectedStyle} recipe={recipe} />
        </section>
        <section id="prompt-method" className="dsg-method" aria-labelledby="dsg-method-title"><div className="dsg-section-heading"><h2 id="dsg-method-title">Describe decisions, not just a vibe.</h2><p>“Make it modern” leaves almost every choice open. A useful prompt says what you are making, who it serves, and how the style should show up.</p></div><dl><div><dt>Name the subject and purpose</dt><dd>“A learning workspace for first-time web designers” gives the image or interface something concrete to communicate.</dd></div><div><dt>Translate the style into visible traits</dt><dd>Ask for frosted panels and fine edges, or hard outlines and offset shadows. The style name alone is only a hint.</dd></div><div><dt>Specify composition and hierarchy</dt><dd>Name the focal subject or main action, the content that belongs together, and the reading order.</dd></div><div><dt>Set a palette and constraints</dt><dd>Say which colors to use and what to avoid. For interfaces, include readable type, contrast, keyboard states and mobile behavior.</dd></div><div><dt>Refine one thing at a time</dt><dd>After the first result, name a specific correction. For example: “Keep the layout; reduce the shadows and make the main action clearer.”</dd></div></dl><p className="dsg-method-note">When attaching a reference, say whether it defines style, composition, or an image to edit. Keep the actual product content and requirements explicit.</p></section>
        <footer className="dsg-sources"><h2>About these examples</h2><p>The 14 style names come from {designStylesSource.author}’s video. The visual-trait notes, generated illustrations, and adaptable prompts are teaching examples for this guide, rather than a transcript or a claim that every style suits every product.</p><p>Every image reinterprets a fictional “Study studio” with a book, notes, a plant, and learning items, so the visual choices are easier to compare.</p><p>A bento grid is a layout pattern; glassmorphism describes a surface treatment. The groupings help you compare them, rather than defining strict boundaries.</p><a className="dsg-text-link" href={designStylesSource.href} target="_blank" rel="noopener noreferrer">Watch the original video<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></footer>
      </div>
    </article>
  </ApplicationPageShell>;
}
