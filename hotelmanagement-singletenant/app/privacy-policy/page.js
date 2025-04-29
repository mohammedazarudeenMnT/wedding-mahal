import { notFound } from "next/navigation";
import PolicyLayout from "../../Components/PolicyLayout.jsx";
import { getPolicyData } from "../../lib/policyData";

export default async function PrivacyPolicyPage() {
  const policyData = await getPolicyData();

  if (!policyData) {
    notFound();
  }

  return (
    <PolicyLayout title="Privacy Policy" logoPath={policyData.hotelLogo}>
      <div
        dangerouslySetInnerHTML={{
          __html: policyData.policy.privacyPolicy || "",
        }}
      />
    </PolicyLayout>
  );
}
