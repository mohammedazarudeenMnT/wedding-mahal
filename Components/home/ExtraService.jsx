"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const extraServiceImages = [
  {
    src: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=2071",
    alt: "Hotel Reception",
    span: "md:col-span-4",
  },
  {
    src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070",
    alt: "Luxury Room",
    span: "md:col-span-4",
  },
  {
    src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070",
    alt: "Luxury Room",
    span: "md:col-span-4",
  },
  {
    src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=2070",
    alt: "Suite Room",
    span: "md:col-span-6",
  },
  {
    src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=2070",
    alt: "Room Service",
    span: "md:col-span-6",
  },
];

export default function ExtraService() {
  return (
    <>
      {/* Extra Services Section */}
      <motion.section
        className="py-12 sm:py-16 md:py-20 bg-white"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-hotel-primary mb-1">Best Prices</p>
              <h2 className="text-3xl md:text-4xl font-serif">
                Extra Services
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-lg mb-4 md:mb-0 md:text-right">
              Aliquip veniam delectus, Marfa eiusmod Pinterest in do umami
              readymade swag. Selfies iPhone Kickstarter, drinking vinegar
            </p>
            <Link href="/rooms">
              {" "}
              <button
                className="inline-block bg-hotel-primary text-white px-6 py-2  hover:bg-hotel-primary transition-colors"
                onClick={() => (window.location.href = "/rooms")}
              >
                VIEW ALL ROOMS
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {extraServiceImages.map((image, index) => (
              <motion.div
                key={index}
                className={`col-span-12 ${image.span} aspect-[4/3] relative overflow-hidden group`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
}
