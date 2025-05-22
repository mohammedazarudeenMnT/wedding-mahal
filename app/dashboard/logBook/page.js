'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import LogBook from "../../../Components/logBook/logBook";
import { usePagePermission } from "../../../hooks/usePagePermission";

const LogBookPage = () => {
  const hasPermission = usePagePermission("Calendar", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Log Book"} />
      </div>
      <LogBook />
    </div>
  );
};

export default LogBookPage;