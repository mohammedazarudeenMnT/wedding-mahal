import { notFound } from "next/navigation";
import PolicyLayout from '../../Components/PolicyLayout.jsx';
import { getPolicyData } from '../../lib/policyData';

export default async function TermsPage() {
  const data = await getPolicyData();

  if (!data) {
    notFound();
  }

  return (
    <PolicyLayout title="Terms and Conditions" logoPath={data.hotelLogo}>
      <div
        dangerouslySetInnerHTML={{
          __html: data.policy.termsAndConditions || "",
        }}
      />
    </PolicyLayout>
  );
}
