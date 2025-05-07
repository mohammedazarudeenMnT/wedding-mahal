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

const facilities = [
  {
    icon: BedDouble,
    title: "Event Planning & Coordination",
    description: "24/7 in-room dining service",
  },
  {
    icon: Wifi,
    title: "Stage Decoration & Floral Arrangements",
    description: "High-speed internet access",
  },
  {
    icon: Coffee,
    title: "Refreshment and Beverags",
    description: "Gourmet breakfast buffet",
  },
  {
    icon: Pool,
    title: "Photography & Videography",
    description: "Heated indoor/outdoor pool",
  },
  {
    icon: Car,
    title: "Sound System & DJ Setup",
    description: "Secure valet parking",
  },
  {
    icon: Dumbbell,
    title: "Valet Parking",
    description: "State-of-the-art equipment",
  },
];

export default function About() {
  return (
     
      <section className="bg-[#FFE9E9] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-hotel-primary" />
            </div>
            <h2 className="text-3xl font-serif mb-4">
              Experience the JRV Mahal Advantage{" "}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From décor to dinner, we take care of it all.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {facilities.map((facility, index) => (
              <div
                key={index}
                className="group  p-8  cursor-pointer transition-all duration-300 hover:shadow-lg"
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
  );
}
