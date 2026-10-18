import {
  Blocks,
  ChartNoAxesCombined,
  CodeXml,
  Gauge,
  Layers3,
  SearchCheck,
  UsersRound,
  Workflow,
} from "lucide-react";

export const engagementOptions = [
  {
    id: "embedded-lead",
    title: "Embedded technical lead",
    description: "I join your existing team to write code, review changes, and help plan frontend work.",
    bestFor: "Teams that need an experienced frontend developer who can also lead technical work.",
    includes: ["Architecture and delivery planning", "Hands-on implementation", "Code review and team guidance"],
    icon: UsersRound,
    projectType: "Hire Mico - embedded leadership",
  },
  {
    id: "focused-build",
    title: "Focused product build",
    description: "Hire me for a defined feature or build. We agree on the scope and review it as development progresses.",
    bestFor: "A new application, a feature, an integration, or a specific set of fixes.",
    includes: ["Scope and technical approach", "Frontend-led full-stack delivery", "Release-ready implementation"],
    icon: CodeXml,
    projectType: "Hire Mico - focused product build",
  },
  {
    id: "asta-team",
    title: "ASTA delivery team",
    description: "Work with ASTA when the project needs several developers or design and development at the same time.",
    bestFor: "Multi-surface platforms, business systems, longer roadmaps, and products with several workstreams.",
    includes: ["Cross-functional delivery", "Shared technical leadership", "A team sized around the product"],
    icon: Layers3,
    projectType: "Build with ASTA team",
  },
];

export const problemsSolved = [
  {
    title: "Shared frontend components",
    description: "Build reusable components and organize application state so your team can work on new features.",
    icon: Blocks,
  },
  {
    title: "Application screens and flows",
    description: "Work through navigation, permissions, and screen behavior for applications with several user roles.",
    icon: Workflow,
  },
  {
    title: "Slow pages and interactions",
    description: "Investigate loading and rendering problems, make targeted changes, and compare the results.",
    icon: Gauge,
  },
  {
    title: "Technical search issues",
    description: "Check why pages aren't being indexed and review metadata, internal links, and content templates.",
    icon: SearchCheck,
  },
];

export const proofPoints = [
  {
    project: "Cortico",
    result: "936K clicks and 137M impressions",
    detail: "Frontend, clinic discovery, CMS surfaces, technical SEO, and product-qualified lead reporting.",
    href: "https://cortico.health/",
    external: true,
    icon: ChartNoAxesCombined,
  },
  {
    project: "Walkspan",
    result: "Interactive neighborhood maps",
    detail: "Frontend leadership for interactive radius maps, establishment discovery, and neighborhood scoring.",
    href: "/portfolio#walkspan",
    icon: SearchCheck,
  },
  {
    project: "DineEase",
    result: "One system across restaurant operations",
    detail: "Technical leadership for orders, kiosks, staff, menus, analytics, reservations, and live operations.",
    href: "/portfolio/dineease",
    icon: Workflow,
  },
  {
    project: "ASTA Softwares",
    result: "Co-founder and Technical Lead since 2021",
    detail: "Product planning, architecture, delivery standards, mentoring, and full-stack coordination.",
    href: "/asta",
    icon: UsersRound,
  },
];

export const fitCriteria = {
  good: [
    "You can explain who uses the product and what they need to do.",
    "We can discuss constraints and agree on scope before starting.",
    "You need frontend work that connects to backend systems.",
    "You want a senior contributor who can lead while staying hands-on.",
  ],
  notFit: [
    "The brief depends on copying another product without understanding the users.",
    "Speed means skipping accessibility, security, or the basic release safeguards.",
    "The scope is fixed before the problem and constraints can be discussed.",
    "You need guaranteed search rankings or sales results.",
  ],
};

export const matcherQuestions = [
  {
    id: "scope",
    question: "What are you building?",
    options: [
      { value: "focused", label: "A focused feature or frontend system", mico: 2, asta: 0 },
      { value: "platform", label: "A product with several connected surfaces", mico: 0, asta: 2 },
      { value: "review", label: "An existing product that needs direction", mico: 2, asta: 0 },
    ],
  },
  {
    id: "stage",
    question: "Where is the product today?",
    options: [
      { value: "idea", label: "Early concept or requirements", mico: 0, asta: 2 },
      { value: "shipping", label: "Actively shipping with a team", mico: 2, asta: 0 },
      { value: "scaling", label: "Live product with scaling pressure", mico: 2, asta: 1 },
    ],
  },
  {
    id: "help",
    question: "What kind of help matters most?",
    options: [
      { value: "leadership", label: "Architecture and senior technical leadership", mico: 3, asta: 0 },
      { value: "delivery", label: "A team that can own multiple workstreams", mico: 0, asta: 3 },
      { value: "frontend", label: "Hands-on frontend and product UI delivery", mico: 2, asta: 1 },
    ],
  },
  {
    id: "working-style",
    question: "How do you want to work together?",
    options: [
      { value: "individual", label: "Directly with a senior individual contributor", mico: 3, asta: 0 },
      { value: "team", label: "With a coordinated software team", mico: 0, asta: 3 },
      { value: "unsure", label: "I want help choosing the right setup", mico: 1, asta: 1 },
    ],
  },
];
