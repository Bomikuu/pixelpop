// Merchant aliases and locally served logos belong here, not in individual views.
// Category/type fallback icons continue to use the shared presets.choiceIcon.
export const transactionMerchants = [
  {
    id: "mcdonalds",
    name: "McDonald’s",
    aliases: ["mcdo", "mcdonalds", "mcdonald's", "mcdonald"],
    category: "Food",
    logo: "/dashboard-merchants/mcdonalds.svg",
    badgeClass: "bg-[#db0007]",
    source: "https://www.mcdonalds.com.ph/",
  },
  {
    id: "jollibee",
    name: "Jollibee",
    aliases: ["jollibee", "jolli bee"],
    category: "Food",
    logo: "/dashboard-merchants/jollibee.ico",
    badgeClass: "bg-white border border-[var(--pd-border)]",
    source: "https://www.jollibee.com.ph/themes/custom/jollibee_theme/favicon.ico",
  },
  {
    id: "starbucks",
    name: "Starbucks",
    aliases: ["starbucks", "star bucks"],
    category: "Food",
    logo: "/dashboard-merchants/starbucks.svg",
    badgeClass: "bg-white border border-[var(--pd-border)]",
    source: "https://starbucks.ph/images/sblogo.svg",
  },
];

const normalize = (value) => String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");

export function transactionMerchantFor(description) {
  const text = ` ${normalize(description)} `;
  let match = null;
  let longest = 0;
  for (const merchant of transactionMerchants) {
    for (const alias of merchant.aliases) {
      const phrase = normalize(alias);
      if (phrase.length > longest && text.includes(` ${phrase} `)) {
        match = merchant;
        longest = phrase.length;
      }
    }
  }
  return match;
}
