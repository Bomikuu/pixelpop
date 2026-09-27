import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  HeartHandshake,
  Users,
  ArrowDownLeft,
  ChartNoAxesCombined,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import PeopleSummary from "../components/PeopleSummary";
import RecordIdentity from "../components/RecordIdentity";
import RecordList from "../components/RecordList";
import { ComparisonChart } from "../components/Charts";
import { EmptyState, ErrorState } from "../components/Panel";

export default function PersonHistoryView({ personKey, ...props }) {
  const { dashboard, month, openForm } = props;
  const heading = useRef(null);
  const state = useRecords(
    "people/?month=" + month + "&person_key=" + encodeURIComponent(personKey),
    dashboard.request,
    dashboard.version,
  );
  const person = state.data?.results[0];
  const personName = person?.person;
  useEffect(() => {
    heading.current?.focus();
  }, [personKey, person?.key]);
  useEffect(() => {
    if (!personName) return;
    const previous = document.title;
    document.title = personName + " history | Personal workspace";
    return () => {
      document.title = previous;
    };
  }, [personName]);
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost">
        <Link to={"/dashboard/people?month=" + month}>
          <ArrowLeft />
          Back to People & money
        </Link>
      </Button>
      {state.loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">
          Loading person history…
        </p>
      ) : state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : !person ? (
        <EmptyState
          icon={Users}
          title="Person not found"
          message="Return to People & money to select an existing person."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
            <div>
              <h2
                ref={heading}
                tabIndex={-1}
                className="rounded-sm text-xl font-semibold outline-none focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)]"
              >
                <RecordIdentity
                  resource="people"
                  row={person}
                  label={person.person + "'s history"}
                />
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Giving, loans, and repayments for this person only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openForm("loan", { person: person.person })}
              >
                <Plus />
                Add loan
              </Button>
              <Button
                onClick={() => openForm("giving", { recipient: person.person })}
              >
                <Plus />
                Add giving
              </Button>
            </div>
          </div>
          <PeopleSummary summary={state.data.summary} month={month} />
          <Tabs defaultValue="overview" className="gap-5">
            <TabsList
              aria-label="Person history sections"
              className="w-full flex-wrap justify-start gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:w-fit"
            >
              <TabsTrigger value="overview" className="px-3 py-2">
                <ChartNoAxesCombined />
                Overview
              </TabsTrigger>
              <TabsTrigger value="giving" className="px-3 py-2">
                <HeartHandshake />
                Giving
              </TabsTrigger>
              <TabsTrigger value="loans" className="px-3 py-2">
                <Users />
                Loans
              </TabsTrigger>
              <TabsTrigger value="repayments" className="px-3 py-2">
                <ArrowDownLeft />
                Repayments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <ComparisonChart
                title="Monthly giving, lending & repayments"
                description="Gifts are expenses. Lent principal and repayments are separate, with no duplicate spending."
                rows={state.data.charts.monthly}
                fields={state.data.charts.fields}
                comparisonMonth={month}
              />
            </TabsContent>
            <TabsContent value="giving">
              <RecordList
                {...props}
                hideAdd
                resource="transactions"
                kind="expense"
                title="Giving records"
                fixedParams={{ giving: "1", recipient: person.person }}
              />
            </TabsContent>
            <TabsContent value="loans">
              <RecordList
                {...props}
                hideAdd
                resource="loans"
                title="Loans · lifetime"
                fixedParams={{ person: person.person }}
              />
            </TabsContent>
            <TabsContent value="repayments">
              <RecordList
                {...props}
                hideAdd
                resource="movements"
                title="Repayment records"
                fixedParams={{ kind: "loan_repayment", person: person.person }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
