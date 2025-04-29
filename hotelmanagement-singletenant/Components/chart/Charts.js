"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../Components/ui/card";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import axios from "axios";
import { SimpleCalendar } from "./SimpleCalendar";

// Remove the static revenueData constant and add these utility functions
const getLastNMonths = (n) => {
  const months = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(format(date, "MMM yyyy"));
  }
  return months;
};

const calculateMonthlyRevenue = (bookings, months) => {
  const monthlyRevenue = {};

  // Initialize all months with zero revenue
  months.forEach((month) => {
    monthlyRevenue[month] = 0;
  });

  // Calculate revenue for each booking
  bookings.forEach((booking) => {
    if (booking.status === "checkout" && booking.totalAmount) {
      const bookingMonth = format(new Date(booking.checkOutDate), "MMM yyyy");
      if (monthlyRevenue.hasOwnProperty(bookingMonth)) {
        // Add the total amount from the booking
        monthlyRevenue[bookingMonth] += booking.totalAmount.total || 0;
      }
    }
  });

  // Convert to array format for the chart
  return months.map((month) => ({
    month,
    revenue: monthlyRevenue[month],
  }));
};

// Add a utility function for consistent number formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    maximumSignificantDigits: 8,
    style: "decimal",
  }).format(amount);
};

// Add this utility function to generate dates between two dates
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  let currentDate = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return dates;
};

// Add this utility function to group dates by week
const groupDatesByWeek = (dates) => {
  const weeks = {};
  dates.forEach((date) => {
    const weekStart = startOfWeek(new Date(date.date));
    const weekKey = format(weekStart, "MMM dd");
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        weekLabel: `${format(weekStart, "MMM dd")}`,
        booked: 0,
        available: 0,
        checkIn: 0,
        notReady: 0,
        date: weekKey,
      };
    }
    weeks[weekKey].booked += date.booked;
    weeks[weekKey].available = Math.max(
      date.available,
      weeks[weekKey].available
    );
    weeks[weekKey].checkIn += date.checkIn;
    weeks[weekKey].notReady += date.notReady;
  });
  return Object.values(weeks);
};

// First, update the calculateYAxisTicks function to be more precise
const calculateYAxisTicks = (maxValue) => {
  // Find the order of magnitude
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));

  // Round up maxValue to next significant number
  const roundedMax = Math.ceil(maxValue / orderOfMagnitude) * orderOfMagnitude;

  // Calculate nice interval
  const roughInterval = roundedMax / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const normalizedInterval = Math.ceil(roughInterval / magnitude) * magnitude;

  // Generate ticks
  const ticks = Array.from({ length: 5 }, (_, i) => i * normalizedInterval);

  return {
    ticks,
    domainMax: ticks[ticks.length - 1],
  };
};

// First, add this new component above your Charts component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
    <svg
      className="w-16 h-16 text-gray-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
    <h3 className="text-base font-medium text-gray-900 mb-1">
      No Rooms Available
    </h3>
    <p className="text-sm text-gray-500">
      There are no rooms configured for this hotel.
    </p>
  </div>
);
/* const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
    <svg 
      className="w-16 h-16 text-gray-300 mb-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    </svg>
    <h3 className="text-base font-medium text-gray-900 mb-1">No bookings found</h3>
    <p className="text-sm text-gray-500">
      There are no bookings for the selected date range.
    </p>
  </div>
); */

// First, add this utility function after your other utility functions

export default function Charts() {
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState("this-week");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const selectTriggerRef = useRef(null); // Ref for the Select Trigger
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [maxRooms, setMaxRooms] = useState(0);
  const [todayRoomStats, setTodayRoomStats] = useState({
    checkIn: 0,
    booked: 0,
    available: 0,
    notReady: 0,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState("last-6-months");

  // Fetch bookings data using hotelDb
  useEffect(() => {
    fetchData();
  }, [selectedDateRange, customDateRange, revenuePeriod]); // Add date range dependencies

  // Modify the fetchData function
  const fetchData = async () => {
    try {
      const [bookingsResponse, roomsResponse, housekeepingResponse] =
        await Promise.all([
          axios.get(`/api/bookings`),
          axios.get(`/api/rooms`),
          axios.get(`/api/houseKeeping`),
        ]);

      if (bookingsResponse.data.success && roomsResponse.data.rooms) {
        const rooms = roomsResponse.data.rooms;
        const totalRooms = rooms.reduce((total, room) => {
          return total + room.roomNumbers.length;
        }, 0);

        // Calculate revenue data
        const months = getLastNMonths(revenuePeriod === "last-year" ? 12 : 6); // Get last 6 months
        const revenueData = calculateMonthlyRevenue(
          bookingsResponse.data.bookings,
          months
        );
        setRevenue(revenueData);

        // Calculate not ready rooms
        const notReadyCount = housekeepingResponse.data.tasks.filter(
          (task) =>
            task.status !== "completed" &&
            (task.status === "pending" ||
              task.status === "maintenance" ||
              task.status === "in-progress")
        ).length;

        const today = new Date();
        const todayString = today.toISOString().split("T")[0];

        const checkInCount = bookingsResponse.data.bookings.reduce(
          (count, booking) => {
            const isToday =
              new Date(booking.checkInDate).toISOString().split("T")[0] ===
              todayString;
            if (
              booking.status === "checkin" ||
              (isToday && booking.status === "booked")
            ) {
              return count + booking.numberOfRooms;
            }
            return count;
          },
          0
        );

        const formattedData = formatBookingsData(
          bookingsResponse.data.bookings,
          totalRooms,
          notReadyCount,
          checkInCount
        );

        setBookings(formattedData.bookings);
        setMaxRooms(totalRooms);
        setTodayRoomStats(
          calculateTodayRoomStats(
            formattedData.bookings,
            totalRooms,
            notReadyCount,
            checkInCount
          )
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Update formatBookingsData function
  const formatBookingsData = (
    rawBookings,
    totalRooms,
    notReadyCount,
    checkInCount
  ) => {
    const bookingsByDate = {};
    const today = startOfDay(new Date());
    const todayString = format(today, "MMM dd, yyyy");

    // Initialize today's data
    bookingsByDate[todayString] = {
      date: todayString,
      booked: 0,
      checkIn: checkInCount,
      notReady: notReadyCount,
      available: totalRooms - checkInCount - notReadyCount,
    };

    // Process bookings
    rawBookings.forEach((booking) => {
      const bookingDate = format(new Date(booking.checkInDate), "MMM dd, yyyy");

      if (!bookingsByDate[bookingDate]) {
        bookingsByDate[bookingDate] = {
          date: bookingDate,
          booked: 0,
          checkIn: 0,
          notReady: 0,
          available: totalRooms,
        };
      }

      if (booking.status === "booked") {
        bookingsByDate[bookingDate].booked += booking.numberOfRooms;
        // Recalculate available rooms
        bookingsByDate[bookingDate].available = Math.max(
          0,
          totalRooms -
            bookingsByDate[bookingDate].booked -
            bookingsByDate[bookingDate].checkIn -
            bookingsByDate[bookingDate].notReady
        );
      }
    });

    return {
      bookings: Object.values(bookingsByDate),
      maxRooms: totalRooms,
    };
  };

  // Update calculateTodayRoomStats function
  const calculateTodayRoomStats = (
    bookings,
    totalRooms,
    notReadyCount,
    checkInCount
  ) => {
    const today = new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const todayData = bookings.find((booking) => booking.date === today) || {
      checkIn: checkInCount, // Use checkInCount directly
      booked: 0,
      available: totalRooms,
      notReady: notReadyCount,
    };

    // Calculate available rooms after subtracting all other statuses
    const available = Math.max(
      0,
      totalRooms -
        checkInCount - // Use checkInCount instead of todayData.checkIn
        (todayData.booked || 0) -
        notReadyCount
    );

    return {
      checkIn: checkInCount, // Use checkInCount
      booked: todayData.booked || 0,
      notReady: notReadyCount,
      available: available,
      totalRooms,
    };
  };

  // Update filterDataByDateRange function
  const filterDataByDateRange = (data, dateRange) => {
    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);
    const allDates = getDatesBetween(start, end);
    const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Map all dates with their booking data
    const datesWithData = allDates.map((date) => {
      const dateString = format(date, "MMM dd, yyyy");
      const existingData = data.find((item) => item.date === dateString);

      if (existingData) {
        // Calculate available rooms correctly
        const bookedRooms = existingData.booked || 0;
        const checkedInRooms = existingData.checkIn || 0;
        const notReadyRooms = existingData.notReady || 0;
        const availableRooms = Math.max(
          0,
          maxRooms - bookedRooms - checkedInRooms - notReadyRooms
        );

        return {
          ...existingData,
          available: availableRooms,
        };
      }

      // Default values for dates without bookings
      return {
        date: dateString,
        booked: 0,
        checkIn: 0,
        notReady: 0,
        available: maxRooms,
      };
    });

    // Group by week if needed
    if (daysDifference > 14 && selectedDateRange === "custom") {
      const weeklyData = groupDatesByWeek(datesWithData);
      return weeklyData.map((week) => ({
        ...week,
        available: Math.max(
          0,
          maxRooms - week.booked - week.checkIn - week.notReady
        ),
      }));
    }

    return datesWithData;
  };

  const handleDateRangeChange = (value) => {
    if (value === "custom") {
      setIsCalendarOpen(true);
    } else {
      setSelectedDateRange(value);
    }
  };

  const handleDateSelect = (dateRange) => {
    setCustomDateRange(dateRange);
    setSelectedDateRange("custom");
    setAppliedDateRange(dateRange); // Set the applied date range
    setIsCalendarOpen(false);
  };

  // Add a function to format the date range display
  const getDateRangeDisplay = () => {
    if (selectedDateRange === "custom" && appliedDateRange) {
      return `${format(appliedDateRange.from, "MMM dd")} - ${format(
        appliedDateRange.to,
        "MMM dd"
      )}`;
    }
    return selectedDateRange.replace(/-/g, " "); // Format other options
  };

  const getDateRange = () => {
    const today = new Date();
    switch (selectedDateRange) {
      case "today":
        return {
          from: startOfDay(today),
          to: endOfDay(today),
        };
      case "this-week":
        return {
          from: startOfWeek(today),
          to: endOfWeek(today),
        };
      case "next-week":
        const nextWeekStart = addDays(startOfWeek(today), 7);
        return {
          from: nextWeekStart,
          to: endOfWeek(nextWeekStart),
        };
      case "custom":
        return (
          customDateRange || {
            from: startOfDay(today),
            to: endOfDay(today),
          }
        );
      default:
        return {
          from: startOfWeek(today),
          to: endOfWeek(today),
        };
    }
  };

  useEffect(() => {
    const dateRange = getDateRange();
    const filtered = filterDataByDateRange(bookings, dateRange);
    setFilteredBookings(filtered);
    if (isDatePickerOpen && selectTriggerRef.current) {
      const rect = selectTriggerRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + window.scrollY, // Position below the select
        left: rect.left + window.scrollX, // Align horizontally
      });
    }
  }, [
    selectedDateRange,
    customDateRange,
    bookings,
    isDatePickerOpen,
    maxRooms,
  ]);

  const calculateRoomPercentages = (stats) => {
    const total =
      stats.checkIn + stats.booked + stats.available + stats.notReady;
    return {
      checkIn: (stats.checkIn / total) * 100,
      booked: (stats.booked / total) * 100,
      available: (stats.available / total) * 100,
      notReady: (stats.notReady / total) * 100,
    };
  };

  const roomPercentages = calculateRoomPercentages(todayRoomStats);

  // Update where you display revenue amounts
  const RevenueDisplay = () => {
    const totalRevenue = revenue.reduce((sum, month) => sum + month.revenue, 0);

    return (
      <div className="text-xl font-bold">₹{formatCurrency(totalRevenue)}</div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Availability Card */}
        <Card className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Room Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Progress Bar Container */}
            <div className="relative">
              <div
                className="flex h-12 md:h-12 w-full rounded-lg overflow-hidden shadow-inner bg-gray-50"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = (x / rect.width) * 100;

                  // Find which section the mouse is over
                  let currentSection;
                  let currentValue;

                  if (percentage <= roomPercentages.checkIn) {
                    currentSection = "Occupied";
                    currentValue = todayRoomStats.checkIn;
                  } else if (
                    percentage <=
                    roomPercentages.checkIn + roomPercentages.booked
                  ) {
                    currentSection = "Booked";
                    currentValue = todayRoomStats.booked;
                  } else if (
                    percentage <=
                    roomPercentages.checkIn +
                      roomPercentages.booked +
                      roomPercentages.available
                  ) {
                    currentSection = "Available";
                    currentValue = todayRoomStats.available;
                  } else {
                    currentSection = "Not Ready";
                    currentValue = todayRoomStats.notReady;
                  }

                  // Show tooltip
                  const tooltip = document.getElementById(
                    "room-availability-tooltip"
                  );
                  if (tooltip) {
                    tooltip.style.display = "block";
                    tooltip.style.left = `${e.clientX}px`;
                    tooltip.style.top = `${e.clientY - 40}px`;
                    tooltip.innerHTML = `
                      <div class="font-medium">${currentSection}</div>
                      <div class="text-sm">${currentValue} Rooms</div>
                    `;
                  }
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById(
                    "room-availability-tooltip"
                  );
                  if (tooltip) {
                    tooltip.style.display = "none";
                  }
                }}
              >
                <div
                  className="bg-hotel-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${roomPercentages.checkIn}%` }}
                />
                <div
                  className="bg-hotel-secondary-grey transition-all duration-300 ease-in-out"
                  style={{ width: `${roomPercentages.booked}%` }}
                />
                <div
                  className="bg-hotel-primary-green transition-all duration-300 ease-in-out"
                  style={{ width: `${roomPercentages.available}%` }}
                />
                <div
                  className="bg-hotel-primary-red transition-all duration-300 ease-in-out"
                  style={{ width: `${roomPercentages.notReady}%` }}
                />
              </div>

              {/* Add the tooltip element */}
              <div
                id="room-availability-tooltip"
                className="fixed z-50 hidden bg-white px-3 py-2 rounded-md shadow-lg border border-gray-200 pointer-events-none transform -translate-x-1/2"
                style={{
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* Occupied */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="h-12 w-1.5 bg-hotel-primary rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">
                    Occupied
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {todayRoomStats.checkIn}
                  </div>
                </div>
              </div>

              {/* Booked */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="h-12 w-1.5 bg-[#6B7280] rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">
                    Booked
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {todayRoomStats.booked}
                  </div>
                </div>
              </div>

              {/* Available */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="h-12 w-1.5 bg-[#25D366] rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">
                    Available
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {todayRoomStats.available}
                    <span className="text-sm text-gray-500 ml-2">
                      ({todayRoomStats.totalRooms} total)
                    </span>
                  </div>
                </div>
              </div>

              {/* Not Ready */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="h-12 w-1.5 bg-red-500 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">
                    Not Ready
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {todayRoomStats.notReady}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Bookings
              </CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {/* Only Booked and Available */}
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-[#6B7280]" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-[#25D366]" />
                  <span>Available</span>
                </div>
              </div>
            </div>
            <Select
              value={selectedDateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger
                ref={selectTriggerRef}
                className="w-[180px] bg-[#EFF6FF]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue>{getDateRangeDisplay()}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="next-week">Next week</SelectItem>
                <SelectItem value="custom">
                  {selectedDateRange === "custom" && appliedDateRange
                    ? `${format(appliedDateRange.from, "MMM dd")} - ${format(
                        appliedDateRange.to,
                        "MMM dd"
                      )}`
                    : "Custom"}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            {/* {filteredBookings.length > 0 ? ( */}
            {maxRooms > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredBookings}
                  margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  barSize={50}
                >
                  {/* Green dotted horizontal lines, no vertical lines */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#10B981"
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      // For this-week and next-week, show day and date
                      if (
                        selectedDateRange === "this-week" ||
                        selectedDateRange === "next-week"
                      ) {
                        return format(date, "EEE dd");
                      }
                      // For custom ranges, keep the week format
                      return value;
                    }}
                    interval={
                      selectedDateRange === "custom" ? 0 : "preserveStartEnd"
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    ticks={Array.from({ length: maxRooms + 1 }, (_, i) => i)}
                    domain={[0, maxRooms]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #ccc",
                    }}
                    formatter={(value, name) => [
                      value,
                      name === "booked" ? "Booked" : "Available",
                    ]}
                    labelFormatter={(label) => {
                      if (selectedDateRange === "custom") {
                        return `Week of ${label}`;
                      }
                      return format(new Date(label), "MMM dd, yyyy");
                    }}
                  />

                  <Bar
                    dataKey="booked"
                    stackId="a"
                    fill="#6B7280"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="booked"
                      position="center"
                      fill="#FFFFFF"
                      fontSize={12}
                    />
                  </Bar>

                  <Bar
                    dataKey="available"
                    stackId="a"
                    fill="#25D366"
                    radius={[0, 0, 4, 4]}
                  >
                    <LabelList
                      dataKey="available"
                      position="center"
                      fill="#FFFFFF"
                      fontSize={12}
                    />
                  </Bar>

                  {/* Gray top bar (Booked) with label above */}
                  {/*   <Bar
                    dataKey="booked"
                    stackId="a"
                    fill="#6B7280"
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fill: '#6B7280', fontSize: 12 }}
                  />
 */}
                  {/* Green lower bar (Available) with label in center */}
                  {/*    <Bar
                    dataKey="available"
                    stackId="a"
                    fill="#25D366"
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'center', fill: '#ffffff', fontSize: 12 }}
                  /> */}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue</CardTitle>
          <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
            <SelectTrigger className="w-[180px] bg-[#EFF6FF]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue>
                  {revenuePeriod === "last-year"
                    ? "Last Year"
                    : "Last 6 Months"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Centered "Total Revenue" label */}
            <div
              className="
      absolute 
      top-1/2 left-1/2 
      -translate-x-1/2 -translate-y-1/2 
      flex flex-col items-center 
      bg-white 
      border border-gray-200 
      rounded-md 
      shadow 
      p-3
    "
            >
              <div className="text-sm font-semibold text-gray-500">
                Total Revenue
              </div>
              <RevenueDisplay />
            </div>
            {/*    <CardContent>
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <RevenueDisplay />
            </div> */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={revenue}
                margin={{
                  top: 20,
                  right: 30,
                  left: 70, // Increased left margin for larger currency values
                  bottom: 30, // Increased bottom margin
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  interval={revenuePeriod === "last-year" ? 1 : 0}
                  dy={10}
                  tick={{
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
                />
                {(() => {
                  const { ticks, domainMax } = calculateYAxisTicks(
                    Math.max(...revenue.map((item) => item.revenue))
                  );
                  return (
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        if (value >= 10000000) {
                          return `₹${(value / 10000000).toFixed(1)}Cr`;
                        } else if (value >= 100000) {
                          return `₹${(value / 100000).toFixed(1)}L`;
                        } else if (value >= 1000) {
                          return `₹${(value / 1000).toFixed(0)}K`;
                        } else {
                          return `₹${value}`;
                        }
                      }}
                      tickMargin={12}
                      ticks={ticks}
                      domain={[0, domainMax]} // Use exact calculated domain max
                      allowDecimals={false}
                      dx={-10}
                      tick={{
                        fill: "#6B7280",
                        fontSize: 12,
                      }}
                    />
                  );
                })()}
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #ccc",
                  }}
                  formatter={(value) => [
                    `₹${formatCurrency(value)}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={revenuePeriod === "last-year"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Render calendar at root level */}
      {isCalendarOpen && (
        <SimpleCalendar
          onSelect={(dateRange) => {
            handleDateSelect(dateRange);
            setIsCalendarOpen(false);
          }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
}
