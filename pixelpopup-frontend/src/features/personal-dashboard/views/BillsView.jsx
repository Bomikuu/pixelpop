import { useSearchParams } from "react-router-dom";
import { CalendarClock, ChartNoAxesCombined, Repeat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import RecordList from "../components/RecordList";
import SubscriptionList from "../components/subscriptions/SubscriptionList";
import ForecastView from "../components/subscriptions/ForecastView";
import { sectionValue } from "../subscriptions/model";

export default function BillsView(props) {
  const [params, setParams] = useSearchParams();
  const section = sectionValue(params.get("section"));
  return <Tabs value={section} onValueChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set("section", value); next.delete("page"); return next; })} className="gap-5">
    <TabsList aria-label="Bills workspaces" className="h-auto w-full flex-wrap justify-start sm:w-fit"><TabsTrigger value="due" className="px-3 py-2"><CalendarClock size={16} />Bills due</TabsTrigger><TabsTrigger value="subscriptions" className="px-3 py-2"><Repeat size={16} />Subscriptions & utilities</TabsTrigger><TabsTrigger value="forecasts" className="px-3 py-2"><ChartNoAxesCombined size={16} />Forecasts</TabsTrigger></TabsList>
    <TabsContent value="due"><RecordList {...props} resource="deadlines" bills title="Bills due" /></TabsContent>
    <TabsContent value="subscriptions"><SubscriptionList {...props} /></TabsContent>
    <TabsContent value="forecasts"><ForecastView {...props} /></TabsContent>
  </Tabs>;
}
