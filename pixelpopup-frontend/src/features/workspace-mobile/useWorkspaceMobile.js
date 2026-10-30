import { useSyncExternalStore } from "react";

const query = "(max-width: 1023px)";
const read = () => window.matchMedia(query).matches;
const subscribe = (notify) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

export default function useWorkspaceMobile() {
  return useSyncExternalStore(subscribe, read, () => false);
}
