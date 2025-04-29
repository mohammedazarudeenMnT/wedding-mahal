"use client";

import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobileno: formData.phone,  // map phone to mobileno
          notes: formData.message    // map message to notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setSubmitMessage("Thank you for your message. We will contact you soon!");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setSubmitMessage(
        error.message || "There was an error sending your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 ">
        <div className="max-w-7xl mx-auto  bg-white shadow-2xl p-6 ">
          <h2 className="text-sm text-hotel-primary mb-2">CONTACT US</h2>
          <h3 className="text-3xl font-serif mb-6">CONTACT WITH US</h3>
          <p className="text-gray-600 mb-12">
            Experience luxury redefined at our prestigious hotel. Reach out to
            us for any inquiries or special requests.
          </p>

          <div className="space-y-8 mt-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-hotel-primary flex items-center justify-center">
                <Phone className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Call Us Now</p>
                <p className="text-lg">+91 8925845077</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-hotel-primary flex items-center justify-center">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Send Email</p>
                <p className="text-lg">sales@mntfuture.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-hotel-primary flex items-center justify-center">
                <MapPin className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Our Location</p>
                <p className="text-lg">3/501, Subash Street, Muneeswaran Nagar,
                </p>
                <p className="text-lg">lyer Bungalow, Madurai - 625014

</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1C1C] p-8 ">
          <h3 className="text-2xl text-white font-serif mb-6">GET IN TOUCH</h3>

          {submitMessage && (
            <div
              className={`p-4 mb-6   ${
                submitMessage.includes("error")
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {submitMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full bg-transparent border border-gray-700  p-3 text-white focus:outline-none focus:border-hotel-primary"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Your Email"
              className="w-full bg-transparent border border-gray-700  p-3 text-white focus:outline-none focus:border-hotel-primary"
              required
            />

            <input
              type="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter Your Phone"
              className="w-full bg-transparent border border-gray-700  p-3 text-white focus:outline-none focus:border-hotel-primary"
              required
            />
          
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write Message"
              rows={4}
              className="w-full bg-transparent border border-gray-700  p-3 text-white focus:outline-none focus:border-hotel-primary"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-hotel-primary text-white py-3  hover:bg-hotel-primary transition disabled:opacity-70"
            >
              {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div className="w-full h-[400px] relative">
        <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3929.548164981921!2d78.134679!3d9.971499!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00c7cc2ecaecf3%3A0x5610bd9fc2fe6ea5!2sMagizh%20NexGen%20Technologies!5e0!3m2!1sen!2sin!4v1741668711520!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
