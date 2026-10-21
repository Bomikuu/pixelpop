export const portfolioLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/boomiyaah/" },
  { label: "GitHub", href: "https://github.com/Bomikuu" },
  { label: "Email", href: "mailto:mico.dahang@gmail.com" },
];

export const portfolioIntroduction = {
  summary: "I'm a senior frontend developer and technical lead in Davao City. I build web applications with React, Vue, and Django.",
  approach: "I spend most of my time on the screens people use every day: maps, forms, dashboards, and operational tools. I work through loading, error, and small-screen states alongside the main flow.",
};

export const projects = [
  {
    id: "cortico",
    title: "Cortico",
    type: "Healthcare platform and growth system",
    summary:
      "I worked on Cortico's frontend, clinic search, and content management, including technical SEO and page performance.",
    role: "Frontend lead · Full-stack contributor · SEO and performance",
    link: "https://cortico.health/",
    linkLabel: "Visit Cortico",
    technologies: ["Vue", "Nuxt", "Django", "Strapi", "Mapbox", "Tailwind CSS", "Hotjar"],
    outcomes: [
      "936K Search Console clicks and 137M impressions in the supplied reporting view.",
      "170.6K organic traffic and 36.4K organic keywords in the supplied SEO overview.",
      "Core Web Vitals passed, with mobile LCP at 1 second in the supplied report.",
      "PQL performance tracked against a monthly target of 35; July reached 34 in the supplied view.",
    ],
    metrics: [
      { value: 936, suffix: "K", label: "Search Console clicks", detail: "Supplied reporting view", featured: true },
      { value: 137, suffix: "M", label: "Search impressions", detail: "Supplied reporting view", featured: true },
      { value: 170.6, suffix: "K", precision: 1, label: "Organic traffic" },
      { value: 36.4, suffix: "K", precision: 1, label: "Organic keywords" },
      { value: 94, label: "Mobile performance score" },
      { value: 34, suffix: "/35", label: "July PQL result" },
    ],
  },
  {
    id: "walkspan",
    title: "Walkspan",
    type: "Walkability and neighborhood discovery",
    summary:
      "I led the frontend development of an interactive map that helps people inspect what is within walking distance and understand the character of a neighborhood before choosing an area.",
    role: "Frontend lead · Frontend architecture",
    link: "https://walkspan.ai/",
    linkLabel: "Visit Walkspan",
    linkProminent: true,
    technologies: ["Vue", "Nuxt", "Mapbox GL", "WebGL", "Responsive UI"],
    outcomes: [
      "Built selectable neighborhood views for 0.25, 0.5, and 1 mile walking radius options.",
      "Mapped nearby food, services, shops, transit, and leisure establishments within each area.",
      "Scored nature through tree cover and classified architecture as prewar, modern, or postwar.",
      "Measured commercial or residential energy, comfort from shade and seating, and quiet from surrounding noise levels.",
      "Supported address comparison with side-by-side maps and character scores for faster neighborhood decisions.",
    ],
    slides: [
      {
        src: "/portfolio/walkspan/walkspan-neighborhood-entry.webp",
        title: "Explore a neighborhood",
        caption: "Start from an address and move directly into its dashboard, must-haves, comparisons, essentials, and neighborhood character.",
        alt: "Walkspan neighborhood map centered on 845 United Nations Plaza with discovery navigation",
      },
      {
        src: "/portfolio/walkspan/walkspan-neighborhood-dashboard.webp",
        title: "Walkability at three distances",
        caption: "Compare what is available within 0.25, 0.5, and 1 mile, including establishment totals and neighborhood character ratings.",
        alt: "Walkspan dashboard showing walking distances, establishment categories, and neighborhood ratings",
      },
      {
        src: "/portfolio/walkspan/walkspan-establishments-map.webp",
        title: "Establishments within reach",
        caption: "Inspect food, services, shops, transit, and leisure destinations across the selected walking radius.",
        alt: "Walkspan satellite map showing establishment markers and walking radius boundaries",
      },
      {
        src: "/portfolio/walkspan/walkspan-address-comparison.webp",
        title: "Compare neighborhoods",
        caption: "Review multiple addresses together across nature, architecture, energy, comfort, and quiet character scores.",
        alt: "Walkspan address comparison view with three neighborhood maps and a nature score chart",
      },
      {
        src: "/portfolio/walkspan/walkspan-establishment-details.webp",
        title: "Inspect nearby places",
        caption: "Open an establishment to review its location, ratings, photos, walking distance, duration, steps, and other trip details.",
        alt: "Walkspan map with a selected establishment detail panel and walking metrics",
      },
    ],
  },
  {
    id: "dineease",
    title: "DineEase",
    type: "Restaurant operations platform · Ongoing",
    summary:
      "A restaurant platform we're developing at ASTA. It brings customer ordering together with staff tools, menus, reservations, and payments.",
    role: "Co-founder · Technical Lead · Frontend architecture",
    link: "/portfolio/dineease",
    linkLabel: "Explore DineEase",
    technologies: ["Nuxt", "Vue", "Django", "WebSockets", "Stripe", "Mapbox", "PostgreSQL"],
    outcomes: [
      "Calendar, reservations, employee management, attendance, and analytics.",
      "Real-time order feed, counter kiosk, customer display, and poster kiosk.",
      "Automated menu setup with editable table-menu and poster design tools.",
      "Map-based ordering, promotions, pricing logic, and partner operations.",
    ],
    slides: [
      { src: "/portfolio/dineease/01-restaurant-workspace.png", title: "Restaurant workspace", caption: "Restaurant setup, service readiness, and live operational controls.", alt: "DineEase restaurant operations workspace" },
      { src: "/portfolio/dineease/11-live-order-dashboard.png", title: "Live order feed", caption: "Incoming orders, sales context, and service controls in one view.", alt: "DineEase live order dashboard" },
      { src: "/portfolio/dineease/12-kiosk-registry.png", title: "Kiosk system", caption: "Provisioned counter devices with paired customer displays.", alt: "DineEase counter kiosk device registry" },
      { src: "/portfolio/dineease/13-menu-publishing.png", title: "Menu publishing", caption: "Poster screens, guided layouts, and QR table-menu publishing.", alt: "DineEase menu publishing studio" },
    ],
  },
  {
    id: "pixelcore",
    title: "PixelCore",
    type: "Connected business operating system",
    summary:
      "A shared business workspace connecting public sites, commerce, bookings, events, operations, workforce, point of sale, and customer displays.",
    role: "Product architecture / Frontend systems / Full-stack delivery",
    link: "/portfolio/pixelcore",
    linkLabel: "Explore PixelCore",
    technologies: ["Nuxt", "Vue", "TypeScript", "Django", "PostgreSQL", "Tailwind CSS", "shadcn/ui", "Three.js"],
    outcomes: [
      "Connected storefronts, service bookings, event sites, public business cards, and displays to business-owned content.",
      "Unified products, services, variants, inventory rules, promotions, point of sale, and customer ordering around one catalog.",
      "Linked calendars, venues, guests, staff, capacity, and event operations through a shared scheduling model.",
      "Brought inventory, suppliers, purchasing, finance, workforce, attendance, and reporting into the same operational workspace.",
    ],
    slides: [
      { src: "/portfolio/pixelcore/01-platform-landing.png", title: "Connected platform", caption: "Shared business information used by the public site and internal tools.", alt: "PixelCore platform landing page" },
      { src: "/portfolio/pixelcore/04-published-storefront.png", title: "Published storefront", caption: "A customer-facing storefront built from the shared catalog and brand system.", alt: "Published PixelCore storefront" },
      { src: "/portfolio/pixelcore/11-calendar-reservations.png", title: "Calendar and venues", caption: "Bookings, resources, capacity, and events in one scheduling workspace.", alt: "PixelCore calendar and venue scheduling workspace" },
      { src: "/portfolio/pixelcore/14-operations.png", title: "Connected operations", caption: "Inventory, purchasing, finance, and reporting linked through shared records.", alt: "PixelCore operations workspace" },
      { src: "/portfolio/pixelcore/16-display-studio.png", title: "Display studio", caption: "Business content repurposed for posters, menus, promotions, and live customer screens.", alt: "PixelCore display authoring studio" },
    ],
  },
  {
    id: "traidify",
    title: "Traidify",
    type: "Financial analytics platform",
    summary:
      "A data-heavy financial product for exploring stocks and blockchain assets, understanding risk, and accessing subscription-based analytics.",
    role: "Full-stack developer · Frontend engineer",
    link: null,
    linkLabel: "Selected project",
    technologies: ["React", "Material UI", "Redux-Saga", "Django", "Python", "Charts"],
    outcomes: [
      "Built dashboard navigation and real-time market interfaces.",
      "Implemented a risk-tolerance quiz and personalized investor flows.",
      "Developed technical-analysis charts, memberships, and payments.",
    ],
    slides: [
      { placeholder: true, title: "Market dashboard", caption: "Dashboard screenshots are not available." },
      { placeholder: true, title: "Risk profile", caption: "Risk-profile screenshots are not available." },
      { placeholder: true, title: "Technical analysis", caption: "Chart screenshots are not available." },
    ],
  },
];

export const technologies = [
  { name: "React", icon: "react.svg", group: "Interface" },
  { name: "Vue", icon: "vue.svg", group: "Interface" },
  { name: "Nuxt", icon: "nuxt.svg", group: "Interface" },
  { name: "Tailwind CSS", icon: "tailwind.svg", group: "Interface" },
  { name: "TypeScript", icon: "typescript.svg", group: "Experience" },
  { name: "JavaScript", icon: "javascript.svg", group: "Experience" },
  { name: "shadcn/ui", icon: "shadcn.svg", group: "Experience" },
  { name: "Three.js", icon: "three.svg", group: "Experience" },
  { name: "Figma", icon: "figma.svg", group: "Experience" },
  { name: "Django", icon: "django.svg", group: "Backend" },
  { name: "Python", icon: "python.svg", group: "Backend" },
  { name: "Node.js", icon: "node.svg", group: "Backend" },
  { name: "PostgreSQL", icon: "postgresql.svg", group: "Backend" },
  { name: "Docker", icon: "docker.svg", group: "Delivery" },
  { name: "Nginx", icon: "nginx.svg", group: "Delivery" },
  { name: "AWS", icon: "aws.svg", group: "Delivery" },
  { name: "Git", icon: "git.svg", group: "Delivery" },
  { name: "Mapbox", icon: "mapbox.svg", group: "Delivery" },
];

export const services = [
  { id: "frontend-architecture", title: "Frontend architecture", description: "Scalable interface foundations, component systems, and technical decisions that keep teams moving.", detail: "Systems and standards" },
  { id: "product-ui", title: "Product UI development", description: "Accessible, responsive interfaces built around real workflows, content, and measurable product goals.", detail: "React, Vue, and Nuxt" },
  { id: "full-stack", title: "Full-stack delivery", description: "Frontend-led product development connected cleanly to APIs, data models, authentication, and deployment.", detail: "Product to production" },
  { id: "design-systems", title: "Design systems", description: "Reusable patterns, tokens, documentation, and quality controls that make product teams more consistent.", detail: "UI foundations" },
  { id: "seo", title: "Technical SEO", description: "Search-ready architecture, structured content, indexation strategy, measurement, and conversion-minded growth.", detail: "Visibility and acquisition" },
  { id: "performance", title: "Performance optimization", description: "Core Web Vitals, rendering, loading strategy, and interaction work that improves real-user experience.", detail: "Speed and stability" },
  { id: "integration", title: "API and system integration", description: "Practical connections between product surfaces, business systems, maps, payments, analytics, and CMS tools.", detail: "Connected workflows" },
  { id: "leadership", title: "Technical leadership", description: "Clear planning, reviews, mentorship, and delivery ownership for teams handling complex frontend work.", detail: "Teams and delivery" },
];

export const processSteps = [
  { id: "discovery", title: "Discovery", shortTitle: "Understand the problem", description: "We discuss who uses the product, what isn't working, and any constraints on the project.", outcome: "An agreed problem to solve", points: ["Who uses the product", "What already exists", "Requirements and constraints"], image: "/portfolio/assets/process/01-discovery.webp", imageAlt: "Product discovery workshop" },
  { id: "planning", title: "Planning", shortTitle: "Plan the work", description: "I break the requirements into tasks and explain the technical choices, dependencies, and likely sequence.", outcome: "A scope and delivery plan", points: ["Scope and priorities", "Technical choices", "Milestones and dependencies"], image: "/portfolio/assets/process/02-planning.webp", imageAlt: "Project planning" },
  { id: "experience", title: "Experience design", shortTitle: "Work through the screens", description: "We review how people will move through the application, including errors and small-screen layouts.", outcome: "Screens and behavior ready to review", points: ["Page structure", "Mobile layouts", "Accessibility and error states"], image: "/portfolio/assets/process/03-experience-design.webp", imageAlt: "Interface wireframing" },
  { id: "development", title: "Development", shortTitle: "Build the features", description: "I build the components and connect them to the APIs. You can review features as they become ready.", outcome: "Working features for review", points: ["Component implementation", "API integration", "Loading and performance"], image: "/portfolio/assets/process/04-development.webp", imageAlt: "Application development" },
  { id: "validation", title: "Validation", shortTitle: "Check before release", description: "I check the affected pages across screen sizes and browsers, including keyboard use and error handling.", outcome: "Release checks and remaining issues", points: ["Visual and mobile review", "Accessibility checks", "Browser and behavior checks"], image: "/portfolio/assets/process/05-validation.webp", imageAlt: "Application review" },
  { id: "launch", title: "Launch and improve", shortTitle: "Release and follow up", description: "I help with the release, review the available data, and discuss what needs attention next.", outcome: "A release and follow-up list", points: ["Release coordination", "Analytics and search reports", "Follow-up work"], image: "/portfolio/assets/process/06-launch.webp", imageAlt: "Product launch" },
];

export const experience = [
  {
    period: "Mar 2021 — present",
    company: "ASTA Softwares",
    title: "Co-founder & Technical Lead",
    detail: "Frontend architecture, product delivery, mentorship, code review, and full-stack coordination across business and interactive products.",
  },
  {
    period: "Aug 2019 — Dec 2025",
    company: "Countable Web Productions",
    title: "Software Developer · Frontend-focused full-stack",
    detail: "Worked on healthcare platforms, content systems, and interactive maps, including clinic marketing pages and technical SEO.",
  },
  {
    period: "Feb 2022 — Feb 2023",
    company: "Traidify",
    title: "Software Developer",
    detail: "Financial dashboards, risk profiling, real-time charts, memberships, and payment-gated analytics.",
  },
  {
    period: "Jan 2021 — Aug 2021",
    company: "Big Oil Co",
    title: "Lead Software Developer",
    detail: "Employee hiring and inventory systems with operational workflows and Google API integrations.",
  },
  {
    period: "May 2018 — Aug 2019",
    company: "Apollo Technologies Inc.",
    title: "Software Developer",
    detail: "Android asset, inventory, workforce, warehouse, and kiosk systems alongside API integration, infrastructure support, and deployment documentation.",
  },
];

export const education = [
  {
    period: "2014 — 2018",
    school: "Ateneo de Davao University",
    program: "Bachelor of Science, Major in Computer Science",
    note: "President's Lister · First Semester 2017",
  },
  {
    period: "2010 — 2014",
    school: "Nieves Villarica National High School",
    program: "Secondary Education",
    note: "Completed",
  },
];

export const certificationPlan = [
  {
    title: "Google Analytics Certification",
    focus: "Measurement and product analytics",
    href: "https://skillshop.withgoogle.com/",
  },
  {
    title: "AEO Fundamentals",
    focus: "Search, answer engines, and AI discovery",
    href: "https://academy.hubspot.com/courses/seo-training%EF%BB%BF",
  },
  {
    title: "Scrum Fundamentals Certified",
    focus: "Agile delivery and technical leadership",
    href: "https://www.scrumstudy.com/certification/scrum-fundamentals-certified",
  },
  {
    title: "Responsive Web Design",
    focus: "Accessible, standards-based frontend craft",
    href: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
  },
];

export const astaSlides = [
  { src: "/portfolio/assets/asta-team-01.jpg", alt: "ASTA Softwares team gathering around a dining table" },
  { src: "/portfolio/assets/asta-team-02.jpg", alt: "ASTA Softwares team celebrating together at a restaurant" },
  { src: "/portfolio/assets/asta-team-03.jpg", alt: "ASTA Softwares team group photo at Camp Sabros" },
  { src: "/portfolio/assets/asta-team-04.jpg", alt: "ASTA Softwares team holding holiday gifts" },
];
