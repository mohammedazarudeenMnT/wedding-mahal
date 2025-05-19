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
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Calendar, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/ui/select";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import axios from "axios";
import { SimpleCalendar } from "./SimpleCalendar.jsx";
import { DonutChart } from "./donut-chart.jsx";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState("last-6-months");
  const [selectedHall, setSelectedHall] = useState("All Halls");
  const [donutDateRange, setDonutDateRange] = useState("this-week");
  const [donutCalendarOpen, setDonutCalendarOpen] = useState(false);
  const [appliedDonutRange, setAppliedDonutRange] = useState(null);
  const [selectedType, setSelectedType] = useState("hall");

  const staticData = {
    hall: {
      booked: 20,
      occupied: 1,
      available: 10,
    },
    room: {
      booked: 15,
      occupied: 5,
      available: 30,
    },
  };

  const bookingData = staticData[selectedType];

  // Create donut chart data
  const chartData = [
    { name: "Booked", value: bookingData.booked, color: "#FFCA28" },
    { name: "Occupied", value: bookingData.occupied, color: "#FF7A00" },
    { name: "Available", value: bookingData.available, color: "#A9A9A9" },
  ];

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

  // Add this function for donut chart date display
  const getDonutDateDisplay = () => {
    if (donutDateRange === "custom" && appliedDonutRange) {
      return `${format(appliedDonutRange.from, "MMM dd")} - ${format(
        appliedDonutRange.to,
        "MMM dd"
      )}`;
    }
    return donutDateRange.replace(/-/g, " ");
  };

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
        {/* Booking Status Card with Donut Chart */}
        <Card className="p-6 bg-white rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-medium">Booking</h2>
            <div className="flex gap-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="outline"
                    className="min-w-[120px] h-10 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-between px-4"
                  >
                    <span className="mr-2">
                      {selectedType === "hall" ? "Hall" : "Room"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Booking type selection"
                  onAction={(key) => setSelectedType(key)}
                  className="min-w-[120px]"
                >
                  <DropdownItem
                    key="hall"
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    Hall
                  </DropdownItem>
                  <DropdownItem
                    key="room"
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    Room
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Select
                value={donutDateRange}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setDonutCalendarOpen(true);
                  } else {
                    setDonutDateRange(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] bg-[#EFF6FF]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue>{getDonutDateDisplay()}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="next-week">Next week</SelectItem>
                  <SelectItem value="custom">
                    {donutDateRange === "custom" && appliedDonutRange
                      ? `${format(appliedDonutRange.from, "MMM dd")} - ${format(
                          appliedDonutRange.to,
                          "MMM dd"
                        )}`
                      : "Custom"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="w-[250px] h-[250px]">
              <DonutChart data={chartData} />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FFCA28]"></div>
                <div className="text-lg">
                  <span className="font-semibold">{bookingData.booked}</span>{" "}
                  <span className="text-gray-600">Booked</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF7A00]"></div>
                <div className="text-lg">
                  <span className="font-semibold">{bookingData.occupied}</span>{" "}
                  <span className="text-gray-600">Occupied</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#A9A9A9]"></div>
                <div className="text-lg">
                  <span className="font-semibold">{bookingData.available}</span>{" "}
                  <span className="text-gray-600">Available</span>
                </div>
              </div>
            </div>
          </div>
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

      {donutCalendarOpen && (
        <SimpleCalendar
          onSelect={(dateRange) => {
            setDonutDateRange("custom");
            setAppliedDonutRange(dateRange);
            setDonutCalendarOpen(false);
          }}
          onClose={() => setDonutCalendarOpen(false)}
        />
      )}
    </div>
  );
}
