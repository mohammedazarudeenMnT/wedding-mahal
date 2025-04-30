"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";
import { amenityIcons } from "../../../utils/amenityIcons";
import { Select, SelectItem } from "@nextui-org/react";
import { MdFreeBreakfast, MdLunchDining, MdDinnerDining } from "react-icons/md";
import { GiCakeSlice } from "react-icons/gi";

import { usePagePermission } from "../../../hooks/usePagePermission";
import AddRoomSkeleton from "./AddRoomSkeleton";

const amenities = [
  { name: "Air Conditioning" },
  { name: "Mineral Water" },
  { name: "Toiletries" },
  { name: "Wifi" },
  { name: "Safe" },
  { name: "Dental Kit" },
  { name: "Water Heater" },
  { name: "Extra Bedding" },
  { name: "Pillow" },
  { name: "Mini Fridge" },
  { name: "Telephone" },
  { name: "TV" },
  { name: "Sound Speakers" },
  { name: "Kettle" },
  { name: "Blackout Curtains" },
  { name: "Hairdryer" },
  { name: "Shampoo/Conditioner" },
  { name: "Bathrobe and Slippers" },
  { name: "Noise Canceling Headphones" },
  { name: "Eye Mask" },
  { name: "Shaving Kit" },
  { name: "Room Freshener" },
  { name: "Daily Newspaper" },
  { name: "Universal Power Adapters" },
  { name: "Chair" },
  { name: "Shaving Mirror" },
  { name: "Writing Pad and Pen" },
  { name: "Hand Sanitizer" },
  { name: "Purified Drinking Water" },
  { name: "Iron/Ironing Board" },
  { name: "Charging Points" },
  { name: "Hot & Cold Water" },
  { name: "Hypoallergenic Bedding" },
  { name: "Fan" },
  { name: "Western Toilet Seat" },
  { name: "Luggage Storage" },
].map((item) => ({
  icon: amenityIcons[item.name]
    ? React.createElement(amenityIcons[item.name])
    : null,
  name: item.name,
}));

const features = [
  { name: "Bathtub" },
  { name: "24 hour Housekeeping" },
  { name: "In Room Dining" },
  { name: "Room Service" },
  { name: "Ironing Service" },
  { name: "Balcony" },
  { name: "Laundry Services" },
  { name: "Private Entrance" },
  { name: "In Room Entertainment System" },
  { name: "Reading Lamp" },
  { name: "Smart TV with Streaming Apps" },
  { name: "Private Fitness Trainer" },
  { name: "Private Butler Service" },
  { name: "Local Shopping Guide" },
  { name: "Signature Welcome Drink" },
  { name: "Soundproof Doors" },
  { name: "Anti Glare Windows" },
  { name: "Scenic View Balcony" },
].map((item) => ({
  icon: amenityIcons[item.name]
    ? React.createElement(amenityIcons[item.name])
    : null,
  name: item.name,
}));

const facilities = [
  { name: "Swimming Pool" },
  { name: "Gym" },
  { name: "Spa" },
  { name: "Sauna" },
  { name: "Bar" },
  { name: "Night Club" },
  { name: "Indoor Games Room" },
  { name: "Outdoor Camping Space" },
  { name: "Private Beach Access" },
  { name: "Mini Golf Course" },
  { name: "Sports Court" },
].map((item) => ({
  icon: amenityIcons[item.name]
    ? React.createElement(amenityIcons[item.name])
    : null,
  name: item.name,
}));

export default function AddRoomForm({ params = {} }) {
  const hasAddPermission = usePagePermission("rooms", "add");
  const hasEditPermission = usePagePermission("rooms", "edit");
  const { id } = params;

  const router = useRouter();
  const roomId = id;
  const isEditMode = !!roomId;
  const [isLoading, setIsLoading] = useState(true);

  const [mainImage, setMainImage] = useState(null);
  const [thumbnailImages, setThumbnailImages] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState(Array(5).fill(""));
  const [numberOfRooms, setNumberOfRooms] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    igst: "",
    price: "",
    additionalGuestCosts: "",
    size: "",
    bedModel: "",
    maxGuests: "",
    amenities: [],
    complementaryFoods: [],
  });

  const initialFormData = {
    name: "",
    description: "",
    igst: "",
    price: "",
    additionalGuestCosts: "",
    size: "",
    bedModel: "",
    maxGuests: "",
    amenities: [],
    complementaryFoods: [],
  };

  const complementaryFoodOptions = [
    {
      label: "Breakfast",
      value: "Breakfast",
      icon: <MdFreeBreakfast className="text-xl" />,
    },
    {
      label: "Lunch",
      value: "Lunch",
      icon: <MdLunchDining className="text-xl" />,
    },
    {
      label: "Dinner",
      value: "Dinner",
      icon: <MdDinnerDining className="text-xl" />,
    },
    {
      label: "Snacks",
      value: "Snacks",
      icon: <GiCakeSlice className="text-xl" />,
    },
  ];

  useEffect(() => {
    if (isEditMode) {
      const fetchRoomData = async () => {
        setIsLoading(true);

        try {
          const response = await axios.get(`/api/rooms/${roomId}`);
          if (response.data.success) {
            const roomData = response.data.room;
            setFormData({
              name: roomData.name,
              description: roomData.description,
              igst: roomData.igst,
              price: roomData.price,
              additionalGuestCosts: roomData.additionalGuestCosts,
              size: roomData.size,
              bedModel: roomData.bedModel,
              maxGuests: roomData.maxGuests,
              amenities: roomData.amenities.map((a) => `${a.icon}-${a.name}`),
              complementaryFoods: roomData.complementaryFoods || [],
            });
            setNumberOfRooms(roomData.roomNumbers.length);

            const newRoomNumbers = Array(roomData.roomNumbers.length).fill("");

            roomData.roomNumbers.forEach((room, index) => {
              newRoomNumbers[index] = room.number;
            });

            setRoomNumbers(newRoomNumbers);
            setMainImage(roomData.mainImage);
            setThumbnailImages(roomData.thumbnailImages);
          }
        } catch (error) {
          console.error("Error fetching room data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoomData();
    } else {
      setIsLoading(false);
    }
  }, [roomId, isEditMode]);

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setMainImage(fileArray[0]);
      setThumbnailImages(fileArray.slice(1));
    }
  };

  const handleRoomNumberChange = (index, value) => {
    setRoomNumbers((prev) => {
      const newNumbers = [...prev];
      newNumbers[index] = value;
      return newNumbers;
    });
  };

  const handleRoomCountChange = (e) => {
    const count = Math.max(0, parseInt(e.target.value) || 0);
    setNumberOfRooms(count);

    setRoomNumbers((prev) => {
      const newArray = Array(count).fill("");

      prev.forEach((num, index) => {
        if (index < count) {
          newArray[index] = num;
        }
      });

      return newArray;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (section, amenityName) => {
    const key = `${section}-${amenityName}`;
    setFormData((prevData) => {
      const amenities = prevData.amenities.includes(key)
        ? prevData.amenities.filter((item) => item !== key)
        : [...prevData.amenities, key];
      return { ...prevData, amenities };
    });
  };

  const handleDeleteRoomNumber = async (roomNumber) => {
    if (!isEditMode) return;

    if (
      !confirm(`Are you sure you want to delete room number ${roomNumber}?`)
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/rooms/${roomId}/roomnumber/${roomNumber}`
      );

      if (response.data.success) {
        setRoomNumbers((prev) => prev.filter((num) => num !== roomNumber));
        setNumberOfRooms((prev) => prev - 1);
        toast.success("Room number deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting room number:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete room number";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditMode && !hasEditPermission) {
      toast.error("You don't have permission to edit rooms");
      return;
    }

    if (!isEditMode && !hasAddPermission) {
      toast.error("You don't have permission to add rooms");
      return;
    }

    const filledRoomNumbers = roomNumbers.filter(
      (number) => number.trim() !== ""
    );

    if (filledRoomNumbers.length !== numberOfRooms) {
      toast.error(
        `Please fill in exactly ${numberOfRooms} room numbers. Currently have ${filledRoomNumbers.length}.`
      );
      return;
    }

    const uniqueNumbers = new Set(filledRoomNumbers);
    if (uniqueNumbers.size !== filledRoomNumbers.length) {
      toast.error("Room numbers must be unique.");
      return;
    }

    const submitData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => submitData.append(key, item));
      } else {
        submitData.append(key, value);
      }
    });

    const roomNumbersData = filledRoomNumbers.map((number) => ({
      number: number.trim(),
      bookeddates: [],
    }));

    submitData.append("roomNumbers", JSON.stringify(roomNumbersData));
    submitData.append("numberOfRooms", numberOfRooms.toString());

    const mainImageFile = document.getElementById("image-upload").files[0];
    if (mainImageFile) {
      submitData.append("mainImage", mainImageFile);
    }

    const thumbnailFiles = document.getElementById("image-upload").files;
    for (let i = 1; i < thumbnailFiles.length; i++) {
      submitData.append("thumbnailImages", thumbnailFiles[i]);
    }

    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`/api/rooms/${roomId}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axios.post(`/api/rooms`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (response.data.success) {
        toast.success(response.data.message);
        router.push(`/dashboard/rooms`);
        setFormData(initialFormData);
        setRoomNumbers(Array(5).fill(""));
        setNumberOfRooms(0);
        setMainImage(null);
        setThumbnailImages([]);
        if (mainImage) URL.revokeObjectURL(mainImage);
        thumbnailImages.forEach((img) => URL.revokeObjectURL(img));
      }
    } catch (error) {
      console.error("Error adding/updating room:", error);
      toast.error("Failed to add/update room. Please try again.");
    }
  };
  if (isLoading) {
    return <AddRoomSkeleton />;
  }

  if (isEditMode && !hasEditPermission) {
    return <div>You don&apos;t have permission to edit rooms</div>;
  }

  if (!isEditMode && !hasAddPermission) {
    return <div>You don&apos;t have permission to add rooms</div>;
  }
  return (
    <div className="flex flex-col relative gap-4 w-full">
      <div className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Room Detail</h1>
              <button
                className="bg-hotel-primary text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                {isEditMode ? "Update" : "Save"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 p-4 z-0 bg-content1 rounded-large shadow-small room-det-bg">
                <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-200 mb-4">
                  {mainImage && (
                    <div className="relative w-full h-full">
                      <Image
                        src={mainImage}
                        alt="Main Room Image"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-lg"
                        priority
                      />
                      <span className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-sm font-bold rounded-br-lg z-10">
                        Main Image
                      </span>
                    </div>
                  )}
                  <label
                    htmlFor="image-upload"
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-full cursor-pointer"
                  >
                    <FaUpload className="text-blue-500" />
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                    />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {thumbnailImages.map((thumb, index) => (
                    <div key={index} className="relative h-20 bg-gray-200">
                      <Image
                        src={thumb}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Room Size
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="35 m²"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bed Model
                    </label>
                    <input
                      type="text"
                      name="bedModel"
                      value={formData.bedModel}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="King"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Guest
                    </label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={formData.maxGuests}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="Deluxe Room"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      IGST %
                    </label>
                    <input
                      type="text"
                      name="igst"
                      value={formData.igst}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rent
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Guest Cost
                    </label>
                    <input
                      type="number"
                      name="additionalGuestCosts"
                      value={formData.additionalGuestCosts}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      placeholder="2000"
                    />
                  </div>
                </div>
                <div className="my-4">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    id="complementary-foods-label"
                  >
                    Complementary Foods
                  </label>
                  <Select
                    items={complementaryFoodOptions}
                    variant="bordered"
                    isMultiple
                    selectionMode="multiple"
                    placeholder="Select complementary foods"
                    selectedKeys={formData.complementaryFoods}
                    onSelectionChange={(keys) => {
                      setFormData((prev) => ({
                        ...prev,
                        complementaryFoods: Array.from(keys),
                      }));
                    }}
                    className="max-w-full"
                    aria-labelledby="complementary-foods-label"
                    labelPlacement="outside"
                  >
                    {(item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        textValue={item.label}
                        startContent={item.icon}
                      >
                        {item.label}
                      </SelectItem>
                    )}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    value={numberOfRooms}
                    onChange={handleRoomCountChange}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                    placeholder="10"
                  />
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Room Numbers</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2">
                    {roomNumbers.map((number, index) => (
                      <div key={index} className="relative">
                        <input
                          type="text"
                          value={number}
                          onChange={(e) =>
                            handleRoomNumberChange(index, e.target.value)
                          }
                          className={`p-2 text-center rounded border w-full ${
                            number.trim() === ""
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder={`Room ${index + 1}`}
                          required
                        />
                        {isEditMode && number && (
                          <button
                            onClick={() => handleDeleteRoomNumber(number)}
                            className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            type="button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm">
                    {numberOfRooms > 0 && (
                      <p
                        className={
                          roomNumbers.filter((n) => n.trim() !== "").length !==
                          numberOfRooms
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {`${
                          roomNumbers.filter((n) => n.trim() !== "").length
                        } of ${numberOfRooms} room numbers filled`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-4 z-0 bg-content1 rounded-large shadow-small">
                <textarea
                  className="w-full h-32 p-2 border rounded mb-4"
                  placeholder="Enter room description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>

                {["Amenities", "Features", "Facilities"].map((section) => {
                  const sectionAmenities =
                    section === "Facilities"
                      ? facilities
                      : section === "Features"
                      ? features
                      : amenities;

                  return (
                    <div key={section} className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">{section}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {sectionAmenities.map((amenity) => (
                          <div
                            key={amenity.name}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`${section}-${amenity.name}`}
                              className="rounded text-blue-500"
                              checked={formData.amenities.includes(
                                `${section}-${amenity.name}`
                              )}
                              onChange={() =>
                                handleAmenityChange(section, amenity.name)
                              }
                            />
                            <label
                              htmlFor={`${section}-${amenity.name}`}
                              className="flex items-center space-x-2"
                            >
                              <span className="text-xl">{amenity.icon}</span>
                              <span>{amenity.name}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
