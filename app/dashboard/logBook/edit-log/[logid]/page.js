// "use client"

// import React from 'react'
// import AddLogForm from '../../../../../Components/logBook/AddLogForm'
// import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader"

// const EditLogPage = ({ params }) => {
//   const { logId } = params;

//   return (
//     <section>
//       <div className="bgclrrr pt-3">
//         <DashboardHeader headerName="Edit Log Entry" />
//       </div>
//       <AddLogForm logId={logId} />
//     </section>
//   )
// }

// export default EditLogPage

"use client"

import React from 'react'
import { useRouter } from "next/navigation"
import { usePagePermission } from "../../../../../hooks/usePagePermission"
import AddLogForm from '../../../../../Components/logBook/AddLogForm'
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader"

const EditLogPage = ({ params }) => {
  const hasPermission = usePagePermission("LogBook", "edit")
  const router = useRouter()

  if (hasPermission === null) {
    return null
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized")
    return null
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Edit Log Entry" />
      </div>
      <AddLogForm logId={params.logid} />
    </section>
  )
}

export default EditLogPage