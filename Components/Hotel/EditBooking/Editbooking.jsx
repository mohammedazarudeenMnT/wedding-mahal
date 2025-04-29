"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Row,
  Col,
  Form,
  Card,
  Modal,
  ProgressBar,
  Dropdown,
  Badge,
} from "react-bootstrap";
import { Button } from "@nextui-org/react";

import { FaCalendarAlt, FaTimes, FaUpload } from "react-icons/fa";
import { DateRange } from "react-date-range";
import {
  addDays,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  format,
} from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import Image from "next/image";
import { countries } from "countries-list";
import ClientSelect from "../addBooking/ClientSelect"; // Import the ClientSelect component
import AddBookingSkeleton from "../addBooking/AddBookingSkeleton.jsx"; // Import the skeleton component
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../addBooking/addbooking.css";
import { validationRules, validateField } from "../../../utils/validationUtils";

export default function EditGuestBooking({ params }) {
  // Add loading state at the top with other state declarations
  const [loading, setLoading] = useState(true);

  const { bookingNumber } = params;
  const router = useRouter();
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([
    { type: "", number: "", price: "", mainImage: "" },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [verificationType, setVerificationType] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("09:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [unavailableDateRanges, setUnavailableDateRanges] = useState([]);
  const [showAvailableDatesModal, setShowAvailableDatesModal] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [originalDateRange, setOriginalDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [originalSelectedRooms, setOriginalSelectedRooms] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    gender: "",
    dateOfBirth: "",
    email: "",
    nationality: "",
    address: "",
    clientRequest: "",
    notes: "",
    numberOfRooms: 1,
    aadharNumber: "",
    passportNumber: "",
    verificationId: "",
    countryCode: "+91",
  });
  const [countryOptions, setCountryOptions] = useState([]);
  const [modifiedFields, setModifiedFields] = useState({});
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const options = Object.entries(countries).map(([code, country]) => ({
      value: code,
      label: country.name,
      search: `${country.name} ${code} ${country.native}`.toLowerCase(),
    }));
    setCountryOptions(options);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRooms(),
          fetchRoomSettings(),
          fetchBookingData(),
        ]);
      } catch (error) {
        console.error("Error loading booking data:", error);
        toast.error("Failed to load booking data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [bookingNumber]);

  const fetchRoomSettings = async () => {
    try {
      const response = await axios.get(`/api/settings/rooms`);
      const data = response.data.settings;
      setCheckInTime(data.checkIn);
      setCheckOutTime(data.checkOut);
    } catch (error) {
      console.error("Error fetching room settings:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`/api/rooms`);
      const data = await response.data;
      if (data.success) {
        setRooms(data.rooms);
      } else {
        console.error("Failed to fetch rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${bookingNumber}`);
      if (response.data.success) {
        const bookingData = response.data.booking;
        const mobileNo = bookingData.mobileNo || "";

        // Extract country code and phone number
        let countryCode = "+91"; // default
        let phoneNumber = mobileNo;

        if (mobileNo.startsWith("+")) {
          const matches = mobileNo.match(/^\+(\d+)/);
          if (matches) {
            countryCode = `+${matches[1]}`;
            phoneNumber = mobileNo.slice(countryCode.length);
          }
        }

        // Store nationality directly without converting to country code
        setFormData({
          firstName: bookingData.firstName || "",
          lastName: bookingData.lastName || "",
          mobileNo: phoneNumber,
          countryCode: countryCode,
          gender: bookingData.gender || "",
          dateOfBirth: bookingData.dateOfBirth
            ? new Date(bookingData.dateOfBirth).toISOString().split("T")[0]
            : "",
          email: bookingData.email || "",
          nationality: bookingData.nationality || "", // Store the full nationality name
          address: bookingData.address || "",
          clientRequest: bookingData.clientRequests || "",
          notes: bookingData.notes || "",
          numberOfRooms: bookingData.numberOfRooms || 1,
          aadharNumber:
            bookingData.verificationType === "aadhar"
              ? bookingData.verificationId || ""
              : "",
          passportNumber:
            bookingData.verificationType === "passport"
              ? bookingData.verificationId || ""
              : "",
          verificationId: bookingData.verificationId || "",
        });
        const newDateRange = [
          {
            startDate: new Date(bookingData.checkInDate),
            endDate: new Date(bookingData.checkOutDate),
            key: "selection",
          },
        ];
        setDateRange(newDateRange);
        setOriginalDateRange({
          startDate: new Date(bookingData.checkInDate),
          endDate: new Date(bookingData.checkOutDate),
        });
        setAdults(bookingData.guests.adults);
        setChildren(bookingData.guests.children);
        setSelectedRooms(bookingData.rooms);
        setOriginalSelectedRooms(bookingData.rooms);
        setVerificationType(bookingData.verificationType);
        setUploadedFiles(
          bookingData.uploadedFiles.map((file) => ({
            name: file.fileName,
            preview: file.filePath,
          }))
        );
        setNumberOfRooms(bookingData.rooms.length);
        filterAvailableRooms(bookingData.rooms);
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
      toast.error("Failed to fetch booking data");
    }
  };

  const isRoomAvailableForDateRange = (roomNumber, startDate, endDate) => {
    if (
      !roomNumber ||
      !roomNumber.unavailableDates ||
      !Array.isArray(roomNumber.unavailableDates)
    ) {
      return true; // If room data is not available or invalid, assume it's available
    }

    // Ensure the unavailableDates array has an even number of elements
    const validUnavailableDates = roomNumber.unavailableDates.filter(
      (_, index) => index % 2 === 0
    );

    return !validUnavailableDates.some((unavailableStartDate, index) => {
      const unavailableEndDate = roomNumber.unavailableDates[index * 2 + 1];

      // If there's no corresponding end date, skip this iteration
      if (!unavailableEndDate) return false;

      const unavailableStart = parseISO(unavailableStartDate);
      const unavailableEnd = parseISO(unavailableEndDate);

      return (
        isWithinInterval(startDate, {
          start: unavailableStart,
          end: unavailableEnd,
        }) ||
        isWithinInterval(endDate, {
          start: unavailableStart,
          end: unavailableEnd,
        }) ||
        (startDate <= unavailableStart && endDate >= unavailableEnd)
      );
    });
  };

  const findAvailableDates = (roomType, roomNumber) => {
    const room = rooms.find((r) => r.name === roomType);
    if (!room) return [];

    const roomData = room.roomNumbers.find((r) => r.number === roomNumber);
    if (!roomData) return [];

    const availableDates = [];
    let currentDate = new Date();
    const endDate = addDays(currentDate, 90); // Check availability for the next 90 days

    while (currentDate <= endDate) {
      const nextDay = addDays(currentDate, 1);
      if (isRoomAvailableForDateRange(roomData, currentDate, nextDay)) {
        availableDates.push(new Date(currentDate));
      }
      currentDate = nextDay;
    }

    return availableDates;
  };

  const filterAvailableRooms = (bookedRooms = []) => {
    const startDate = dateRange[0].startDate;
    const endDate = dateRange[0].endDate;

    const available = rooms.reduce((acc, room) => {
      const availableRoomNumbers = room.roomNumbers.filter((rn) =>
        isRoomAvailableForDateRange(rn, startDate, endDate)
      );

      if (availableRoomNumbers.length > 0) {
        acc.push({
          ...room,
          roomNumbers: availableRoomNumbers,
        });
      }

      return acc;
    }, []);

    bookedRooms.forEach((bookedRoom) => {
      const roomType = available.find((r) => r.name === bookedRoom.type);
      if (roomType) {
        const roomNumber = roomType.roomNumbers.find(
          (rn) => rn.number === bookedRoom.number
        );
        if (!roomNumber) {
          roomType.roomNumbers.push({
            number: bookedRoom.number,
            unavailableDates: [],
          });
        }
      } else {
        available.push({
          name: bookedRoom.type,
          roomNumbers: [{ number: bookedRoom.number, unavailableDates: [] }],
          price: bookedRoom.price,
          mainImage: bookedRoom.mainImage,
        });
      }
    });

    setAvailableRooms(available);
    setSelectedRooms(
      bookedRooms.length > 0
        ? bookedRooms
        : [{ type: "", number: "", price: "" }]
    );
  };

  useEffect(() => {
    if (dateRange[0].startDate && dateRange[0].endDate) {
      filterAvailableRooms(selectedRooms);
    }
  }, [dateRange, rooms, checkInTime, checkOutTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setModifiedFields((prev) => ({ ...prev, [name]: true }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Validate field on change
    const error = validateField(name, value, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handlePhoneChange = (value, data) => {
    const countryCode = `+${data.dialCode}`;
    const phoneNumber = value.slice(data.dialCode.length);
    setFormData((prev) => ({
      ...prev,
      countryCode: countryCode,
      mobileNo: phoneNumber,
    }));
    setModifiedFields((prev) => ({ ...prev, mobileNo: true }));

    // Clear error when user starts typing
    if (errors.mobileNo) {
      setErrors((prev) => ({ ...prev, mobileNo: null }));
    }

    // Validate phone number
    const error = validateField("mobileNo", phoneNumber, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, mobileNo: error }));
    }
  };

  const handleAdultIncrease = () => setAdults(adults + 1);
  const handleAdultDecrease = () => adults > 1 && setAdults(adults - 1);
  const handleChildrenIncrease = () => setChildren(children + 1);
  const handleChildrenDecrease = () =>
    children > 0 && setChildren(children - 1);

  const totalGuests = adults + children;

  const handleSelectChange = (e) => {
    setVerificationType(e.target.value || "");
    // Don't clear verification values when changing type
    setFormData((prev) => ({
      ...prev,
      verificationType: e.target.value || "", // Add this line
      verificationId: prev.aadharNumber || prev.passportNumber || "", // Add this line
    }));
  };

  const handleSelectCountryChange = (selectedOption, { name }) => {
    setFormData((prevData) => ({
      ...prevData,
      nationality: selectedOption ? selectedOption.label : "", // Store the country name, not the code
    }));
    setModifiedFields((prev) => ({ ...prev, nationality: true }));
  };

  const filterCountries = (inputValue) => {
    return countryOptions.filter((country) =>
      country.search.includes(inputValue.toLowerCase())
    );
  };

  const loadCountryOptions = (inputValue) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(filterCountries(inputValue));
      }, 300);
    });
  };

  const handleDateChange = (item) => {
    const startDate = new Date(item.selection.startDate);
    const endDate = new Date(item.selection.endDate);

    const [checkInHours, checkInMinutes] = checkInTime.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime
      .split(":")
      .map(Number);

    const adjustedStartDate = setMinutes(
      setHours(startDate, checkInHours),
      checkInMinutes
    );
    const adjustedEndDate = setMinutes(
      setHours(endDate, checkOutHours),
      checkOutMinutes
    );

    setDateRange([
      {
        startDate: adjustedStartDate,
        endDate:
          adjustedStartDate >= adjustedEndDate
            ? adjustedStartDate
            : adjustedEndDate,
        key: "selection",
      },
    ]);
    setModifiedFields((prev) => ({
      ...prev,
      checkInDate: true,
      checkOutDate: true,
    }));
  };

  const toggleCalendar = () => setShowCalendar((prev) => !prev);

  const handleFileUpload = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          setTimeout(() => {
            setUploadProgress(0);
            setUploadComplete(false);
          }, 2000);
        }
      }, 200);

      if (event.target.value !== undefined) {
        event.target.value = null;
      }
    }
  };

  const removeFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event);
  };

  const handleRoomChange = async (index, field, value) => {
    const newSelectedRooms = [...selectedRooms];
    newSelectedRooms[index] = { ...newSelectedRooms[index], [field]: value };
    if (field === "type") {
      const selectedRoom = rooms.find((r) => r.name === value);
      if (selectedRoom) {
        newSelectedRooms[index].price = selectedRoom.price;
        newSelectedRooms[index]._id = selectedRoom._id;
        newSelectedRooms[index].mainImage =
          selectedRoom.mainImage || "/assets/img/rooms/rooms.png";
      }
    }
    setSelectedRooms(newSelectedRooms);

    if (field === "number") {
      updateUnavailableDateRanges(newSelectedRooms[index].type, value);
    }
    setModifiedFields((prev) => ({ ...prev, [field]: true }));
  };

  const updateUnavailableDateRanges = (roomType, roomNumber) => {
    const selectedRoom = rooms.find((r) => r.name === roomType);
    if (selectedRoom) {
      const selectedRoomNumber = selectedRoom.roomNumbers.find(
        (rn) => rn.number === roomNumber
      );
      if (selectedRoomNumber && selectedRoomNumber.unavailableDates) {
        const dateRanges = [];
        for (
          let i = 0;
          i < selectedRoomNumber.unavailableDates.length;
          i += 2
        ) {
          if (i + 1 < selectedRoomNumber.unavailableDates.length) {
            dateRanges.push({
              start: new Date(selectedRoomNumber.unavailableDates[i]),
              end: new Date(selectedRoomNumber.unavailableDates[i + 1]),
            });
          }
        }
        setUnavailableDateRanges(dateRanges);
      } else {
        setUnavailableDateRanges([]);
      }
    }
  };

  const isDateDisabled = (date) => {
    return unavailableDateRanges.some((range) =>
      isWithinInterval(date, { start: range.start, end: range.end })
    );
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields using validation rules
    Object.keys(formData).forEach((field) => {
      // Skip mobile number validation if it hasn't been modified
      if (field === "mobileNo" && !modifiedFields.mobileNo) {
        return;
      }

      if (validationRules[field]) {
        const error = validateField(field, formData[field], validationRules);
        if (error) newErrors[field] = error;
      }
    });

    // Additional custom validations
    if (!verificationType) {
      newErrors.verificationType = "Please select a verification type";
    }

    if (verificationType === "aadhar" && !formData.aadharNumber) {
      newErrors.aadharNumber = "Aadhar number is required";
    } else if (
      verificationType === "aadhar" &&
      !/^\d{12}$/.test(formData.aadharNumber)
    ) {
      newErrors.aadharNumber = "Aadhar number must be 12 digits";
    }

    if (verificationType === "passport" && !formData.passportNumber) {
      newErrors.passportNumber = "Passport number is required";
    } else if (
      verificationType === "passport" &&
      !/^[A-Z0-9]{8,}$/.test(formData.passportNumber)
    ) {
      newErrors.passportNumber = "Invalid passport number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const hasDateChanged =
      originalDateRange.startDate.getTime() !==
        dateRange[0].startDate.getTime() ||
      originalDateRange.endDate.getTime() !== dateRange[0].endDate.getTime();

    const hasRoomChanged = !selectedRooms.every(
      (room, index) =>
        room.type === originalSelectedRooms[index]?.type &&
        room.number === originalSelectedRooms[index]?.number
    );

    if (!hasDateChanged && !hasRoomChanged) {
      await updateBooking();
      return;
    }

    const allRoomsAvailable = selectedRooms.every((room) => {
      const roomData = rooms
        .find((r) => r.name === room.type)
        ?.roomNumbers.find((rn) => rn.number === room.number);
      return isRoomAvailableForDateRange(
        roomData,
        dateRange[0].startDate,
        dateRange[0].endDate
      );
    });

    if (!allRoomsAvailable) {
      const unavailableRooms = selectedRooms.filter((room) => {
        const roomData = rooms
          .find((r) => r.name === room.type)
          ?.roomNumbers.find((rn) => rn.number === room.number);
        return !isRoomAvailableForDateRange(
          roomData,
          dateRange[0].startDate,
          dateRange[0].endDate
        );
      });

      // Check if the unavailable dates are only after the original end date
      const onlyExtendingStay = unavailableRooms.every((room) => {
        const roomData = rooms
          .find((r) => r.name === room.type)
          ?.roomNumbers.find((rn) => rn.number === room.number);
        return isRoomAvailableForDateRange(
          roomData,
          originalDateRange.startDate,
          originalDateRange.endDate
        );
      });

      if (onlyExtendingStay) {
        // If only extending the stay, proceed with the booking update
        await updateBooking();
        return;
      }

      const availableDatesForRooms = unavailableRooms.map((room) => ({
        ...room,
        availableDates: findAvailableDates(room.type, room.number),
      }));

      setAvailableDates(availableDatesForRooms);
      setShowAvailableDatesModal(true);
      return;
    }

    await updateBooking();
  };

  const updateBooking = async () => {
    const bookingFormData = new FormData();

    // Create a complete form data object with the phone number
    const completeFormData = {
      ...formData,
      // Only combine country code and mobile number if the field was modified
      mobileNo: modifiedFields.mobileNo
        ? `${formData.countryCode}${formData.mobileNo}`
        : formData.mobileNo, // Use existing number if not modified
      clientRequests: formData.clientRequest,
    };

    // Only append modified fields
    Object.keys(modifiedFields).forEach((key) => {
      if (
        completeFormData[key] !== null &&
        completeFormData[key] !== undefined
      ) {
        bookingFormData.append(key, completeFormData[key].toString());
      }
    });

    // Handle check-in/out dates if modified
    if (modifiedFields.checkInDate) {
      bookingFormData.append(
        "checkInDate",
        dateRange[0].startDate.toISOString()
      );
    }
    if (modifiedFields.checkOutDate) {
      bookingFormData.append(
        "checkOutDate",
        dateRange[0].endDate.toISOString()
      );
    }

    // Handle file uploads if any
    if (uploadedFiles.length > 0) {
      // Handle existing files
      const existingFiles = uploadedFiles.filter((file) => !file.file);
      if (existingFiles.length > 0) {
        bookingFormData.append(
          "existingFiles",
          JSON.stringify(
            existingFiles.map((file) => ({
              fileName: file.name,
              filePath: file.preview,
            }))
          )
        );
      }

      // Handle new files
      const newFiles = uploadedFiles.filter((file) => file.file);
      newFiles.forEach((fileObj) => {
        bookingFormData.append("newFiles", fileObj.file);
      });
    }

    // Add verification details to form data
    if (verificationType) {
      bookingFormData.append("verificationType", verificationType);
      if (verificationType === "aadhar") {
        bookingFormData.append("verificationId", formData.aadharNumber);
      } else if (verificationType === "passport") {
        bookingFormData.append("verificationId", formData.passportNumber);
      }
    }

    // Append existing uploaded files
    if (uploadedFiles.length > 0) {
      const existingFiles = uploadedFiles
        .filter((file) => !file.file) // Filter out new files
        .map((file) => ({
          fileName: file.name,
          filePath: file.preview,
        }));
      bookingFormData.append("existingFiles", JSON.stringify(existingFiles));
    }

    // Append new files
    uploadedFiles
      .filter((file) => file.file) // Only get new files
      .forEach((fileObj) => {
        bookingFormData.append("uploadedFiles", fileObj.file);
      });

    try {
      const response = await axios.put(
        `/api/bookings/${bookingNumber}`,
        bookingFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const result = response.data;

      if (result.success) {
        toast.success(result.message);
        const hasDateChanged =
          originalDateRange.startDate.getTime() !==
            dateRange[0].startDate.getTime() ||
          originalDateRange.endDate.getTime() !==
            dateRange[0].endDate.getTime();

        const hasRoomChanged = !selectedRooms.every(
          (room, index) =>
            room.type === originalSelectedRooms[index]?.type &&
            room.number === originalSelectedRooms[index]?.number
        );

        if (hasDateChanged || hasRoomChanged) {
          await updateRoomAvailability(selectedRooms, dateRange[0]);
        }
        router.push(`/dashboard/bookings/${bookingNumber}`);
      } else {
        toast.error("Booking update failed: " + result.message);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("An error occurred while updating the booking.");
    }
  };

  const updateRoomAvailability = async (bookedRooms, dateRange) => {
    for (const room of bookedRooms) {
      try {
        const roomData = rooms.find((r) => r.name === room.type);
        if (!roomData) {
          console.error(`Room type ${room.type} not found`);
          continue;
        }
        const roomId = roomData._id;
        const formData = new FormData();
        formData.append("roomNumber", room.number);
        formData.append(
          "unavailableDates",
          JSON.stringify([
            dateRange.startDate.toISOString(),
            dateRange.endDate.toISOString(),
          ])
        );

        const response = await axios.put(`/api/rooms/${roomId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!response.data.success) {
          console.error(
            `Failed to update room availability for ${room.type} ${room.number}: ${response.data.message}`
          );
          toast.error(`Failed to update availability for room ${room.number}`);
        } else {
          console.log(
            `Room ${room.number} marked as booked for the selected dates`
          );
        }
      } catch (error) {
        console.error(
          `Error updating room availability for ${room.type} ${room.number}:`,
          error
        );
        toast.error(
          `Error updating availability for room ${room.number}: ${error.message}`
        );
      }
    }
  };

  // Add loading check right after state declarations and before the main return
  if (loading) {
    return <AddBookingSkeleton />;
  }

  return (
    <section className="container-fluid py-5 bg-light addboookinggg">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Edit Guest</h1>
          </div>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="firstName">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    isInvalid={!!errors.firstName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="lastName">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    isInvalid={!!errors.lastName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="mobileNo">
                  <Form.Label>Mobile No *</Form.Label>
                  <div className="phone-input-container">
                    <PhoneInput
                      country={"in"}
                      value={formData.countryCode + formData.mobileNo}
                      onChange={handlePhoneChange}
                      inputProps={{
                        required: true,
                        placeholder: "Enter mobile number",
                        className: "form-control",
                      }}
                      onFocus={() => setIsCountryDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setIsCountryDropdownOpen(false), 200)
                      }
                      containerStyle={{
                        width: "100%",
                      }}
                      inputStyle={{
                        width: "100%",
                        height: "38px",
                        fontSize: "1rem",
                        paddingLeft: "48px",
                      }}
                      dropdownStyle={{
                        width: "300px",
                        maxHeight: "200px",
                        overflow: "auto",
                        overflowX: "hidden",
                        zIndex: 999,
                      }}
                      enableSearch={true}
                      disableSearchIcon={true}
                      searchPlaceholder="Search country..."
                      isInvalid={!!errors.mobileNo}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.mobileNo}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="gender">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender || ""} // Add fallback empty string
                    onChange={handleInputChange}
                    isInvalid={!!errors.gender}
                    required
                  >
                    <option value="" key="empty-gender">
                      Select gender
                    </option>
                    <option value="male" key="male">
                      Male
                    </option>
                    <option value="female" key="female">
                      Female
                    </option>
                    <option value="other" key="other">
                      Other
                    </option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.gender}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="dateOfBirth">
                  <Form.Label>Date of Birth *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="pe-5"
                      isInvalid={!!errors.dateOfBirth}
                      required
                    />
                    <FaCalendarAlt className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateOfBirth}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="email">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    isInvalid={!!errors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="nationality">
                  <Form.Label>Nationality *</Form.Label>
                  <ClientSelect
                    inputId="nationality-select"
                    name="nationality"
                    value={
                      formData.nationality
                        ? {
                            value: formData.nationality,
                            label: formData.nationality, // Use the full nationality name as both value and label
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      handleSelectCountryChange(selectedOption, {
                        name: "nationality",
                      })
                    }
                    options={countryOptions}
                    placeholder="Search and select country"
                    isClearable
                    isSearchable
                    loadOptions={loadCountryOptions}
                    noOptionsMessage={() => "No countries found"}
                    isInvalid={!!errors.nationality}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nationality}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="verificationDetails">
                  <Form.Label>Verification ID *</Form.Label>
                  <Form.Select
                    value={verificationType || ""}
                    onChange={handleSelectChange}
                    isInvalid={!!errors.verificationType}
                    required
                  >
                    <option value="" key="empty">
                      Select Verification ID
                    </option>
                    <option value="aadhar" key="aadhar">
                      Aadhar Number
                    </option>
                    <option value="passport" key="passport">
                      Passport Number
                    </option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.verificationType}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              {verificationType === "aadhar" && (
                <Col md={6}>
                  <Form.Group controlId="aadharNumber">
                    <Form.Label>Enter Aadhar Number *</Form.Label>
                    <Form.Control
                      type="number"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your Aadhar number"
                      isInvalid={!!errors.aadharNumber}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.aadharNumber}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}
              {verificationType === "passport" && (
                <Col md={6}>
                  <Form.Group controlId="passportNumber">
                    <Form.Label>Enter Passport Number *</Form.Label>
                    <Form.Control
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your Passport number"
                      isInvalid={!!errors.passportNumber}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.passportNumber}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}
              <Col md={12}>
                <Form.Group controlId="address">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    isInvalid={!!errors.address}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <hr className="h-px my-8 border-dashed border-gray-900 dark:border-gray-900" />
              {/* <Col md={6}>
                <label className="text-lg font-semibold mb-2 block">
                  Check In
                </label>
                <div className="d-flex align-items-center">
                  <div
                    className="border rounded-lg py-3 px-4 cursor-pointer hover:shadow-lg transition-all flex-grow-1 me-2"
                    onClick={toggleCalendar}
                  >
                    {dateRange[0].startDate.toDateString()}{" "}
                    <FaCalendarAlt className="float-right text-muted" />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <label className="text-lg font-semibold mb-2 block">
                  Check Out
                </label>
                <div className="d-flex align-items-center">
                  <div
                    className="border rounded-lg py-3 px-4 cursor-pointer hover:shadow-lg transition-all flex-grow-1 me-2"
                    onClick={toggleCalendar}
                  >
                    {dateRange[0].endDate.toDateString()}{" "}
                    <FaCalendarAlt className="float-right text-muted" />
                  </div>
                </div>
              </Col> */}
              {/* {showCalendar && (
                <div className="mt-6">
                  <DateRange
                    ranges={dateRange}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    rangeColors={["#4F46E5"]}
                    className="w-full"
                    disabledDates={unavailableDateRanges.flatMap((range) =>
                      Array.from(
                        {
                          length:
                            (range.end - range.start) / (24 * 60 * 60 * 1000) +
                            1,
                        },
                        (_, i) => addDays(range.start, i)
                      )
                    )}
                    isDayBlocked={isDateDisabled}
                  />
                </div>
              )}
              <Col md={6}>
                <Form.Group controlId="numberOfRooms">
                  <Form.Label>Number of Rooms</Form.Label>
                  <Form.Select
                    value={formData.numberOfRooms}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        numberOfRooms: value,
                      }));
                      setNumberOfRooms(value);
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Label>Number of Guests</Form.Label>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="dropdown-basic"
                    className="w-100"
                  >
                    <span role="img" aria-label="guest-icon">
                      👩‍👩‍👦‍👦
                    </span>{" "}
                    {totalGuests} guests
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ padding: "10px" }}>
                    <Row className="align-items-center mb-2">
                      <Col>Adults</Col>
                      <Col xs="auto">
                        <Button
                          variant="outline-secondary"
                          onClick={handleAdultDecrease}
                        >
                          -
                        </Button>
                      </Col>
                      <Col xs="auto">
                        <span>{adults}</span>
                      </Col>
                      <Col xs="auto">
                        <Button
                          variant="outline-secondary"
                          onClick={handleAdultIncrease}
                        >
                          +
                        </Button>
                      </Col>
                    </Row>
                    <Row className="align-items-center mb-2">
                      <Col>Children</Col>
                      <Col xs="auto">
                        <Button
                          variant="outline-secondary"
                          onClick={handleChildrenDecrease}
                        >
                          -
                        </Button>
                      </Col>
                      <Col xs="auto">
                        <span>{children}</span>
                      </Col>
                      <Col xs="auto">
                        <Button
                          variant="outline-secondary"
                          onClick={handleChildrenIncrease}
                        >
                          +
                        </Button>
                      </Col>
                    </Row>
                  </Dropdown.Menu>
                </Dropdown>
              </Col> */}
            </Row>
            {/* {selectedRooms.map((room, index) => (
              <Card key={index} className="mt-3 bg-light">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Image
                        src={room.mainImage || "/assets/img/rooms/rooms.png"}
                        alt={`${room.type} room`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover' }} // Replace objectFit prop with style
                        className="rounded"
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId={`roomType${index}`}>
                        <Form.Label>Room Type {index + 1}</Form.Label>
                        <Form.Select
                          value={room.type || ''}  // Add fallback empty string
                          onChange={(e) =>
                            handleRoomChange(index, "type", e.target.value)
                          }
                        >
                          <option value="" key="empty-room">Select room type</option>
                          {availableRooms.map((r) => (
                            <option key={`${r._id}-${r.name}`} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId={`roomNo${index}`}>
                        <Form.Label>Room No {index + 1}</Form.Label>
                        <Form.Select
                          value={room.number || ''} // Add fallback empty string
                          onChange={(e) =>
                            handleRoomChange(index, "number", e.target.value)
                          }
                        >
                          <option value="" key="empty-number">Select room number</option>
                          {availableRooms
                            .find((r) => r.name === room.type)
                            ?.roomNumbers.map((rn) => (
                              <option key={`${room.type}-${rn.number}`} value={rn.number}>
                                {rn.number}
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId={`price${index}`}>
                        <Form.Label>Price</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <Form.Control
                            type="number"
                            placeholder="Enter price"
                            value={room.price}
                            onChange={(e) =>
                              handleRoomChange(index, "price", e.target.value)
                            }
                            readOnly
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))} */}

            <Row className="mt-3">
              <Col md={6}>
                <Form.Group controlId="clientRequest">
                  <Form.Label>Client Request</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="clientRequest"
                    value={formData.clientRequest}
                    onChange={handleInputChange}
                    placeholder="Enter client request"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter additional notes"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mt-3">
                  <Form.Label>Upload Files</Form.Label>
                  <div
                    className={`border-2 border-dashed p-3 text-center ${
                      isDragging ? "drag-over" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Form.Control
                      type="file"
                      id="fileUpload"
                      className="d-none"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Form.Label
                      htmlFor="fileUpload"
                      className="mb-0 cursor-pointer"
                    >
                      <div className="uploadingcenter d-flex flex-column align-items-center justify-content-center">
                        <FaUpload className="display-4 text-muted mb-2" />
                        <p className="mb-0">Click to upload or drag and drop</p>
                        <p className="small text-muted">
                          Supported formats: JPEG, PNG, PDF, Word
                        </p>
                      </div>
                    </Form.Label>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mt-3">
                  <Form.Label>Uploaded Files</Form.Label>
                  {uploadedFiles.length > 0 ? (
                    <div className="list-group gap-3">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center "
                        >
                          <span>{file.name}</span>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeFile(file.name)}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No files uploaded yet.</p>
                  )}
                </Form.Group>
                {uploadProgress > 0 && (
                  <Form.Group className="mt-3">
                    <Form.Label>Uploading</Form.Label>
                    <div className="bg-light p-2 rounded">
                      <div className="d-flex align-items-center">
                        <span className="flex-grow-1">Uploading files...</span>
                        <ProgressBar
                          now={uploadProgress}
                          style={{ width: "50%", height: "20px" }}
                        />
                      </div>
                    </div>
                  </Form.Group>
                )}
                {uploadComplete && (
                  <div className="mt-2 alert alert-success" role="alert">
                    Load Complete!
                  </div>
                )}
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-4">
              <Button
                type="submit"
                className="me-2 bg-hotel-primary text-white"
              >
                Update Booking
              </Button>
              <Button
                className="bg-hotel-secondary-grey text-white"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      <Modal
        show={showAvailableDatesModal}
        onHide={() => setShowAvailableDatesModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Available Dates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableDates.map((room, index) => (
            <div key={index} className="mb-4">
              <h5>
                {room.type} - Room {room.number}
              </h5>
              <div className="d-flex flex-wrap">
                {room.availableDates.map((date, dateIndex) => (
                  <Badge key={dateIndex} bg="success" className="m-1">
                    {format(date, "yyyy-MM-dd")}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="bg-hotel-secondary-grey"
            onClick={() => setShowAvailableDatesModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
