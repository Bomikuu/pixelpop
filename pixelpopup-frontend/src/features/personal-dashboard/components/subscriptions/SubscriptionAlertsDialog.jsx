import { Link } from "react-router-dom";
import { Bell, ArrowRight } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";

export default function SubscriptionAlertsDialog({ alert, close }) {
  if (!alert) return null;
  const destination = /^\/dashboard\/bills\/subscriptions\/\d+(?:\?cycle=\d+)?$/.test(alert.destination || "") ? alert.destination : "/dashboard/bills?section=subscriptions";
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="personal-dashboard bg-white sm:max-w-lg"><DialogHeader><DialogTitle className="flex gap-2"><Bell className="size-5" />{alert.title || "Service reminder"}</DialogTitle><DialogDescription>{alert.message}</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={close}>Dismiss</Button><Button asChild><Link to={destination} onClick={close}>Review service<ArrowRight size={15} /></Link></Button></div></DialogContent></Dialog>;
}
