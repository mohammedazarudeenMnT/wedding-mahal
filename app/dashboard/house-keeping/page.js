'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader"
import HouseKeeping from "../../../Components/houseKeeping/HouseKeeping"
import { usePagePermission } from "../../../hooks/usePagePermission"

const HousekeepingPage = () => {
  const hasPermission = usePagePermission("House-keeping", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <div>Loading...</div>;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="House Keeping" />
      </div>
      <HouseKeeping />
    </div>
  );
};

export default HousekeepingPage;
