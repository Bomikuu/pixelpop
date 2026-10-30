import { MoreHorizontal, Plus } from "lucide-react";
import useWorkspaceObstructions from "./useWorkspaceObstructions";
import "./mobileWorkspace.css";

export default function WorkspaceBottomNav({ items, onNavigate, onMore, moreOpen, moreButtonRef, moreControls, onAction, actionOpen, actionButtonRef, actionControls }) {
  const { keyboardOpen } = useWorkspaceObstructions();
  const moreActive = moreOpen || !items.some((item) => item.active);
  const activeIndex = items.findIndex((item) => item.active);
  const activeSlot = moreActive ? 4 : activeIndex < 2 ? activeIndex : activeIndex + 1;
  const classes = (active) => `workspace-bottom-link ${active ? "workspace-bottom-link-active" : ""}`;
  const link = ({ key, label, href, Icon, active }) => <a key={key} href={href} aria-current={active ? "page" : undefined} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onNavigate(href);
  }} className={classes(active)}><Icon size={22} strokeWidth={active ? 2.2 : 1.7} aria-hidden="true"/><span>{label}</span></a>;
  return <nav aria-label="Workspace shortcuts" data-mascot-exclusion-zone style={{ "--workspace-active-slot": activeSlot }} className={`workspace-bottom-nav workspace-bottom-nav-centered fixed inset-x-0 bottom-0 z-30 lg:hidden ${keyboardOpen ? "hidden" : "grid"}`}>
    <span className="workspace-bottom-indicator" aria-hidden="true" />
    {items.slice(0, 2).map(link)}
    <button ref={actionButtonRef} type="button" className="workspace-bottom-action" aria-label="Open quick actions" aria-haspopup="dialog" aria-expanded={actionOpen} aria-controls={actionControls} onClick={onAction}><Plus size={29} strokeWidth={1.8} aria-hidden="true" /><span className="sr-only">Quick actions</span></button>
    {items.slice(2).map(link)}
    <button ref={moreButtonRef} type="button" aria-haspopup="dialog" aria-expanded={moreOpen} aria-controls={moreControls} onClick={onMore} className={classes(moreActive)}><MoreHorizontal size={21} aria-hidden="true"/><span>More</span></button>
  </nav>;
}
