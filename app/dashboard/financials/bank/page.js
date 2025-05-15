"use client";

import BankPage from "@/Components/Bank/BankPage";
import BankEntryPage from "@/Components/Bank/BankEntryPage";
import { useSearchParams } from "next/navigation";

export default function Bank() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return <div>{tab === "entry" ? <BankEntryPage /> : <BankPage />}</div>;
}
