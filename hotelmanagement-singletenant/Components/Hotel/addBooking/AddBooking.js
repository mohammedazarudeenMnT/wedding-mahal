"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Form,
  Card,
  ProgressBar,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import { FaCalendarAlt, FaTimes, FaUpload } from "react-icons/fa";
import { DateRange } from "react-date-range";
import {
  addDays,
  setHours,
  setMinutes,
  format,
  differenceInDays,
} from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import ClientSelect from "./ClientSelect.js"; // Import the ClientSelect component
import AddBookingSkeleton from "./AddBookingSkeleton"; // Import the skeleton component

import { countries } from "countries-list";
import ConfirmationModal from "../../ui/BookingConfirmationModal.jsx";
import { RadioGroup, Radio, Button } from "@nextui-org/react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import debounce from "lodash.debounce";

import { validationRules, validateField } from "../../../utils/validationUtils";

export default function AddGuest() {
  const [loading, setLoading] = useState(true); // Add loading state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

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
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    countryCode: "+91", // Changed: Added + prefix
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
  });
  const [countryOptions, setCountryOptions] = useState([]);
  const [totalAmount, setTotalAmount] = useState({
    roomCharge: 0,
    taxes: 0,
    additionalGuestCharge: 0,
    total: 0,
  });
  const [roomSettings, setRoomSettings] = useState({
    weekend: [],
    weekendPriceHike: 0,
  });

  const [priceBreakdown, setPriceBreakdown] = useState([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [paymentLink, setPaymentLink] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [errors, setErrors] = useState({});
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const countryTelCodes = Object.entries(countries).reduce(
    (acc, [code, country]) => {
      acc[country.name] = country.phone;
      return acc;
    },
    {}
  );
  const router = useRouter();

  const handleSelectCountryChange = useCallback((selectedOption, { name }) => {
    if (name === "nationality") {
      setFormData((prev) => ({
        ...prev,
        nationality: selectedOption ? selectedOption.label : "",
      }));
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (searchType, value) => {
      if (!value) return;

      try {
        setIsAutofilling(true);
        const response = await axios.get(
          `/api/guests/search?${searchType}=${value}`
        );

        if (response.data.success) {
          const guestData = response.data.guest;

          // Clean up mobile number that comes with country code
          let cleanMobileNo = guestData.mobileNo || "";
          let cleanCountryCode = "+91"; // Default country code

          // If mobile number starts with a country code pattern (+XX or +XXX)
          if (cleanMobileNo.startsWith("+")) {
            const matches = cleanMobileNo.match(/^\+(\d{1,3})/);
            if (matches) {
              cleanCountryCode = `+${matches[1]}`;
              // Remove the country code from the mobile number
              cleanMobileNo = cleanMobileNo.substring(
                cleanMobileNo.indexOf(matches[1]) + matches[1].length
              );
            }
          }

          // Remove any additional + symbols and duplicated country codes
          cleanMobileNo = cleanMobileNo.replace(/\+/g, "").replace(/^91/, "");

          // Update form data with cleaned values
          setFormData((prev) => ({
            ...prev,
            firstName:
              guestData.firstName || guestData.name?.split(" ")[0] || "",
            lastName:
              guestData.lastName ||
              guestData.name?.split(" ").slice(1).join(" ") ||
              "",
            email: guestData.email || prev.email,
            mobileNo: cleanMobileNo,
            countryCode: cleanCountryCode,
            gender: guestData.gender || "",
            dateOfBirth: guestData.dateOfBirth
              ? format(new Date(guestData.dateOfBirth), "yyyy-MM-dd")
              : "",
            nationality: guestData.nationality || "",
            address: guestData.address || "",
            aadharNumber:
              guestData.verificationType?.toLowerCase() === "aadhar"
                ? guestData.verificationId
                : "",
            passportNumber:
              guestData.verificationType?.toLowerCase() === "passport"
                ? guestData.verificationId
                : "",
          }));

          // Set verification type
          setVerificationType(guestData.verificationType?.toLowerCase() || "");

          // Handle file uploads
          if (guestData.uploadedFiles?.length > 0) {
            setUploadedFiles(
              guestData.uploadedFiles.map((file) => ({
                name: file.fileName,
                type: file.fileType,
                preview: file.fileUrl,
                file: null,
              }))
            );
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching guest data:", error);
        }
      } finally {
        setIsAutofilling(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const options = Object.entries(countries).map(([code, country]) => ({
      value: code,
      label: country.name,
      search: `${country.name} ${code} ${country.native}`.toLowerCase(),
    }));
    setCountryOptions(options);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [roomsResponse, settingsResponse] = await Promise.all([
          axios.get(`/api/rooms`),
          axios.get(`/api/settings/rooms`),
        ]);

        if (roomsResponse.data.success) {
          setRooms(roomsResponse.data.rooms);
        } else {
          console.error("Failed to fetch rooms");
        }

        const settingsData = settingsResponse.data.settings;
        setCheckInTime(settingsData.checkIn);
        setCheckOutTime(settingsData.checkOut);
        setRoomSettings({
          weekend: settingsData.weekend || [],
          weekendPriceHike: settingsData.weekendPriceHike || 0,
        });
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("email")) {
      const email = params.get("email");
      setFormData((prev) => ({
        ...prev,
        firstName: params.get("firstName") || "",
        lastName: params.get("lastName") || "",
        email: email || "",
        mobileNo: params.get("mobileNo") || "",
        notes: params.get("notes") || "",
      }));

      // Trigger guest search by email
      if (email) {
        debouncedSearch("email", email);
      }
    }
  }, [debouncedSearch]);

  const isRoomAvailableForDateRange = (roomNumber, startDate, endDate) => {
    // Check if room is in housekeeping (status is checkout or pending with null checkOut)
    const isInHousekeeping = roomNumber.bookeddates.some(
      (date) =>
        (date.status === "checkout" || date.status === "pending") &&
        date.checkOut === null
    );

    // If room is in housekeeping, it's not available
    if (isInHousekeeping) {
      return false;
    }

    // Check regular booking conflicts
    return !roomNumber.bookeddates.some((bookedDate) => {
      const bookedStart = bookedDate.checkIn
        ? new Date(bookedDate.checkIn)
        : null;
      const bookedEnd = bookedDate.checkOut
        ? new Date(bookedDate.checkOut)
        : null;

      if (bookedDate.status === "maintenance" && bookedStart) {
        return startDate >= bookedStart || endDate >= bookedStart;
      }

      return (
        (startDate >= bookedStart && startDate < bookedEnd) ||
        (endDate > bookedStart && endDate <= bookedEnd) ||
        (startDate <= bookedStart && endDate >= bookedEnd)
      );
    });
  };

  const filterAvailableRooms = () => {
    const startDate = dateRange[0].startDate;
    const endDate = dateRange[0].endDate;

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

    const available = rooms.reduce((acc, room) => {
      const availableRoomNumbers = room.roomNumbers.filter((rn) =>
        isRoomAvailableForDateRange(rn, adjustedStartDate, adjustedEndDate)
      );

      if (availableRoomNumbers.length > 0) {
        acc.push({
          ...room,
          roomNumbers: availableRoomNumbers,
        });
      }

      return acc;
    }, []);

    setAvailableRooms(available);
    setSelectedRooms(
      Array(numberOfRooms).fill({ type: "", number: "", price: "" })
    );
  };

  useEffect(() => {
    if (dateRange[0].startDate && dateRange[0].endDate && rooms.length > 0) {
      filterAvailableRooms();
    }
  }, [dateRange, rooms, checkInTime, checkOutTime]);

  useEffect(() => {
    setSelectedRooms(
      Array(numberOfRooms).fill({ type: "", number: "", price: "" })
    );
  }, [numberOfRooms]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    const error = validateField(name, value, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "email" && value.includes("@")) {
      debouncedSearch("email", value);
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

    if (phoneNumber.length >= 10) {
      debouncedSearch("phone", phoneNumber);
    }

    if (errors.mobileNo) {
      setErrors((prev) => ({ ...prev, mobileNo: null }));
    }
  };

  const handleAdultIncrease = () => setAdults(adults + 1);
  const handleAdultDecrease = () => adults > 1 && setAdults(adults - 1);
  const handleChildrenIncrease = () => setChildren(children + 1);
  const handleChildrenDecrease = () =>
    children > 0 && setChildren(children - 1);

  const totalGuests = adults + children;

  const handleSelectChange = (e) => {
    setVerificationType(e.target.value);
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

    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      setShowCalendar(false);
    }
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

  const calculateRoomPrice = (room, date, roomSettings) => {
    const dayOfWeek = format(date, "EEE");
    const isWeekendDay = roomSettings.weekend.includes(dayOfWeek);
    if (isWeekendDay) {
      const hikePercentage = 1 + roomSettings.weekendPriceHike / 100;
      return parseFloat(room.price) * hikePercentage;
    }
    return parseFloat(room.price);
  };

  const calculateTotalAmount = () => {
    if (selectedRooms.some((room) => !room.type || !room.number || !room.price))
      return;

    const checkInDate = new Date(dateRange[0].startDate);
    const checkOutDate = new Date(dateRange[0].endDate);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) return;

    let priceBreakdownArray = [];
    let totalRoomCharge = 0;
    let totalTaxes = 0;
    let totalAdditionalCharge = 0;

    const totalCapacity = selectedRooms.reduce(
      (sum, room) => sum + (room.maxGuests || 2),
      0
    );
    const totalExtraGuests = Math.max(0, totalGuests - totalCapacity);

    const highestAdditionalGuestCost = Math.max(
      ...selectedRooms.map((room) => parseFloat(room.additionalGuestCosts || 0))
    );

    const additionalChargePerNight =
      totalExtraGuests * highestAdditionalGuestCost;

    selectedRooms.forEach((room, roomIndex) => {
      let roomTotalAmount = 0;

      for (let i = 0; i < nights; i++) {
        const currentDate = addDays(checkInDate, i);
        const basePrice = calculateRoomPrice(room, currentDate, roomSettings);
        const igst = basePrice * (parseFloat(room.igst) / 100);

        const roomAdditionalCharge =
          roomIndex === 0 ? additionalChargePerNight : 0;

        totalRoomCharge += basePrice;
        totalTaxes += igst;

        roomTotalAmount += basePrice + igst + roomAdditionalCharge;

        priceBreakdownArray.push({
          date: currentDate,
          roomType: room.type,
          roomNumber: room.number,
          roomCharge: basePrice,
          taxes: igst,
          additionalCharge: roomAdditionalCharge,
          total: basePrice + igst + roomAdditionalCharge,
          isWeekend: roomSettings.weekend.includes(format(currentDate, "EEE")),
        });
      }

      room.totalAmount = roomTotalAmount;

      if (roomIndex === 0) {
        totalAdditionalCharge += additionalChargePerNight * nights;
      }
    });

    const total = totalRoomCharge + totalTaxes + totalAdditionalCharge;

    setTotalAmount({
      roomCharge: totalRoomCharge,
      taxes: totalTaxes,
      additionalGuestCharge: totalAdditionalCharge,
      total: total,
    });

    setPriceBreakdown(priceBreakdownArray);
  };

  useEffect(() => {
    if (
      selectedRooms.length > 0 &&
      dateRange[0].startDate &&
      dateRange[0].endDate
    ) {
      calculateTotalAmount();
    }
  }, [
    selectedRooms,
    dateRange,
    adults,
    children,
    checkInTime,
    checkOutTime,
    roomSettings,
  ]);

  const handleRoomChange = (index, field, value) => {
    const newSelectedRooms = [...selectedRooms];
    newSelectedRooms[index] = { ...newSelectedRooms[index], [field]: value };

    if (field === "type" || field === "number") {
      const selectedRoomType = availableRooms.find(
        (r) => r.name === newSelectedRooms[index].type
      );
      if (selectedRoomType) {
        const nights = Math.max(
          1,
          differenceInDays(dateRange[0].endDate, dateRange[0].startDate)
        );
        let totalRoomAmount = 0;

        for (let i = 0; i < nights; i++) {
          const currentDate = addDays(new Date(dateRange[0].startDate), i);
          const basePrice = parseFloat(selectedRoomType.price) || 0;
          const igst =
            basePrice * (parseFloat(selectedRoomType.igst) / 100) || 0;
          const additionalGuestCost =
            index === 0
              ? Math.max(0, totalGuests - selectedRoomType.maxGuests) *
                parseFloat(selectedRoomType.additionalGuestCosts || 0)
              : 0;

          const dailyAmount =
            calculateRoomPrice(selectedRoomType, currentDate, roomSettings) +
            igst +
            additionalGuestCost;
          totalRoomAmount += dailyAmount;
        }

        newSelectedRooms[index] = {
          ...newSelectedRooms[index],
          price: parseFloat(selectedRoomType.price),
          _id: selectedRoomType._id,
          mainImage:
            selectedRoomType.mainImage || "/assets/img/rooms/rooms.png",
          igst: parseFloat(selectedRoomType.igst) || 0,
          additionalGuestCosts:
            parseFloat(selectedRoomType.additionalGuestCosts) || 0,
          maxGuests: parseInt(selectedRoomType.maxGuests) || 2,
          nights: nights,
          totalAmount: totalRoomAmount,
        };
      }
    }

    setSelectedRooms(newSelectedRooms);
    setTimeout(() => calculateTotalAmount(), 0);
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (validationRules[field]) {
        const error = validateField(field, formData[field], validationRules);
        if (error) newErrors[field] = error;
      }
    });

    if (!verificationType) {
      newErrors.verificationType = "Please select a verification type";
    }

    if (verificationType === "aadhar" && !formData.aadharNumber) {
      newErrors.aadharNumber = "Aadhar number is required";
    }

    if (verificationType === "passport" && !formData.passportNumber) {
      newErrors.passportNumber = "Passport number is required";
    }

    if (selectedRooms.some((room) => !room.type || !room.number)) {
      newErrors.rooms = "Please select all room types and numbers";
    }

    if (!dateRange[0].startDate || !dateRange[0].endDate) {
      newErrors.dateRange = "Please select check-in and check-out dates";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyCurrentAvailability = async (
    selectedRooms,
    checkInDate,
    checkOutDate
  ) => {
    try {
      const response = await axios.get(`/api/rooms`);
      if (!response.data.success) {
        throw new Error("Failed to verify room availability");
      }

      const currentRooms = response.data.rooms;
      const unavailableRooms = [];

      for (const selectedRoom of selectedRooms) {
        const roomType = currentRooms.find((r) => r._id === selectedRoom._id);
        if (!roomType) {
          throw new Error(`Room type ${selectedRoom.type} no longer exists`);
        }

        const roomNumber = roomType.roomNumbers.find(
          (r) => r.number === selectedRoom.number
        );
        if (!roomNumber) {
          throw new Error(
            `Room number ${selectedRoom.number} no longer exists`
          );
        }

        const isAvailable = isRoomAvailableForDateRange(
          roomNumber,
          checkInDate,
          checkOutDate
        );

        if (!isAvailable) {
          unavailableRooms.push(selectedRoom.number);
        }
      }

      if (unavailableRooms.length > 0) {
        throw new Error(
          `Rooms ${unavailableRooms.join(
            ", "
          )} are no longer available. Please select different rooms.`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const checkInDate = new Date(dateRange[0].startDate);
      const checkOutDate = new Date(dateRange[0].endDate);

      await verifyCurrentAvailability(selectedRooms, checkInDate, checkOutDate);

      setIsConfirmationModalOpen(true);
    } catch (error) {
      toast.error(error.message || "Error checking room availability");
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setIsProcessing(true);
      const checkInDate = new Date(dateRange[0].startDate);
      const checkOutDate = new Date(dateRange[0].endDate);

      await verifyCurrentAvailability(selectedRooms, checkInDate, checkOutDate);
    } catch (error) {
      toast.error(error.message || "Error processing booking");
      setIsConfirmationModalOpen(false);
      return;
    } finally {
      setIsProcessing(false);
    }

    const bookingFormData = new FormData();

    const completeFormData = {
      ...formData,
      mobileNo: `${formData.countryCode}${formData.mobileNo}`,
    };

    Object.entries(completeFormData).forEach(([key, value]) => {
      bookingFormData.append(key, value.toString());
    });

    bookingFormData.append("totalAmount", JSON.stringify(totalAmount));

    bookingFormData.append(
      "rooms",
      JSON.stringify(
        selectedRooms.map((room, index) => ({
          type: room.type,
          number: room.number,
          price: parseFloat(room.price) || 0,
          _id: room._id,
          mainImage: room.mainImage || "/assets/img/rooms/rooms.png",
          igst: parseFloat(room.igst) || 0,
          additionalGuestCharge:
            index === 0 ? totalAmount.additionalGuestCharge : 0,
          totalAmount: room.totalAmount,
        }))
      )
    );

    const checkInDate = new Date(dateRange[0].startDate);
    checkInDate.setHours(
      checkInTime.split(":")[0],
      checkInTime.split(":")[1],
      0,
      0
    );
    const formattedCheckInDate = checkInDate.toISOString();

    const checkOutDate = new Date(dateRange[0].endDate);
    checkOutDate.setHours(
      checkOutTime.split(":")[0],
      checkOutTime.split(":")[1],
      0,
      0
    );
    const formattedCheckOutDate = checkOutDate.toISOString();

    bookingFormData.append("checkInDate", formattedCheckInDate);
    bookingFormData.append("checkOutDate", formattedCheckOutDate);

    const guestsData = {
      adults: Number.isNaN(adults) ? 0 : adults,
      children: Number.isNaN(children) ? 0 : children,
    };
    bookingFormData.append("guests", JSON.stringify(guestsData));

    bookingFormData.append(
      "roomNumbers",
      selectedRooms.map((room) => room.number).join(",")
    );

    bookingFormData.append("clientRequests", formData.clientRequest);
    bookingFormData.append("notes", formData.notes);

    bookingFormData.append("verificationType", verificationType);
    if (verificationType === "aadhar") {
      bookingFormData.append("verificationId", formData.aadharNumber);
    } else if (verificationType === "passport") {
      bookingFormData.append("verificationId", formData.passportNumber);
    }

    uploadedFiles.forEach((fileObj) => {
      bookingFormData.append("uploadedFiles", fileObj.file);
    });
    bookingFormData.append("paymentMethod", paymentMethod);

    try {
      if (paymentMethod === "paymentLink") {
        const linkResponse = await axios.post(
          `/api/bookings/create-razorpay-payment-link`,
          {
            amount: totalAmount.total,
            currency: "INR",
            customer: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              contact: formData.mobileNo,
            },
          }
        );

        if (linkResponse.data.success) {
          setPaymentLink(linkResponse.data.paymentLink);
          bookingFormData.append(
            "razorpayPaymentLinkId",
            linkResponse.data.paymentLinkId
          );

          await pollPaymentStatus(
            linkResponse.data.paymentLinkId,
            bookingFormData
          );
        } else {
          toast.error("Failed to generate payment link.");
          return;
        }
      } else if (paymentMethod === "cod") {
        await setPaymentStatus("completed");

        await bookingFormData.append("paymentStatus", "completed");
        await createBooking(bookingFormData);
      }

      setIsConfirmationModalOpen(false);
    } catch (error) {
      console.error("Error processing booking:", error);
      toast.error("An error occurred while processing the booking.");
    }
  };

  const pollPaymentStatus = async (paymentLinkId, bookingFormData) => {
    const maxAttempts = 60;
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(
          `/api/bookings/check-payment-status/${paymentLinkId}`
        );

        if (statusResponse.data.status === "paid") {
          await clearInterval(pollInterval);
          await setPaymentStatus("completed");
          await bookingFormData.append("paymentStatus", "completed");
          await createBooking(bookingFormData);
        } else if (
          statusResponse.data.status === "cancelled" ||
          statusResponse.data.status === "expired"
        ) {
          clearInterval(pollInterval);
          toast.error("Payment was cancelled or expired. Please try again.");
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          toast.error("Payment time expired. Please try again.");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000);
  };

  const createBooking = async (bookingFormData) => {
    try {
      const response = await axios.post(
        `/api/bookings/addbooking`,
        bookingFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const result = response.data;

      if (result.success) {
        toast.success(result.message);
        router.push(`/dashboard/bookings`);
        if (result.emailSent) {
          toast.info("Confirmation email sent to guest");
        } else {
          toast.warn(
            "Booking successful, but failed to send confirmation email"
          );
        }

        resetForm();
        setAvailableRooms([]);
        setSelectedRooms([{ type: "", number: "", price: "", mainImage: "" }]);
        setPriceBreakdown([]);
        setTotalAmount({
          roomCharge: 0,
          taxes: 0,
          additionalGuestCharge: 0,
          total: 0,
        });

        if (dateRange[0].startDate && dateRange[0].endDate) {
          filterAvailableRooms();
        }
      } else {
        toast.error("Booking failed: " + result.message);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("An error occurred while creating the booking.");
    }
  };

  const resetForm = () => {
    setFormData({
      bookingNumber: "",
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
    });
    setSelectedRooms([{ type: "", number: "", price: "" }]);
    setUploadedFiles([]);
    setAdults(1);
    setChildren(0);
    setDateRange([
      {
        startDate: new Date(),
        endDate: addDays(new Date(), 1),
        key: "selection",
      },
    ]);
    setVerificationType("");
    setAvailableRooms([]);
    setPaymentStatus("pending");
    setPaymentLink("");
  };

  if (loading) {
    return <AddBookingSkeleton />;
  }
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <section className="container-fluid py-5 bg-light addboookinggg">
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h2 mb-0">Add Guest</h1>
            </div>
            <Form onSubmit={handleSubmit}>
              {isAutofilling && (
                <div className="mb-3 text-blue-600">
                  <Spinner size="sm" className="mr-2" />
                  Searching for guest information...
                </div>
              )}
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
                    <Form.Label>Mobile No</Form.Label>
                    <div
                      className={`custom-input ${
                        errors.mobileNo ? "error" : ""
                      }`}
                    >
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
                            setTimeout(
                              () => setIsCountryDropdownOpen(false),
                              200
                            )
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
                        />
                      </div>
                    </div>
                    {isCountryDropdownOpen && (
                      <div className="country-list-backdrop" />
                    )}
                    {errors.mobileNo && (
                      <Form.Control.Feedback
                        type="invalid"
                        style={{ display: "block" }}
                      >
                        {errors.mobileNo}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="gender">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      isInvalid={!!errors.gender}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.gender}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="dateOfBirth">
                    <Form.Label>Date of Birth</Form.Label>
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
                    <Form.Label>Nationality</Form.Label>
                    <ClientSelect
                      inputId="nationality-select"
                      name="nationality"
                      value={countryOptions.find(
                        (country) => country.label === formData.nationality
                      )}
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
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.nationality}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="verificationDetails">
                    <Form.Label>Verification ID</Form.Label>
                    <Form.Select
                      value={verificationType || ""}
                      onChange={handleSelectChange}
                      isInvalid={!!errors.verificationType}
                      required
                    >
                      <option value="">Select Verification ID</option>
                      <option value="aadhar">Aadhar Number</option>
                      <option value="passport">Passport Number</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.verificationType}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                {verificationType === "aadhar" && (
                  <Col md={6}>
                    <Form.Group controlId="aadharNumber">
                      <Form.Label>Enter Aadhar Number</Form.Label>
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
                      <Form.Label>Enter Passport Number</Form.Label>
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
                    <Form.Label>Address</Form.Label>
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
                <Col md={6}>
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
                </Col>
                {showCalendar && (
                  <div className="mt-6">
                    <DateRange
                      ranges={dateRange}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      rangeColors={["#4F46E5"]}
                      className="w-full"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateRange}
                    </Form.Control.Feedback>
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
                      {[
                        ...Array(
                          Math.min(
                            5,
                            availableRooms.reduce(
                              (sum, room) => sum + room.roomNumbers.length,
                              0
                            )
                          )
                        ),
                      ].map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {idx + 1}
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
                </Col>
              </Row>
              {selectedRooms.map((room, index) => (
                <Card key={index} className="mt-3 bg-light">
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group controlId={`roomType${index}`}>
                          <Form.Label>Room Type {index + 1}</Form.Label>
                          <Form.Select
                            value={room.type}
                            onChange={(e) =>
                              handleRoomChange(index, "type", e.target.value)
                            }
                            isInvalid={!!errors.rooms}
                          >
                            <option value="">Select room type</option>
                            {availableRooms.map((r) => (
                              <option key={r._id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.rooms}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId={`roomNo${index}`}>
                          <Form.Label>Room No {index + 1}</Form.Label>
                          <Form.Select
                            value={room.number}
                            onChange={(e) =>
                              handleRoomChange(index, "number", e.target.value)
                            }
                            isInvalid={!!errors.rooms}
                          >
                            <option value="">Select room number</option>
                            {availableRooms
                              .find((r) => r.name === room.type)
                              ?.roomNumbers.map((rn) => (
                                <option key={rn.number} value={rn.number}>
                                  {rn.number}
                                </option>
                              ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.rooms}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
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
              ))}
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
                          <p className="mb-0">
                            Click to upload or drag and drop
                          </p>
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
                          <span className="flex-grow-1">
                            Uploading files...
                          </span>
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
                      Upload Complete!
                    </div>
                  )}
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId="paymentMethod">
                    <Form.Label>Payment Method</Form.Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <Radio
                        value="paymentLink"
                        color="success"
                        className="mb-2"
                      >
                        Pay via Payment Link
                      </Radio>
                      <Radio value="cod" color="success">
                        Pay at Hotel
                      </Radio>
                    </RadioGroup>
                  </Form.Group>
                </Col>
              </Row>
              {paymentLink && (
                <Row className="mt-3">
                  <Col md={6}>
                    <div className="alert alert-info">
                      <h3 className="mb-3">Payment Link Generated</h3>
                      <p>
                        A payment link has been generated and will be sent to
                        the provided email address. You can also click the
                        button below to open the payment link in a new tab.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => window.open(paymentLink, "_blank")}
                      >
                        Open Payment Link
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="submit"
                  className="me-2 bg-hotel-primary text-white"
                >
                  Save Guest
                </Button>
                <Button
                  color="secondary"
                  type="button"
                  onClick={resetForm}
                  className="bg-hotel-secondary-grey text-white"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={handleConfirmBooking}
          priceBreakdown={priceBreakdown}
          totalAmount={totalAmount}
          roomSettings={roomSettings}
          dateRange={dateRange}
          isProcessing={isProcessing}
        />
      </section>
    </>
  );
}
