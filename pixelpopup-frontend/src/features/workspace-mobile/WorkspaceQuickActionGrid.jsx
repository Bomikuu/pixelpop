export default function WorkspaceQuickActionGrid({ items, onChoose }) {
  return <div className="workspace-quick-action-grid" data-action-count={items.length}>
    {items.map((action, index) => <button key={action.label} type="button" className="workspace-quick-action" style={{ "--workspace-action-order": Math.min(index, 5) }} onClick={() => onChoose(action)} disabled={action.disabled}>
      <span className="workspace-quick-action-icon"><action.Icon size={27} strokeWidth={1.65} aria-hidden="true" /></span>
      <span className="mt-3 text-sm font-medium leading-5">{action.mobileLabel || action.label}</span>
      {action.description && <span className="sr-only">{action.description}</span>}
    </button>)}
  </div>;
}
