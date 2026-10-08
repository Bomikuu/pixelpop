import { ChoiceField } from "./shared";

// ISO 3166-1 alpha-2 choices from tzdata's iso3166.tab, plus XK for Kosovo.
const countryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW`.split(" ");
const commonCountries = ["PH", "US", "GB", "AU", "CA", "SG", "IN", "JP", "AE", "DE", "FR", "NZ"];
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryChoices = countryCodes.map((code) => {
  const name = code === "XK" ? "Kosovo" : regionNames.of(code);
  return { code, name };
});
const countryOptions = [
  ...commonCountries.map((code) => countryChoices.find((country) => country.code === code)),
  ...countryChoices.filter((country) => !commonCountries.includes(country.code)).sort((a, b) => a.name.localeCompare(b.name)),
].map(({ code, name }) => [name, `${name} (${code})`]);

const commonCurrencies = ["USD", "PHP", "EUR", "GBP", "AUD", "CAD", "SGD", "JPY", "AED"];
const supportedCurrencies = typeof Intl.supportedValuesOf === "function"
  ? Intl.supportedValuesOf("currency")
  : commonCurrencies;
const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
const currencyOptions = [...new Set([...commonCurrencies, ...supportedCurrencies])]
  .map((code) => [code, `${code} · ${currencyNames.of(code)}`]);

export function ClientCountryField({ label = "Country", value, onChange, error }) {
  const options = value && !countryOptions.some(([name]) => name === value)
    ? [["not-set", "Not specified"], [value, value], ...countryOptions]
    : [["not-set", "Not specified"], ...countryOptions];
  return <ChoiceField label={label} name="country" value={value || "not-set"} onChange={(_, next) => onChange("country", next === "not-set" ? "" : next)} options={options} error={error}/>;
}

export function ProjectCurrencyField({ value, onChange, error }) {
  const options = value && !currencyOptions.some(([code]) => code === value)
    ? [[value, value], ...currencyOptions]
    : currencyOptions;
  return <ChoiceField label="Currency" name="currency" value={value} onChange={onChange} options={options} required error={error}/>;
}
