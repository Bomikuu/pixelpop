import data from "./interviewReference.json";
import glossary from "./interviewTechnologyGlossary.json";

export const referenceGroups = [
  { id: "stories", title: "Tell your story", description: "Structure an answer, connect it to your work, and describe evidence precisely.", sections: ["answer-frameworks", "project-stories", "metrics"] },
  { id: "applications", title: "Build applications", description: "Frontend, APIs, data, accessibility and engineering quality.", sections: ["frontend-architecture", "react", "vue-nuxt", "api-design", "backend-terms", "ui-ux", "quality"] },
  { id: "systems", title: "Design reliable systems", description: "Architecture, production incidents, cloud operations and security boundaries.", sections: ["system-design", "incident-scenarios", "deployment", "cloud-computing", "security", "security-diagrams"] },
  { id: "delivery", title: "Lead and deliver", description: "Team decisions, collaboration, ownership and delivery practices.", sections: ["agile-delivery", "leadership"] },
  { id: "product", title: "Understand the product", description: "Business language, product decisions, growth signals and AI integration.", sections: ["business-terms", "product-thinking", "seo", "ai-integration"] },
  { id: "practice", title: "Practice and review", description: "Video references and a manageable weekly practice routine.", sections: ["courses", "weekly-routine"] },
];

export const referenceSections = data.navigation;
const labelFor = (id) => referenceSections.find((section) => section.id === id)?.label || id;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text = (id, title, body, extra = {}) => body ? { id, title, body, ...extra } : null;
const list = (id, title, items) => items?.length ? { id, title, items } : null;

function topic(sectionId, entry, index, title, sections, extra = {}) {
  return {
    id: `${sectionId}/${entry.id || `${index + 1}-${slug(title)}`}`,
    sectionId,
    sectionTitle: labelFor(sectionId),
    groupId: referenceGroups.find((group) => group.sections.includes(sectionId)).id,
    title,
    sections: sections.filter(Boolean),
    technologies: entry.technologyExamples || [],
    terms: entry.terms || [],
    ...extra,
  };
}

function questionTopics(sectionId, items) {
  return items.map((item, index) => topic(sectionId, item, index, item.question, [
    text("idea", "Core answer", item.coreAnswer, { lead: true }),
    text("example", "In practice", item.example),
    text("mistake", "A mistake to avoid", item.commonMistake, { caution: true }),
    list("terms", "Terms to use naturally", item.terms),
  ]));
}

function storyTopics(sectionId, items) {
  return items.map((item, index) => topic(sectionId, item, index, item.title, [
    text("idea", "Core answer", item.coreAnswer, { lead: true }),
    text("intent", "What the interviewer is looking for", item.interviewerIntent),
    text("example", "Example answer", item.exampleAnswer),
    text("evidence", "Connect it to your work", item.projectProof),
    list("terms", "Terms to remember", item.terms),
    text("mistake", "A mistake to avoid", item.commonMistake, { caution: true }),
  ], { prompt: item.prompt }));
}

const topics = [
  ...data.answerFrameworks.map((item, index) => topic("answer-frameworks", item, index, item.title, [
    { id: "structure", title: "Structure your answer", sequence: item.formula.split(" → ") },
    text("example", "Example answer", item.example),
  ])),
  ...storyTopics("project-stories", data.projectStories),
  ...data.businessTermGroups.flatMap((group) => group.items.map((item, index) => topic("business-terms", item, index, `${item.term}: ${item.expanded}`, [
    text("idea", "What it means", item.definition, { lead: true }),
    text("value", "Why the business cares", item.businessValue),
    text("example", "Connect it to your work", item.portfolioExample),
    text("answer", "Interview phrasing", item.interviewExample),
    list("examples", "Examples", item.examples),
  ], { subgroup: group.title, subgroupDescription: group.description, terms: [item.term] }))),
  ...storyTopics("system-design", data.architectureTopics),
  topic("incident-scenarios", { id: "response-pattern" }, 0, "A repeatable incident response", [
    { id: "steps", title: "Work through the incident", steps: data.incidentResponsePattern.map((item) => ({ title: item.title, detail: item.description })) },
  ]),
  ...data.incidentScenarios.map((item, index) => topic("incident-scenarios", item, index, item.title, [
    text("situation", "The situation", item.situation, { lead: true }),
    text("rule", "The first rule", item.firstRule, { caution: true }),
    { id: "steps", title: "Work through the incident", steps: item.steps },
    list("signals", "Signals to inspect", item.signals),
    text("decision", "Make the scaling decision", item.scaleDecision),
    text("answer", "Interview answer", item.interviewAnswer),
  ])),
  ...data.backendConcepts.map((item, index) => topic("backend-terms", item, index, item.term, [
    text("idea", "What it means", item.definition, { lead: true }),
    text("recognize", "You may already use it when", item.youMayUseItWhen),
    text("example", "Project example", item.projectExample),
    text("answer", "Interview phrasing", item.interviewExample),
  ], { terms: [item.term] })),
  ...data.apiStyles.map((item, index) => topic("api-design", item, index, item.title, [
    text("idea", "What it means", item.definition, { lead: true }),
    text("recognize", "Recognize it in a project", item.youMayUseItWhen),
    text("example", "Follow an example", item.example),
    text("choose", "When to choose it", item.chooseWhen),
    text("mistake", "What to watch for", item.watchFor, { caution: true }),
  ])),
  ...questionTopics("api-design", data.apiQuestions),
  ...questionTopics("frontend-architecture", data.frontendArchitectureTopics),
  ...questionTopics("deployment", data.deploymentTopics),
  ...questionTopics("cloud-computing", data.cloudComputingTopics),
  ...questionTopics("ui-ux", data.uiUxTopics),
  ...questionTopics("quality", data.qualityTopics),
  ...questionTopics("security", data.securityTopics),
  ...data.securityDiagramScenarios.map((item, index) => topic("security-diagrams", item, index, item.title, [
    text("idea", "Core answer", item.coreAnswer, { lead: true }),
    text("framing", "The important distinction", item.seniorFraming),
    ...(item.flows || []).map((flow) => ({ id: flow.id, title: flow.label, flow })),
    item.controlMappings?.length ? { id: "controls", title: "Compare the controls", mappings: item.controlMappings, headers: item.mappingHeaders || ["Threat", "Controls", "Why it matters"] } : null,
    { id: "steps", title: "Step-by-step explanation", steps: item.steps },
    text("answer", "Interview answer", item.interviewAnswer),
    list("terms", "Terms to remember", item.terms),
    text("mistake", "A mistake to avoid", item.commonMistake, { caution: true }),
  ], { prompt: item.question })),
  ...data.frontendSections.flatMap((section) => questionTopics(section.id, section.items)),
  ...questionTopics("agile-delivery", data.agileDeliveryTopics),
  ...questionTopics("leadership", data.leadershipTopics),
  ...questionTopics("ai-integration", data.aiTopics),
  ...questionTopics("product-thinking", data.productThinkingTopics),
  ...data.seoReference.workstreams.map((item, index) => topic("seo", item, index, item.title, [
    text("idea", "What to understand", item.description, { lead: true }),
    list("checks", "What to check", item.checks),
  ], { prompt: item.signal, technologies: item.tools })),
  ...data.seoReference.linkTypes.map((item, index) => topic("seo", item, index, item.title, [
    text("idea", "What the link means", item.description, { lead: true }),
    { id: "path", title: "Follow the link", sequence: [item.from, item.to] },
    text("checks", "What to check", item.check),
  ])),
  topic("seo", { id: "review-rhythm" }, 0, "A useful SEO review rhythm", [
    { id: "cadence", title: "Choose the right review window", steps: data.seoReference.reviewCadence.map((item) => ({ title: item.when, detail: item.focus })) },
    text("answer", "Frame the senior answer", data.seoReference.seniorAnswer),
    text("proof", "Connect it to your work", data.seoReference.portfolioProof),
  ]),
  ...data.metricGuidance.map((item, index) => topic("metrics", item, index, ["Describe your contribution", "Name the performance evidence", "Explain what scalable means", "Be clear about your expertise", "Describe operational ownership", "Make reliability concrete"][index], [
    text("use", "Use this phrasing", item.strong, { lead: true }),
    text("avoid", "Avoid this phrasing", item.weak, { caution: true }),
    text("reason", "Why the distinction matters", item.reason),
  ])),
  ...data.courses.map((item, index) => topic("courses", item, index, item.title, [
    text("idea", "What to take away", item.takeaway, { lead: true }),
    { id: "video", title: "Watch the lesson", video: item },
  ], { subgroup: item.module, attribution: item.source })),
  ...data.weeklyRoutine.map((item, index) => topic("weekly-routine", item, index, `${item.day}: ${item.focus}`, [
    text("exercise", "Your practice for today", item.exercise, { lead: true }),
  ])),
];

// Keep group and section ordering deliberate, independent of the source's keys.
export const referenceTopics = referenceGroups.flatMap((group) => group.sections.flatMap((sectionId) => topics.filter((item) => item.sectionId === sectionId)));
export const topicById = new Map(referenceTopics.map((item) => [item.id, item]));

function normalizeTechnologyKey(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return glossary.aliases?.[normalized] || normalized;
}

export function getTechnologyDetail(item) {
  const exact = glossary.entries?.[normalizeTechnologyKey(item)];
  if (exact) return { ...exact, example: exact.howToDiscuss || exact.example };
  const separator = [" or ", " and "].find((candidate) => item.toLowerCase().includes(candidate));
  if (separator) {
    const labels = item.split(new RegExp(separator, "i")).map((label) => label.trim()).filter(Boolean);
    const parts = labels.map((label) => glossary.entries?.[normalizeTechnologyKey(label)]);
    if (labels.length === 2 && parts.every(Boolean)) {
      const [left, right] = parts;
      return {
        category: separator.trim() === "or" ? "Technology comparison" : "Technology combination",
        definition: `${labels[0]}: ${left.definition} ${labels[1]}: ${right.definition}`,
        whyItMatters: `${left.whyItMatters} ${right.whyItMatters}`,
        example: separator.trim() === "or"
          ? `Define the requirement first, compare ${labels[0]} and ${labels[1]} against scale, ownership, operations, and failure behavior, then justify the simpler adequate option.`
          : `Explain the boundary between ${labels[0]} and ${labels[1]}, the contract joining them, and how you observe or test that integration.`,
        caution: `${left.caution} ${right.caution}`,
        sources: [left.source, right.source].filter(Boolean),
      };
    }
  }
  const family = glossary.families?.find(({ keywords }) => keywords.some((keyword) => item.toLowerCase().includes(keyword))) || glossary.defaultDetail;
  return {
    category: family.category,
    definition: family.definition.replaceAll("{term}", item),
    whyItMatters: family.whyItMatters.replaceAll("{term}", item),
    example: family.howToDiscuss.replaceAll("{term}", item),
    caution: family.caution,
  };
}

export function technologyTopic(label, origin) {
  const detail = getTechnologyDetail(label);
  return {
    id: `technology/${label}`,
    title: label,
    groupId: origin.groupId,
    sectionId: origin.sectionId,
    sectionTitle: detail.category || "Technology reference",
    terms: [label], technologies: [],
    sections: [
      text("idea", "What it means", detail.definition, { lead: true }),
      text("value", "Why it matters", detail.whyItMatters),
      text("example", "How to discuss it", detail.example),
      text("mistake", "Keep in mind", detail.caution, { caution: true }),
      [...new Set([detail.source, ...(detail.sources || [])].filter(Boolean))].length ? { id: "sources", title: "Further reading", sources: [...new Set([detail.source, ...(detail.sources || [])].filter(Boolean))] } : null,
    ].filter(Boolean),
  };
}
