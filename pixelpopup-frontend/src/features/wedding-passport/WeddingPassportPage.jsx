import { useState } from "react";
import "./weddingPassport.css";

const EVENT = {
  couple: "Andrea + Mico",
  dateShort: "06.15.26",
  dateLong: "Saturday, June 15, 2026",
  venue: "The Garden House",
  location: "Davao City, Philippines",
  note: "A small evening with our favorite people.",
};

const ITINERARY = [
  { time: "02:30", label: "Arrival", detail: "Find your seat and say hello." },
  { time: "03:00", label: "Ceremony", detail: "Vows, rings, and a little happy crying." },
  { time: "04:00", label: "Portraits", detail: "Golden-hour photos together." },
  { time: "05:30", label: "Dinner", detail: "Food, stories, and dancing." },
];

export default function WeddingPassportPage() {
  const [view, setView] = useState("overview");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", attendance: "yes", guests: "1", note: "" });

  const updateForm = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  };

  const submitRsvp = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    localStorage.setItem("pp_wedding_rsvp_passport_v1", JSON.stringify({ ...form, submittedAt: new Date().toISOString() }));
    setSubmitted(true);
  };

  return (
    <main className="wedding-passport min-h-screen px-4 py-4 text-[#26322e] sm:px-8 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-6xl overflow-hidden border border-[#34483e] bg-[#f4f0e7] shadow-[10px_10px_0_#b8b1a0] lg:grid-cols-[0.78fr_1.22fr] sm:min-h-[calc(100vh-64px)]">
        <aside className="passport-cover relative flex min-h-[560px] flex-col justify-between overflow-hidden p-7 text-[#f4f0e7] sm:p-10 lg:min-h-full">
          <div className="passport-cover-image absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 flex items-start justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-[#dce3d2]">
            <span>Private event</span>
            <span>Issue 01</span>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-12 bg-[#c4d3ba]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#dce3d2]">Wedding passport</span>
            </div>
            <div className="font-serif text-6xl leading-[0.82] tracking-[-0.08em] sm:text-8xl">
              {EVENT.dateShort.split(".").map((part, index) => <div key={part}>{part}{index < 2 ? "." : ""}</div>)}
            </div>
            <div className="mt-8 max-w-xs border-l border-[#c4d3ba]/70 pl-4 text-sm leading-6 text-[#dce3d2]">
              {EVENT.note}
            </div>
          </div>

          <div className="relative z-10 mt-12 flex items-end justify-between border-t border-[#c4d3ba]/40 pt-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#c4d3ba]">Hosted by</div>
              <div className="mt-1 font-serif text-2xl">{EVENT.couple}</div>
            </div>
            <div className="passport-stamp grid h-20 w-20 place-items-center rounded-full border border-[#c4d3ba] text-center text-[9px] font-bold uppercase leading-4 tracking-[0.15em] text-[#dce3d2]">Save<br />the<br />date</div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-5 border-b border-[#d5cec0] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7b877d]">The event desk</div>
              <h1 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#34463e]">Come celebrate with us.</h1>
            </div>
            <div className="flex gap-1 rounded-full border border-[#c8cfc5] bg-[#ebe9df] p-1" aria-label="Event sections">
              <TabButton active={view === "overview"} onClick={() => setView("overview")}>Overview</TabButton>
              <TabButton active={view === "reply"} onClick={() => setView("reply")}>Reply</TabButton>
            </div>
          </header>

          <div className="flex-1 px-6 py-7 sm:px-10 sm:py-9">
            {submitted ? <Confirmation form={form} onBack={() => { setSubmitted(false); setView("overview"); }} /> : null}
            {!submitted && view === "overview" ? <Overview onReply={() => setView("reply")} /> : null}
            {!submitted && view === "reply" ? <ReplyForm form={form} updateForm={updateForm} onSubmit={submitRsvp} /> : null}
          </div>

          <footer className="flex flex-col gap-2 border-t border-[#d5cec0] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#849087] sm:flex-row sm:justify-between sm:px-10">
            <span>{EVENT.venue}</span>
            <span>{EVENT.location}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}

function Overview({ onReply }) {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 border-b border-[#d5cec0] pb-9 sm:grid-cols-[1fr_0.75fr]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a0785f]">You are on the list</div>
          <h2 className="mt-3 max-w-lg font-serif text-4xl leading-[1.03] tracking-[-0.05em] text-[#34463e] sm:text-5xl">An evening for vows, food, and people we love.</h2>
        </div>
        <div className="flex flex-col justify-end text-sm leading-6 text-[#6d786f]">
          <p>{EVENT.dateLong}</p>
          <p>{EVENT.venue}</p>
          <p>{EVENT.location}</p>
          <button className="mt-5 w-fit border-b border-[#51685a] pb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#51685a] transition hover:border-[#a0785f] hover:text-[#a0785f]" type="button" onClick={onReply}>Reply to invitation <span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7b877d]">Field notes / itinerary</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0785f]">Local time</div>
        </div>
        <div className="mt-5 divide-y divide-[#d5cec0] border-y border-[#d5cec0]">
          {ITINERARY.map((item) => (
            <div className="grid grid-cols-[64px_1fr] gap-4 py-4 sm:grid-cols-[80px_1fr_0.9fr] sm:gap-6" key={item.label}>
              <div className="font-mono text-sm text-[#a0785f]">{item.time}</div>
              <div className="font-semibold text-[#34463e]">{item.label}</div>
              <div className="text-sm leading-5 text-[#7b877d] sm:text-right">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Fact label="Dress" value="Formal / semi-formal" />
        <Fact label="Ceremony" value="Garden, 3:00 PM" />
        <Fact label="Reception" value="Dinner to follow" />
      </section>
    </div>
  );
}

function ReplyForm({ form, updateForm, onSubmit }) {
  return (
    <form className="mx-auto max-w-2xl" onSubmit={onSubmit}>
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a0785f]">Reply card</div>
      <h2 className="mt-3 font-serif text-4xl tracking-[-0.05em] text-[#34463e]">Will you be there?</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#6d786f]">Please send one response per invitation. We’ll keep your seat warm.</p>

      <div className="mt-8 space-y-6">
        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#607066]">
          Your name
          <input className="mt-2 w-full border-b-2 border-[#b9c2b8] bg-transparent px-0 py-3 text-base font-normal normal-case tracking-normal text-[#34463e] outline-none transition focus:border-[#51685a]" value={form.name} onChange={updateForm("name")} placeholder="Full name" required />
        </label>

        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.15em] text-[#607066]">Attendance</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <AttendanceButton active={form.attendance === "yes"} onClick={() => updateFormValue(updateForm, "attendance", "yes")}>Yes, I’ll be there</AttendanceButton>
            <AttendanceButton active={form.attendance === "no"} onClick={() => updateFormValue(updateForm, "attendance", "no")}>Sorry, can’t make it</AttendanceButton>
          </div>
        </fieldset>

        <label className="block max-w-[220px] text-xs font-bold uppercase tracking-[0.15em] text-[#607066]">
          Number of guests
          <select className="mt-2 w-full border-b-2 border-[#b9c2b8] bg-transparent px-0 py-3 text-base font-normal normal-case tracking-normal text-[#34463e] outline-none focus:border-[#51685a]" value={form.guests} onChange={updateForm("guests")}>
            <option value="1">Just me</option>
            <option value="2">Me + 1 guest</option>
            <option value="3">Me + 2 guests</option>
            <option value="4">Me + 3 guests</option>
          </select>
        </label>

        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#607066]">
          A note for the couple <span className="font-normal normal-case tracking-normal text-[#9ca59d]">(optional)</span>
          <textarea className="mt-2 min-h-28 w-full resize-y border-b-2 border-[#b9c2b8] bg-transparent px-0 py-3 text-base font-normal normal-case tracking-normal text-[#34463e] outline-none focus:border-[#51685a]" value={form.note} onChange={updateForm("note")} placeholder="Can’t wait to celebrate..." />
        </label>
      </div>

      <div className="mt-9 flex flex-col items-start gap-3 border-t border-[#d5cec0] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs leading-5 text-[#89938a]">Responses are saved on this device for now.</span>
        <button className="rounded-full bg-[#51685a] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#f4f0e7] shadow-[0_4px_0_#34463e] transition hover:-translate-y-0.5" type="submit">Send my reply <span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}

function updateFormValue(updateForm, key, value) {
  updateForm(key)({ target: { value } });
}

function AttendanceButton({ active, children, onClick }) {
  return (
    <button className={`border px-4 py-3 text-left text-sm transition ${active ? "border-[#51685a] bg-[#e4ebe1] text-[#34463e]" : "border-[#c8cfc5] bg-[#f8f6ef] text-[#7b877d] hover:border-[#8da193]"}`} type="button" onClick={onClick} aria-pressed={active}>
      <span className={`mr-2 inline-block h-2 w-2 rounded-full border ${active ? "border-[#51685a] bg-[#51685a]" : "border-[#9ca59d]"}`} />
      {children}
    </button>
  );
}

function TabButton({ active, children, onClick }) {
  return <button className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${active ? "bg-[#51685a] text-[#f4f0e7]" : "text-[#758178] hover:text-[#34463e]"}`} type="button" onClick={onClick}>{children}</button>;
}

function Fact({ label, value }) {
  return (
    <div className="border-l-2 border-[#c1cbbf] pl-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0785f]">{label}</div>
      <div className="mt-2 text-sm text-[#56645b]">{value}</div>
    </div>
  );
}

function Confirmation({ form, onBack }) {
  return (
    <section className="flex min-h-[500px] flex-col justify-center">
      <div className="max-w-xl">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a0785f]">Reply logged</div>
        <h2 className="mt-4 font-serif text-5xl leading-[0.96] tracking-[-0.06em] text-[#34463e]">Your seat is reserved, {form.name.split(" ")[0]}.</h2>
        <p className="mt-6 max-w-md text-sm leading-7 text-[#6d786f]">Thank you for being part of this day. We’ll see you at {EVENT.venue} on {EVENT.dateLong}.</p>
        <div className="mt-8 grid max-w-sm grid-cols-2 gap-3 border-y border-[#d5cec0] py-5 text-sm">
          <div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0785f]">Attendance</div><div className="mt-1 text-[#34463e]">{form.attendance === "yes" ? "I’ll be there" : "Can’t make it"}</div></div>
          <div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0785f]">Guests</div><div className="mt-1 text-[#34463e]">{form.guests}</div></div>
        </div>
        <button className="mt-8 border-b border-[#51685a] pb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#51685a]" type="button" onClick={onBack}>Back to the invitation →</button>
      </div>
    </section>
  );
}
