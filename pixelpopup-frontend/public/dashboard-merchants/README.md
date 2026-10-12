# Transaction merchant assets

The shared catalog is `src/features/personal-dashboard/lib/transactionMerchants.js`.
It owns merchant names, whole-phrase aliases, category hints, local asset paths, badge presentation, and source attribution. `TransactionTypeIcon` renders these logos and falls back to existing `presets.choiceIcon` icons for unknown merchants or failed images. Bank logos remain in the existing `presets.institutions` catalog; do not duplicate them here.

Assets were obtained from the brands’ official websites:

- McDonald’s: the golden-arches SVG in the header of https://www.mcdonalds.com.ph/ (the 16px favicon was not used).
- Jollibee: https://www.jollibee.com.ph/themes/custom/jollibee_theme/favicon.ico
- Starbucks: https://starbucks.ph/images/sblogo.svg

These marks identify the transaction merchant; they do not imply affiliation or endorsement. Trademarks belong to their respective owners. Assets are served locally without third-party image requests when entering financial data.
