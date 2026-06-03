import React from "react";
import { DatePlanner, datePlannerConfig } from "../features/date-planner";

/**
 * DatePlannerPage — Demo page that renders the Date Planner with sample config.
 */
export default function DatePlannerPage() {
  return <DatePlanner config={datePlannerConfig} />;
}
