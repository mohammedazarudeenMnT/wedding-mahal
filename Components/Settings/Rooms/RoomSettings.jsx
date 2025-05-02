"use client";

import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";

import axios from "axios";
import { toast } from "react-toastify";

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, "0"),
  label: `${i.toString().padStart(2, "0")}:00`,
}));

const days = [
  { key: "Sun", label: "Sun" },
  { key: "Mon", label: "Mon" },
  { key: "Tue", label: "Tue" },
  { key: "Wed", label: "Wed" },
  { key: "Thu", label: "Thu" },
  { key: "Fri", label: "Fri" },
  { key: "Sat", label: "Sat" },
];

export default function RoomSettings() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [priceHike, setPriceHike] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [manualControl, setManualControl] = useState(false);

  useEffect(() => {
    fetchRoomSettings();
  }, []);

  const fetchRoomSettings = async () => {
    try {
      const response = await axios.get(`/api/settings/rooms`);
      const data = response.data.settings;
      setCheckIn(data.checkIn.split(":")[0]);
      setCheckOut(data.checkOut.split(":")[0]);
      setSelectedDays(data.weekend);
      setPriceHike(data.weekendPriceHike.toString());
      setManualControl(data.manualControl || false);
    } catch (error) {
      console.error("Error fetching room settings:", error);
    }
  };

  const handleDayToggle = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let checkInHour = parseInt(checkIn);
      let checkOutHour = parseInt(checkOut);

      // Ensure checkout is less than checkin (next day checkout)
      if (checkOutHour >= checkInHour) {
        toast.error(
          "Check-out time must be earlier than check-in time (next day checkout)"
        );
        setIsLoading(false);
        return;
      }

      // Calculate hours for next day checkout
      const hourDiff = 24 - checkInHour + checkOutHour;

      if (hourDiff > 23) {
        toast.error("Stay duration cannot exceed 23 hours");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("checkIn", `${checkIn}:00`);
      formData.append("checkOut", `${checkOut}:00`);
      selectedDays.forEach((day) => formData.append("weekend", day));
      formData.append("weekendPriceHike", priceHike);
      formData.append("manualControl", manualControl);
      const response = await axios.post(`/api/settings/rooms`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error saving room settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px] flex flex-col">
      <div>
        <h2 className="text-xl font-semibold mb-1">Room Settings</h2>
        <p className="text-sm text-gray-500 mb-6">
          Manage your room categories and pricing
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <div className="flex gap-6 w-1/4">
          <label
            htmlFor="checkIn"
            className="items-center justify-center text-sm font-medium text-gray-700 mb-2 mt-2 text-nowrap"
          >
            Check In
          </label>
          <Select
            id="checkIn"
            aria-label="Check-in time"
            className="w-1/2"
            placeholder="Select Hour"
            selectedKeys={checkIn ? [checkIn] : []}
            onChange={(e) => setCheckIn(e.target.value)}
            variant="bordered"
            radius="lg"
          >
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-6 w-1/4">
          <label
            htmlFor="checkOut"
            className="items-center justify-center text-sm font-medium text-gray-700 mb-2 mt-2 text-nowrap"
          >
            Check Out
          </label>
          <Select
            id="checkOut"
            aria-label="Check-out time"
            className="w-1/2"
            placeholder="Select Hour"
            selectedKeys={checkOut ? [checkOut] : []}
            onChange={(e) => setCheckOut(e.target.value)}
            variant="bordered"
            radius="lg"
          >
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex gap-9 my-7">
        <label className="items-center justify-center text-sm font-medium text-gray-700 mb-4 mt-4">
          Weekend
        </label>
        <div className="flex gap-4">
          {days.map((day) => (
            <button
              key={day.key}
              onClick={() => handleDayToggle(day.key)}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${
                  selectedDays.includes(day.key)
                    ? "bg-hotel-primary text-white"
                    : "bg-white text-gray-700 border border-gray-300"
                }
              `}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-9">
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
          Weekend Price Hike
        </label>
        <div className="flex items-center max-w-[200px]">
          <Input
            value={priceHike}
            onValueChange={setPriceHike}
            variant="bordered"
            radius="lg"
            endContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">%</span>
              </div>
            }
            classNames={{
              input: "text-right",
            }}
            className="w-1/2"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <Switch isSelected={manualControl} onValueChange={setManualControl} />
        <span>Manual Housekeeping Control</span>
        <div className="text-xs text-gray-500 ml-2">
          (Disables automatic housekeeping buffer time)
        </div>
      </div>
      <div className="w-full flex justify-end items-end flex-grow mt-16">
        <Button
          size="lg"
          radius="full"
          className="bg-hotel-primary text-white px-8 w-[150px]"
          onClick={handleSave}
          isLoading={isLoading}
        >
          Save
        </Button>
      </div>
    </section>
  );
}
