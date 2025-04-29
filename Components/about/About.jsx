import Image from "next/image";
import Link from "next/link";

import {
  Crown,
  BedDouble,
  ArrowLeft,
  ArrowRight,
  Wifi,
  Coffee,
  School as Pool,
  Car,
  Dumbbell,
  UtensilsCrossed,
  WashingMachine,
} from "lucide-react";
import { motion } from "framer-motion";

const facilities = [
  {
    icon: BedDouble,
    title: "Room Services",
    description: "24/7 in-room dining service",
  },
  {
    icon: Wifi,
    title: "Wi-Fi Internet",
    description: "High-speed internet access",
  },
  {
    icon: Coffee,
    title: "Breakfast",
    description: "Gourmet breakfast buffet",
  },
  {
    icon: Pool,
    title: "Swimming Pool",
    description: "Heated indoor/outdoor pool",
  },
  {
    icon: Car,
    title: "Parking Space",
    description: "Secure valet parking",
  },
  {
    icon: Dumbbell,
    title: "Fitness Center",
    description: "State-of-the-art equipment",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant & Bar",
    description: "Fine dining experience",
  },
  {
    icon: WashingMachine,
    title: "Laundry Service",
    description: "Same-day laundry service",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="h-[300px] relative flex items-center justify-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl font-serif mb-4">ABOUT US</h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Link href="/">HOME</Link>
            <span>/</span>
            <span>ABOUT</span>
          </div>
        </div>
      </div>

      {/* Luxury Hotel Section */}
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
              Experience unparalleled luxury at our award-winning hotel. Nestled
              in the heart of California, we offer a perfect blend of
              sophistication, comfort, and world-class service.
            </p>
            <p className="text-gray-600 mb-8">
              Our commitment to excellence has made us the preferred choice for
              discerning travelers seeking an exceptional hospitality
              experience.
            </p>
            <div className="text-gray-600">
              <p className="mb-2">
                {" "}
                3/508, Bharathi St, Muneeswarar Nagar, Iyer Bungalow,
              </p>
              <p>Madurai, Tamil Nadu 625014</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Facilities */}
      {/* Hotel Facilities */}
      <section className="bg-[#F8F6F3] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-hotel-primary" />
            </div>
            <h2 className="text-3xl font-serif mb-4">
              HOTEL&apos;S FACILITIES
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Proactively morph optimal infomediaries rather than accurate
              expertise. Intrinsicly progressive resources rather than
              resource-leveling
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {facilities.map((facility, index) => (
              <div
                key={index}
                className="group bg-white p-8  cursor-pointer transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 flex items-center justify-center mb-4">
                    <facility.icon className="w-10 h-10 text-hotel-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg font-serif mb-2">{facility.title}</h3>
                  <p className="text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {facility.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-sm text-hotel-primary mb-2">
              LUXURY HOTEL AND RESORT
            </h2>
            <h3 className="text-3xl font-serif">
              RESORT CLIENTS FEEDBACK
              <br />
              ABOUT SERVICES
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "John D. Alexon",
                role: "Traveler",
                image:
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
                comment:
                  "Exceptional service and luxurious accommodations. The attention to detail and professional staff made our stay truly memorable.",
              },
              {
                name: "Zaman D. John",
                role: "Tourist",
                image:
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
                comment:
                  "Outstanding experience from check-in to check-out. The facilities are world-class and the service is impeccable.",
              },
              {
                name: "Mukul Ansari",
                role: "Business",
                image:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
                comment:
                  "Perfect for business travelers. The amenities and location are excellent, and the staff goes above and beyond.",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8  shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className=" object-cover"
                      fill
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.comment}</p>
                <div className="text-hotel-primary mt-4">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
