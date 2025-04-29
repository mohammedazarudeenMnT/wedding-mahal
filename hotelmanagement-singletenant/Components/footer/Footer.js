"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export default function Footer({ logoUrl }) {
  const pathname = usePathname();

  const renderLogo = () => {
    if (!logoUrl) return null;

    return (
      <Image
        src={logoUrl}
        alt="Hotel Logo"
        width={200}
        height={200}
        className="w-auto h-full max-w-full object-contain brightness-0 invert opacity-90"
        priority={false}
      />
    );
  };

  const links = [
    { name: "About Hotel", href: "/about" },
    { name: "Rooms & Suites", href: "/rooms" },
    { name: "Contact", href: "/contact" },
    { name: "Payment Policy", href: "/payment-policy" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-and-conditions" },
  ];

  return (
    <footer className="bg-[#1C1C1C] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <Link
            href={`/dashboard`}
            className="logo-container h-16 flex items-center px-4 transition-all duration-300"
          >
            <div className="logo-wrapper relative w-[130px] h-16">
              {/* Fixed height container with flexible width */}
              <div className="absolute inset-0 flex items-center justify-start">
                {renderLogo()}
              </div>
            </div>
          </Link>
          <p className="text-gray-400 mb-6 mt-5">
            Luxury and comfort redefined in the heart of the city.
          </p>
          <div className="flex space-x-4 pt-4">
            <a href="#" className="hover:text-hotel-primary">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Youtube size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-serif mb-4">USEFUL LINKS</h4>
          <ul className="space-y-2 text-gray-400">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${
                    pathname === link.href
                      ? "text-hotel-primary"
                      : "hover:text-hotel-primary"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-serif mb-4">GALLERY</h4>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square">
                <img
                  src={`https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&q=80&w=2070`}
                  alt={`Gallery ${i}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-serif mb-4">NEWSLETTER</h4>
          <p className="text-gray-400 mb-4">Subscribe to our newsletter</p>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter E-Mail"
              className="w-full bg-transparent border border-gray-700  p-3 text-white focus:outline-none focus:border-hotel-primary"
            />
            <button className="w-full bg-hotel-primary text-white py-3  hover:bg-hotel-primary transition">
              SUBSCRIBE NOW
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-800">
        <p className="text-center text-gray-400">
          © {new Date().getFullYear()} Royella. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
