import { notFound } from "next/navigation";
import PolicyLayout from "../../Components/PolicyLayout.jsx";
import { getPolicyData } from "../../lib/policyData";

export default async function PaymentPolicyPage() {
  const policyData = await getPolicyData();

  if (!policyData) {
    notFound();
  }

  return (
    <PolicyLayout title="Payment Policy" logoPath={policyData.hotelLogo}>
      <div
        dangerouslySetInnerHTML={{
          __html: policyData.policy.paymentPolicy || "",
        }}
      />
    </PolicyLayout>
  );
}
