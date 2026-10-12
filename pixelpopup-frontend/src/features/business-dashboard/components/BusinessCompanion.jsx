import { useLocation } from "react-router-dom";
import StationaryCatMascot from "../../../ui/mascot/StationaryCatMascot";
import { dashboardSmokeyMessages, smokeyAcknowledgement } from "../../../ui/mascot/dashboardSmokeyMessages";

export default function BusinessCompanion({ notification, pendingCount, dismiss }) {
  const { pathname } = useLocation();
  const section = pathname.includes("/applications/ai") ? "applications/ai" : pathname.split("/")[2] || "";
  const response = notification ? { ...notification, message: `${smokeyAcknowledgement(notification)}\n\n${notification.message}` } : null;
  return <StationaryCatMascot notification={response} pendingCount={pendingCount} dismiss={dismiss} messages={dashboardSmokeyMessages("business", section)}/>;
}
