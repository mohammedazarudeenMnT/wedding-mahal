"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";

export default function Navbar({ logoUrl }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if the current path matches the link path
  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Apply active styles
  const getLinkStyles = (path) => {
    return isActive(path) ? "text-hotel-primary" : "hover:text-hotel-primary";
  };

  // Early return or fallback for logo sections if no logoUrl
  const renderLogo = () => {
    if (!logoUrl) return null;
    return (
      <Image
        src={logoUrl}
        alt="Hotel Logo"
        width={200}
        height={200}
        className="w-auto h-full max-w-full object-contain brightness-0 invert opacity-90"
        priority
      />
    );
  };

  return (
    <nav className="bg-[#1C1C1C] text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Menu Button */}
        <div className="flex items-center justify-between py-4 lg:hidden">
          <Link
            href={`/dashboard`}
            className="logo-container h-16 flex items-center px-4 transition-all duration-300"
          >
            <div className="logo-wrapper relative w-[130px] h-16">
              <div className="absolute inset-0 flex items-center justify-start">
                {renderLogo()}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between py-6">
          <div
            className="flex items-center space-x-16 "
            style={{ display: "contents" }}
          >
            <Link
              href={`/`}
              className="logo-container h-16 flex items-center px-4 transition-all duration-300"
            >
              <div className="logo-wrapper relative w-[130px] h-16">
                <div className="absolute inset-0 flex items-center justify-start">
                  {renderLogo()}
                </div>
              </div>
            </Link>
            <div className="flex space-x-8">
              <div className="relative group"></div>
              <Link href="/" className={getLinkStyles("/")}>
                HOME
              </Link>
              <Link href="/about" className={getLinkStyles("/about")}>
                ABOUT
              </Link>

              <Link href="/rooms" className={getLinkStyles("/rooms")}>
                ROOMS
              </Link>
              <Link href="/contact" className={getLinkStyles("/contact")}>
                CONTACT
              </Link>
            </div>
          </div>
          <div className=" flex pt-4 border-t border-gray-700 gap-2">
            <Link
              href="/login"
              className=" text-center hover:text-hotel-primary transition"
            >
              LOGIN
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className={getLinkStyles("/")}>
                HOME
              </Link>
              <Link href="/about" className={getLinkStyles("/about")}>
                ABOUT
              </Link>

              <Link href="/rooms" className={getLinkStyles("/rooms")}>
                ROOMS
              </Link>
              <Link href="/contact" className={getLinkStyles("/contact")}>
                CONTACT
              </Link>

              <div className=" flex pt-4 border-t border-gray-700 gap-5">
                <Link
                  href="/login"
                  className=" text-center hover:text-hotel-primary transition"
                >
                  LOGIN
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
