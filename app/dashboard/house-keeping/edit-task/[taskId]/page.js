'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader";
import AddOrEditTask from "../../../../../Components/houseKeeping/AddOrEditTask";
import { usePagePermission } from "../../../../../hooks/usePagePermission";

const Page = ({ params }) => {
  const hasPermission = usePagePermission("House-keeping", "edit");
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
        <DashboardHeader headerName={"Edit House Keeping Task"} />
      </div>
      <div className="p-6">
        <AddOrEditTask mode="edit" taskId={params.taskId} />
      </div>
    </div>
  );
};

export default Page;
