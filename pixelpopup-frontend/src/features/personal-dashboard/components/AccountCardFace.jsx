import { useEffect, useRef } from "react";
import Card from "card";
import "card/lib/card.css";
import InstitutionLogo from "./InstitutionLogo";
import { cardNetworks, choiceIcon, coverageTypes, fundTypes, institutionFor } from "../lib/presets";
import "./AccountCardFace.css";

const kindLabels = {
  bank: "Bank account",
  cash: "Cash",
  ewallet: "Digital wallet",
  credit_card: "Credit card",
};

export default function AccountCardFace({ account, align = "center", size = "default" }) {
  const containerRef = useRef(null);
  const kind = account.kind || "bank";
  const coverage = kind === "fund" && coverageTypes.includes(account.fund_type);
  const name = String(account.name || "Account name").trim();
  const lastFour = String(account.last_four || "").replace(/\D/g, "").slice(-4);
  const expiry = String(account.card_expiry || "").trim();
  const institution =
    kind === "cash" || kind === "fund"
      ? null
      : institutionFor(account.institution || account.name);
  const Icon = choiceIcon(kind === "fund" ? account.fund_type : kind);
  const networkOption =
    kind === "cash" || kind === "fund"
      ? null
      : cardNetworks.find(
          (option) => option.value && option.value === account.card_network,
        );
  const network = networkOption?.value || "";
  const label =
    kind === "fund"
      ? fundTypes.find((item) => item.value === account.fund_type)?.label || "Fund"
      : kindLabels[kind] || "Account";
  const faceNumber =
    kind === "cash"
      ? "Cash on hand"
      : kind === "fund"
        ? coverage ? "Coverage only" : "Recorded fund"
        : lastFour
          ? `••••  ••••  ••••  ${lastFour}`
          : "No number saved";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Card.js needs a form, but this detached one never collects or submits card data.
    const previewForm = document.createElement("form");
    ["number", "expiry", "cvc", "name"].forEach((field) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = field;
      previewForm.appendChild(input);
    });
    new Card({ form: previewForm, container, formatting: false });
    container
      .querySelectorAll(".jp-card-back, .jp-card-cvc")
      .forEach((element) => element.remove());

    return () => {
      container.replaceChildren();
      container.removeAttribute("data-jp-card-initialized");
    };
  }, []);

  useEffect(() => {
    const front = containerRef.current?.querySelector(".jp-card-front");
    if (!front) return;
    const card = front.closest(".jp-card");
    cardNetworks.forEach((option) => {
      if (option.value) card.classList.remove(`jp-card-${option.value}`);
    });
    card.classList.toggle("jp-card-identified", !!network);
    if (network) card.classList.add(`jp-card-${network}`);
    front.querySelector(".jp-card-number").textContent = faceNumber;
    front.querySelector(".jp-card-name").textContent = name;
    const expiryDisplay = front.querySelector(".jp-card-expiry");
    expiryDisplay.textContent = kind === "cash" || kind === "fund" ? "" : expiry;
    expiryDisplay.dataset.before = expiry ? "Expires" : "";
    expiryDisplay.dataset.after = "";
  }, [faceNumber, name, expiry, kind, network]);

  const description = [label, name];
  if (networkOption) description.push(networkOption.label);
  if (lastFour && kind !== "cash" && kind !== "fund")
    description.push(`ending in ${lastFour}`);
  if (expiry && kind !== "cash" && kind !== "fund")
    description.push(`expires ${expiry}`);

  return (
    <div
      role="img"
      aria-label={description.join(", ")}
      data-kind={kind}
      data-network={network || undefined}
      className={"pd-card-preview relative aspect-[7/4] w-full " + (size === "small" ? "max-w-[250px] " : "max-w-[350px] ") + (align === "left" ? "ml-0 mr-auto" : "mx-auto")}
    >
      <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-[7%] pt-[6%] text-white"
      >
        {institution ? (
          <span className="grid h-8 w-16 shrink-0 place-items-center rounded bg-white px-1.5 py-1">
            <InstitutionLogo institution={institution} />
          </span>
        ) : (
          <span className="max-w-[65%] truncate text-xs font-semibold tracking-wide">
            {label}
          </span>
        )}
        {!network && <Icon size={24} className="shrink-0 text-white" />}
      </div>
    </div>
  );
}
