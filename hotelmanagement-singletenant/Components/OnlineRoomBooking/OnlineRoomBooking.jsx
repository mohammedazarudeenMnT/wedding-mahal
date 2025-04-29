"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import { FaBed, FaUsers } from "react-icons/fa";
import RoomDetails from "./RoomDetails";
import axios from "axios";
import { PiCurrencyInr } from "react-icons/pi";
import { format, setHours, setMinutes, addDays, startOfDay } from "date-fns";
import { ChevronDown, CalendarIcon, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Calendar } from "../ui/calendar.tsx";
import BookingModal from "../ui/BookingModal.jsx";
import RoomListSkeleton from "../Rooms/RoomSkeleton.jsx";
import RoomPreviewModal from "./RoomPreviewModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import "../../styles/rooms.css";
import Image from "next/image";
import { MdFreeBreakfast, MdLunchDining, MdDinnerDining } from "react-icons/md";
import { GiCakeSlice } from "react-icons/gi";

const complementaryFoodIcons = {
  Breakfast: <MdFreeBreakfast className="w-4 h-4" />,
  Lunch: <MdLunchDining className="w-4 h-4" />,
  Dinner: <MdDinnerDining className="w-4 h-4" />,
  Snacks: <GiCakeSlice className="w-4 h-4" />,
};

export default function OnlineRoomBooking({ initialData }) {
  const [rooms, setRooms] = useState(initialData.rooms || []);
  const [selectedRoom, setSelectedRoom] = useState(
    initialData.rooms?.[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [categories, setCategories] = useState(() => {
    const uniqueCategories = [
      ...new Set(initialData.rooms?.map((room) => room.name) || []),
    ];
    return ["all", ...uniqueCategories];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roomSettings, setRoomSettings] = useState(
    initialData.settings || {
      checkIn: "14:00",
      checkOut: "12:00",
      weekend: [],
      weekendPriceHike: 0,
    }
  );
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [hotelData, setHotelData] = useState(initialData.hotelInfo || null);
  const [error, setError] = useState(null);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const isLaptop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    // Automatically filter rooms when date range or number of rooms changes
    filterRooms();
  }, [dateRange, numberOfRooms]);

  const handleRoomClick = (room) => {
    // Only allow selecting available rooms
    if (isRoomTypeAvailable(room)) {
      setSelectedRoom(room);
      if (!isLaptop) {
        setPreviewModalOpen(true);
      }
    }
  };

  const handleCategoryChange = (e) => {
    // Update to handle the new selection format
    const newValue = e.target.value;
    setSelectedCategory(newValue);
  };

  const handleCheckAvailability = async () => {
    setLoading(true);
    try {
      const roomsResponse = await axios.get(`/api/rooms`);
      setRooms(roomsResponse.data.rooms);

      const availableRooms = roomsResponse.data.rooms.filter((room) => {
        const availableRoomCount = room.roomNumbers.filter((roomNumber) =>
          isRoomAvailableForDateRange(
            roomNumber,
            dateRange.from,
            dateRange.to,
            roomSettings.checkIn,
            roomSettings.checkOut
          )
        ).length;
        return availableRoomCount >= numberOfRooms;
      });

      setAvailableRooms(availableRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const isRoomAvailableForDateRange = (
    roomNumber,
    startDate,
    endDate,
    checkInTime,
    checkOutTime
  ) => {
    if (!roomNumber?.bookeddates || !Array.isArray(roomNumber.bookeddates))
      return true;

    const [checkInHours, checkInMinutes] = checkInTime.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime
      .split(":")
      .map(Number);

    const requestedCheckIn = setMinutes(
      setHours(new Date(startDate), checkInHours),
      checkInMinutes
    );
    const requestedCheckOut = setMinutes(
      setHours(new Date(endDate), checkOutHours),
      checkOutMinutes
    );

    return !roomNumber.bookeddates.some((bookedDate) => {
      // Check for housekeeping status (checkout without checkOut date or pending)
      if (
        (bookedDate.status === "checkout" && !bookedDate.checkOut) ||
        (bookedDate.status === "pending" && !bookedDate.checkOut)
      ) {
        return true; // Room is unavailable due to housekeeping
      }

      // First check maintenance status
      if (bookedDate.status === "maintenance") {
        if (bookedDate.checkIn) {
          const maintenanceStart = new Date(bookedDate.checkIn);
          return (
            requestedCheckIn >= maintenanceStart ||
            requestedCheckOut >= maintenanceStart
          );
        }
        return true;
      }

      // Check for both checkin and booked status
      if (!["checkin", "booked"].includes(bookedDate.status)) return false;

      const bookedStart = new Date(bookedDate.checkIn);
      const bookedEnd = new Date(bookedDate.checkOut);

      return (
        (requestedCheckIn < bookedEnd && requestedCheckOut > bookedStart) ||
        requestedCheckIn.getTime() === bookedStart.getTime() ||
        requestedCheckOut.getTime() === bookedEnd.getTime()
      );
    });
  };

  const handleBookNow = (room) => {
    const availableRoomNumbers = room.roomNumbers.filter((roomNum) =>
      isRoomAvailableForDateRange(
        roomNum,
        dateRange.from,
        dateRange.to,
        roomSettings.checkIn,
        roomSettings.checkOut
      )
    );

    setSelectedRoom({
      ...room,
      roomNumbers: availableRoomNumbers,
    });
    setIsBookingModalOpen(true);
  };

  const filterRooms = () => {
    return rooms.filter((room) => {
      const categoryMatch =
        selectedCategory === "all" ||
        room.name.toLowerCase() === selectedCategory.toLowerCase();

      const searchMatch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.price.toString().includes(searchQuery);

      return categoryMatch && searchMatch;
    });
  };

  const filteredRooms = useMemo(
    () => filterRooms(),
    [rooms, selectedCategory, dateRange, searchQuery, numberOfRooms]
  );
  const calculateRoomPrice = (room, date) => {
    const dayOfWeek = format(date, "EEE");
    const isWeekendDay = roomSettings.weekend.includes(dayOfWeek);
    if (isWeekendDay) {
      const hikePercentage = 1 + roomSettings.weekendPriceHike / 100;
      return room.price * hikePercentage;
    }
    return room.price;
  };

  const isRoomTypeAvailable = (room) => {
    if (!room || !dateRange.from || !dateRange.to) return false;

    const availableRoomCount = room.roomNumbers.filter((roomNum) =>
      isRoomAvailableForDateRange(
        roomNum,
        dateRange.from,
        dateRange.to,
        roomSettings.checkIn,
        roomSettings.checkOut
      )
    ).length;

    return availableRoomCount >= numberOfRooms;
  };

  if (loading) {
    return <RoomListSkeleton />;
  }
  const refreshRoomAvailability = async () => {
    handleCheckAvailability();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="w-full bg-gray-900 p-4  mb-8 rounded-lg mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Check In Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 block">
                Check in
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center rounded-md bg-gray-800 px-3 py-2 text-white cursor-pointer">
                    <span>{format(dateRange.from, "dd MMM yyyy")}</span>
                    <CalendarIcon className="ml-auto h-4 w-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => {
                      if (date) {
                        setDateRange((prev) => ({
                          ...prev,
                          from: startOfDay(date),
                          to: addDays(startOfDay(date), 1),
                        }));
                      }
                    }}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check Out Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 block">
                Check out
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center rounded-md bg-gray-800 px-3 py-2 text-white cursor-pointer">
                    <span>{format(dateRange.to, "dd MMM yyyy")}</span>
                    <CalendarIcon className="ml-auto h-4 w-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => {
                      if (date && date > dateRange.from) {
                        setDateRange((prev) => ({
                          ...prev,
                          to: startOfDay(date),
                        }));
                      }
                    }}
                    disabled={(date) =>
                      date <= dateRange.from || date < startOfDay(new Date())
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Number of Rooms */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 block">
                Number Of Rooms
              </label>
              <div className="relative">
                <select
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-800 px-3 py-2 text-white appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num} className="bg-gray-800">
                      {num}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Check Availability Button */}
            <div className="flex items-end">
              <Button
                className="w-full bg-hotel-primary hover:bg-hotel-primary  text-white py-2 px-4 rounded-md"
                onClick={handleCheckAvailability}
              >
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 md:p-4 z-0 flex flex-col relative justify-between gap-4 w-full container mx-auto flex-grow">
        <div className="container-fluid w-full p-2 md:p-4">
          {/* Search and Filter Controls */}
          <div className="mb-6 relative">
            <Input
              type="search"
              placeholder="Search room type or prices..."
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="w-full flex-1 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs md:text-sm text-gray-500">Sort by:</span>
              {categories.length > 0 && (
                <Select
                  className="w-full sm:w-40"
                  aria-label="Sort rooms by category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div> */}
          </div>

          {/* Room Listings */}
          <div>
            {filteredRooms.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-4">
                <div
                  className={`w-full ${isLaptop ? "lg:w-2/4" : ""} space-y-4`}
                >
                  {filteredRooms.map((room) => (
                    <div
                      key={room._id}
                      className={`bg-white border rounded-lg p-3 md:p-4 flex flex-col md:flex-row gap-4 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedRoom && selectedRoom._id === room._id
                          ? "room-details-bg"
                          : ""
                      }`}
                      onClick={() => handleRoomClick(room)}
                    >
                      {/* Room Image */}
                      <div className="w-full md:w-60 lg:w-48 xl:w-56 h-auto md:h-auto flex-shrink-0 relative aspect-[4/3]">
                        <Image
                          src={room.mainImage}
                          alt={room.name}
                          fill
                          className="object-cover rounded-lg"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 48vw"
                        />
                      </div>

                      {/* Room Details */}
                      <div className="flex flex-col flex-grow min-w-0">
                        {/* Room Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {room.name}
                          </h3>
                          <p className="text-xl lg:text-2xl font-bold flex items-center gap-1 whitespace-nowrap">
                            <PiCurrencyInr />
                            {calculateRoomPrice(room, dateRange.from).toFixed(
                              2
                            )}
                            <span className="text-sm font-normal">/night</span>
                          </p>
                        </div>

                        {/* Room Specs */}
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-sm text-gray-600 mb-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium whitespace-nowrap">
                              {room.size} m²
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FaBed className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium whitespace-nowrap">
                              {room.bedModel}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FaUsers className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium whitespace-nowrap">
                              {room.maxGuests} guests
                            </span>
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 lg:line-clamp-3 mb-2">
                          {room.description}
                        </p>

                        {/* Complementary Foods */}
                        {room.complementaryFoods &&
                          room.complementaryFoods.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {room.complementaryFoods.map((food, index) => (
                                <span
                                  key={index}
                                  className="flex items-center gap-1 text-sm text-gray-600"
                                >
                                  {complementaryFoodIcons[food]}
                                  <span>{food}</span>
                                </span>
                              ))}
                            </div>
                          )}

                        {/* Availability and Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-auto pt-2">
                          <p className="text-sm whitespace-nowrap">
                            <span className="text-gray-600">Available: </span>
                            <span className="font-semibold">
                              {
                                room.roomNumbers.filter((roomNum) =>
                                  isRoomAvailableForDateRange(
                                    roomNum,
                                    dateRange.from,
                                    dateRange.to,
                                    roomSettings.checkIn,
                                    roomSettings.checkOut
                                  )
                                ).length
                              }
                              /{room.numberOfRooms}
                            </span>
                            <span className="text-gray-600"> Rooms</span>
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`px-4 lg:px-6 py-2 rounded-md w-full sm:w-auto ${
                              isRoomTypeAvailable(room)
                                ? "bg-hotel-primary hover:bg-hotel-primary text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              isRoomTypeAvailable(room) && handleBookNow(room);
                            }}
                            disabled={!isRoomTypeAvailable(room)}
                          >
                            {isRoomTypeAvailable(room)
                              ? "Book Now"
                              : "Not Available"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Only show inline RoomDetails on laptop and above */}
                {isLaptop && (
                  <div className="w-full lg:w-2/4 sticky top-4">
                    <RoomDetails
                      room={selectedRoom}
                      dateRange={dateRange}
                      roomSettings={roomSettings}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Preview Modal for mobile/tablet */}
      <RoomPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        room={selectedRoom}
        dateRange={dateRange}
        roomSettings={roomSettings}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={selectedRoom}
        dateRange={dateRange}
        hotelInfo={hotelData}
        numberOfRooms={numberOfRooms}
        roomSettings={{
          ...roomSettings,
          weekend: roomSettings.weekend,
          weekendPriceHike: roomSettings.weekendPriceHike,
        }}
        onBookingSuccess={refreshRoomAvailability}
      />
    </div>
  );
}
