"use client";
import { Crown, BedDouble } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const rooms = [
  {
    id: 1,
    title: "Delux Family Rooms",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
  {
    id: 2,
    title: "Doubble Suite Rooms",
    image: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
  {
    id: 3,
    title: "Suprior Bed Rooms",
    image: "https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
];

export default function Facilities() {
  return (
<motion.section
        id="facilities"
        className="py-12 sm:py-16 md:py-20 bg-[#F8F6F3]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-hotel-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif mb-6">
              ROYELLA&apos;S ROOMS & SUITES
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Proactively morph optimal infomediaries rather than accurate
              expertise. Intrinsicly progressive resources rather than
              resource-leveling
            </p>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white overflow-hidden shadow-lg">
                {/* Room Image */}
                <div className="relative">
                  <Image
                    src={room.image}
                    alt={room.title}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-hotel-primary text-white px-4 py-1 ">
                    {room.price} | NIGHT
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-6">
                  <div className="text-hotel-primary text-sm mb-2">
                    {room.type}
                  </div>
                  <h3 className="text-2xl font-serif mb-4">{room.title}</h3>
                  <p className="text-gray-600 mb-4">{room.size}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BedDouble className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-600">{room.beds}</span>
                    </div>
                    <Link href="/rooms">
                      {" "}
                      <button className="bg-hotel-primary text-white px-6 py-2  hover:bg-hotel-primary transition-colors">
                        Book Now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
  );
}
