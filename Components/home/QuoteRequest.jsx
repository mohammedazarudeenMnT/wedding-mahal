"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function QuoteRequest() {
  const [quoteFormData, setQuoteFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isQuoteSubmitting, setIsQuoteSubmitting] = useState(false);
  const [quoteSubmitMessage, setQuoteSubmitMessage] = useState("");

  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setQuoteFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setIsQuoteSubmitting(true);
    setQuoteSubmitMessage("");

    try {
      const response = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quoteFormData.name,
          email: quoteFormData.email,
          mobileno: quoteFormData.phone,
          notes: quoteFormData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setQuoteSubmitMessage("Thank you for your message. We will contact you soon!");
      setQuoteFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setQuoteSubmitMessage(
        error.message || "There was an error sending your message. Please try again."
      );
    } finally {
      setIsQuoteSubmitting(false);
    }
  };

  return (
    <>
      {/* Quote Request Section */}
      <motion.section
        className="p-12 sm:py-16 md:py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto  bg-white shadow-2xl  ">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="relative h-[300px] md:h-auto">
              <Image
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070"
                alt="Luxury Room"
                className=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="p-5">
              <p className="text-hotel-primary uppercase tracking-wider mb-4">
                MAKE AN APPOINTMENT
              </p>
              <h2 className="text-4xl font-serif mb-8">Request A Free Quote</h2>
              {quoteSubmitMessage && (
                <div
                  className={`p-4 mb-6 ${
                    quoteSubmitMessage.includes("error")
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {quoteSubmitMessage}
                </div>
              )}
              <form className="space-y-6" onSubmit={handleQuoteSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="name"
                    value={quoteFormData.name}
                    onChange={handleQuoteChange}
                    placeholder="Your Name"
                    className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={quoteFormData.email}
                    onChange={handleQuoteChange}
                    placeholder="Email Address"
                    className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                    required
                  />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={quoteFormData.phone}
                  onChange={handleQuoteChange}
                  placeholder="Phone"
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                />
                <textarea
                  name="message"
                  value={quoteFormData.message}
                  onChange={handleQuoteChange}
                  placeholder="Type Your Message"
                  rows={4}
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                ></textarea>
                <button
                  type="submit"
                  disabled={isQuoteSubmitting}
                  className="bg-hotel-primary text-white px-8 py-4 hover:bg-hotel-primary transition uppercase tracking-wider disabled:opacity-70"
                >
                  {isQuoteSubmitting ? "Submitting..." : "Submit Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
