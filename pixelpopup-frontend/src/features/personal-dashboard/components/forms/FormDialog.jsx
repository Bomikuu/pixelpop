import { useEffect, useRef, useState } from "react";
import { Save, UserRoundPlus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../ui/alert-dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import SelectableField from "../SelectableField";
import {
  institutions,
  utilityPresets,
  choiceIcon,
  institutionFor,
  cashKinds,
  coverageTypes,
} from "../../lib/presets";
import { Button } from "../../ui/button";
import { formDefinition } from "./formDefinitions";
import PersonFields from "./PersonFields";
import { requestId } from "../../lib/format";
import AccountCardFace from "../AccountCardFace";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "../AccountBalancePreview";

const accountSources = new Set(["accounts", "cashAccounts", "cards", "funds"]);

function accountFlow(entity, field, values, record) {
  if (!accountSources.has(field.source) || field.name === "credit_card" || ["deadline", "schedule"].includes(entity)) return null;
  if (entity === "settlement" && values.transaction) return null;
  if (entity === "loan" && values.existing === "true") return null;
  if (["expense", "income", "giving"].includes(entity) && values.repeat && values.repeat !== "never") return null;
  if (field.name === "source") return "out";
  if (field.name === "destination") return entity === "movement" && values.kind === "credit_card_payment" ? "cardPayment" : "in";
  if (entity === "income" || (entity === "settlement" && record?.settlement_kind === "loan_collection")) return "in";
  if (entity === "movement" && values.kind === "loan_repayment") return "in";
  return "out";
}

export default function FormDialog({
  entity,
  record,
  data,
  mutate,
  close,
  notify,
  restoreFocus,
}) {
  const definition = formDefinition(entity, record);
  const [initial] = useState(() =>
    Object.fromEntries(
      definition.fields.map((f) => [
        f.name,
        String(record?.[f.name] ?? f.default ?? ""),
      ]),
    ),
  );
  const [values, setValues] = useState(initial);
  const [institutionChoice, setInstitutionChoice] = useState(
    () => institutionFor(initial.institution)?.value || "__other",
  );
  const [utility, setUtility] = useState("custom");
  const [key] = useState(requestId);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [personDraft, setPersonDraft] = useState({ name: "", relationship: "", custom_relationship: "", notes: "" });
  const [personErrors, setPersonErrors] = useState({});
  const [personSaving, setPersonSaving] = useState(false);
  const [createdContact, setCreatedContact] = useState(null);
  const draftControl = useRef(null);
  const dirty = JSON.stringify(initial) !== JSON.stringify(values) || Object.values(personDraft).some(Boolean);
  useEffect(() => {
    const unload = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);
  const fields = definition.fields.filter((f) => !f.when || f.when(values));
  const sources = {
    accounts: data.accounts
      .filter((a) => a.active && a.kind !== "fund")
      .map(accountChoiceOption),
    cashAccounts: data.accounts
      .filter((a) => a.active && cashKinds.includes(a.kind))
      .map(accountChoiceOption),
    cards: data.accounts
      .filter((a) => a.active && a.kind === "credit_card")
      .map(accountChoiceOption),
    funds: data.accounts
      .filter((a) => a.active && a.kind === "fund" && !coverageTypes.includes(a.fund_type))
      .map(accountChoiceOption),
    coverages: data.accounts
      .filter((a) => a.kind === "fund" && coverageTypes.includes(a.fund_type) && (a.active || String(a.id) === String(record?.coverage)))
      .map((a) => ({
        value: String(a.id),
        label: a.name,
        icon: choiceIcon(a.fund_type),
      })),
    categories: data.categories.map((c) => ({
      value: String(c.id),
      label: c.name,
      icon: choiceIcon(c.name),
    })),
    contacts: [...data.contacts, ...(createdContact && !data.contacts.some((person) => person.id === createdContact.id) ? [createdContact] : [])]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((person) => ({ value: String(person.id), label: person.name, icon: Users })),
  };
  function change(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "", common: "" }));
  }
  const amountValue = entity === "loan" ? values.principal : values.amount;
  const accountState = (field) => {
    const direction = accountFlow(entity, field, values, record);
    const selected = data.accounts.find((item) => String(item.id) === String(values[field.name]));
    const existingAmount = record?.id && ["expense", "income", "giving"].includes(entity) && String(record.account) === String(selected?.id)
      ? record.amount : 0;
    const projection = direction && selected && accountProjection(selected, amountValue, direction, existingAmount);
    const blocked = direction === "out" && selected?.kind === "credit_card" && selected.credit_limit == null;
    return { direction, selected, existingAmount, blocked: blocked || projection?.blocked, previewVisible: Boolean(projection || blocked) };
  };
  const insufficientAccount = fields.some((field) => accountSources.has(field.source) && accountState(field).blocked);
  async function savePerson() {
    if (personSaving) return;
    const invalid = {};
    if (!personDraft.name.trim()) invalid.name = "Enter a name.";
    if (!personDraft.relationship) invalid.relationship = "Choose a relationship.";
    if (Object.keys(invalid).length) {
      setPersonErrors(invalid);
      document.getElementById("new-contact-" + Object.keys(invalid)[0])?.focus();
      return;
    }
    setPersonSaving(true);
    try {
      const person = await mutate("contacts/", {
        ...personDraft,
        name: personDraft.name.trim(),
        custom_relationship: personDraft.relationship === "Other" ? personDraft.custom_relationship.trim() : "",
      });
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
      setPersonErrors({ ...mapped, common: mapped.detail || mapped.non_field_errors || error.message });
      document.getElementById("new-contact-" + Object.keys(mapped)[0])?.focus();
    } finally {
      setPersonSaving(false);
    }
  }
  function chooseUtility(value) {
    setUtility(value);
    const preset = utilityPresets.find((p) => p.value === value);
    if (preset?.title) {
      setValues((v) => ({
        ...v,
        title: preset.title,
        kind: "bill",
        repeat: "monthly",
        amount_mode: value === "internet" ? "fixed" : "variable",
        amount: "",
        settlement_kind: "expense",
      }));
      setErrors({});
    }
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const invalid = {};
    for (const f of fields) {
      const value = values[f.name]?.trim();
      const linkedExpense = entity === "settlement" && values.transaction;
      if (
        f.required &&
        !value &&
        !(linkedExpense && ["amount", "account"].includes(f.name))
      )
        invalid[f.name] = "Enter or select " + f.label.toLowerCase() + ".";
      if (
        value &&
        f.type === "number" &&
        (!Number.isFinite(Number(value)) ||
          (f.min != null && Number(value) < Number(f.min)))
      )
        invalid[f.name] = "Enter a valid amount or number.";
      if (f.max && value > f.max)
        invalid[f.name] = "Use today or an earlier date.";
      if (value && f.pattern && !new RegExp(f.pattern).test(value))
        invalid[f.name] = f.validationMessage;
    }
    for (const field of fields.filter((item) => accountSources.has(item.source))) {
      if (accountState(field).blocked) invalid[field.name] = "Choose an account with enough balance or available credit.";
    }
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      document.getElementById("finance-" + Object.keys(invalid)[0])?.focus();
      return;
    }
    const body = Object.fromEntries(
      fields
        .filter(
          (f) =>
            f.name !== "repeat" &&
            f.name !== "amount_mode" &&
            (entity === "schedule" || f.name !== "interval"),
        )
        .map((f) => [
          f.name,
          values[f.name] === ""
            ? f.nullable || f.type === "number" || f.type === "time"
              ? null
              : ""
            : ["existing", "active"].includes(f.name)
              ? values[f.name] === "true"
              : values[f.name],
        ]),
    );
    if (
      values.amount_mode === "variable" &&
      (entity === "schedule" || !record?.id)
    )
      body.amount = null;
    if (entity === "deadline" && !record?.id && ["task", "reminder"].includes(body.kind))
      body.amount = null;
    if (entity === "schedule" && record?.kind !== "income")
      body.variable_amount = values.amount_mode === "variable";
    if (entity === "schedule" && record?.coverage) {
      body.coverage = record.coverage;
      body.kind = "bill";
      body.settlement_kind = "expense";
      body.interval = 1;
    }
    if (["expense", "income"].includes(entity)) body.kind = entity;
    if (entity === "giving") body.kind = "expense";
    if (entity === "fund") body.kind = "fund";
    if (entity === "fund" && coverageTypes.includes(body.fund_type)) body.opening_balance = 0;
    if (["fund_contribution", "fund_withdrawal"].includes(entity))
      body.kind = entity;
    let path = definition.endpoint,
      method =
        definition.method ||
        (record?.id &&
        ![
          "settlement",
          "adjustment",
          "movement",
          "budget",
          "fund_contribution",
          "fund_withdrawal",
        ].includes(entity)
          ? "PATCH"
          : "POST");
    if (method === "PATCH" && record?.id && entity !== "budget")
      path += record.id + "/";
    if (
      (!record?.id &&
        ["expense", "income", "loan", "giving"].includes(entity)) ||
      [
        "movement",
        "adjustment",
        "settlement",
        "fund_contribution",
        "fund_withdrawal",
      ].includes(entity)
    )
      body.request_id = key;
    if (values.repeat && values.repeat !== "never") {
      path = "schedules/";
      method = "POST";
      const scheduled = {
        title: body.title || body.name,
        kind: entity === "income" ? "income" : body.kind,
        amount: body.amount,
        anchor_date: body.due_date || body.date,
        frequency: values.repeat,
        interval: Number(values.interval || 1),
        category: body.category || null,
        account: body.credit_card || body.account || null,
        settlement_kind: body.settlement_kind || "expense",
        due_time: body.due_time || null,
        reminder_days: body.reminder_days || 0,
        notes: body.notes,
        variable_amount:
          ["bill", "subscription", "payment"].includes(body.kind) &&
          body.amount == null,
      };
      Object.keys(body).forEach((k) => delete body[k]);
      Object.assign(body, scheduled);
    }
    setSaving(true);
    try {
      await mutate(path, body, method);
      notify(entity === "person" ? (record?.id ? "Person updated." : "Person added.") : "Saved successfully.", {
        entity: path === "schedules/" ? "schedule" : entity,
        action:
          entity === "settlement" &&
          record?.settlement_kind === "loan_collection"
            ? "collected"
            : entity === "movement" && values.kind === "loan_repayment"
              ? "repaid"
              : entity === "movement" && values.kind === "transfer"
                ? "transferred"
                : entity === "settlement"
                  ? "settled"
                  : entity === "repayment"
                    ? "repaid"
                    : entity === "adjustment"
                      ? "corrected"
                      : record?.id
                        ? "edited"
                        : "added",
      });
      close();
    } catch (error) {
      const mapped =
        error.fields &&
        typeof error.fields === "object" &&
        !Array.isArray(error.fields)
          ? Object.fromEntries(
              Object.entries(error.fields).map(([k, v]) => [
                k,
                Array.isArray(v) ? v.join(" ") : String(v),
              ]),
            )
          : {};
      setErrors({
        ...mapped,
        common: mapped.detail || mapped.non_field_errors || error.message,
      });
      document.getElementById("finance-" + Object.keys(mapped)[0])?.focus();
    } finally {
      setSaving(false);
    }
  }
  const tryClose = () => {
    if (!saving) {
      if (dirty) {
        draftControl.current = document.activeElement;
        setDiscard(true);
      } else close();
    }
  };
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) tryClose();
        }}
      >
        <DialogContent
          onCloseAutoFocus={restoreFocus}
          className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl lg:w-[75vw] lg:max-w-[75vw]"
          onInteractOutside={(event) => {
            if (saving || dirty) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{definition.title}</DialogTitle>
            <DialogDescription>
              {entity === "deadline"
                ? ["task", "reminder"].includes(values.kind)
                  ? "Tasks have no payment amount and do not change your balances."
                  : "Plan the bill now, then record its payment when it is due."
                : entity === "person"
                  ? "Save this person once, then select them for giving or loans."
                  : entity === "schedule" && record?.coverage
                    ? "Premium bills appear on your deadlines. Paying one records an expense linked to this coverage."
                  : "Manual tracking in Philippine pesos. Your records stay in Django."}
            </DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="space-y-4">
            {entity === "deadline" && !record?.id && ["bill", "subscription", "payment"].includes(values.kind) && (
              <div className="space-y-2 border-b pb-4">
                <p className="text-sm font-medium">
                  Start with a recurring bill
                </p>
                <SelectableField
                  id="utility-preset"
                  label="Recurring bill preset"
                  options={utilityPresets}
                  value={utility}
                  onChange={chooseUtility}
                  disabled={saving}
                />
              </div>
            )}
            {errors.common && (
              <p
                role="alert"
                className="rounded-md bg-red-50 p-3 text-sm text-red-900"
              >
                {errors.common}
              </p>
            )}
            <div
              className={
                entity === "account"
                  ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,350px)]"
                  : ""
              }
            >
              {entity === "account" && (
                <div className="xl:order-2">
                  <p className="mb-3 text-sm font-semibold text-[var(--pd-ink)]">
                    Card preview
                  </p>
                  <AccountCardFace account={values} />
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    For account numbers, only the last four digits are saved.
                    Expiry is optional; no full card number or security code is
                    needed.
                  </p>
                </div>
              )}
              <div
                className={
                  "grid gap-4 sm:grid-cols-2 " +
                  (entity === "account" ? "xl:order-1" : "")
                }
              >
                {entity === "person" ? (
                  <PersonFields values={values} onChange={change} errors={errors} disabled={saving} />
                ) : fields.map((f) => {
                  const id = "finance-" + f.name;
                  const selectedAccount = accountSources.has(f.source) ? accountState(f) : null;
                  let options = f.options || sources[f.source] || [];
                  if (f.cashOnly && f.source === "accounts")
                    options = sources.cashAccounts;
                  if (entity === "movement" && f.name === "destination")
                    options =
                      values.kind === "credit_card_payment"
                        ? sources.cards
                        : sources.cashAccounts;
                  return (
                    <div
                      key={f.name}
                      className={
                        ["textarea", "select", "institution"].includes(f.type) ||
                        f.name === "existing"
                          ? "sm:col-span-2"
                          : ""
                      }
                    >
                      <Label htmlFor={id} className="mb-2 block">
                        {f.label}
                        {f.required && " *"}
                      </Label>
                      {f.type === "select" ? (
                        <>
                          <SelectableField
                            id={id}
                            label={f.label}
                            required={f.required}
                            options={
                              f.nullable
                                ? [{ value: "", label: "None" }, ...options]
                                : options
                            }
                            value={values[f.name]}
                            onChange={(v) => change(f.name, v)}
                            disabled={saving || f.disabled}
                            invalid={!!errors[f.name]}
                            describedBy={[errors[f.name] && id + "-error", selectedAccount?.previewVisible && id + "-preview"].filter(Boolean).join(" ") || undefined}
                            forceTiles={accountSources.has(f.source)}
                          />
                          {selectedAccount?.direction && (
                            <AccountBalancePreview
                              id={id + "-preview"}
                              account={selectedAccount.selected}
                              amount={amountValue}
                              direction={selectedAccount.direction}
                              existingAmount={selectedAccount.existingAmount}
                            />
                          )}
                        </>
                      ) : f.type === "institution" ? (
                        <div className="space-y-3">
                          <SelectableField
                            id={id}
                            label={f.label}
                            options={institutions.filter(
                              (p) =>
                                p.value === "__other" ||
                                (values.kind === "ewallet"
                                  ? ["GCash", "Maya"].includes(p.value)
                                  : !["GCash", "Maya"].includes(p.value)),
                            )}
                            value={institutionChoice}
                            onChange={(v) => {
                              setInstitutionChoice(v);
                              change("institution", v === "__other" ? "" : v);
                            }}
                            disabled={saving}
                          />
                          {institutionChoice === "__other" && (
                            <div>
                              <Label htmlFor="custom-institution">
                                Institution name
                              </Label>
                              <Input
                                id="custom-institution"
                                value={values.institution || ""}
                                onChange={(e) =>
                                  change("institution", e.target.value)
                                }
                                maxLength={100}
                                disabled={saving}
                                placeholder="Enter your bank or wallet"
                              />
                            </div>
                          )}
                        </div>
                      ) : f.type === "textarea" ? (
                        <Textarea
                          id={id}
                          value={values[f.name]}
                          onChange={(e) => change(f.name, e.target.value)}
                          maxLength={4000}
                          disabled={saving}
                          className="resize-none"
                          aria-invalid={!!errors[f.name]}
                          aria-describedby={
                            errors[f.name] ? id + "-error" : undefined
                          }
                        />
                      ) : (
                        <Input
                          id={id}
                          type={f.type}
                          value={values[f.name]}
                          onChange={(e) => change(f.name, e.target.value)}
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          inputMode={f.inputMode}
                          placeholder={f.placeholder}
                          pattern={f.pattern}
                          maxLength={
                            f.maxLength || (f.name === "reason" ? 240 : 160)
                          }
                          disabled={saving || f.disabled}
                          aria-invalid={!!errors[f.name]}
                          aria-describedby={
                            [
                              f.hint && id + "-hint",
                              errors[f.name] && id + "-error",
                            ]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                        />
                      )}
                      {f.hint && (
                        <p
                          id={id + "-hint"}
                          className="mt-1 text-xs leading-5 text-slate-600"
                        >
                          {f.hint}
                        </p>
                      )}
                      {f.name === "contact" && ["giving", "loan", "expense"].includes(entity) && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCreatingPerson((value) => !value);
                              if (!creatingPerson) requestAnimationFrame(() => document.getElementById("new-contact-name")?.focus());
                            }}
                            disabled={saving || personSaving}
                            aria-expanded={creatingPerson}
                            aria-controls="inline-person-fields"
                          >
                            <UserRoundPlus aria-hidden="true" />
                            {creatingPerson ? "Close person form" : "Add person"}
                          </Button>
                          {creatingPerson && (
                            <div
                              id="inline-person-fields"
                              className="mt-3 border border-[var(--pd-border)] bg-[var(--pd-soft)] p-4"
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                                  event.preventDefault();
                                  savePerson();
                                }
                              }}
                            >
                              <p className="mb-3 text-sm font-semibold">New person</p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <PersonFields
                                  prefix="new-contact"
                                  values={personDraft}
                                  onChange={(name, value) => {
                                    setPersonDraft((current) => ({ ...current, [name]: value }));
                                    setPersonErrors((current) => ({ ...current, [name]: "", common: "" }));
                                  }}
                                  errors={personErrors}
                                  disabled={personSaving}
                                />
                              </div>
                              {personErrors.common && <p role="alert" className="mt-3 text-sm text-red-800">{personErrors.common}</p>}
                              <div className="mt-4 flex justify-end">
                                <Button type="button" size="sm" onClick={savePerson} disabled={personSaving} aria-busy={personSaving}>
                                  <Save aria-hidden="true" />
                                  {personSaving ? "Saving person…" : "Save person"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {errors[f.name] && (
                        <p
                          id={id + "-error"}
                          role="alert"
                          className="mt-1 text-sm text-red-800"
                        >
                          {errors[f.name]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {entity === "income" &&
              values.repeat !== "never" &&
              values.repeat && (
                <p className="text-sm text-slate-600">
                  Recurring income is generated as expected. Mark it received
                  after the money arrives.
                </p>
              )}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={tryClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || insufficientAccount}
                aria-busy={saving}
                className="min-w-28"
              >
                <Save aria-hidden="true" />
                {saving ? "Saving…" : entity === "person" ? "Save person" : "Save record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent
          className="personal-dashboard"
          onCloseAutoFocus={(event) => {
            if (draftControl.current?.isConnected) {
              event.preventDefault();
              draftControl.current.focus();
            } else restoreFocus(event);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              These edits have not been saved. Your existing records will stay
              unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={close}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
