"use client";
import { Construction, School, Bed } from "lucide-react";
import { motion } from "framer-motion";

const AirConditioner = Construction;
const Pool = School;

const facilities = [
  {
    icon: <AirConditioner className="w-12 h-12" />,
    title: "Air Conditioner",
    description:
      "A wonderful serenity has taken possession royela design soul like these sweet mornings of spring royela dolor consectetur tempor incididunt resort sweet",
  },
  {
    icon: <Pool className="w-12 h-12" />,
    title: "Swimming Pool",
    description:
      "A wonderful serenity has taken possession royela design soul like these sweet mornings of spring royela dolor consectetur tempor incididunt resort sweet",
  },
  {
    icon: <Bed className="w-12 h-12" />,
    title: "Comfortable rooms",
    description:
      "A wonderful serenity has taken possession royela design soul like these sweet mornings of spring royela dolor consectetur tempor incididunt resort sweet",
  },
];

export default function HotelFacilities() {
  return (
    <>
      {/* Hotel Facilities Section */}
      <motion.section
        id="facilities"
        className="py-12 sm:py-16 md:py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif mb-6">
              Hotel Facilities For Every Need
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A wonderful serenity has taken possession of my entire soul, like
              these sweet mornings of spring which I enjoy with my whole heart.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {facilities.map((facility, index) => (
              <div key={index} className="text-center p-8">
                <div className="text-hotel-primary mb-6 flex justify-center">
                  {facility.icon}
                </div>
                <h3 className="text-2xl font-serif mb-4">{facility.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
}
