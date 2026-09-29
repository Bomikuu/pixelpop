import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HeartHandshake,
  Users,
  LayoutDashboard,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import PeopleSummary from "../components/PeopleSummary";
import MoneyFlowAmount from "../components/MoneyFlowAmount";
import { ComparisonChart } from "../components/Charts";
import RecordList from "../components/RecordList";
import RecordIdentity from "../components/RecordIdentity";
import { EmptyState, ErrorState, Panel } from "../components/Panel";
import { money, monthLabel } from "../lib/format";
import SharedBillsView from "./SharedBillsView";
import PeopleActions from "../components/PeopleActions";

export default function PeopleView(props) {
  const { dashboard, month, openForm } = props;
  const [params, setParams] = useSearchParams();
  const view = ["overview", "giving", "loans", "shared"].includes(
    params.get("view"),
  )
    ? params.get("view")
    : "overview";
  const [page, setPage] = useState(1);
  const state = useRecords(
    "people/?month=" + month + "&page=" + page,
    dashboard.request,
    dashboard.version,
  );
  useEffect(() => {
    if (state.data)
      setPage((current) =>
        Math.min(current, Math.max(1, Math.ceil(state.data.count / 20))),
      );
  }, [state.data]);
  return (
    <div className="space-y-5">
      {view !== "shared" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            One place for the people you support and lend to. Gifts are
            spending; loans remain repayable until collected.
          </p>
          <PeopleActions openForm={openForm} />
        </div>
      )}
      <Tabs
        value={view}
        onValueChange={(next) =>
          setParams((previous) => {
            const updated = new URLSearchParams(previous);
            updated.set("view", next);
            return updated;
          })
        }
        className="gap-5"
      >
        <TabsList
          aria-label="People and money views"
          className="w-full flex-wrap justify-start gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:w-fit"
        >
          <TabsTrigger value="overview" className="px-3 py-2">
            <LayoutDashboard />
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
          <TabsTrigger value="shared" className="px-3 py-2">
            <Receipt aria-hidden="true" />
            Shared bills
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-5">
          {state.data?.summary && (
            <PeopleSummary summary={state.data.summary} month={month} />
          )}
          {state.data?.charts && (
            <ComparisonChart
              title="Monthly giving & lending"
              description="Support, principal lent, and repayments stay separate. Existing loans use their recorded lending date—not a new cash deduction."
              rows={state.data.charts.monthly}
              fields={state.data.charts.fields}
              comparisonMonth={month}
            />
          )}
          <Panel
            title="People"
            description={
              "Giving follows " +
              monthLabel(month) +
              "; loan columns show lifetime principal. Open a person's page for their full history."
            }
          >
            {state.loading ? (
              <p role="status" className="py-8 text-sm text-slate-600">
                Loading people…
              </p>
            ) : state.error ? (
              <ErrorState message={state.error} retry={dashboard.refresh} />
            ) : !state.data?.results.length ? (
              <EmptyState
                icon={HeartHandshake}
                title="No people yet"
                message="Add a person first, then record giving or money lent whenever you need to."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Given · {monthLabel(month)}</TableHead>
                        <TableHead>Lent · lifetime</TableHead>
                        <TableHead>Repaid · lifetime</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>History</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.data.results.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell>
                            <RecordIdentity
                              resource="people"
                              row={row}
                              label={row.person}
                            />
                            <p className="ml-12 text-xs text-slate-600">
                              {row.custom_relationship || row.relationship}
                            </p>
                          </TableCell>
                          {["given", "lent", "repaid", "outstanding"].map(
                            (key) => (
                              <TableCell key={key} className="tabular-nums">
                                {key === "outstanding" ? money(row[key]) : (
                                  <MoneyFlowAmount amount={row[key]} direction={key === "repaid" ? "in" : "out"} />
                                )}
                              </TableCell>
                            ),
                          )}
                          <TableCell>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                to={
                                  "/dashboard/people/" +
                                  row.key +
                                  "?month=" +
                                  month
                                }
                                aria-label={"View history for " + row.person}
                              >
                                View history
                                <ChevronRight />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
                  <span>
                    {state.data.count} people · Page {page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={!state.data.previous}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!state.data.next}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Panel>
        </TabsContent>
        <TabsContent value="giving">
          <RecordList
            {...props}
            hideAdd
            resource="transactions"
            kind="expense"
            title="Giving records"
            fixedParams={{ giving: "1" }}
          />
        </TabsContent>
        <TabsContent value="loans">
          <RecordList
            {...props}
            hideAdd
            resource="loans"
            title="Money lent · lifetime"
          />
        </TabsContent>
        <TabsContent value="shared">
          <SharedBillsView {...props} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
