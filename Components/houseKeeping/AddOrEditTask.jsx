"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePagePermission } from "../../hooks/usePagePermission";
import axios from "axios";
import { Button, Select, SelectItem, Textarea } from "@nextui-org/react";
import { toast } from "react-toastify";

export default function AddOrEditTask({ mode = "add", taskId = null }) {
  const router = useRouter();
  const hasAddPermission = usePagePermission("House-keeping", "add");
  const hasEditPermission = usePagePermission("House-keeping", "edit");

  // Check appropriate permission based on mode
  const hasPermission = mode === "edit" ? hasEditPermission : hasAddPermission;

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    roomType: "",
    roomNumber: "",
    bookingNumber: "",
    checkOutDate: new Date().toISOString().split("T")[0],
    priority: "medium",
    reservationStatus: "available", // Changed from "checkout" to match select options
    status: "pending",
    assignedTo: "",
    notes: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [roomsResponse, staffResponse] = await Promise.all([
          axios.get(`/api/rooms`),
          axios.get(`/api/employeeManagement`),
        ]);

        if (roomsResponse.data.success) {
          setRooms(roomsResponse.data.rooms);
        }

        if (staffResponse.data.success) {
          const housekeepingStaff = staffResponse.data.employees.filter(
            (employee) =>
              employee.department.name.toLowerCase() === "housekeeping"
          );
          setStaff(housekeepingStaff);
        }

        // If in edit mode and we have a taskId, fetch task data after rooms are loaded
        if (mode === "edit" && taskId) {
          const taskResponse = await axios.get(`/api/houseKeeping/${taskId}`);
          if (taskResponse.data.success) {
            const taskData = taskResponse.data.task;
            setFormData({
              ...taskData,
              reservationStatus:
                taskData.reservationStatus === "checked-out"
                  ? "checkout"
                  : taskData.reservationStatus,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load required data");
      }
    };

    fetchInitialData();
  }, [mode, taskId]);

  const getRoomReservationStatus = (roomType, roomNumber) => {
    const room = rooms.find((r) => r.name === roomType);
    if (room) {
      const roomData = room.roomNumbers.find((rn) => rn.number === roomNumber);
      if (roomData && roomData.bookeddates?.length > 0) {
        // First check for checkin status as it takes priority
        const checkinBooking = roomData.bookeddates.find(
          (date) => date.status === "checkin"
        );
        if (checkinBooking) {
          return {
            status: "checkin",
            bookingNumber: checkinBooking.bookingNumber,
            guests: checkinBooking.guests,
          };
        }

        // Then check for booked status
        const bookedBooking = roomData.bookeddates.find(
          (date) => date.status === "booked"
        );
        if (bookedBooking) {
          return {
            status: "booked",
            bookingNumber: bookedBooking.bookingNumber,
            guests: bookedBooking.guests,
          };
        }
      }
    }
    return {
      status: "available",
      bookingNumber: null,
      guests: null,
    };
  };

  const getRoomMaintenanceInfo = (roomType, roomNumber) => {
    const room = rooms.find((r) => r.name === roomType);
    if (room) {
      const roomData = room.roomNumbers.find((rn) => rn.number === roomNumber);
      if (roomData && roomData.bookeddates?.length > 0) {
        const futureBookings = roomData.bookeddates.filter(
          (date) => date.checkOut && new Date(date.checkOut) > new Date()
        );

        if (futureBookings.length > 0) {
          const lastCheckout = new Date(
            Math.max(...futureBookings.map((b) => new Date(b.checkOut)))
          );
          return {
            canMaintain: true,
            startDate: lastCheckout,
            message: `Maintenance can start after ${lastCheckout.toLocaleDateString()}`,
          };
        }
      }
      return {
        canMaintain: true,
        startDate: new Date(),
        message: "Can start maintenance immediately",
      };
    }
    return { canMaintain: false, message: "Room not found" };
  };

  const getBookedRoomInfo = (roomType, roomNumber) => {
    const room = rooms.find((r) => r.name === roomType);
    if (room) {
      const roomData = room.roomNumbers.find((rn) => rn.number === roomNumber);
      const futureBooking = roomData?.bookeddates?.find(
        (date) =>
          date.status === "booked" && new Date(date.checkIn) > new Date()
      );

      if (futureBooking) {
        const checkInTime = new Date(futureBooking.checkIn);
        const hoursUntilCheckIn = (checkInTime - new Date()) / (1000 * 60 * 60);

        return {
          isBooked: true,
          canClean: hoursUntilCheckIn >= 2,
          checkInTime: checkInTime,
          message: `Check-in scheduled for ${checkInTime.toLocaleString()}`,
        };
      }
    }
    return { isBooked: false };
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // If room type or number changes, update reservation status and booking number
      if (name === "roomType" || name === "roomNumber") {
        if (newData.roomType && newData.roomNumber) {
          const roomInfo = getRoomReservationStatus(
            newData.roomType,
            newData.roomNumber
          );

          // Update form data with room status and booking information
          newData.reservationStatus = roomInfo.status;
          newData.bookingNumber = roomInfo.bookingNumber;

          // Set guests if available
          if (roomInfo.guests) {
            newData.guests = roomInfo.guests;
          }

          // Set priority based on status
          if (roomInfo.status === "checkin") {
            newData.priority = "high";
            newData.notes = `Check-in housekeeping task\nBooking: ${roomInfo.bookingNumber}`;
          } else if (roomInfo.status === "booked") {
            const bookingInfo = getBookedRoomInfo(
              newData.roomType,
              newData.roomNumber
            );
            if (bookingInfo.isBooked) {
              newData.priority = "high";
              newData.notes = `Pre-arrival cleaning for booking: ${roomInfo.bookingNumber}`;
            }
          }
        }
      }

      if (name === "status" && value === "maintenance") {
        const maintenanceInfo = getRoomMaintenanceInfo(
          newData.roomType,
          newData.roomNumber
        );
        if (maintenanceInfo.canMaintain) {
          newData.expectedStartTime = maintenanceInfo.startDate.toISOString();
          newData.startTime = maintenanceInfo.startDate.toISOString();
          newData.notes = `Maintenance Information:\n${
            maintenanceInfo.message
          }\n\n${newData.notes || ""}`;
          newData.reservationStatus = "maintenance";
        } else {
          toast.error("Cannot set room to maintenance");
          return prev;
        }
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let dataToSend = { ...formData };

      // Add completion times if status is being set to completed
      if (dataToSend.status === "completed") {
        const currentTime = new Date().toISOString();
        dataToSend = {
          ...dataToSend,
          endTime: currentTime,
          actualEndTime: currentTime,
        };
      }

      // Add start times if status is being set to in-progress
      if (dataToSend.status === "in-progress" && !dataToSend.startTime) {
        const currentTime = new Date().toISOString();
        dataToSend = {
          ...dataToSend,
          startTime: currentTime,
          actualStartTime: currentTime,
        };
      }

      let response;
      if (mode === "edit") {
        response = await axios.put(`/api/houseKeeping/${taskId}`, dataToSend);
      } else {
        const formDataObj = new FormData();
        Object.keys(dataToSend).forEach((key) => {
          if (dataToSend[key]) {
            formDataObj.append(key, dataToSend[key]);
          }
        });
        response = await axios.post(`/api/houseKeeping`, formDataObj);
      }

      if (response.data.success) {
        toast.success("Task saved successfully");
        router.push(`/dashboard/house-keeping`);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error(error.response?.data?.error || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const BookingWarning = () => {
    const bookingInfo = getBookedRoomInfo(
      formData.roomType,
      formData.roomNumber
    );
    if (bookingInfo.isBooked) {
      return (
        <div
          className={`p-2 rounded-md ${
            bookingInfo.canClean ? "bg-warning-100" : "bg-error-100"
          }`}
        >
          <p className="text-sm">{bookingInfo.message}</p>
          {bookingInfo.canClean && (
            <p className="text-sm font-bold">
              Must complete before:{" "}
              {new Date(
                bookingInfo.checkInTime.getTime() - 2 * 60 * 60 * 1000
              ).toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  if (!hasPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to {mode === "edit" ? "edit" : "add"}{" "}
        tasks
      </div>
    );
  }
  return (
    <section className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span>Loading...</span>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold my-4">
            {mode === "edit" ? "Edit Task" : "Add Task"}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 container  mt-3">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="room-type-label"
              >
                Room Type
              </label>
              <Select
                placeholder="Select room type"
                className="w-full"
                selectedKeys={
                  formData.roomType ? new Set([formData.roomType]) : new Set()
                }
                onChange={(e) => handleInputChange("roomType", e.target.value)}
                aria-labelledby="room-type-label"
              >
                {rooms.map((room) => (
                  <SelectItem key={room.name} value={room.name}>
                    {room.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="room-number-label"
              >
                Room Number
              </label>
              <Select
                placeholder="Select room number"
                className="w-full"
                selectedKeys={
                  formData.roomNumber
                    ? new Set([formData.roomNumber])
                    : new Set()
                }
                onChange={(e) =>
                  handleInputChange("roomNumber", e.target.value)
                }
                aria-labelledby="room-number-label"
              >
                {rooms
                  .find((r) => r.name === formData.roomType)
                  ?.roomNumbers.map((rn) => (
                    <SelectItem key={rn.number} value={rn.number}>
                      {rn.number}
                    </SelectItem>
                  )) || []}
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="reservation-status-label"
              >
                Reservation Status
              </label>
              <Select
                placeholder="Select reservation status"
                className="w-full"
                selectedKeys={new Set([formData.reservationStatus])} // Changed to ensure Set is always created
                onChange={(e) =>
                  handleInputChange("reservationStatus", e.target.value)
                }
                isDisabled={true}
                aria-labelledby="reservation-status-label"
              >
                <SelectItem key="checkin" value="checkin">
                  Checked In
                </SelectItem>
                <SelectItem key="checkout" value="checkout">
                  Checked Out
                </SelectItem>
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="available" value="available">
                  Available
                </SelectItem>
                <SelectItem key="booked" value="booked">
                  Booked
                </SelectItem>
                <SelectItem key="maintenance" value="maintenance">
                  Maintenance
                </SelectItem>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="housekeeping-status-label"
              >
                Housekeeping Status
              </label>
              <Select
                placeholder="Select housekeeping status"
                className="w-full"
                selectedKeys={
                  formData.status ? new Set([formData.status]) : new Set()
                }
                onChange={(e) => handleInputChange("status", e.target.value)}
                aria-labelledby="housekeeping-status-label"
              >
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="in-progress" value="in-progress">
                  In Progress
                </SelectItem>
                <SelectItem key="completed" value="completed">
                  Completed
                </SelectItem>
                <SelectItem key="maintenance" value="maintenance">
                  Maintenance
                </SelectItem>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="priority-label"
              >
                Priority
              </label>
              <Select
                placeholder="Select priority"
                className="w-full"
                selectedKeys={
                  formData.priority ? new Set([formData.priority]) : new Set()
                }
                onChange={(e) => handleInputChange("priority", e.target.value)}
                aria-labelledby="priority-label"
              >
                <SelectItem key="high" value="high">
                  High
                </SelectItem>
                <SelectItem key="medium" value="medium">
                  Medium
                </SelectItem>
                <SelectItem key="low" value="low">
                  Low
                </SelectItem>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                id="assign-to-label"
              >
                Assign To
              </label>
              <Select
                placeholder="Select staff member"
                className="w-full"
                selectedKeys={
                  formData.assignedTo
                    ? new Set([formData.assignedTo])
                    : new Set()
                }
                onChange={(e) =>
                  handleInputChange("assignedTo", e.target.value)
                }
                aria-labelledby="assign-to-label"
              >
                {staff.map((employee) => (
                  <SelectItem
                    key={employee.employeeId}
                    value={employee.employeeId}
                  >
                    {`${employee.firstName} ${employee.lastName}`}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                placeholder="Enter any additional notes"
                className="w-full"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <BookingWarning />

      <div className="flex justify-center gap-3 mt-6">
        <Button
          className="min-w-44 bg-hotel-primary-red text-white"
          onPress={() => router.push(`/dashboard/house-keeping`)}
        >
          Cancel
        </Button>
        <Button
          className="min-w-44 bg-hotel-primary text-white"
          onPress={handleSubmit}
          isLoading={loading}
        >
          {mode === "edit" ? "Update" : "Save"} Task
        </Button>
      </div>
    </section>
  );
}
