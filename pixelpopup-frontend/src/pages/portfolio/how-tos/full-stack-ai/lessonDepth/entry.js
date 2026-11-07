export default function depth(why, mechanism, input, walkthrough, output, decision, pitfall, question, answer, references) {
  return {
    context: [why, mechanism],
    workedExample: { input, walkthrough, output },
    decision,
    pitfall,
    check: { question, answer },
    references,
  };
}
