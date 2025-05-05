"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ChevronDown, PenSquare, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";

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
  const [selectedDays, setSelectedDays] = useState([]);
  const [priceHike, setPriceHike] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [propertyTypeInput, setPropertyTypeInput] = useState("");
  const [eventTypeInput, setEventTypeInput] = useState("");
  const [timeSlotInput, setTimeSlotInput] = useState("");
  const [timeSlotFromTime, setTimeSlotFromTime] = useState("");
  const [timeSlotToTime, setTimeSlotToTime] = useState("");
  const [showPropertyTypes, setShowPropertyTypes] = useState(false);
  const [showEventTypes, setShowEventTypes] = useState(false);
  const [isCreatingPropertyType, setIsCreatingPropertyType] = useState(false);
  const [isCreatingEventType, setIsCreatingEventType] = useState(false);
  const [editingPropertyType, setEditingPropertyType] = useState(null);
  const [editingEventType, setEditingEventType] = useState(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const propertyTypeInputRef = useRef(null);
  const eventTypeInputRef = useRef(null);
  const timeSlotInputRef = useRef(null);

  useEffect(() => {
    fetchRoomSettings();
  }, []);

  const fetchRoomSettings = async () => {
    try {
      const response = await axios.get(`/api/settings/rooms`);
      const data = response.data.settings;
      setSelectedDays(data.weekend || []);
      setPriceHike(data.weekendPriceHike.toString());
      setPropertyTypes(data.propertyTypes || []);
      setEventTypes(data.eventTypes || []);
      setTimeSlots(Array.isArray(data.timeSlots) ? data.timeSlots : []);
    } catch (error) {
      console.error("Error fetching room settings:", error);
      toast.error("Failed to fetch room settings");
      setTimeSlots([]); // Ensure timeSlots is an array even on error
    }
  };

  const refetchSettings = async () => {
    await fetchRoomSettings();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (isEditMode) return;

      if (
        propertyTypeInputRef.current &&
        !propertyTypeInputRef.current.contains(event.target)
      ) {
        setShowPropertyTypes(false);
        setIsCreatingPropertyType(false);
      }
      if (
        eventTypeInputRef.current &&
        !eventTypeInputRef.current.contains(event.target)
      ) {
        setShowEventTypes(false);
        setIsCreatingEventType(false);
      }
      if (
        timeSlotInputRef.current &&
        !timeSlotInputRef.current.contains(event.target)
      ) {
        setShowTimeSlots(false);
        setIsCreatingTimeSlot(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditMode]);

  const handleDayToggle = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/settings/rooms`, {
        weekend: selectedDays,
        weekendPriceHike: parseFloat(priceHike),
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

  const handlePropertyTypeChange = (value) => {
    setPropertyTypeInput(value);
    setIsCreatingPropertyType(
      !propertyTypes.some(
        (type) => type.name.toLowerCase() === value.toLowerCase()
      )
    );
  };

  const handleEventTypeChange = (value) => {
    setEventTypeInput(value);
    setIsCreatingEventType(
      !eventTypes.some(
        (type) => type.name.toLowerCase() === value.toLowerCase()
      )
    );
  };

  const handleSavePropertyType = async () => {
    if (!propertyTypeInput.trim()) return;
    try {
      const formData = {
        operation: editingPropertyType ? "update" : "create",
        type: "propertyType",
        name: propertyTypeInput,
        oldName: editingPropertyType,
      };

      const response = await axios.post(`/api/settings/rooms`, formData);

      if (response.data.success) {
        toast.success(
          editingPropertyType ? "Property type updated" : "Property type added"
        );
        setPropertyTypeInput("");
        setEditingPropertyType(null);
        setIsEditMode(false);
        setShowPropertyTypes(false);
        await refetchSettings();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to save property type"
      );
    }
  };

  const handleSaveEventType = async () => {
    if (!eventTypeInput.trim()) return;
    try {
      const formData = {
        operation: editingEventType ? "update" : "create",
        type: "eventType",
        name: eventTypeInput,
        oldName: editingEventType,
      };

      const response = await axios.post(`/api/settings/rooms`, formData);

      if (response.data.success) {
        toast.success(
          editingEventType ? "Event type updated" : "Event type added"
        );
        setEventTypeInput("");
        setEditingEventType(null);
        setIsEditMode(false);
        setShowEventTypes(false);
        await refetchSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save event type");
    }
  };

  const handleSaveTimeSlot = async () => {
    if (!timeSlotInput.trim() || !timeSlotFromTime || !timeSlotToTime) return;
    try {
      const formData = {
        operation: editingTimeSlot ? "update" : "create",
        type: "timeSlot",
        name: timeSlotInput,
        oldName: editingTimeSlot,
        fromTime: `${timeSlotFromTime}:00`,
        toTime: `${timeSlotToTime}:00`,
      };

      const response = await axios.post(`/api/settings/rooms`, formData);

      if (response.data.success) {
        toast.success(
          editingTimeSlot ? "Time slot updated" : "Time slot added"
        );
        setTimeSlotInput("");
        setTimeSlotFromTime("");
        setTimeSlotToTime("");
        setEditingTimeSlot(null);
        setIsEditMode(false);
        setTimeSlots(false);
        await refetchSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save time slot");
    }
  };

  const handleDeletePropertyType = async (name) => {
    try {
      const response = await axios.post(`/api/settings/rooms`, {
        operation: "delete",
        type: "propertyType",
        name,
      });

      if (response.data.success) {
        toast.success("Property type deleted");
        await refetchSettings();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to delete property type"
      );
    }
  };

  const handleDeleteEventType = async (name) => {
    try {
      const response = await axios.post(`/api/settings/rooms`, {
        operation: "delete",
        type: "eventType",
        name,
      });

      if (response.data.success) {
        toast.success("Event type deleted");
        await refetchSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete event type");
    }
  };

  const handleDeleteTimeSlot = async (name) => {
    try {
      const response = await axios.post(`/api/settings/rooms`, {
        operation: "delete",
        type: "timeSlot",
        name,
      });

      if (response.data.success) {
        toast.success("Time slot deleted");
        await refetchSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete time slot");
    }
  };

  const renderTimeSlotsTable = () => {
    // Ensure timeSlots is an array
    const timeSlotsArray = Array.isArray(timeSlots) ? timeSlots : [];
    const pages = Math.ceil(timeSlotsArray.length / rowsPerPage);
    const items = timeSlotsArray.slice(
      (page - 1) * rowsPerPage,
      page * rowsPerPage
    );

    return (
      <div className="mt-6 space-y">
        <h3 className="text-lg font-semibold">Time Slots</h3>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Time slot name"
            value={timeSlotInput}
            onChange={(e) => setTimeSlotInput(e.target.value)}
            className="w-1/4"
          />
          <Select
            aria-label="From time"
            className="w-1/4"
            placeholder="From Time"
            selectedKeys={timeSlotFromTime ? [timeSlotFromTime] : []}
            onChange={(e) => setTimeSlotFromTime(e.target.value)}
          >
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="To time"
            className="w-1/4"
            placeholder="To Time"
            selectedKeys={timeSlotToTime ? [timeSlotToTime] : []}
            onChange={(e) => setTimeSlotToTime(e.target.value)}
          >
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </Select>
          <Button
            className="bg-hotel-primary text-white"
            onPress={handleSaveTimeSlot}
          >
            {editingTimeSlot ? "Update" : "Create"}
          </Button>
        </div>
        <Table
          aria-label="Time Slots"
          bottomContent={
            pages > 1 ? (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn>TIME SLOT NAME</TableColumn>
            <TableColumn>FROM TIME</TableColumn>
            <TableColumn>TO TIME</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {items.map((slot) => (
              <TableRow key={slot.name}>
                <TableCell>{slot.name}</TableCell>
                <TableCell>{slot.fromTime}</TableCell>
                <TableCell>{slot.toTime}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        setEditingTimeSlot(slot.name);
                        setTimeSlotInput(slot.name);
                        setTimeSlotFromTime(slot.fromTime.split(":")[0]);
                        setTimeSlotToTime(slot.toTime.split(":")[0]);
                        setIsEditMode(true);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeleteTimeSlot(slot.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <section className="mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px] flex flex-col">
      <div>
        <h2 className="text-xl font-semibold mb-1">Property Settings</h2>
        <p className="text-sm text-gray-500 mb-6">
          Manage your room categories and pricing
        </p>
      </div>

      <div className="flex gap-9">
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-3 w-1/6">
          Property Type
        </label>
        <div className="relative w-2/3" ref={propertyTypeInputRef}>
          <div className="flex gap-2">
            <Input
              placeholder="Search or create property type"
              value={propertyTypeInput}
              onChange={(e) => handlePropertyTypeChange(e.target.value)}
              className="w-1/2"
              onClick={() => !isEditMode && setShowPropertyTypes(true)}
              endContent={
                <ChevronDown
                  className={`w-4 h-4 text-[#70707B] cursor-pointer ${
                    editingPropertyType ? "hidden" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode) setShowPropertyTypes(!showPropertyTypes);
                  }}
                />
              }
            />
            {(isCreatingPropertyType || editingPropertyType) && (
              <Button
                className="bg-hotel-primary text-white"
                onPress={handleSavePropertyType}
              >
                {editingPropertyType ? "Update" : "Create"}
              </Button>
            )}
          </div>
          {showPropertyTypes && !editingPropertyType && (
            <div className="absolute z-50 w-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {propertyTypes.map((type) => (
                <div
                  key={type.name}
                  className="flex justify-between items-center p-2 hover:bg-gray-100"
                >
                  <span className="flex-1 px-2">{type.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        setEditingPropertyType(type.name);
                        setPropertyTypeInput(type.name);
                        setIsEditMode(true);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeletePropertyType(type.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-9">
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-3 w-1/6">
          Event Type
        </label>
        <div className="relative w-2/3" ref={eventTypeInputRef}>
          <div className="flex gap-2">
            <Input
              placeholder="Search or create event type"
              value={eventTypeInput}
              onChange={(e) => handleEventTypeChange(e.target.value)}
              className="w-1/2"
              onClick={() => !isEditMode && setShowEventTypes(true)}
              endContent={
                <ChevronDown
                  className={`w-4 h-4 text-[#70707B] cursor-pointer ${
                    editingEventType ? "hidden" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode) setShowEventTypes(!showEventTypes);
                  }}
                />
              }
            />
            {(isCreatingEventType || editingEventType) && (
              <Button
                className="bg-hotel-primary text-white"
                onPress={handleSaveEventType}
              >
                {editingEventType ? "Update" : "Create"}
              </Button>
            )}
          </div>
          {showEventTypes && !editingEventType && (
            <div className="absolute z-50 w-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {eventTypes.map((type) => (
                <div
                  key={type.name}
                  className="flex justify-between items-center p-2 hover:bg-gray-100"
                >
                  <span className="flex-1 px-2">{type.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        setEditingEventType(type.name);
                        setEventTypeInput(type.name);
                        setIsEditMode(true);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeleteEventType(type.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {renderTimeSlotsTable()}

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

      <div className="w-full flex justify-end items-end flex-grow mt-16">
        <Button
          size="lg"
          radius="full"
          className="bg-hotel-primary text-white px-8 w-[150px]"
          onPress={handleSave}
          isLoading={isLoading}
        >
          Save
        </Button>
      </div>
    </section>
  );
}
