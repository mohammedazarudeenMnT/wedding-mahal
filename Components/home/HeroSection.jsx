"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";

export default function HeroSection() {
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await axios.get("/api/web-settings");
        if (response.data && response.data.heroSections && response.data.heroSections[0]) {
          setHeroData(response.data.heroSections[0]);
        }
      } catch (error) {
        console.error("Error fetching hero section data:", error);
      }
    };

    fetchHeroData();
  }, []);

  if (!heroData) return null;

  return (
    <div className="relative max-sm:h-[60vh] sm:h-[60vh] md:h-[90vh] lg:h-[90vh]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroData.image})`,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <motion.div
          className="max-w-2xl w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.p
            className="text-sm sm:text-base md:text-lg text-white mb-4 tracking-wider"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {heroData.quote}
          </motion.p>
          <motion.h1
            className="text-3xl sm:text-5xl md:text-6xl font-serif mb-8 text-white leading-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {heroData.title}
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link
              href="/rooms"
              className="inline-block bg-hotel-primary px-6 md:px-8 py-3 hover:bg-hotel-primary/90 transform hover:scale-105 transition-all duration-300 text-white text-sm sm:text-base shadow-lg hover:shadow-xl"
            >
              DISCOVER MORE
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
