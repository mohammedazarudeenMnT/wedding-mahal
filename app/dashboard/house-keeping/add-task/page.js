'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader";
import AddOrEditTask from "../../../../Components/houseKeeping/AddOrEditTask";
import { usePagePermission } from "../../../../hooks/usePagePermission";

const Page = () => {
  const hasPermission = usePagePermission("House-keeping", "add");
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
        <DashboardHeader headerName={"Add House Keeping Task"} />
      </div>
      <div className="p-6">
        <AddOrEditTask mode="add" />
      </div>
    </div>
  );
};

export default Page;
