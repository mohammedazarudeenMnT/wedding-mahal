import Home from "../Components/home/Home";
import About from "../Components/home/About";
import Facilities from "../Components/home/Facilities";
import HotelFacilities from "../Components/home/HotelFacilities";
import ExtraService from "../Components/home/ExtraService";
import Testimonials from "../Components/home/Testimonials";
import QuoteRequest from "../Components/home/QuoteRequest";

export default function Page() {
  return (
    <section>
      <Home />
      <About />
      <Facilities />
      <HotelFacilities />
      <ExtraService />
      <Testimonials />
      <QuoteRequest />
    </section>
  );
}