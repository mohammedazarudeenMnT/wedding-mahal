import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";
import Map from "./Map";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="h-[300px] relative flex items-center justify-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl font-serif mb-4">CONTACT</h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>HOME</span>
            <span>/</span>
            <span>CONTACT</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
      <Map />
    </div>
  );
}
