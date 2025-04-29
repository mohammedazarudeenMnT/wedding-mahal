"use client";

import { setHours, setMinutes } from "date-fns";
import { Button, Modal, ModalContent } from "@nextui-org/react";
import { useState } from "react";
import { FaUsers, FaChevronRight, FaChevronLeft, FaBed } from "react-icons/fa";
import { amenityIcons } from "../../utils/amenityIcons";
import "./RoomDetails.css";
import Image from "next/image";
import { MdFreeBreakfast, MdLunchDining, MdDinnerDining } from "react-icons/md";
import { GiCakeSlice } from "react-icons/gi";
import Link from "next/link";

const statusColors = {
  available: "bg-hotel-primary-green text-white", // Green for available
  booked: "bg-hotel-secondary-grey text-hotel-primary-text",
  checkin: "bg-hotel-primary text-white", // Blue for checked in
  checkout: "bg-hotel-primary-red text-white", // Red for checked out
  maintenance: "bg-hotel-secondary-light-grey text-hotel-primary-text", // Gray for maintenance
  housekeeping: "bg-hotel-primary-red text-white", // Add housekeeping color
};

const RoomDetails = ({ room, dateRange, roomSettings }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  // Filter out any null or undefined images and create a unique array
  const images = [room?.mainImage, ...(room?.thumbnailImages || [])]
    .filter((img) => img)
    .filter((img, index, self) => self.indexOf(img) === index);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setPreviewOpen(true);
  };

  const prevImage = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const nextImage = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getRoomStatus = (roomNumber, dateRange) => {
    if (!roomNumber.bookeddates || roomNumber.bookeddates.length === 0) {
      return "available";
    }

    const selectedDate = new Date(dateRange.from);
    selectedDate.setHours(0, 0, 0, 0);

    // Check for housekeeping status
    const housekeepingBooking = roomNumber.bookeddates.find(
      (date) =>
        (date.status === "checkout" || date.status === "pending") &&
        date.checkOut === null &&
        new Date(date.checkIn) <= new Date(dateRange.to)
    );

    if (housekeepingBooking) {
      const housekeepingDate = new Date(housekeepingBooking.checkIn);
      housekeepingDate.setHours(0, 0, 0, 0);

      // Room should show as housekeeping only from the checkIn date onwards
      if (selectedDate >= housekeepingDate) {
        return "housekeeping";
      }
    }

    const [checkInHours, checkInMinutes] = roomSettings.checkIn
      .split(":")
      .map(Number);
    const [checkOutHours, checkOutMinutes] = roomSettings.checkOut
      .split(":")
      .map(Number);

    const isSingleDate = dateRange.from.getTime() === dateRange.to.getTime();
    const requestedCheckIn = setMinutes(
      setHours(new Date(dateRange.from), checkInHours),
      checkInMinutes
    );
    const requestedCheckOut = setMinutes(
      setHours(new Date(dateRange.to), checkOutHours),
      checkOutMinutes
    );

    // Find the active booking for this date/range
    const activeBooking = roomNumber.bookeddates.find((bookedDate) => {
      if (bookedDate.status === "maintenance") {
        if (bookedDate.checkIn) {
          const maintenanceStart = new Date(bookedDate.checkIn);
          return requestedCheckIn >= maintenanceStart;
        }
        return true;
      }

      if (!["checkin", "checkout", "booked"].includes(bookedDate.status)) {
        return false;
      }

      const bookedStart = new Date(bookedDate.checkIn);
      const bookedEnd = new Date(bookedDate.checkOut);

      if (isSingleDate) {
        // For single date, check if the date falls within a booking period
        return requestedCheckIn >= bookedStart && requestedCheckIn < bookedEnd;
      }

      // For date range
      return (
        (requestedCheckIn < bookedEnd && requestedCheckOut > bookedStart) ||
        requestedCheckIn.getTime() === bookedStart.getTime() ||
        requestedCheckOut.getTime() === bookedEnd.getTime()
      );
    });

    return activeBooking ? activeBooking.status : "available";
  };

  const getAvailableRoomCount = () => {
    if (!room?.roomNumbers) return 0;
    return room.roomNumbers.filter(
      (roomNum) => getRoomStatus(roomNum, dateRange) === "available"
    ).length;
  };

  const complementaryFoodIcons = {
    Breakfast: <MdFreeBreakfast />,
    Lunch: <MdLunchDining />,
    Dinner: <MdDinnerDining />,
    Snacks: <GiCakeSlice />,
  };

  if (!room) {
    return <div>No room selected</div>;
  }

  return (
    <div className="bg-hotel-primary-bg rounded-lg p-6 shadow-sm overflow-auto">
      <div className="sticky top-0 z-10 pb-4">
        <h1 className="text-2xl font-semibold mb-2">{room.name} Room</h1>
        <div className="flex flex-col gap-1">
          <p className="text-gray-600">
            Occupied:{" "}
            <span className="font-medium">
              {room.numberOfRooms - getAvailableRoomCount()}/
              {room.numberOfRooms} Rooms
            </span>
          </p>
        </div>
      </div>

      {/* Room Numbers Grid */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {room.roomNumbers.map((roomNumber) => {
          const status = getRoomStatus(roomNumber, dateRange);
          const activeBooking = roomNumber.bookeddates?.find((booking) => {
            const bookingDate = new Date(booking.checkIn);
            const selectedDate = new Date(dateRange.from);
            return (
              booking.status !== "maintenance" &&
              bookingDate.toDateString() === selectedDate.toDateString()
            );
          });

          // Decide whether to render a link or plain div based on booking status
          const ContentWrapper = activeBooking ? Link : "div";
          const wrapperProps = activeBooking
            ? {
                href: `/dashboard/bookings/${activeBooking.bookingNumber}`,
                className: `cursor-pointer ${statusColors[status]}`,
              }
            : {
                className: statusColors[status],
              };

          return (
            <ContentWrapper key={roomNumber.number} {...wrapperProps}>
              <div
                className="p-2 h-12 flex items-center justify-center"
                title={`Room ${roomNumber.number}${
                  activeBooking ? ` - ${activeBooking.bookingNumber}` : ""
                }`}
              >
                {roomNumber.number}
              </div>
            </ContentWrapper>
          );
        })}
      </div>

      <h3 className="text-xl font-semibold mb-4">Room Details</h3>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="rounded-lg h-64 overflow-hidden relative">
          <Image
            src={room.mainImage || "/placeholder.svg"}
            alt={`${room.name} Main View`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-lg cursor-pointer"
            onClick={() => handleImageClick(0)}
            priority
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {images.slice(1).map((image, index) => (
            <div
              key={index}
              className="rounded-lg h-20 overflow-hidden relative"
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${room.name} View ${index + 1}`}
                fill
                sizes="(max-width: 768px) 25vw, 20vw"
                className="object-cover rounded-lg cursor-pointer"
                onClick={() => handleImageClick(index + 1)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-base">{room.size} m²</span>
        </div>
        <div className="flex items-center gap-2">
          <FaBed className="w-4 h-4" />
          <span className="text-base">{room.bedModel}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaUsers className="w-4 h-4" />
          <span className="text-base">{room.maxGuests} guests</span>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        {room.description ||
          "Upgrade to our Deluxe Rooms for added space and luxury. With a king-size bed, separate seating area, larger work desk, and a 55-inch flat-screen TV, these rooms are perfect for those who want to unwind in style. The en-suite bathroom boasts a bathtub and shower, ensuring maximum comfort during your stay."}
      </p>

      {/* Complementary Foods */}
      {room.complementaryFoods && room.complementaryFoods.length > 0 && (
        <div className="mb-6">
          <h4 className="text-hotel-primary-text font-semibold mb-3">
            Complementary Foods
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {room.complementaryFoods.map((food, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xl text-gray-500">
                  {complementaryFoodIcons[food]}
                </span>
                <span>{food}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities */}
      <h4 className="text-hotel-primary-text font-semibold mb-3">Facilities</h4>

      <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
        {room?.amenities?.map((amenity, index) => {
          const IconComponent = amenityIcons[amenity.name];
          return (
            IconComponent && (
              <div key={index} className="flex items-center gap-2">
                <IconComponent className="w-5 h-5 text-gray-500" />
                <span>{amenity.name}</span>
              </div>
            )
          );
        })}
      </div>

      {/* Image Preview Modal with Gallery */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        size="full"
        hideCloseButton
        className="image-preview-modal"
        classNames={{
          base: "bg-black/90",
          wrapper: "p-0",
          body: "p-0",
        }}
      >
        <ModalContent className="h-[100vh]">
          {(onClose) => (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                isIconOnly
                className="absolute top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70"
                onClick={onClose}
                aria-label="Close preview"
              >
                ✕
              </Button>

              {/* Navigation buttons */}
              <div className="fixed inset-x-0 flex items-center justify-between px-4 z-50">
                <Button
                  isIconOnly
                  onClick={prevImage}
                  className="bg-black/50 text-white hover:bg-black/70 w-10 h-10 min-w-0"
                >
                  <FaChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  isIconOnly
                  onClick={nextImage}
                  className="bg-black/50 text-white hover:bg-black/70 w-10 h-10 min-w-0"
                >
                  <FaChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Image container */}
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
                  <Image
                    src={images[selectedImageIndex] || "/placeholder.svg"}
                    alt={`Room preview ${selectedImageIndex + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                    quality={100}
                  />
                </div>
              </div>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RoomDetails;
