"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import axios from "axios";
import { format, isWithinInterval, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { PiFadersHorizontal } from "react-icons/pi";

import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Buttons } from "../ui/button";
import { cn } from "@/lib/utils";
import { usePagePermission } from "../../hooks/usePagePermission";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import Invoice from "./InvoicePritnt";
import TableSkeleton from "../ui/TableSkeleton";

// Update COLUMNS to match API data structure
const COLUMNS = [
  {
    uid: "bookingNumber",
    name: "Booking ID",
    sortable: true,
  },
  {
    uid: "invoiceNumber",
    name: "Invoice No",
    sortable: true,
  },
  {
    uid: "customerName",
    name: "Customer Name",
    sortable: true,
  },
  {
    uid: "stayDates",
    name: "Stay Period",
    sortable: true,
  },
  {
    uid: "paymentMethod",
    name: "Payment Method",
    sortable: true,
  },
  {
    uid: "paymentStatus",
    name: "Payment Status",
    sortable: true,
  },
  {
    uid: "totalAmount",
    name: "Amount",
    sortable: true,
  },
  {
    uid: "actions",
    name: "Actions",
    sortable: false,
  },
];

// Payment method options from schema
const PAYMENT_METHODS = ["online", "cod", "paymentLink"];

const INITIAL_VISIBLE_COLUMNS = [
  "bookingNumber",
  "invoiceNumber",
  "customerName",
  "bookingDates",
  "paymentMethod",
  "totalAmount",
  "actions",
];

export default function Invoices() {
  const hasViewPermission = usePagePermission("Financials/Invoices", "view");
  const hasAddPermission = usePagePermission("Financials/Invoices", "add");
  const hasEditPermission = usePagePermission("Financials/Invoices", "edit");
  const hasDeletePermission = usePagePermission(
    "Financials/Invoices",
    "delete"
  );

  const [state, setState] = useState({
    invoices: [],
    settings: null,
    loading: true,
    error: null,
    filterValue: "",
    page: 1,
    rowsPerPage: 10,
  });

  // Update date state to handle null values properly
  const [date, setDate] = useState({
    from: null,
    to: null,
  });

  // Handle date selection with null check
  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) {
      setDate({ from: null, to: null });
    } else {
      setDate(selectedDate);
    }
  };

  // Keep payment method filter
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(new Set([]));

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );

  const [sortDescriptor, setSortDescriptor] = useState({
    column: "age",
    direction: "ascending",
  });

  const openModal = () => setIsModalOpen(true);

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await axios.get(`/api/financials/invoices`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          invoices: response.data.invoices,
          settings: response.data.settings,
          loading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewInvoice = useCallback(
    (invoice) => {
      setSelectedInvoice({
        ...invoice,
      });
      onOpen();
    },
    [onOpen]
  );

  // Close the invoice
  const closeInvoice = () => {
    setSelectedInvoice(null);
    onClose();
  };

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return COLUMNS;

    return COLUMNS.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  // Update payment method filter handler
  const handlePaymentMethodChange = useCallback((keys) => {
    setPaymentMethodFilter(keys);
  }, []);

  // Update filteredItems to handle payment method filter correctly
  const filteredItems = useMemo(() => {
    return state.invoices.filter((invoice) => {
      // Search filter
      if (state.filterValue) {
        const searchFields = [
          invoice.invoiceNumber,
          invoice.bookingNumber,
          invoice.customerDetails.name,
          invoice.paymentDetails.method,
          invoice.customerDetails.phone,
          invoice.customerDetails.email,
        ].map((field) => field?.toLowerCase() || "");

        if (
          !searchFields.some((field) =>
            field.includes(state.filterValue.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Payment method filter
      if (paymentMethodFilter.size > 0) {
        if (
          !paymentMethodFilter.has(invoice.paymentDetails.method?.toLowerCase())
        ) {
          return false;
        }
      }

      // Date range filter with null check
      if (date?.from && date?.to) {
        try {
          const bookingDate = parseISO(invoice.createdAt);
          return isWithinInterval(bookingDate, {
            start: date.from,
            end: date.to,
          });
        } catch (error) {
          console.error("Date filtering error:", error);
          return true; // Include the booking if date parsing fails
        }
      }

      return true;
    });
  }, [state.invoices, state.filterValue, paymentMethodFilter, date]);

  const pages = Math.ceil(filteredItems.length / state.rowsPerPage);

  const items = useMemo(() => {
    const start = (state.page - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;

    return filteredItems.slice(start, end);
  }, [state.page, filteredItems, state.rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // Update the renderCell function
  const renderCell = useCallback(
    (invoice, columnKey) => {
      switch (columnKey) {
        case "bookingNumber":
          return invoice.bookingNumber;
        case "customerName":
          return invoice.customerDetails.name;
        case "invoiceNumber":
          return invoice.invoiceNumber;
        case "stayDates":
          return (
            <div className="flex flex-col">
              <span>
                Check-in:{" "}
                {format(new Date(invoice.stayDetails.checkIn), "dd/MM/yyyy")}
              </span>
              <span>
                Check-out:{" "}
                {format(new Date(invoice.stayDetails.checkOut), "dd/MM/yyyy")}
              </span>
            </div>
          );
        case "paymentStatus":
          return (
            <div
              className={`capitalize ${
                invoice.paymentDetails.status === "completed"
                  ? "text-green-600"
                  : invoice.paymentDetails.status === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {invoice.paymentDetails.status}
            </div>
          );
        case "totalAmount":
          return `₹${invoice.amounts.totalAmount.toFixed(2)}`;
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasViewPermission && (
                <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                  <FaEye onClick={() => handleViewInvoice(invoice)} />
                </div>
              )}
            </div>
          );
        case "guests":
          return `Adults: ${invoice.guests.adults}, Children: ${invoice.guests.children}`;
        case "paymentMethod":
          return (
            <div className="space-y-1 max-w-[300px]">
              <div className="font-semibold capitalize">
                {invoice.paymentDetails.method}
              </div>
              {invoice.paymentDetails.method === "online" && (
                <>
                  <div className="text-xs text-gray-600">
                    <div>
                      Order ID: {invoice.paymentDetails.razorpayOrderId}
                    </div>
                    <div>
                      Payment ID: {invoice.paymentDetails.razorpayPaymentId}
                    </div>
                    {/* <div>Amount: ₹{invoice.paymentDetails.amount}</div> */}
                  </div>
                </>
              )}
              {invoice.paymentDetails.method === "paymentLink" && (
                <div className="text-xs text-gray-600">
                  Link ID: {invoice.paymentDetails.razorpayPaymentLinkId}
                </div>
              )}
              {invoice.paymentDetails.method === "qr" && (
                <div className="text-xs text-gray-600">
                  QR ID: {invoice.paymentDetails.qrCodeId}
                </div>
              )}
            </div>
          );
        case "numberOfRooms":
          return invoice.numberOfRooms;
        case "mobileNo":
          return invoice.customerDetails.phone;
        case "email":
          return invoice.customerDetails.email;
        case "status":
          return (
            <div
              className={`capitalize ${
                invoice.status === "checked-in"
                  ? "text-green-600"
                  : invoice.status === "checked-out"
                  ? "text-blue-600"
                  : invoice.status === "cancelled"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {invoice.status}
            </div>
          );
        default:
          return invoice[columnKey];
      }
    },
    [handleViewInvoice, hasViewPermission]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setState((prev) => ({
      ...prev,
      rowsPerPage: Number(e.target.value),
      page: 1,
    }));
  }, []);

  const onSearchChange = useCallback((value) => {
    if (value) {
      setState((prev) => ({ ...prev, filterValue: value, page: 1 }));
    } else {
      setState((prev) => ({ ...prev, filterValue: "" }));
    }
  }, []);

  const onClear = useCallback(() => {
    setState((prev) => ({ ...prev, filterValue: "", page: 1 }));
  }, []);

  // Update topContent to show only payment method filter and calendar
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[20%] "
            classNames={{
              base: "w-full sm:max-w-[44%] ",
              inputWrapper: "bg-hotel-secondary ",
              input: "text-hotel-primary-text",
            }}
            placeholder="Search invoices..."
            startContent={<SearchIcon />}
            value={state.filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Buttons
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
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
                    <span>Pick a date</span>
                  )}
                </Buttons>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className=" min-w-28 bg-hotel-secondary  "
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {paymentMethodFilter.size
                    ? `${paymentMethodFilter.size} Selected`
                    : "All Payment Methods"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Payment Method Filter"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={paymentMethodFilter}
                onSelectionChange={handlePaymentMethodChange}
              >
                {PAYMENT_METHODS.map((method) => (
                  <DropdownItem
                    key={method.toLowerCase()}
                    className="capitalize"
                  >
                    {method}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button className="min-w-12 bg-hotel-secondary text-hotel-primary-text">
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
                {COLUMNS.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {filteredItems.length} Invoices
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value={state.rowsPerPage}>{state.rowsPerPage}</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    state.filterValue,
    state.rowsPerPage,
    paymentMethodFilter,
    visibleColumns,
    date,
    onRowsPerPageChange,
    onSearchChange,
    onClear,
    openModal,
  ]);

  const bottomContent = useMemo(() => {
    const start = (state.page - 1) * state.rowsPerPage + 1;
    const end = Math.min(state.page * state.rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          Showing {start}-{end} of {filteredItems.length}
        </span>

        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              page={state.page}
              total={pages}
              onChange={(page) => setState((prev) => ({ ...prev, page }))}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [state.page, state.rowsPerPage, filteredItems.length, pages]);

  if (state.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading invoices: {state.error}
      </div>
    );
  }

  if (state.loading) {
    return <TableSkeleton />;
  }

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view invoices
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label="Example table with custom cells, pagination and sorting"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        classNames={{
          wrapper: "",
          td: "py-3", // Add padding to table cells to accommodate more content
        }}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns} className="table-header">
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
              className="table-header"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No Invoices found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item._id || item.bookingNumber}>
              {(columnKey) => (
                <TableCell style={{ color: "#0D0E0D" }}>
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        onClose={closeInvoice}
        size="full"
        scrollBehavior="inside"
        className="max-w-full h-screen"
      >
        <ModalContent className="h-full">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Invoice Details
              </ModalHeader>
              <ModalBody className="flex-grow overflow-auto">
                {selectedInvoice && <Invoice {...selectedInvoice} />}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
