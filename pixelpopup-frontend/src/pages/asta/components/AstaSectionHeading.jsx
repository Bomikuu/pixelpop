export default function AstaSectionHeading({ id, eyebrow, title, description, inverse = false }) {
  return (
    <header className={`asta-home-heading${inverse ? " asta-home-heading--inverse" : ""}`}>
      <div>
        {eyebrow ? <p className="asta-home-heading__eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
      </div>
      <p className="asta-home-heading__description">{description}</p>
    </header>
  );
}
