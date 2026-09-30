import AccountCardFace from "../AccountCardFace";

export default function AccountFormPreview({ values }) {
  return <div className="xl:order-2">
    <p className="mb-3 text-sm font-semibold text-[var(--pd-ink)]">Card preview</p>
    <AccountCardFace account={values} />
    <p className="mt-3 text-xs leading-5 text-slate-600">
      For account numbers, only the last four digits are saved. Expiry is optional;
      no full card number or security code is needed.
    </p>
  </div>;
}
