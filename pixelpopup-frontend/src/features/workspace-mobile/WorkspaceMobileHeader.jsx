import ThemeToggle from "../../ui/theme/ThemeToggle";

export default function WorkspaceMobileHeader({ title, subtitle, workspace = "Personal", headingRef, actions, children }) {
  return <header className="workspace-mobile-header lg:hidden">
    <div className="workspace-mobile-masthead">
      <div className="workspace-mobile-brand">
        <img src="/portfolio/assets/mico-logo.webp" width="36" height="36" alt="" />
        <div className="min-w-0">
          <p className="workspace-mobile-wordmark">Mico Workspace</p>
          <p className="workspace-mobile-context">{workspace}</p>
        </div>
      </div>
      <div className="workspace-mobile-tools"><ThemeToggle />{actions}</div>
    </div>
    <div className="workspace-mobile-subheader">
      <div className="workspace-mobile-page-heading">
        <h1 ref={headingRef} tabIndex={-1} className="workspace-mobile-title">{title}</h1>
        {subtitle && <p className="workspace-mobile-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="workspace-mobile-date-controls">{children}</div>}
    </div>
  </header>;
}
