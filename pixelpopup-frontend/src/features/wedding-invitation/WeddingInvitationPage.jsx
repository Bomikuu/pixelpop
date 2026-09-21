import { useState } from "react";
import WeddingDetailsScene from "../../ui/scenes/wedding/WeddingDetailsScene";
import WeddingHeroScene from "../../ui/scenes/wedding/WeddingHeroScene";
import WeddingRSVPScene from "../../ui/scenes/wedding/WeddingRSVPScene";
import WeddingScheduleScene from "../../ui/scenes/wedding/WeddingScheduleScene";
import "./weddingInvitation.css";

const WEDDING = {
  names: { bride: "Andrea", groom: "Mico" },
  dateLine: "Saturday • June 15, 2026 • 3:00 PM",
  locationLine: "Davao City • Philippines",
  details: {
    date: "Saturday, June 15, 2026",
    time: "3:00 PM",
    ceremony: "Ceremony at 3:00 PM",
    reception: "Reception to follow",
    venue: "The Garden House",
    address: "Davao City, Philippines",
    dressCode: "Formal / Semi-formal",
    theme: "Garden evening",
  },
  photos: {
    coverUrl: "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1600&q=85",
    brideUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85",
    groomUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85",
  },
};

const SCHEDULE = [
  {
    id: "arrival",
    time: "2:30 PM",
    title: "Guest Arrival",
    subtitle: "Registration + Seating",
    description: "Please arrive a little early so everyone can settle in before the ceremony begins.",
  },
  {
    id: "ceremony",
    time: "3:00 PM",
    title: "Ceremony",
    subtitle: "Vows + Rings",
    description: "An unplugged moment with the people we love. Please keep phones on silent during the vows.",
  },
  {
    id: "photos",
    time: "4:00 PM",
    title: "Photo Time",
    subtitle: "Family + Friends",
    description: "Stay close after the ceremony for group photos and golden-hour portraits.",
  },
  {
    id: "reception",
    time: "5:30 PM",
    title: "Reception",
    subtitle: "Dinner + Program",
    description: "Dinner, stories, a few surprises, and dancing into the evening.",
  },
];

export default function WeddingInvitationPage() {
  const [view, setView] = useState("invitation");

  const goTo = (nextView) => setView(nextView);

  return (
    <main className="wedding-page min-h-screen px-4 py-5 text-[#303735] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col sm:min-h-[calc(100vh-64px)]">
        <header className="wedding-topbar flex flex-col gap-5 border-b border-[#cfc6b5] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#7f887f]">A private invitation</div>
            <div className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#36413d] sm:text-4xl">Andrea <span className="text-[#9b8067]">&</span> Mico</div>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Wedding invitation sections">
            <NavButton active={view === "invitation"} onClick={() => goTo("invitation")}>Invitation</NavButton>
            <NavButton active={view === "details"} onClick={() => goTo("details")}>Details</NavButton>
            <NavButton active={view === "schedule"} onClick={() => goTo("schedule")}>Schedule</NavButton>
            <NavButton active={view === "rsvp"} onClick={() => goTo("rsvp")}>RSVP</NavButton>
          </nav>
        </header>

        <div className="flex-1 py-4 sm:py-7">
          {view === "invitation" ? (
            <WeddingHeroScene
              title="WEDDING"
              subtitle="You’re invited"
              names={WEDDING.names}
              dateLine={WEDDING.dateLine}
              locationLine={WEDDING.locationLine}
              photos={WEDDING.photos}
              primaryText="View details"
              secondaryText="RSVP now"
              onPrimary={() => goTo("details")}
              onSecondary={() => goTo("rsvp")}
            />
          ) : null}

          {view === "details" ? (
            <WeddingDetailsScene
              title="The day, in a few details"
              names={WEDDING.names}
              details={WEDDING.details}
              primaryText="RSVP"
              secondaryText="Back to invitation"
              onPrimary={() => goTo("rsvp")}
              onSecondary={() => goTo("invitation")}
              onOpenSchedule={() => goTo("schedule")}
            />
          ) : null}

          {view === "schedule" ? (
            <WeddingScheduleScene
              title="Our wedding day"
              items={SCHEDULE}
              primaryText="Back to details"
              secondaryText="RSVP"
              onPrimary={() => goTo("details")}
              onSecondary={() => goTo("rsvp")}
            />
          ) : null}

          {view === "rsvp" ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <WeddingRSVPScene
                title="Will you join us?"
                subtitle="Please let us know if you can celebrate with us."
                names={WEDDING.names}
                primaryText="Send RSVP"
                secondaryText="Back to details"
                onDone={() => goTo("thanks")}
                onCancel={() => goTo("details")}
              />
              <EventSnapshot onSchedule={() => goTo("schedule")} />
            </div>
          ) : null}

          {view === "thanks" ? <ThanksCard onBack={() => goTo("invitation")} /> : null}
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#cfc6b5] pt-4 text-[11px] uppercase tracking-[0.18em] text-[#8a9189] sm:flex-row sm:items-center sm:justify-between">
          <span>With love, Andrea + Mico</span>
          <span>June 15, 2026 • Davao City</span>
        </footer>
      </div>
    </main>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button
      className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
        active
          ? "border-[#4f5e58] bg-[#4f5e58] text-[#f8f4ea] shadow-[0_3px_0_#27302c]"
          : "border-[#c4c7bc] bg-[#fbfaf6] text-[#63706a] hover:-translate-y-0.5 hover:border-[#7e9086]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EventSnapshot({ onSchedule }) {
  return (
    <aside className="rounded-3xl border border-[#d2c9b9] bg-[#fbfaf6] p-5 shadow-[0_12px_30px_rgba(67,76,68,0.08)] lg:mt-8">
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9b8067]">Event snapshot</div>
      <h2 className="mt-3 font-serif text-2xl text-[#36413d]">Garden evening</h2>
      <div className="mt-5 space-y-4 text-sm text-[#69736b]">
        <SnapshotRow label="When" value="June 15, 2026 · 3:00 PM" />
        <SnapshotRow label="Where" value="The Garden House, Davao City" />
        <SnapshotRow label="Dress" value="Formal / Semi-formal" />
      </div>
      <button className="mt-6 w-full rounded-full border border-[#b8c1b8] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#51645a] transition hover:bg-[#eef1eb]" type="button" onClick={onSchedule}>
        See full schedule
      </button>
    </aside>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="border-b border-[#e5dfd3] pb-3 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b8067]">{label}</div>
      <div className="mt-1 leading-relaxed">{value}</div>
    </div>
  );
}

function ThanksCard({ onBack }) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#b8c1b8] bg-[#eef1eb] text-2xl text-[#52675c]">✓</div>
      <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-[#9b8067]">RSVP received</div>
      <h1 className="mt-3 font-serif text-4xl text-[#36413d] sm:text-5xl">Thank you for celebrating with us.</h1>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#69736b]">Your response is saved on this device for now. We’re looking forward to seeing you at The Garden House.</p>
      <button className="mt-8 rounded-full bg-[#4f5e58] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f8f4ea] shadow-[0_4px_0_#27302c] transition hover:-translate-y-0.5" type="button" onClick={onBack}>Return to invitation</button>
    </section>
  );
}
