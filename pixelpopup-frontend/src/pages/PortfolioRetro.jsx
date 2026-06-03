import React, { useMemo, useState } from "react";
import { overlay } from "../ui/overlay";
import {
  Window,
  RetroButton,
  RetroInput,
  RetroPanel,
  RetroSlider,
  RetroIconButton,
  TypewriterPanel,
  RetroChoicePanel,
  RetroPasswordGatePanel,
  RetroTimelinePanel,
  RetroMapPanel,
  RetroQuizPanel,
  RetroMediaLyricPanel,
  RetroHeader,
  RetroFooter,
} from "../ui/retro";

import {
  Star,
  Heart,
  MousePointerClick,
  Sparkles,
  Music,
  X,
  Code,
  Briefcase,
  Rocket,
  Github,
  Linkedin,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

export default function PortfolioPage() {
  const [name, setName] = useState("Mico Ang");
  const [activeTab, setActiveTab] = useState("home");
  const [email, setEmail] = useState("mico.dahang@gmail.com");
  const [vol, setVol] = useState(85);

  const testToast = () => {
    overlay.toast({ type: "success", message: "Saved successfully!" });
    overlay.effect({ type: "vhs", ms: 1200, strength: 12, aberration: 3, noise: 0.15 });
    overlay.effect({ type: "sfx", name: "success" });
  };

  const testModal = () => {
    overlay.showModal({
      title: "CONTACT",
      subtitle: "Quick connect",
      content: (
        <div className="space-y-3 font-pp">
          <div className="font-extrabold">Mico Ang</div>
          <div className="text-sm opacity-80">
            Senior Software Developer • Frontend-focused Full-Stack
          </div>
          <div className="text-sm">
            Email: <span className="font-extrabold">{email}</span>
          </div>
          <div className="text-sm">
            Phone: <span className="font-extrabold">09994827961</span>
          </div>
          <div className="text-sm">
            Focus:{" "}
            <span className="font-extrabold">
              Frontend Architecture / SEO / CMS / Map Systems
            </span>
          </div>
        </div>
      ),
      showDefaultActions: true,
      confirmText: "Close",
      cancelText: "Later",
      onConfirm: () => overlay.toast({ type: "info", message: "Message sent (demo)." }),
    });
  };

  const testLoading = () => {
    overlay.showLoading({ title: "LOADING", subtitle: "Generating portfolio preview…" });
    overlay.effect({ type: "sfx", name: "beep", volume: 0.05 });
    setTimeout(() => overlay.hideLoading(), 1500);
  };

  const openDetails = (item) => {
    overlay.effect({ type: "vhs", ms: 600, strength: 12, aberration: 2 });
    overlay.effect({ type: "sfx", name: "success", volume: 0.07 });

    overlay.showModal({
      title: item.title.toUpperCase(),
      subtitle: `${item.company} • ${item.year}`,
      content: (
        <div className="space-y-4 font-pp text-sm">
          <div>{item.description}</div>
          <div>
            <div className="font-bold mb-1">Tech Stack</div>
            <div className="flex flex-wrap gap-2">
              {item.tech.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 border border-black bg-white text-xs font-bold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
      showDefaultActions: true,
      confirmText: "Close",
    });
  };

  const techStack = useMemo(
    () => [
      "Vue.js",
      "Nuxt.js",
      "React.js",
      "React Native",
      "TypeScript",
      "JavaScript",
      "TailwindCSS",
      "HTML",
      "CSS",
      "Django",
      "Python",
      "Node.js",
      "RiotJS",
      "Mapbox",
      "Docker",
      "Nginx",
      "AWS EC2",
      "SEO",
      "Google Search Console",
      "Stripe",
    ],
    []
  );

  const timelineData = [
    {
      id: "asta",
      year: "Mar 2021 – Present",
      title: "Senior Frontend Developer / Technical Lead",
      company: "ASTA Softwares",
      description:
        "Led development of multiple full-stack platforms and CMS-driven systems across employee management, food delivery, and interactive web applications. Owned frontend architecture, contributed to backend integration, led mentorship, sprint coordination, deployment support, and frontend consistency across projects.",
      tech: ["Vue.js", "Nuxt.js", "React.js", "Django", "Docker", "AWS EC2", "Mapbox"],
    },
    {
      id: "countable",
      year: "Aug 2019 – Dec 2025",
      title: "Software Developer (Full-Stack, Frontend-Focused)",
      company: "Countable Web Productions",
      description:
        "Led development of CMS-driven platforms, healthcare systems, clinic marketing applications, map-based products, and SEO-focused growth systems. Played a strong role in frontend architecture, scalable UI delivery, and full-stack execution for the Cortico ecosystem and related platforms.",
      tech: ["Vue.js", "Nuxt.js", "Django", "RiotJS", "TailwindCSS", "Mapbox", "SEO"],
    },
    {
      id: "traidify",
      year: "Feb 2022 – Feb 2023",
      title: "Software Developer",
      company: "Traidify",
      description:
        "Developed a financial platform for blockchain and stock analytics with dashboard UI, real-time charting, technical analysis, subscription access, and investor-focused workflows. Also contributed to the platform landing page focused on engagement and conversion.",
      tech: ["React.js", "Material UI", "Redux-Saga", "Django", "Python"],
    },
    {
      id: "bigoil",
      year: "Jan 2021 – Aug 2021",
      title: "Lead Software Developer",
      company: "Big Oil Co",
      description:
        "Built full-stack systems for hiring and inventory management using Google Sheets as a real-time data store. Developed submission workflows, management interfaces, and operational dashboards for business use.",
      tech: ["React.js", "Material UI", "Node.js", "Google API Services"],
    },
    {
      id: "apollo",
      year: "May 2018 – Aug 2019",
      title: "Software Developer",
      company: "Apollo Technologies Inc.",
      description:
        "Developed Android-based internal systems for asset scanning, inventory management, warehouse operations, workforce tracking, and kiosk-based business services. Also gained hands-on exposure to Linux, Nginx, Apache, Docker, networking, and infrastructure support.",
      tech: ["Android Java", "React.js", "Django", "Linux", "Docker", "Nginx", "Apache"],
    },
  ];

  return (
    <div className="min-h-screen pp-retro-bg w-screen">
      <RetroHeader
        title="PIXELPOPUP.EXE"
        logo={{ src: "/img/logo.png", alt: "PixelPopup" }}
        tabs={[
          { id: "home", label: "HOME" },
          { id: "templates", label: "TEMPLATES" },
          { id: "booth", label: "BOOTH" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightLinks={[
          { label: "m1ku.dev", href: "https://m1ku.dev", external: true },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="font-pp text-2xl md:text-4xl font-black text-white drop-shadow">
            MicoPortfolio.exe
          </div>
          <div className="font-pp text-white/80 mt-1">
            Senior software developer • frontend-heavy full-stack • SEO • maps • CMS • interactive systems
          </div>
        </div>

        {/* HERO: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Main hero */}
          <div className="lg:col-span-7">
            <Window
              title="Mico Ang"
              subtitle="Senior Software Developer • Frontend-heavy • SEO • CMS • Map Systems"
              maxWidthClass="max-w-none"
              rightSlot={
                <div className="flex items-center gap-2">
                  <RetroIconButton title="Code" icon={<Code size={18} strokeWidth={3} />} />
                  <RetroIconButton title="Ship" icon={<Rocket size={18} strokeWidth={3} />} />
                  <RetroIconButton title="Work" icon={<Briefcase size={18} strokeWidth={3} />} />
                </div>
              }
              footer={
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="font-pp text-sm opacity-80">
                    Status: <span className="font-extrabold">Available for senior frontend / full-stack projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RetroButton variant="secondary" onClick={testModal}>
                      Contact
                    </RetroButton>
                    <RetroButton onClick={testToast}>Ping Effects</RetroButton>
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroPanel title="Profile">
                  <div className="space-y-4">
                    <RetroInput
                      label="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      rightSlot={<span className="font-pp text-xs opacity-70">.txt</span>}
                    />
                    <RetroInput
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      hint="This is a demo field (hook to form later if needed)."
                    />
                    <div className="flex items-center gap-2">
                      <RetroButton variant="secondary" className="flex-1" onClick={testLoading}>
                        Preview
                      </RetroButton>
                      <RetroButton className="flex-1" onClick={testToast}>
                        Save
                      </RetroButton>
                    </div>
                  </div>
                </RetroPanel>

                <RetroPanel title="Workflow / Focus">
                  <div className="space-y-4">
                    <RetroSlider
                      label="Frontend focus"
                      value={vol}
                      onChange={(e) => setVol(Number(e.target.value))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "crt", ms: 1200 })}>
                        CRT
                      </RetroButton>
                      <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "vhs", ms: 900 })}>
                        VHS
                      </RetroButton>
                      <RetroButton variant="ghost" onClick={() => overlay.effect({ type: "cursorTrail", ms: 1500 })}>
                        Cursor FX
                      </RetroButton>
                      <RetroButton variant="ghost" onClick={() => overlay.effect({ type: "confetti", doubleBurst: true })}>
                        Confetti
                      </RetroButton>
                    </div>
                  </div>
                </RetroPanel>
              </div>
            </Window>
          </div>

          {/* RIGHT: Sidebar stack */}
          <div className="lg:col-span-5 space-y-6">
            <Window
              title="TECH STACK"
              subtitle="Tools I ship with"
              maxWidthClass="max-w-none"
            >
              <div className="flex flex-wrap gap-2">
                {techStack.map((t) => (
                  <span
                    key={t}
                    className="font-pp text-xs font-extrabold px-2 py-1 border-[3px] border-black bg-white"
                    style={{ boxShadow: "var(--pp-shadow)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <RetroIconButton title="UI Systems" icon={<MousePointerClick size={18} strokeWidth={3} />} />
                <RetroIconButton title="Polish" icon={<Sparkles size={18} strokeWidth={3} />} />
                <RetroIconButton title="Motion" icon={<Music size={18} strokeWidth={3} />} />
              </div>
            </Window>

            <Window
              title="LINKS"
              subtitle="Find me online"
              maxWidthClass="max-w-none"
              titlebarGradient={false}
              titlebarSolidBg="var(--pp-accent)"
            >
              <div className="space-y-3 font-pp text-sm">
                <div className="flex items-center gap-2">
                  <RetroIconButton title="GitHub" icon={<Github size={18} strokeWidth={3} />} />
                  <div className="font-extrabold">GitHub</div>
                </div>
                <div className="flex items-center gap-2">
                  <RetroIconButton title="LinkedIn" icon={<Linkedin size={18} strokeWidth={3} />} />
                  <div className="font-extrabold">LinkedIn</div>
                </div>
                <div className="flex items-center gap-2">
                  <RetroIconButton title="Website" icon={<Globe size={18} strokeWidth={3} />} />
                  <div className="font-extrabold">m1ku.dev</div>
                </div>
                <div className="flex items-center gap-2">
                  <RetroIconButton title="Email" icon={<Mail size={18} strokeWidth={3} />} />
                  <div className="font-extrabold">{email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <RetroIconButton title="Phone" icon={<Phone size={18} strokeWidth={3} />} />
                  <div className="font-extrabold">09994827961</div>
                </div>
              </div>
            </Window>
          </div>
        </div>

        {/* Typewriter intro */}
        <TypewriterPanel
          title="ABOUT_ME.TXT"
          rightSlot={<span className="font-pp text-xs opacity-70">draft_01</span>}
          text={
            "Hi, I'm Mico.\n\nSeasoned Full-Stack Software Developer with strong expertise in frontend engineering, SEO, UI/UX, and scalable web application development.\n\nI build healthcare platforms, internal tools, CMS-driven systems, marketing sites, map-based platforms, dashboards, and interactive web applications.\n\nFrontend-focused by specialization, with solid backend, deployment, and technical leadership experience.\n\nClick text to skip typing."
          }
          beepEnabled
          speedMs={35}
          onSecondary={() => overlay.toast({ type: "info", message: "Skipped typing." })}
          onPrimary={() => {
            overlay.effect({ type: "confetti", doubleBurst: true });
            overlay.effect({ type: "sfx", name: "success" });
          }}
          primaryText="Nice"
          secondaryText="Skip"
          className="my-8"
        />

        {/* Choice Panel (portfolio context) */}
        <div id="portfolio-choice-window">
          <RetroChoicePanel
            title="HIRE_ROUTE.EXE"
            intro={<div className="font-pp text-sm font-extrabold">What do you want to explore?</div>}
            choices={[
              {
                id: "projects",
                label: "PROJECTS 🚀",
                description: "Show shipped work and demos",
                kind: "primary",
                icon: <Rocket size={18} strokeWidth={3} />,
                onSelect: () => {
                  overlay.effect({ type: "vhs", ms: 800, strength: 12 });
                  overlay.toast({ type: "success", message: "Loading projects…" });
                },
              },
              {
                id: "case-studies",
                label: "CASE STUDIES 🔒",
                description: "Private deep dives (password)",
                kind: "danger",
                icon: <X size={18} strokeWidth={3} />,
                onSelect: () => {
                  overlay.effect({ type: "windowShake", selector: "#portfolio-choice-window", ms: 450, intensity: 9 });
                  overlay.effect({ type: "sfx", name: "error" });
                  overlay.toast({ type: "warning", message: "Locked. Use the password gate below." });
                },
              },
            ]}
          />
        </div>

        {/* Password gate */}
        <RetroPasswordGatePanel
          title="PRIVATE_CASES.ACCESS"
          prompt="Some case studies are private."
          hint="Try: 0000 (demo)"
          expectedPassword="0000"
          onSuccess={() => {
            overlay.effect({ type: "confetti", doubleBurst: true });
            overlay.effect({ type: "sfx", name: "success" });
            overlay.toast({ type: "success", message: "Access granted (demo)." });
          }}
        />

        {/* Timeline Panel = Work Experience */}
        <RetroTimelinePanel
          title="WORK_EXPERIENCE.LOG"
          items={[
            {
              id: "asta",
              date: "Mar 2021 – Present",
              title: "Senior Frontend Developer / Technical Lead",
              subtitle: "ASTA Softwares • frontend architecture • leadership • delivery",
              description:
                "Led full-stack platforms across employee management, food delivery, and interactive web apps while owning frontend direction, mentorship, coordination, and deployment support.",
              icon: <Briefcase size={18} strokeWidth={3} />,
              actions: [
                {
                  label: "Celebrate",
                  kind: "primary",
                  onClick: () => {
                    overlay.effect({ type: "confetti", doubleBurst: true });
                    overlay.effect({ type: "sfx", name: "success" });
                  },
                },
                {
                  label: "VHS flashback",
                  kind: "secondary",
                  onClick: () => overlay.effect({ type: "vhs", ms: 1200, strength: 12 }),
                },
              ],
            },
            {
              id: "countable",
              date: "Aug 2019 – Dec 2025",
              title: "Software Developer (Frontend-Focused)",
              subtitle: "Countable Web Productions • healthcare • CMS • SEO • maps",
              description:
                "Built and maintained healthcare systems, clinic websites, map-based platforms, and SEO-driven marketing applications with strong ownership in frontend architecture and full-stack delivery.",
              icon: <Star size={18} strokeWidth={3} />,
              actions: [
                {
                  label: "Open modal",
                  kind: "ghost",
                  onClick: () =>
                    overlay.showModal({
                      title: "HIGHLIGHT",
                      subtitle: "Cortico ecosystem",
                      content: (
                        <div className="font-pp font-extrabold">
                          CMS-driven healthcare systems, clinic marketing, maps, and SEO growth workflows.
                        </div>
                      ),
                      showDefaultActions: true,
                    }),
                },
              ],
            },
            {
              id: "apollo",
              date: "May 2018 – Aug 2019",
              title: "Software Developer",
              subtitle: "Apollo Technologies • Android systems • infra support",
              description:
                "Worked on Android-based asset, inventory, warehouse, and workforce systems while also gaining exposure to Linux, deployment, networking, and infrastructure support.",
              icon: <Heart size={18} strokeWidth={3} />,
              actions: [
                {
                  label: "Cursor FX",
                  kind: "secondary",
                  onClick: () => overlay.effect({ type: "cursorTrail", ms: 1500 }),
                },
              ],
            },
          ]}
        />

        {/* Quiz Panel (portfolio fun + CTA) */}
        <RetroQuizPanel
          title="CLIENT_FIT.CHECK"
          question="Which type of work fits me best?"
          answers={[
            { label: "Frontend systems + UI architecture + scalable business platforms", correct: true },
            { label: "Only backend maintenance", correct: false },
            { label: "No UI, no SEO, no product thinking", correct: false },
          ]}
          explanation="Correct 😄 I specialize in frontend-heavy systems with scalable product architecture, SEO, and strong UX."
          maxAttempts={3}
          onCorrect={() => {
            overlay.effect({ type: "confetti" });
            overlay.effect({ type: "sfx", name: "success" });
          }}
        />

        {/* BIG MAP SECTION (full width) */}
        <div className="my-10">
          <RetroMapPanel
            showSidebar
            title="WORK_LOCATIONS.MAP"
            popupTitle="DETAILS"
            defaultSelectedId="davao"
            initialZoom={12}
            onSelect={(place) => console.log("Selected:", place.title)}
            places={[
              {
                id: "davao",
                title: "Davao City",
                subtitle: "Home base",
                badge: "PH",
                description:
                  "Primary base for building and shipping platforms across healthcare, internal tools, CMS systems, and interactive web applications.",
                lng: 125.6128,
                lat: 7.0731,
                mediaUrl:
                  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
                mediaType: "image",
                actions: [
                  {
                    label: "Ping",
                    kind: "primary",
                    onClick: () => {
                      overlay.toast({ type: "success", message: "Pinged Davao node." });
                      overlay.effect({ type: "sfx", name: "beep", volume: 0.06 });
                    },
                  },
                ],
              },
              {
                id: "remote",
                title: "Remote",
                subtitle: "Distributed teams",
                badge: "GLOBAL",
                description:
                  "Experienced working with distributed teams across frontend development, delivery workflows, sprint coordination, and technical execution.",
                lng: 121.0,
                lat: 14.6,
                mediaUrl:
                  "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1200&q=80",
                mediaType: "image",
                actions: [
                  {
                    label: "Celebrate 🎉",
                    kind: "secondary",
                    onClick: () => overlay.effect({ type: "confetti", doubleBurst: true }),
                  },
                ],
              },
              {
                id: "project-sites",
                title: "Client Projects",
                subtitle: "Healthcare, business, marketing, and data systems",
                badge: "PORTFOLIO",
                description:
                  "Worked on clinic systems, food delivery platforms, inventory tools, hiring systems, blockchain dashboards, interactive experiences, and CMS-driven websites.",
                lng: 125.6214,
                lat: 7.0795,
                mediaUrl:
                  "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
                mediaType: "image",
                actions: [
                  {
                    label: "Open modal",
                    kind: "primary",
                    onClick: () =>
                      overlay.showModal({
                        title: "PROJECT TYPES",
                        subtitle: "What I build",
                        content: (
                          <div className="font-pp text-sm space-y-2">
                            <div>• Healthcare platforms and clinic websites</div>
                            <div>• CMS and marketing systems</div>
                            <div>• Map-based discovery experiences</div>
                            <div>• Internal business tools and dashboards</div>
                            <div>• Interactive event and engagement platforms</div>
                          </div>
                        ),
                        showDefaultActions: true,
                      }),
                  },
                ],
              },
            ]}
          />
        </div>

        <Window
          title="Career Timeline"
          subtitle="Professional Experience"
        >
          <div className="space-y-6">
            {timelineData.map((item) => (
              <RetroPanel
                key={item.id}
                title={`${item.year} • ${item.title}`}
                rightSlot={<Briefcase size={16} />}
              >
                <div className="space-y-3 text-sm font-pp">
                  <div className="font-bold">{item.company}</div>
                  <div className="opacity-80 line-clamp-2">
                    {item.description}
                  </div>

                  <div className="flex gap-2">
                    <RetroButton
                      variant="secondary"
                      onClick={() => openDetails(item)}
                    >
                      View Details
                    </RetroButton>

                    <RetroButton
                      variant="ghost"
                      onClick={() =>
                        overlay.spawnSticker({
                          emoji: "🚀",
                          x: 50,
                          y: 50,
                          entry: "dropBounce",
                          durationMs: 900,
                        })
                      }
                    >
                      React
                    </RetroButton>
                  </div>
                </div>
              </RetroPanel>
            ))}
          </div>
        </Window>

        {/* Footer tools window */}
        <Window title="TOOLS" subtitle="Quick actions" maxWidthClass="max-w-none">
          <div className="flex flex-wrap gap-3">
            <RetroButton onClick={testToast}>Toast + VHS</RetroButton>
            <RetroButton variant="secondary" onClick={testModal}>
              Modal
            </RetroButton>
            <RetroButton variant="secondary" onClick={testLoading}>
              Loading
            </RetroButton>
            <RetroButton variant="danger" onClick={() => overlay.effect({ type: "glitch", ms: 700, strength: 10 })}>
              Glitch
            </RetroButton>
            <RetroButton variant="ghost" onClick={() => overlay.effect({ type: "cursorTrail", ms: 1500 })}>
              Cursor Trail
            </RetroButton>
          </div>

          <div className="mt-5">
            <RetroPanel title="Sticker Area" bg="rgba(255,255,255,0.9)">
              <div className="flex flex-wrap gap-2">
                <RetroButton
                  onClick={() =>
                    overlay.spawnSticker({
                      emoji: "✨",
                      x: 50,
                      y: 45,
                      entry: "shakePop",
                      size: 70,
                      durationMs: 900,
                    })
                  }
                >
                  Drop Sticker
                </RetroButton>
                <RetroButton
                  variant="secondary"
                  onClick={() => overlay.spawnBurst({ emoji: "🚀", x: 50, y: 50, count: 14, spread: 22 })}
                >
                  Burst 🚀
                </RetroButton>
                <RetroButton
                  variant="ghost"
                  onClick={() => overlay.clearStickers()}
                >
                  Clear
                </RetroButton>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="font-pp font-extrabold">BUILD. SHIP. SCALE.</span>
                <span className="font-pp text-sm opacity-70">★ ★ ★ ★ ★</span>
              </div>
            </RetroPanel>
          </div>
        </Window>
      </div>

      <RetroFooter
        links={[
          { label: "m1ku.dev", href: "https://m1ku.dev", external: true },
          { label: "Contact", href: "/contact" },
        ]}
        socials={[
          { label: "GitHub", href: "#", external: true },
          { label: "LinkedIn", href: "#", external: true },
          { label: "Email", href: "mailto:mico.dahang@gmail.com", external: true },
        ]}
      />
    </div>
  );
}