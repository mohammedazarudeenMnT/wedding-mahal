'use client'

import React from "react";
// import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import CalendarView from "../../../Components/calendarView/calendarView";
// import { usePagePermission } from "../../../hooks/usePagePermission";

const CalendarViewPage = () => {
 /*  const hasPermission = usePagePermission("Calendar", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }
 */
  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Calendar View"} />
      </div>
      <CalendarView />
    </div>
  );
};

export default CalendarViewPage;