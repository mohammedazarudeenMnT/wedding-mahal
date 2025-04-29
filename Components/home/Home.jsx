"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Construction,
  School,
  Bed,
  Crown,
  BedDouble,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const AirConditioner = Construction;
const Pool = School;

const rooms = [
  {
    id: 1,
    title: "Delux Family Rooms",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
  {
    id: 2,
    title: "Doubble Suite Rooms",
    image:
      "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
  {
    id: 3,
    title: "Suprior Bed Rooms",
    image:
      "https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&q=80&w=1200",
    price: "$560",
    type: "LUXURY ROOM",
    size: "1500 SQ.FT/Rooms",
    beds: "2 King Bed",
  },
];

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39",
    title: "THE BEST LUXURY HOTEL IN CALIFORNIA",
    subtitle: "★★★★★ LUXURY HOTEL & RESORT",
  },
  {
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
    title: "EXPERIENCE ULTIMATE COMFORT",
    subtitle: "★★★★★ PREMIUM ACCOMMODATIONS",
  },
  {
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304",
    title: "YOUR PERFECT GETAWAY",
    subtitle: "★★★★★ WORLD-CLASS SERVICE",
  },
];

const testimonials = [
  {
    name: "John D. Alexon",
    role: "Traveler",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
  {
    name: "Zaman D. John",
    role: "Tourist",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
  {
    name: "Mukul Ansari",
    role: "Business",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

      setQuoteSubmitMessage(
        "Thank you for your message. We will contact you soon!"
      );
      setQuoteFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setQuoteSubmitMessage(
        error.message ||
          "There was an error sending your message. Please try again."
      );
    } finally {
      setIsQuoteSubmitting(false);
    }
  };

  const nextSlide = () => {
    setIsPaused(true);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setTimeout(() => setIsPaused(false), 1000);
  };

  const prevSlide = () => {
    setIsPaused(true);
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
    setTimeout(() => setIsPaused(false), 1000);
  };

  // Auto-play with pause on hover
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(nextSlide, 8000); // 8 second transition
      return () => clearInterval(timer);
    }
  }, [isPaused]);

  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(testimonialTimer);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-white overflow-x-hidden overflow-y-hidden">
      {/* Enhanced Hero Carousel */}
      {/* Enhanced Hero Carousel */}
      <div className="relative group max-sm:h-[60vh] sm:h-[60vh] md:h-[90vh] lg:h-[90vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {/* Background Image */}
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroSlides[currentSlide].image})`,
              }}
              initial={{ scale: 1 }}
              animate={{ scale: isPaused ? 1 : 1.05 }}
              transition={{ duration: 8, ease: "linear" }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <motion.div
                className="max-w-2xl w-full"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.p
                  className="text-sm sm:text-base md:text-lg text-white mb-4 tracking-wider"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>
                <motion.h1
                  className="text-3xl sm:text-5xl md:text-6xl font-serif mb-8 text-white leading-tight"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  {heroSlides[currentSlide].title}
                </motion.h1>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link
                    href="/rooms"
                    className="inline-block bg-hotel-primary px-6 md:px-8 py-3 hover:bg-hotel-primary transform hover:scale-105 transition-all duration-300 text-white text-sm sm:text-base shadow-lg hover:shadow-xl"
                  >
                    <button> DISCOVER MORE</button>{" "}
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute z-20 inset-0 flex  items-center justify-end ">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-black/50 hover:bg-hotel-primary flex items-center justify-center text-white transform hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-black/50 hover:bg-hotel-primary flex items-center justify-center text-white transform hover:scale-105 transition-all duration-300"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute z-20 bottom-8 left-0 right-0 flex justify-center items-center gap-3">
          <div className="flex gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsPaused(true);
                  setCurrentSlide(idx);
                  setTimeout(() => setIsPaused(false), 1000);
                }}
                className={`transition-all duration-300 ${
                  currentSlide === idx
                    ? "w-8 h-3 bg-hotel-primary"
                    : "w-3 h-3 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <motion.section
        id="about"
        className="py-12 sm:py-16 md:py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=2070"
                alt="Luxury Hotel Room"
                className=" shadow-lg"
                width={1000}
                height={667}
              />
              <div className="absolute -bottom-0 right-0  bg-[#1c1c1ce3] text-white p-3 border-l-8 border-t-8 border-[#cececedc]">
                <div className="text-center">
                  <div className="text-hotel-primary text-4xl font-serif mb-2">
                    ★
                  </div>
                  <div className="uppercase text-sm mb-1">AWARD WINNING</div>
                  <div className="uppercase text-sm">HOTEL</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-sm text-hotel-primary mb-2">
                LUXURY HOTEL AND RESORT
              </h2>
              <h3 className="text-3xl font-serif mb-6">
                LUXURY BEST HOTEL IN CITY MADURAI, TAMILNADU
              </h3>
              <p className="text-gray-600 mb-6">
                Experience unparalleled luxury at our award-winning hotel.
                Nestled in the heart of California, we offer a perfect blend of
                sophistication, comfort, and world-class service.
              </p>
              <p className="text-gray-600 mb-8">
                Our commitment to excellence has made us the preferred choice
                for discerning travelers seeking an exceptional hospitality
                experience.
              </p>
              <div className="text-gray-600">
                <p className="mb-2">
                  3/508, Bharathi St, Muneeswarar Nagar, Iyer Bungalow,
                </p>
                <p>Madurai, Tamil Nadu 625014</p>
              </div>
              <Link href="/about">
                {" "}
                <button className="mt-8 bg-hotel-primary text-white px-8 py-3  hover:bg-hotel-primary transition">
                  ABOUT MORE
                </button>
              </Link>
            </div>
          </div>
        </section>
      </motion.section>

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
            {[
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
            ].map((facility, index) => (
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
            <motion.div
              className="col-span-12 md:col-span-4 aspect-[4/3] relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=2071"
                alt="Hotel Reception"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </motion.div>
            <motion.div
              className="col-span-12 md:col-span-4 aspect-[4/3] relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070"
                alt="Luxury Room"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </motion.div>
            <motion.div
              className="col-span-12 md:col-span-4 aspect-[4/3] relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=2070"
                alt="Luxury Room"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>
            <motion.div
              className="col-span-12 md:col-span-6 aspect-[4/3] relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=2070"
                alt="Suite Room"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
            <motion.div
              className="col-span-12 md:col-span-6 aspect-[4/3] relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Image
                src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=2070"
                alt="Room Service"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <motion.section
        className="py-12 sm:py-16 md:py-20 bg-[#1C1C1C] text-white overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <p className="text-hotel-primary mb-4 uppercase tracking-wider">
                LUXURY HOTEL AND RESORT
              </p>
              <h2 className="text-4xl font-serif">
                CLIENT FEEDBACK
                <br />
                ABOUT SERVICES
              </h2>
            </div>
            <div className="flex gap-4 mt-8 md:mt-0">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 border border-gray-600 flex items-center justify-center hover:bg-hotel-primary hover:border-hotel-primary transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 border border-gray-600 flex items-center justify-center hover:bg-hotel-primary hover:border-hotel-primary transition-all duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative h-[360px] max-w-3xl mx-auto overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="absolute w-full"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <motion.div
                  className="bg-[#252525] p-8 transform transition-all duration-300 hover:scale-[1.02]"
                  whileHover={{ y: -5 }}
                >
                  <div className="mb-8">
                    <div className="text-hotel-primary text-4xl mb-4">
                      &ldquo;
                    </div>
                    <p className="text-gray-400 leading-relaxed text-lg">
                      {testimonials[currentTestimonial].comment}
                    </p>
                  </div>
                  <motion.div
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Image
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-lg">
                        {testimonials[currentTestimonial].name}
                      </h4>
                      <p className="text-gray-400">
                        {testimonials[currentTestimonial].role}
                      </p>
                    </div>
                    <div className="ml-auto text-hotel-primary text-lg">
                      ★★★★★
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-3 transition-all duration-300 ${
                  currentTestimonial === index
                    ? "w-8 bg-hotel-primary"
                    : "w-3 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.section>
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
    </div>
  );
}
