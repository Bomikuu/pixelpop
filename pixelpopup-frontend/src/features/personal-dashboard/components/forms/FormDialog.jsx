import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { utilityPresets, choiceIcon, institutionFor, cashKinds, coverageTypes } from "../../lib/presets";
import { requestId } from "../../lib/format";
import { accountChoiceOption, accountProjection } from "../AccountBalancePreview";
import { formDefinition } from "./formDefinitions";
import { accountSources, accountState as getAccountState } from "./accountFlow";
import { buildSubmission } from "./formSubmission";
import { validateForm } from "./formValidation";
import FormModalShell from "./FormModalShell";
import FormField from "./FormField";
import PersonFields from "./PersonFields";
import AccountFormPreview from "./AccountFormPreview";
import RecurringBillPreset from "./RecurringBillPreset";
import InlinePersonCreator from "./InlinePersonCreator";

export default function FormDialog({ entity, record, data, mutate, close, notify, restoreFocus }) {
  const definition = formDefinition(entity, record);
  const [initial] = useState(() => Object.fromEntries(
    definition.fields.map((field) => [field.name, String(record?.[field.name] ?? field.default ?? "")]),
  ));
  const [values, setValues] = useState(initial);
  const [institutionChoice, setInstitutionChoice] = useState(
    () => institutionFor(initial.institution)?.value || "__other",
  );
  const [utility, setUtility] = useState("custom");
  const [key] = useState(requestId);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [personDraft, setPersonDraft] = useState({ name: "", relationship: "", custom_relationship: "", notes: "" });
  const [personErrors, setPersonErrors] = useState({});
  const [personSaving, setPersonSaving] = useState(false);
  const [createdContact, setCreatedContact] = useState(null);
  const pendingErrorFocus = useRef(null);
  const dirty = JSON.stringify(initial) !== JSON.stringify(values) || Object.values(personDraft).some(Boolean);
  const fields = definition.fields.filter((field) => !field.when || field.when(values));

  function showErrors(next, inlinePerson = false) {
    pendingErrorFocus.current = {
      prefix: inlinePerson ? "new-contact" : "finance",
      names: Object.keys(next).filter((name) => next[name]),
    };
    if (inlinePerson) setPersonErrors(next);
    else setErrors(next);
  }

  useEffect(() => {
    // Wait for errors to render and saving controls to become focusable again.
    if (saving || personSaving || !pendingErrorFocus.current) return;
    const { prefix, names } = pendingErrorFocus.current;
    pendingErrorFocus.current = null;
    for (const name of names) {
      const control = document.getElementById(`${prefix}-${name}`);
      control?.focus();
      if (control && document.activeElement === control) return;
    }
    document.getElementById(`${prefix}-form-error`)?.focus();
  }, [errors, personErrors, saving, personSaving]);

  const sources = {
    accounts: data.accounts.filter((account) => account.active && account.kind !== "fund").map(accountChoiceOption),
    cashAccounts: data.accounts.filter((account) => account.active && cashKinds.includes(account.kind)).map(accountChoiceOption),
    cards: data.accounts.filter((account) => account.active && account.kind === "credit_card").map(accountChoiceOption),
    funds: data.accounts.filter((account) => account.active && account.kind === "fund" && !coverageTypes.includes(account.fund_type)).map(accountChoiceOption),
    coverages: data.accounts
      .filter((account) => account.kind === "fund" && coverageTypes.includes(account.fund_type) && (account.active || String(account.id) === String(record?.coverage)))
      .map((account) => ({ value: String(account.id), label: account.name, icon: choiceIcon(account.fund_type) })),
    categories: data.categories.map((category) => ({ value: String(category.id), label: category.name, icon: choiceIcon(category.name) })),
    contacts: [...data.contacts, ...(createdContact && !data.contacts.some((person) => person.id === createdContact.id) ? [createdContact] : [])]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((person) => ({ value: String(person.id), label: [person.name, person.nickname, person.organization,
        person.custom_relationship || person.relationship, "Person #" + person.id].filter(Boolean).join(" · "), icon: Users })),
  };
  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", common: "" }));
  }
  const amountValue = entity === "loan" ? values.principal : values.amount;
  const accountState = (field) => getAccountState({
    entity, field, values, record, accounts: data.accounts, amount: amountValue, project: accountProjection,
  });
  const insufficientAccount = fields.some((field) => accountSources.has(field.source) && accountState(field).blocked);

  async function savePerson() {
    if (personSaving) return;
    const personDefinition = formDefinition("person");
    const personFields = personDefinition.fields.filter((field) => !field.when || field.when(personDraft));
    const invalid = validateForm({ entity: "person", fields: personFields, values: personDraft });
    if (Object.keys(invalid).length) {
      showErrors(invalid, true);
      return;
    }
    setPersonSaving(true);
    try {
      const { body } = buildSubmission({
        entity: "person", definition: personDefinition, fields: personFields,
        values: Object.fromEntries(personDefinition.fields.map((field) => [field.name, personDraft[field.name] || ""])),
      });
      const person = await mutate("contacts/", body);
      setCreatedContact(person);
      change("contact", String(person.id));
      setPersonDraft({ name: "", relationship: "", custom_relationship: "", notes: "" });
      setPersonErrors({});
      setCreatingPerson(false);
      notify("Person added.", { entity: "person", action: "added" });
      requestAnimationFrame(() => document.getElementById("finance-contact")?.focus());
    } catch (error) {
      const mapped = error.fields && typeof error.fields === "object" && !Array.isArray(error.fields)
        ? Object.fromEntries(Object.entries(error.fields).map(([name, value]) => [name, Array.isArray(value) ? value.join(" ") : String(value)]))
        : {};
      showErrors({ ...mapped, common: mapped.detail || mapped.non_field_errors || error.message }, true);
    } finally {
      setPersonSaving(false);
    }
  }

  function chooseUtility(value) {
    setUtility(value);
    const preset = utilityPresets.find((item) => item.value === value);
    if (value === "custom") {
      setValues((current) => ({ ...current, title: "", kind: "bill", amount_mode: "fixed", amount: "" }));
      setErrors({});
      return;
    }
    if (preset?.title) {
      setValues((current) => ({
        ...current, title: preset.title, kind: preset.kind || "bill", repeat: "monthly",
        amount_mode: preset.amountMode || "fixed", amount: "", settlement_kind: "expense",
      }));
      setErrors({});
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving || personSaving) return;
    const invalid = validateForm({ entity, fields, values, getAccountState: accountState });
    if (Object.keys(invalid).length) {
      showErrors(invalid);
      return;
    }
    const { path, body, method, notification } = buildSubmission({
      entity, record, definition, fields, values, requestId: key,
    });
    setSaving(true);
    try {
      await mutate(path, body, method);
      notify(notification.message, notification.context);
      close();
    } catch (error) {
      const mapped = error.fields && typeof error.fields === "object" && !Array.isArray(error.fields)
        ? Object.fromEntries(Object.entries(error.fields).map(([name, value]) => [name, Array.isArray(value) ? value.join(" ") : String(value)]))
        : {};
      showErrors({ ...mapped, common: mapped.detail || mapped.non_field_errors || error.message });
    } finally {
      setSaving(false);
    }
  }

  const description = entity === "deadline"
    ? ["task", "reminder"].includes(values.kind)
      ? "Tasks have no payment amount and do not change your balances."
      : "Plan the bill now, then record its payment when it is due."
    : entity === "person"
      ? "Save this person once, then select them for giving or loans."
      : entity === "schedule" && record?.coverage
        ? "Premium bills appear on your deadlines. Paying one records an expense linked to this coverage."
        : "Manual tracking in Philippine pesos. Your records stay in Django.";

  return <FormModalShell
    title={definition.title} description={description}
    error={errors.common || (Object.values(errors).some(Boolean) ? "Check the highlighted fields before saving." : "")}
    errorId="finance-form-error"
    busy={saving || personSaving} dirty={dirty} onSubmit={save} onCancel={close} scrollBody
    onCloseAutoFocus={restoreFocus} submitDisabled={insufficientAccount || fields.some((field) => field.type === "image" && ["__processing__", "__invalid__"].includes(values[field.name]))}
    saveLabel={entity === "person" ? "Save person" : "Save record"}
  >
    {entity === "deadline" && !record?.id && ["bill", "subscription", "payment"].includes(values.kind) &&
      <RecurringBillPreset value={utility} onChange={chooseUtility} disabled={saving} />}
    <div className={entity === "account" ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,350px)]" : ""}>
      {entity === "account" && <AccountFormPreview values={values} />}
      <div className={`grid gap-4 sm:grid-cols-2 ${entity === "account" ? "xl:order-1" : entity === "person" ? "" : "lg:grid-cols-6"}`}>
        {entity === "person" ? <PersonFields values={values} onChange={change} errors={errors} disabled={saving} existingAvatar={record?.avatar_url} /> :
          fields.map((field) => {
            let options = field.options || sources[field.source] || [];
            if (field.cashOnly && field.source === "accounts") options = sources.cashAccounts;
            if (entity === "movement" && field.name === "destination")
              options = values.kind === "credit_card_payment" ? sources.cards : sources.cashAccounts;
            return <FormField
              key={field.name} field={field} values={values} options={options}
              error={errors[field.name]} disabled={saving} onChange={change}
              entity={entity} accountState={accountState} amountValue={amountValue}
              institutionChoice={institutionChoice} onInstitutionChoice={setInstitutionChoice}
            >
              {field.name === "contact" && ["giving", "loan", "expense"].includes(entity) &&
                <InlinePersonCreator
                  open={creatingPerson}
                  onToggle={() => {
                    setCreatingPerson((current) => !current);
                    if (!creatingPerson) requestAnimationFrame(() => document.getElementById("new-contact-name")?.focus());
                  }}
                  draft={personDraft}
                  onDraftChange={(name, value) => {
                    setPersonDraft((current) => ({ ...current, [name]: value }));
                    setPersonErrors((current) => ({ ...current, [name]: "", common: "" }));
                  }}
                  errors={personErrors} saving={personSaving} onSave={savePerson} disabled={saving}
                />}
            </FormField>;
          })}
      </div>
    </div>
    {entity === "income" && values.repeat !== "never" && values.repeat &&
      <p className="text-sm text-slate-600">Recurring income is generated as expected. Mark it received after the money arrives.</p>}
  </FormModalShell>;
}
