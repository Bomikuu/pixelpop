import { initials } from "../../lib/sharedBills";

export default function ParticipantAvatars({ participants }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="flex -space-x-2" aria-hidden="true">
        {participants.slice(0, 3).map((person) => (
          <span
            key={person.id || person.name}
            title={person.name}
            className="grid size-8 place-items-center rounded-full border-2 border-white bg-blue-50 text-xs font-semibold text-blue-800"
          >
            {initials(person.name)}
          </span>
        ))}
      </span>
      <span className="text-xs text-slate-600">
        {participants.length > 3
          ? "+" + (participants.length - 3) + " more · "
          : ""}
        {participants.length} people
      </span>
    </span>
  );
}
