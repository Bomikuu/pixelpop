export const catMascotConfig = Object.freeze({
  enabled: true,
  supportedRoutes: ["/", "/portfolio", "/asta"],
  spriteUrl: "/mascot/office-cat-sprite.webp",
  sprite: {
    sheetWidth: 1536,
    sheetHeight: 1024,
    columns: 4,
    rows: 2,
  },
  desktopSize: { width: 96, height: 128 },
  tabletSize: { width: 78, height: 104 },
  mobileSize: { width: 64, height: 86 },
  edgePadding: 20,
  exclusionPadding: 14,
  minimumIdleDuration: 4000,
  maximumIdleDuration: 10000,
  minimumSpeechInterval: 18000,
  maximumSpeechInterval: 30000,
  speechDuration: 4400,
  movementEnabledOnMobile: false,
  enableSleepingState: true,
  pauseWhenDocumentHidden: true,
  exclusionSelectors: [
    "nav",
    "form",
    "dialog[open]",
    "[role='dialog'][aria-modal='true']",
    "[data-mascot-exclusion-zone]",
    "a[href='#work']",
    "a[href='#contact']",
    "#process [role='tablist']",
    ".asta-button",
    ".asta-agency-button",
  ],
});

export function isMascotRoute(pathname) {
  return catMascotConfig.supportedRoutes.some((route) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ));
}
