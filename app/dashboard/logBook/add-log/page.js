'use client'

import React from "react"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import AddLogForm from "../../../../Components/logBook/AddLogForm"
import { useRouter } from "next/navigation"
import { usePagePermission } from "@/hooks/usePagePermission"

export default function AddLogPage() {
  const hasPermission = usePagePermission("LogBook", "add")
  const router = useRouter()

  if (hasPermission === null) {
    return null
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized")
    return null
  }

  return (
    <>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Log Book"} />
      </div>
      <AddLogForm />
    </>
  )
}