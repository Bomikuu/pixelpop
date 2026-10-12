import PersonAvatar from "../PersonAvatar";

export default function ParticipantAvatars({ participants, showNames = false }) {
  if (showNames) {
    return (
      <span className="flex flex-wrap gap-x-5 gap-y-3">
        {participants.map((person) => (
          <span key={person.id || person.name} className="flex min-w-0 items-center gap-2 text-sm text-slate-900">
            <PersonAvatar src={person.avatar_url} name={person.name} className="size-9 text-xs" />
            <span className="break-words">{person.name}</span>
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="flex -space-x-2" aria-hidden="true">
        {participants.slice(0, 3).map((person) => (
          <span
            key={person.id || person.name}
            title={person.name}
            className="rounded-full border-2 border-white"
          >
            <PersonAvatar src={person.avatar_url} name={person.name} className="size-8 text-xs" />
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
