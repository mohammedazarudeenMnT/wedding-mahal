"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function About() {
  return (
    <motion.section
      id="about"
      className="py-12 sm:py-16 md:py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=2070"
              alt="Luxury Hotel Room"
              className="shadow-lg"
              width={1000}
              height={667}
            />
            <div className="absolute bottom-4 left-4 bg-white p-4">
              <div className="uppercase text-sm mb-1">AWARD WINNING</div>
              <div className="uppercase text-sm">HOTEL</div>
            </div>
          </div>
          <div>
            <h2 className="text-sm text-hotel-primary mb-2">LUXURY HOTEL AND RESORT</h2>
            <h3 className="text-3xl font-serif mb-6">LUXURY BEST HOTEL IN CITY MADURAI, TAMILNADU</h3>
            <p className="text-gray-600 mb-6">
              Experience unparalleled luxury at our award-winning hotel. Nestled in the heart of California, 
              we offer a perfect blend of sophistication, comfort, and world-class service.
            </p>
            <p className="text-gray-600 mb-8">
              Our commitment to excellence has made us the preferred choice for discerning travelers 
              seeking an exceptional hospitality experience.
            </p>
            <div className="text-gray-600">
              <p className="mb-2">3/508, Bharathi St, Muneeswarar Nagar, Iyer Bungalow,</p>
              <p>Madurai, Tamil Nadu 625014</p>
            </div>
            <Link href="/about">
              <button className="mt-8 bg-hotel-primary text-white px-8 py-3 hover:bg-hotel-primary transition">
                ABOUT MORE
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
