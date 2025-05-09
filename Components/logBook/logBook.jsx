"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays } from "date-fns"
import { 
  CalendarIcon, 
  Download, 
  Eye, 
  FileEdit, 
  Search, 
  Trash2,
} from "lucide-react"
import { 
  FaBoxOpen,  // For issued items
  FaMoneyBillWave,  // For charges
  FaClock,  // For pending items
  FaExclamationTriangle  // For damaged items
} from "react-icons/fa"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table"
import { Pagination } from "@heroui/pagination"
import { DateRangePicker } from "@heroui/date-picker"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { PiFadersHorizontal } from "react-icons/pi"
import ConfirmationDialog from "../ui/ConfirmationDialog"
import { PlusIcon } from "@/Components/ui/Table/PlusIcon"
import { cn } from "@/lib/utils"
import "./logbook.css"
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip" // Add
import Link from "next/link"
const INITIAL_VISIBLE_COLUMNS = [
  "customerName",
  "propertyType",
  "event",
  "date",
  "issuedItems",
  "status",
  "actions"
]

const statusColorMap = {
  Verified: "success",
  Issued: "warning",
/*   Pending: "default",
  Cancelled: "danger", */
};

export default function LogBook() {
  const [filterValue, setFilterValue] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  })
  const [columns, setColumns] = useState([])
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    // Implement delete logic here
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value))
    setPage(1)
  }, [])

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue("")
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue("")
    setPage(1)
  }, [])

  const filteredData = inventoryData.filter(item => 
    item.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
    item.bookingId.toLowerCase().includes(filterValue.toLowerCase())
  )

  const pages = Math.ceil(filteredData.length / rowsPerPage)
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredData.slice(start, end)
  }, [page, filteredData, rowsPerPage])

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, filteredData.length)

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {`Showing ${start}-${end} of ${filteredData.length}`}
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
    )
  }, [page, pages, rowsPerPage, filteredData.length])

  const generateColumns = useCallback(() => {
    const newColumns = [
      {
        key: "customerName",
        name: "Customer Name",
        uid: "customerName",
        sortable: true,
      },
      {
        key: "propertyType",
        name: "Property Type",
        uid: "propertyType",
        sortable: true,
      },
      {
        key: "event",
        name: "Event Type",
        uid: "event",
        sortable: true,
      },
      {
        key: "date",
        name: "Date",
        uid: "date",
        sortable: true,
      },
      {
        key: "issuedItems",
        name: "Issued Items",
        uid: "issuedItems",
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
      {
        key: "mobileNo",
        name: "Mobile No",
        uid: "mobileNo",
        sortable: true,
      },
      {
        key: "checkInTime",
        name: "Check-in Time",
        uid: "checkInTime",
        sortable: true,
      },
      {
        key: "notes",
        name: "Notes",
        uid: "notes",
        sortable: true,
      },
      {
        key: "electricity",
        name: "Electricity/Generator",
        uid: "electricity",
        sortable: true,
      }
    ]
    setColumns(newColumns)
  }, [])

  const renderCell = useCallback((item, column) => {
    const cellValue = item[column.uid]

    switch (column.uid) {
      case "customerName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.customerName}</p>
            <p className="text-bold text-tiny text-default-500">{item.bookingId}</p>
          </div>
        )
      case "propertyType":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.propertyType}</p>
          </div>
        )
      case "issuedItems":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
            color={Number(item.issuedItems) > 5 ? "warning" : "success"}
          >
            {item.issuedItems} items
          </Chip>
        )
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[item.paymentStatus]}
            size="sm"
            variant="flat"
          >
            {item.paymentStatus}
          </Chip>
        )
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="View Details">
              <Button isIconOnly variant="light" className="text-default-400 cursor-pointer active:opacity-50">
                <Eye className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Edit">
              <Button isIconOnly variant="light" className="text-default-400 cursor-pointer active:opacity-50">
                <FileEdit className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button 
                isIconOnly 
                variant="light" 
                className="text-danger cursor-pointer active:opacity-50"
                onClick={() => handleDeleteClick(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        )
      default:
        return cellValue
    }
  }, [])

  useEffect(() => {
    generateColumns()
  }, [generateColumns])

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns
    return columns.filter((column) => 
      Array.from(visibleColumns).includes(column.uid)
    )
  }, [visibleColumns, columns])

   

  return (
    <div className="container mx-auto p-4 bg-white">
      {/* Metrics Cards - Updated to match CheckIn.jsx style */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 databoxmain">
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Total Items Issued Today</span>
              <div className="databoxback">
                <FaBoxOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">18</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Total Item Charges</span>
              <div className="databoxback">
                <FaMoneyBillWave className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">₹21,000</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Pending Items to Return</span>
              <div className="databoxback">
                <FaClock className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">10</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Damage Items Reported</span>
              <div className="databoxback">
                <FaExclamationTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">2</div>
            </div>
          </div>
        </div>
      </section>

      {/* Working Sheet Logs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-hotel-primary-text font-semibold text-lg">Working sheet Logs</h2>
          
          <div className="flex gap-3">
            <Input
              isClearable
              classNames={{
                base: "w-full sm:max-w-[44%] date-btn",
                inputWrapper: "bg-hotel-secondary",
                input: "text-hotel-primary-text",
              }}
              placeholder="Search"
              startContent={<Search className="h-4 w-4 text-gray-500" />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
            />

            {/* Replace Popover calendar with DateRangePicker */}
            <div className="flex items-center gap-2">
              <DateRangePicker
                className="bg-white text-[#333] border-0 w-[280px]"
                label="Select Dates"
                onChange={(range) => {
                  if (!range || !range.start || !range.end) {
                    setDateRange({
                      from: new Date(),
                      to: addDays(new Date(), 1),
                    });
                    return;
                  }

                  const startDate = new Date(
                    range.start.year,
                    range.start.month - 1,
                    range.start.day
                  );
                  const endDate = new Date(
                    range.end.year,
                    range.end.month - 1,
                    range.end.day
                  );

                  setDateRange({
                    from: startDate,
                    to: endDate,
                  });
                }}
                classNames={{
                  base: "bg-hotel-secondary rounded-lg h-[40px]", // Added fixed height
                  trigger: "bg-hotel-secondary rounded-lg h-[40px]", // Updated height
                  value: "text-hotel-primary-text text-sm", // Added text size
                  content: "h-[40px]", // Added content height
                  popover: "rounded-lg mt-1",
                  input: "h-[40px]", // Added input height
                }}
              />
            </div>

            <Button
              className="min-w-[40px] bg-hotel-secondary text-hotel-primary-text"
              isIconOnly
              variant="flat"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button 
                  className="min-w-20 bg-hotel-secondary text-hotel-primary-text"
                  isIconOnly
                >
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
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Link href="/dashboard/logBook/add-log">
            <Button
              className="min-w-44 bg-hotel-primary text-hotel-primary-text"
              endContent={<PlusIcon />}
            >
              Add Item
            </Button>
          </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-default-400 text-small">
            Total {filteredData.length} items
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

        <Table
          aria-label="Inventory logs table"
          bottomContent={bottomContent}
          bottomContentPlacement="inside"
          classNames={{
            wrapper: "min-h-[400px]",
          }}
        >
          <TableHeader>
            {headerColumns.map((column) => (
              <TableColumn 
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody items={items}>
            {(item) => (
              <TableRow key={item.bookingId}>
                {headerColumns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Item"
          description={`Are you sure you want to delete this item?`}
          confirmText="Delete"
        />
      </div>
    </div>
  )
}

const inventoryData = [
  {
    customerName: "Madhan R",
    mobileNo: "9876543210",
    propertyType: "Hall A",
    event: "Wedding",
    date: "07/04/2025",
    checkInTime: "09:00 AM",
    notes: "Notes something note..",
    issuedItems: "7",
    electricity: "Yes",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Arjun V",
    mobileNo: "9876543211",
    propertyType: "Hall B",
    event: "Conference",
    date: "28/03/2025",
    checkInTime: "10:00 AM",
    notes: "Notes something note..",
    issuedItems: "8",
    electricity: "No",
    paymentStatus: "Issued",
    bookingId: "BO-1357",
  },
  {
    customerName: "Gokul N",
    mobileNo: "9876543212",
    propertyType: "Hall C",
    event: "Birthday",
    date: "18/03/2025",
    checkInTime: "11:00 AM",
    notes: "Notes something note..",
    issuedItems: "12",
    electricity: "Yes",
    paymentStatus: "Issued",
    bookingId: "BO-7443",
  },
  {
    customerName: "Varadhan U",
    mobileNo: "9876543213",
    propertyType: "Hall D",
    event: "Wedding",
    date: "07/04/2025",
    checkInTime: "12:00 PM",
    notes: "Notes something note..",
    issuedItems: "7",
    electricity: "Yes",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Tamilarasan R",
    mobileNo: "9876543214",
    propertyType: "Hall E",
    event: "Meeting",
    date: "07/04/2025",
    checkInTime: "01:00 PM",
    notes: "Notes something note..",
    issuedItems: "5",
    electricity: "No",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Madhu M",
    mobileNo: "9876543215",
    propertyType: "Hall F",
    event: "Seminar",
    date: "07/04/2025",
    checkInTime: "02:00 PM",
    notes: "Notes something note..",
    issuedItems: "6",
    electricity: "Yes",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Vinayak I",
    mobileNo: "9876543216",
    propertyType: "Hall G",
    event: "Workshop",
    date: "07/04/2025",
    checkInTime: "03:00 PM",
    notes: "Notes something note..",
    issuedItems: "7",
    electricity: "Yes",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Rudhran A",
    mobileNo: "9876543217",
    propertyType: "Hall H",
    event: "Exhibition",
    date: "07/04/2025",
    checkInTime: "04:00 PM",
    notes: "Notes something note..",
    issuedItems: "9",
    electricity: "No",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
  {
    customerName: "Abi T",
    mobileNo: "9876543218",
    propertyType: "Hall I",
    event: "Party",
    date: "07/04/2025",
    checkInTime: "05:00 PM",
    notes: "Notes something note..",
    issuedItems: "3",
    electricity: "Yes",
    paymentStatus: "Verified",
    bookingId: "BO-0982",
  },
]
