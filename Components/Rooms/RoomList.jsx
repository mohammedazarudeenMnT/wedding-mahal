"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, ModalContent } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { FaBed, FaUsers } from "react-icons/fa";
import RoomDetails from "./RoomDetails";
import Link from "next/link";
import axios from "axios";
import { PiCurrencyInr } from "react-icons/pi";
import { IoTrashBinOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Calendar } from "@/Components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import RoomListSkeleton from "./RoomSkeleton.jsx";
import { usePagePermission } from "@/hooks/usePagePermission";
import Image from "next/image";
import { MdFreeBreakfast, MdLunchDining, MdDinnerDining } from "react-icons/md";
import { GiCakeSlice } from "react-icons/gi";

const complementaryFoodIcons = {
  Breakfast: <MdFreeBreakfast className="w-4 h-4" />,
  Lunch: <MdLunchDining className="w-4 h-4" />,
  Dinner: <MdDinnerDining className="w-4 h-4" />,
  Snacks: <GiCakeSlice className="w-4 h-4" />,
};

export default function RoomList() {
  const canViewRooms = usePagePermission("rooms", "view");
  const canEditRooms = usePagePermission("rooms", "edit");
  const canDeleteRooms = usePagePermission("rooms", "delete");
  const canAddRooms = usePagePermission("rooms", "add");

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomSettings, setRoomSettings] = useState({
    checkIn: "14:00",
    checkOut: "12:00",
    weekend: [],
    weekendPriceHike: 0,
  });
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  useEffect(() => {
    if (canViewRooms) {
      fetchData();
    }
  }, [canViewRooms]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsResponse, settingsResponse] = await Promise.all([
        axios.get("/api/rooms"),
        axios.get("/api/settings/rooms"),
      ]);

      setRooms(roomsResponse.data.rooms);
      setSelectedRoom(roomsResponse.data.rooms[0]);

      const uniqueCategories = [
        ...new Set(roomsResponse.data.rooms.map((room) => room.name)),
      ];
      setCategories(["all", ...uniqueCategories]);

      const settings = settingsResponse.data.settings;
      setRoomSettings({
        checkIn: settings.checkIn,
        checkOut: settings.checkOut,
        weekend: settings.weekend || [],
        weekendPriceHike: settings.weekendPriceHike || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    if (window.innerWidth < 1024) {
      setIsMobileDetailsOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/rooms/${id}`);
      toast.success(response.data.message);
      setRooms((prevRooms) => prevRooms.filter((room) => room._id !== id));

      const updatedCategories = [
        ...new Set(
          rooms.filter((room) => room._id !== id).map((room) => room.name)
        ),
      ];
      setCategories(["all", ...updatedCategories]);
    } catch (error) {
      toast.error("Failed to delete room: " + error.message);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleDateChange = (range) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from, // If no 'to' date, use 'from' date (single date mode)
      });
    } else {
      setDateRange({
        from: new Date(),
        to: addDays(new Date(), 1),
      });
    }
  };

  const getRoomStatusMemoized = useCallback(
    (roomNumber, dateRange) => {
      if (!roomNumber?.bookeddates || !Array.isArray(roomNumber.bookeddates))
        return true;

      const selectedDate = new Date(dateRange.from);
      selectedDate.setHours(0, 0, 0, 0);

      // Check for housekeeping status
      const isHousekeeping = roomNumber.bookeddates.some((date) => {
        if (
          (date.status === "checkout" || date.status === "pending") &&
          date.checkOut === null
        ) {
          const housekeepingDate = new Date(date.checkIn);
          housekeepingDate.setHours(0, 0, 0, 0);
          return selectedDate >= housekeepingDate;
        }
        return false;
      });

      if (isHousekeeping) {
        return false; // Room not available during housekeeping
      }

      // Rest of the existing availability check logic
      const [checkInHours, checkInMinutes] = roomSettings.checkIn
        .split(":")
        .map(Number);
      const [checkOutHours, checkOutMinutes] = roomSettings.checkOut
        .split(":")
        .map(Number);

      const requestedCheckIn = setMinutes(
        setHours(new Date(dateRange.from), checkInHours),
        checkInMinutes
      );
      const requestedCheckOut = setMinutes(
        setHours(new Date(dateRange.to || dateRange.from), checkOutHours),
        checkOutMinutes
      );

      return !roomNumber.bookeddates.some((bookedDate) => {
        if (bookedDate.status === "maintenance") {
          if (bookedDate.checkIn) {
            const maintenanceStart = new Date(bookedDate.checkIn);
            return requestedCheckIn >= maintenanceStart;
          }
          return true;
        }

        if (!["checkin", "checkout", "booked"].includes(bookedDate.status))
          return false;

        const bookedStart = new Date(bookedDate.checkIn);
        const bookedEnd = new Date(bookedDate.checkOut);

        // For single date (when from and to are the same)
        if (dateRange.from.getTime() === dateRange.to.getTime()) {
          return (
            requestedCheckIn >= bookedStart && requestedCheckIn < bookedEnd
          );
        }

        // For date range
        return (
          (requestedCheckIn < bookedEnd && requestedCheckOut > bookedStart) ||
          requestedCheckIn.getTime() === bookedStart.getTime() ||
          requestedCheckOut.getTime() === bookedEnd.getTime()
        );
      });
    },
    [dateRange, roomSettings]
  );

  const calculateRoomPriceMemoized = useCallback(
    (room, date) => {
      const dayOfWeek = format(date, "EEE");
      const isWeekendDay = roomSettings.weekend.includes(dayOfWeek);
      if (isWeekendDay) {
        const hikePercentage = 1 + roomSettings.weekendPriceHike / 100;
        return room.price * hikePercentage;
      }
      return room.price;
    },
    [roomSettings]
  );

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const categoryMatch =
        selectedCategory === "all" ||
        room.name.toLowerCase() === selectedCategory.toLowerCase();

      const searchMatch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomNumbers.some((rn) =>
          rn.number.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return categoryMatch && searchMatch;
    });
  }, [rooms, selectedCategory, searchQuery]);

  if (!canViewRooms) {
    return <div>You don&apos;t have permission to view rooms.</div>;
  }

  if (loading) {
    return <RoomListSkeleton />;
  }

  return (
    <div className="flex flex-col relative gap-2 md:gap-4 w-full">
      <div className="p-2 md:p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
        <div className="container-fluid w-full p-2 md:p-4">
          <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center mb-4 space-y-3 sm:space-y-0 gap-3 md:gap-5">
            <div className="relative w-full sm:max-w-xs flex-1">
              <Input
                type="search"
                placeholder="Search room type or number"
                startContent={<Search />}
                className="w-full sm:max-w-xs flex-1"
                classNames={{
                  base: "w-full sm:max-w-[44%]",
                  inputWrapper: "bg-hotel-secondary",
                  input: "text-hotel-primary-text text-sm",
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Check Availability:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white border rounded-md h-10 px-3 flex items-center gap-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-2">Sort by:</span>
                  <Select
                    className="w-40"
                    classNames={{
                      base: "bg-hotel-secondary rounded-lg",
                      trigger: "bg-hotel-secondary rounded-lg",
                      value: "text-hotel-primary-text",
                      popover: "rounded-lg",
                    }}
                    defaultSelectedKeys={["all"]}
                    onChange={handleCategoryChange}
                    aria-label="Select room category"
                  >
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              {canAddRooms && (
                <Link href="/dashboard/rooms/addrooms">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                  >
                    Add Category
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div>
            {filteredRooms.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-2/4 space-y-4">
                  {filteredRooms.map((room) => (
                    <div
                      key={room._id}
                      className={`bg-white border rounded-lg p-4 flex flex-col md:flex-row gap-4 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedRoom && selectedRoom._id === room._id
                          ? "room-details-bg"
                          : ""
                      }`}
                      onClick={() => handleRoomClick(room)}
                    >
                      <div className="w-full md:w-60 lg:w-48 xl:w-56 h-auto md:h-auto flex-shrink-0 relative aspect-[4/3]">
                        <Image
                          src={room.mainImage || "/placeholder.svg"}
                          alt={room.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, 128px"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold">{room.name}</h3>
                          <div className="flex gap-2">
                            {canEditRooms && (
                              <Link
                                href={`/dashboard/rooms/editrooms/${room._id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-hotel-secondary-light-grey text-hotel-primary-text font-[500] border-hotel-secondary-light-grey"
                                >
                                  Edit
                                </Button>
                              </Link>
                            )}
                            {canDeleteRooms && (
                              <Button
                                size="sm"
                                className="bg-red-500 text-white h-8 w-8 min-w-0 p-0 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(room._id);
                                }}
                              >
                                <IoTrashBinOutline className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <span className="mr-1">{room.size} m²</span>
                          </span>
                          {room.type === "Room" ? (
                            <>
                              <span className="flex items-center">
                                <FaBed className="w-3 h-3 mr-1" />
                                <span>{room.bedModel}</span>
                              </span>
                              <span className="flex items-center">
                                <FaUsers className="w-3 h-3 mr-1" />
                                <span>{room.maxGuests} guests</span>
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center">
                              <FaUsers className="w-3 h-3 mr-1" />
                              <span>Capacity: {room.capacity}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {room.description}
                        </p>
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
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm">
                            Availability:{" "}
                            <span className="font-medium">
                              {room.type === "Room"
                                ? `${
                                    room.roomNumbers.filter((roomNum) =>
                                      getRoomStatusMemoized(roomNum, dateRange)
                                    ).length
                                  }/${room.numberOfRooms} Rooms`
                                : `${
                                    room.hallNumbers.filter((hallNum) =>
                                      getRoomStatusMemoized(hallNum, dateRange)
                                    ).length
                                  }/${room.numberOfHalls} Halls`}
                            </span>
                          </p>
                          <p className="text-xl font-semibold flex items-center mt-3">
                            <PiCurrencyInr className="w-5 h-5" />
                            {calculateRoomPriceMemoized(
                              room,
                              dateRange.from
                            ).toFixed(0)}
                            <span className="text-sm text-gray-500 font-normal ml-1">
                              /night
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block w-full lg:w-2/4 sticky top-4">
                  {loading ? (
                    <div>Loading Room ...</div>
                  ) : (
                    <RoomDetails
                      room={selectedRoom}
                      dateRange={dateRange}
                      roomSettings={roomSettings}
                    />
                  )}
                </div>

                <Modal
                  isOpen={isMobileDetailsOpen}
                  onClose={() => setIsMobileDetailsOpen(false)}
                  className="lg:hidden"
                  size="full"
                  scrollBehavior="inside"
                  placement="bottom"
                >
                  <ModalContent>
                    {(onClose) => (
                      <>
                        <div className="p-4">
                          <Button
                            isIconOnly
                            className="absolute right-4 top-4"
                            onClick={onClose}
                            aria-label="Close"
                          >
                            ✕
                          </Button>
                          <RoomDetails
                            room={selectedRoom}
                            dateRange={dateRange}
                            roomSettings={roomSettings}
                          />
                        </div>
                      </>
                    )}
                  </ModalContent>
                </Modal>
              </div>
            ) : (
              <div>No rooms available for the selected criteria.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
