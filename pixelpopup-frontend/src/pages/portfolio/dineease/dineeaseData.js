export const dineEaseSlides = [
  { id: "restaurant-workspace", src: "/portfolio/dineease/01-restaurant-workspace.png", title: "Restaurant operations workspace", caption: "Restaurant identity, service readiness, operating schedule, and live order and reservation controls.", alt: "DineEase restaurant operations workspace showing restaurant setup and service controls" },
  { id: "menu-intelligence", src: "/portfolio/dineease/02-menu-intelligence.png", title: "Menu intelligence", caption: "A menu catalog with pricing, availability, nutrition readiness, and calorie context.", alt: "DineEase menu catalog showing menu items, calories, prices, and readiness" },
  { id: "restaurant-finder", src: "/portfolio/dineease/03-restaurant-finder.webp", title: "Restaurant discovery", caption: "Mapbox-powered restaurant browsing with a connected results sidebar and filters.", alt: "DineEase restaurant finder with a three-dimensional map and restaurant listing" },
  { id: "checkout", src: "/portfolio/dineease/04-checkout.png", title: "Checkout and fulfillment", caption: "Pickup or delivery, payment choices, a clear cost breakdown, and visible order calories.", alt: "DineEase checkout screen with delivery, payment, and calorie information" },
  { id: "promotions", src: "/portfolio/dineease/05-promotions.png", title: "Promotion studio", caption: "Restaurant-owned offers with status, schedules, codes, and minimum-order conditions.", alt: "DineEase promotion management screen with active restaurant offers" },
  { id: "calorie-cart", src: "/portfolio/dineease/06-calorie-cart.png", title: "Calorie-aware cart", caption: "A persistent cart keeps quantities, totals, and aggregated calories visible while guests browse.", alt: "DineEase public menu with a calorie-aware shopping cart drawer" },
  { id: "reservation-detail", src: "/portfolio/dineease/07-reservation-detail.png", title: "Reservation follow-up", caption: "Staff can inspect a booking and record outcomes such as dined-in or no-show.", alt: "DineEase reservation event detail dialog over the operations calendar" },
  { id: "calendar", src: "/portfolio/dineease/08-calendar.png", title: "Calendar and reservations", caption: "A monthly operations view for reservations, prep tasks, and optional Google Calendar sync.", alt: "DineEase calendar with reservations and restaurant tasks" },
  { id: "attendance-terminal", src: "/portfolio/dineease/09-attendance-terminal.png", title: "Attendance terminal", caption: "Administrators provision shared restaurant tablets with a short-lived setup code.", alt: "DineEase restaurant attendance terminal setup screen" },
  { id: "employee-dashboard", src: "/portfolio/dineease/10-employee-dashboard.png", title: "Employee operations", caption: "Invitations, documents, attendance, leave review, and staff status in one workspace.", alt: "DineEase employee and attendance dashboard" },
  { id: "live-orders", src: "/portfolio/dineease/11-live-order-dashboard.png", title: "Live order command center", caption: "Incoming orders, sales context, order health, and service controls update in one operational view.", alt: "DineEase live incoming-order dashboard with order and sales cards" },
  { id: "kiosk-registry", src: "/portfolio/dineease/12-kiosk-registry.png", title: "Counter kiosk registry", caption: "Restaurant owners provision, inspect, rotate, or disable shared counter devices.", alt: "DineEase counter kiosk registry and device setup guide" },
  { id: "menu-publishing", src: "/portfolio/dineease/13-menu-publishing.png", title: "Poster and table-menu publishing", caption: "Existing catalog data becomes screen posters, guided layouts, or interactive QR table menus.", alt: "DineEase menu publishing studio with displays and live poster preview" },
  { id: "analytics", src: "/portfolio/dineease/14-analytics.png", title: "Restaurant analytics", caption: "Sales, order health, average order value, top items, and busiest hours stay visible together.", alt: "DineEase analytics dashboard with sales and order performance" },
  { id: "profit-costs", src: "/portfolio/dineease/15-profit-costs.png", title: "Profit and costs", caption: "Revenue, food cost, expenses, net profit, and menu-item profitability support practical decisions.", alt: "DineEase profit and costs workspace with menu profitability rows" },
  { id: "event-logs", src: "/portfolio/dineease/16-event-logs.png", title: "Business event logs", caption: "A searchable audit trail connects operational changes to people, restaurants, amounts, and statuses.", alt: "DineEase business event log with filters and an activity timeline" },
];

export const dineEasePillars = [
  {
    id: "operate",
    icon: "store",
    title: "Run service from one workspace",
    summary: "Restaurant setup, opening controls, live orders, and counter workflows share the same operational context.",
    image: "/portfolio/dineease/01-restaurant-workspace.png",
    imageAlt: "DineEase restaurant operations workspace",
    features: ["Restaurant profile, location, media, hours, and readiness guidance", "Independent controls for incoming orders and reservations", "Live order feed, service states, sales cards, and fast actions", "Counter kiosks and paired read-only customer displays"],
  },
  {
    id: "publish",
    icon: "screens",
    title: "Publish menus with useful food context",
    summary: "Menu data stays reusable across guest ordering, counter displays, posters, and QR table experiences.",
    image: "/portfolio/dineease/13-menu-publishing.png",
    imageAlt: "DineEase menu publishing studio",
    features: ["Manual or ingredient-calculated calories per serving", "Price, availability, ingredient, image, category, and costing data", "Guided poster layouts and a full-screen interactive canvas", "Multiple displays and synchronized QR table menus"],
  },
  {
    id: "sell",
    icon: "map",
    title: "Connect discovery to checkout",
    summary: "Guests can find a restaurant, understand its food, apply offers, and complete an order without losing context.",
    image: "/portfolio/dineease/03-restaurant-finder.webp",
    imageAlt: "DineEase Mapbox-powered restaurant finder",
    features: ["Mapbox discovery by category, service, open state, and proximity", "Public restaurant pages with menus, media, reviews, hours, and offers", "Calorie-aware cart totals and item-level nutrition context", "Pickup or delivery with card, pay-in-store, and GCash choices"],
  },
  {
    id: "host",
    icon: "calendar",
    title: "Coordinate reservations and the dining room",
    summary: "The calendar combines guest bookings, table capacity, restaurant tasks, and service follow-up.",
    image: "/portfolio/dineease/08-calendar.png",
    imageAlt: "DineEase restaurant calendar and reservation view",
    features: ["Shareable reservation flow for date, time, party size, and fitting tables", "Capacity-aware seating that excludes tables too small for a party", "Draggable floor-plan tables with availability and reservation states", "Reservation outcome and task-completion follow-up"],
  },
  {
    id: "staff",
    icon: "team",
    title: "Give restaurant teams operational structure",
    summary: "Onboarding, attendance, leave, documents, and employee context live in one auditable staff lifecycle.",
    image: "/portfolio/dineease/10-employee-dashboard.png",
    imageAlt: "DineEase employee and attendance dashboard",
    features: ["Invitation-based employee onboarding with profile and documents", "Shared attendance tablets with individual employee PINs", "Leave approval, clocked-in status, and consecutive-late flags", "Employee profiles combining workplace, activity, and performance context"],
  },
  {
    id: "decide",
    icon: "analytics",
    title: "Turn service data into business decisions",
    summary: "Sales, order health, menu profitability, expenses, and event history make operational tradeoffs explainable.",
    image: "/portfolio/dineease/14-analytics.png",
    imageAlt: "DineEase restaurant analytics dashboard",
    features: ["Sales trends, order states, average order value, top items, and busiest hours", "Ingredient cost, selling price, markup, revenue, and margin by menu item", "Recurring and one-off operating expenses beside food cost and revenue", "Searchable event logs for orders, refunds, reservations, attendance, and staff actions"],
  },
];

export const dineEaseTechnologies = [
  { name: "Nuxt", icon: "nuxt.svg", group: "Frontend", detail: "Application framework" },
  { name: "Vue", icon: "vue.svg", group: "Frontend", detail: "Component architecture" },
  { name: "Django", icon: "django.svg", group: "Backend", detail: "Business workflows and APIs" },
  { name: "PostgreSQL", icon: "postgresql.svg", group: "Data", detail: "Operational data model" },
  { name: "WebSockets", icon: "socketio.svg", group: "Realtime", detail: "Live order events" },
  { name: "Stripe", icon: "stripe.svg", group: "Commerce", detail: "Payment workflows" },
  { name: "Mapbox", icon: "mapbox.svg", group: "Discovery", detail: "Restaurant search and maps" },
  { name: "Tailwind CSS", icon: "tailwind.svg", group: "Interface", detail: "Responsive product styling" },
];

export const dineEaseProject = {
  slug: "dineease",
  name: "DineEase",
  seo: {
    title: "DineEase Restaurant Operations Platform | Mico Ang",
    description: "DineEase case study covering restaurant operations, calorie-aware menus, ordering, reservations, employees, kiosks, publishing, analytics, and audit logs.",
  },
  hero: {
    scene: "dineease",
    backHref: "/portfolio#project-dineease",
    backLabel: "Back to selected works",
    title: "DineEase, our restaurant platform.",
    highlight: "DineEase",
    summary: "We're developing DineEase at ASTA to manage ordering, menus, reservations, and staff in the same application.",
    actions: [
      { label: "Explore the product", href: "#product-gallery", primary: true },
      { label: "View capabilities", href: "#features", primary: false, icon: false },
    ],
    facts: [
      { label: "Status", value: "Ongoing ASTA platform", detail: "Large connected product system" },
      { label: "Role", value: "Co-founder and Technical Lead", detail: "Product and engineering leadership" },
      { label: "Responsibility", value: "Frontend architecture", detail: "Interface systems and delivery" },
    ],
  },
  overview: {
    title: "Ordering and the work behind it.",
    description: "Customers browse menus and place orders. Restaurant staff use the same system to manage those orders, reserve tables, and update availability.",
    image: {
      src: "/portfolio/dineease/01-restaurant-workspace.png",
      alt: "DineEase restaurant operations workspace",
    },
    signals: [
      { title: "Guest journey", description: "Discovery, menus, nutrition context, promotions, ordering, checkout, and reservations remain connected." },
      { title: "Restaurant operation", description: "Service readiness, orders, tables, employees, kiosks, publishing, and calendar work share one context." },
      { title: "Management visibility", description: "Analytics, costs, profitability, event logs, and operational status support explainable decisions." },
    ],
  },
  responsibilities: {
    title: "The parts I work on.",
    description: "These areas share restaurant and menu data, alongside order, reservation, and employee records.",
    items: dineEasePillars,
  },
  gallery: {
    title: "Screens from the application.",
    description: "Browse 16 captures from the DineEase feature guide, covering customer ordering and restaurant management.",
    sourceNote: "Product reference captured from the supplied DineEase feature guide",
    slides: dineEaseSlides,
  },
  features: {
    title: "Built around the work of running a restaurant.",
    description: "The features below cover taking orders, publishing menus, managing staff, and reviewing restaurant activity.",
    items: dineEasePillars,
  },
  technology: {
    title: "How it's built.",
    description: "Nuxt and Vue handle the interface. Django and PostgreSQL support the backend, with WebSockets for live order updates.",
    items: dineEaseTechnologies,
  },
  cta: {
    title: "Working on a restaurant application?",
    description: "Tell me which parts you need help with, from the interface to backend integrations.",
    actions: [
      { label: "Discuss a platform", href: "/portfolio#contact", primary: true },
      { label: "Visit ASTA Softwares", href: "/asta", primary: false },
    ],
  },
};
