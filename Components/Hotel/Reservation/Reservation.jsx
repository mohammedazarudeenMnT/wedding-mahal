"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { CiFilter } from "react-icons/ci";
import { RiCloseLargeFill } from "react-icons/ri";
import { PiFadersHorizontal } from "react-icons/pi";

import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { format, isWithinInterval, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Buttons } from "../../ui/button.tsx";
import { Calendar } from "../../ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover.tsx";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Button,
} from "@nextui-org/react";
import { PlusIcon } from "../../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../../ui/Table/SearchIcon.jsx";
import { statusOptions } from "./data.js";
import { cn } from "@/lib/utils";
import { capitalize } from "../../ui/Table/utils.js";
import ConfirmationDialog from "../../ui/ConfirmationDialog.jsx";
import { usePagePermission } from "../../../hooks/usePagePermission.ts";
import TableSkeleton from "../../ui/TableSkeleton";

const statusColorMap = {
  booked: "warning",
  checkin: "success",
  checkout: "default",
  cancelled: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "guest",
  "room",
  "mobileNo",
  "duration",
  "check-in-check-out",
  "status",
  "actions",
];

export default function ReservationList({}) {
  const hasViewPermission = usePagePermission("Bookings", "view");
  const hasAddPermission = usePagePermission("Bookings", "add");
  const hasEditPermission = usePagePermission("Bookings", "edit");
  const hasDeletePermission = usePagePermission("Bookings", "delete");
  const [bookings, setBookings] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = useState(
    new Set(["booked", "checkin"])
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "checkInDate",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [date, setDate] = useState({
    from: "",
    to: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    description: "",
    confirmText: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/bookings`);
      if (response.data.success) {
        setBookings(response.data.bookings);
        generateColumns(response.data.bookings[0]);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const generateColumns = (sampleBooking) => {
    if (!sampleBooking) return;

    const newColumns = [
      {
        key: "guest",
        name: "Guest",
        uid: "guest",
        sortable: true,
      },
      {
        key: "room",
        name: "Room Category",
        uid: "room",
        sortable: true,
      },
      {
        key: "mobileNo",
        name: "Mobile No",
        uid: "mobileNo",
        sortable: true,
      },
      {
        key: "duration",
        name: "Duration",
        uid: "duration",
        sortable: true,
      },
      {
        key: "check-in-check-out",
        name: "Check-In & Check-Out",
        uid: "check-in-check-out",
        sortable: true,
      },
      {
        key: "clientRequests",
        name: "Client Requests",
        uid: "clientRequests",
        sortable: true,
      },
      {
        key: "status",
        name: "Status",
        uid: "status",
        sortable: true,
      },
      {
        key: "actions",
        name: "Actions",
        uid: "actions",
      },
    ];

    setColumns(newColumns);
  };

  const updateBookingStatus = useCallback(
    async (bookingNumber, newStatus) => {
      try {
        const response = await axios.put(
          `/api/bookings/${bookingNumber}`,
          { status: newStatus },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        if (response.data.success) {
          toast.success(
            `Booking ${
              newStatus === "checkin"
                ? "checked in"
                : newStatus === "cancelled"
                ? "cancelled"
                : "checked out"
            } successfully`
          );
          fetchBookings(); // Refresh the bookings list
        } else {
          toast.error(`Failed to update booking status`);
        }
      } catch (error) {
        console.error(`Error updating booking status:`, error);
        toast.error(`Error updating booking status`);
      }
    },
    [fetchBookings]
  );

  const cancelBooking = useCallback(
    async (bookingNumber) => {
      try {
        const bookingToCancel = bookings.find(
          (b) => b.bookingNumber === bookingNumber
        );
        if (!bookingToCancel) {
          toast.error("Booking not found");
          return;
        }

        // Update booking status to cancelled
        const bookingResponse = await axios.put(
          `/api/bookings/${bookingNumber}`,
          { status: "cancelled" },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (bookingResponse.data.success) {
          // Update room availability for each room in the booking
          for (const bookedRoom of bookingToCancel.rooms) {
            await axios.put(
              `/api/rooms/${bookedRoom._id}`,
              {
                roomNumber: bookedRoom.number,
                action: "clear",
                bookingNumber: bookingNumber,
              },
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            );
          }

          toast.success("Booking cancelled and room availability updated");
          fetchBookings(); // Refresh the bookings list
        } else {
          toast.error("Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Error cancelling booking");
      }
    },
    [bookings, fetchBookings]
  );

  const handleStatusChange = useCallback(
    (bookingNumber, newStatus) => {
      let title, description, confirmText;
      switch (newStatus) {
        case "checkin":
          title = "Confirm Check-In";
          description = "Are you sure you want to check in this guest?";
          confirmText = "Check In";
          break;
        case "checkout":
          title = "Confirm Check-Out";
          description = "Are you sure you want to check out this guest?";
          confirmText = "Check Out";
          break;
        case "cancelled":
          title = "Confirm Cancellation";
          description = "Are you sure you want to cancel this booking?";
          confirmText = "Cancel Booking";
          break;
      }
      setDialogProps({ title, description, confirmText });
      setConfirmAction(() => () => {
        if (newStatus === "cancelled") {
          cancelBooking(bookingNumber);
        } else {
          updateBookingStatus(bookingNumber, newStatus);
        }
      });
      setShowConfirmDialog(true);
    },
    [cancelBooking, updateBookingStatus]
  );

  const checkInBooking = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "checkin"),
    [handleStatusChange]
  );
  const checkOutBooking = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "checkout"),
    [handleStatusChange]
  );
  const cancelBookingWithConfirmation = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "cancelled"),
    [handleStatusChange]
  );

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (!columns || columns.length === 0)
      return INITIAL_VISIBLE_COLUMNS.map((key) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
        uid: key,
        sortable: key !== "actions",
      }));

    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const filteredItems = useMemo(() => {
    if (!bookings) return [];
    let filteredBookings = [...bookings];

    if (hasSearchFilter) {
      filteredBookings = filteredBookings.filter((booking) =>
        `${booking.firstName} ${booking.lastName}`
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== columns.length
    ) {
      filteredBookings = filteredBookings.filter((booking) =>
        Array.from(statusFilter).includes(booking.status)
      );
    }
    if (statusFilter.size > 0 && statusFilter.size !== statusOptions.length) {
      filteredBookings = filteredBookings.filter((booking) =>
        statusFilter.has(booking.status)
      );
    }

    // Filter by date range
    if (date && date.from && date.to) {
      filteredBookings = filteredBookings.filter((booking) => {
        try {
          const checkInDate = parseISO(booking.checkInDate);
          const checkOutDate = parseISO(booking.checkOutDate);
          return (
            isWithinInterval(checkInDate, { start: date.from, end: date.to }) ||
            isWithinInterval(checkOutDate, {
              start: date.from,
              end: date.to,
            }) ||
            (checkInDate <= date.from && checkOutDate >= date.to)
          );
        } catch (error) {
          console.error(
            `Error filtering booking: ${booking.bookingNumber}`,
            error
          );
          return false; // Exclude this booking if there's an error
        }
      });
    }

    return filteredBookings;
  }, [bookings, filterValue, statusFilter, columns, date, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = useCallback(
    (booking, columnKey) => {
      const cellValue = booking[columnKey];

      switch (columnKey) {
        case "guest":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `${
                  booking.gender === "male"
                    ? "https://i.pravatar.cc/150?u=a042581f4e29026024d"
                    : "https://i.pravatar.cc/150?u=a092581d4ef9026700d"
                }`,
              }}
              description={booking.bookingNumber}
              name={`${booking.firstName} ${booking.lastName}`}
              classNames={{
                name: "text-hotel-primary-text",
                description: "text-hotel-secondary-grey",
              }}
            >
              {booking.email}
            </User>
          );
        case "room":
          return booking.rooms && booking.rooms.length > 0
            ? booking.rooms.map((r) => `${r.type} (${r.number})`).join(", ")
            : "N/A";
        case "request":
          return booking.mobileNo || "N/A";
        case "duration":
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const duration = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
          );
          return `${duration} ${duration === 1 ? "day" : "days"}`;
        case "check-in-check-out":
          return (
            <div className="flex flex-row justify-start">
              <div className="flex justify-evenly">
                <span>
                  {new Date(booking.checkInDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="mx-2"> - </span>
                <span>
                  {new Date(booking.checkOutDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[booking.status] || "default"}
              size="sm"
              variant="flat"
            >
              {booking.status || "N/A"}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasViewPermission && (
                <Link href={`/dashboard/bookings/${booking.bookingNumber}`}>
                  <Button
                    variant="flat"
                    className="min-w-15 bg-hotel-primary text-white"
                  >
                    View
                  </Button>
                </Link>
              )}
              {hasEditPermission && booking.status === "booked" && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary-darkgreen text-white"
                  onClick={() => checkInBooking(booking.bookingNumber)}
                >
                  Check In
                </Button>
              )}
              {hasEditPermission && booking.status === "checkin" && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary-darkred text-white"
                  onClick={() => checkOutBooking(booking.bookingNumber)}
                >
                  Check Out
                </Button>
              )}
              {hasDeletePermission && booking.status === "booked" && (
                <Button
                  variant="flat"
                  className="min-w-10 bg-hotel-primary-red text-white"
                  aria-label="cancel"
                  onClick={() =>
                    cancelBookingWithConfirmation(booking.bookingNumber)
                  }
                >
                  <RiCloseLargeFill />
                </Button>
              )}
              {(booking.status === "checkin" ||
                booking.status === "checkout" ||
                booking.status === "cancelled") && (
                <Button
                  variant="flat"
                  className="min-w-10 bg-gray-300 text-white"
                  aria-label="cancel"
                  disabled
                >
                  <RiCloseLargeFill />
                </Button>
              )}
            </div>
          );
        default:
          return cellValue;
      }
    },
    [
      checkInBooking,
      checkOutBooking,
      cancelBookingWithConfirmation,
      hasViewPermission,
      hasEditPermission,
      hasDeletePermission,
    ]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-2 items-end">
            <h2 className="text-hotel-primary-text  font-[500]">
              Bookings List
            </h2>
            <div className="flex gap-3">
              <Input
                isClearable
                classNames={{
                  base: "w-full sm:max-w-[44%] date-btn",
                  inputWrapper: "bg-hotel-secondary ",
                  input: "text-hotel-primary-text",
                }}
                placeholder="Search guest, status, etc ..."
                startContent={<SearchIcon />}
                value={filterValue}
                onClear={() => onClear()}
                onValueChange={onSearchChange}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Buttons
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-hotel-secondary",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span className="text-hotel-primary-text">
                        {" "}
                        Pick a date
                      </span>
                    )}
                  </Buttons>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Dropdown>
                <DropdownTrigger className="hidden sm:flex">
                  <Button
                    className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
                    classNames={{
                      base: ["bg-hotel-secondary hover:bg-hotel-secondary/90"],
                      content: "text-default-900",
                    }}
                    startContent={<CiFilter />}
                    radius="sm"
                  >
                    All Status
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Table Columns"
                  closeOnSelect={false}
                  selectedKeys={statusFilter}
                  selectionMode="multiple"
                  onSelectionChange={setStatusFilter}
                >
                  {statusOptions.map((status) => (
                    <DropdownItem
                      key={status.uid}
                      className="capitalize text-hotel-primary-text"
                    >
                      {capitalize(status.name)}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger className="hidden sm:flex">
                  <Button className="min-w-20 bg-hotel-secondary text-hotel-primary-text">
                    <PiFadersHorizontal />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Table Columns"
                  closeOnSelect={false}
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                >
                  {columns.map((column) => (
                    <DropdownItem key={column.uid} className="capitalize">
                      {capitalize(column.name)}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {hasAddPermission && (
                <Link href={`/dashboard/bookings/add-booking`}>
                  <Button
                    className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                    endContent={<PlusIcon />}
                  >
                    New Booking
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-default-400 text-small">
              Total {bookings.length} bookings
            </span>
            <label className="flex items-center text-default-400 text-small">
              Rows per page:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                onChange={onRowsPerPageChange}
              >
                <option value={rowsPerPage}>{rowsPerPage}</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </label>
          </div>
        </div>
      </>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onRowsPerPageChange,
    bookings.length,
    onSearchChange,
    columns,
    date,
    onClear,
    rowsPerPage,
    hasAddPermission,
  ]);

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {`Showing ${start}-${end} of ${filteredItems.length}`}
        </span>
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              page={page}
              total={pages}
              onChange={setPage}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, filteredItems.length]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (columns.length === 0 && bookings.length > 0) {
    return <TableSkeleton />;
  }

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view bookings
      </div>
    );
  }

  return (
    <>
      {headerColumns && headerColumns.length > 0 ? (
        <Table
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="inside"
          classNames={{
            wrapper: "",
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="inside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"No bookings found"}
            items={sortedItems || []}
          >
            {(item) => (
              <TableRow key={item?._id || item?.bookingNumber}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <TableSkeleton />
      )}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          confirmAction();
          setShowConfirmDialog(false);
        }}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmText={dialogProps.confirmText}
      />
    </>
  );
}
