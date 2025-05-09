

"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Input } from "@/Components/ui/input"
import { Buttons } from "@/Components/ui/button"
import { Textarea } from "@/Components/ui/textarea"
import { X, Plus } from "lucide-react"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table"
import { DateRangePicker } from "@heroui/date-picker"
import { addDays } from "date-fns"

export default function AddLogForm() {
  const [itemsIssued, setItemsIssued] = useState([{}])
  const [electricityReadings, setElectricityReadings] = useState([{}])
  const [totalAmount, setTotalAmount] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  })

  const addItemRow = () => {
    setItemsIssued([...itemsIssued, {}])
  }

  const addElectricityRow = () => {
    setElectricityReadings([...electricityReadings, {}])
  }

  const removeItemRow = (index) => {
    const newItems = [...itemsIssued]
    newItems.splice(index, 1)
    setItemsIssued(newItems)
  }

  const removeElectricityRow = (index) => {
    const newReadings = [...electricityReadings]
    newReadings.splice(index, 1)
    setElectricityReadings(newReadings)
  }

  return (
    <div className="w-full px-4 py-2">
      <div className="p-4  rounded-lg shadow">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-hotel-primary-text font-[500]">
            Add New Log Entry
          </h2>
        </div>

        {/* Form content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date picker */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm text-gray-600">Date</label>
              <DateRangePicker
                className="bg-white text-[#333] border-0 w-full"
                label="Select Date"
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
                  base: "bg-hotel-secondary rounded-lg h-[40px]",
                  trigger: "bg-hotel-secondary rounded-lg h-[40px]",
                  value: "text-hotel-primary-text text-sm",
                  content: "h-[40px]",
                  popover: "rounded-lg mt-1",
                  input: "h-[40px]",
                }}
              />
            </div>

            {/* Booking ID */}
            <div className="space-y-2">
              <label htmlFor="bookingId" className="text-sm text-gray-600">Booking Id</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking1">Booking 1</SelectItem>
                  <SelectItem value="booking2">Booking 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm text-gray-600">Customer Name</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer1">Customer 1</SelectItem>
                  <SelectItem value="customer2">Customer 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number - Changed to Select dropdown */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm text-gray-600">Phone Number</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Phone Number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone1">+91 9876543210</SelectItem>
                  <SelectItem value="phone2">+91 8765432109</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label htmlFor="propertyType" className="text-sm text-gray-600">Property Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="type1">Type 1</SelectItem>
                  <SelectItem value="type2">Type 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Time */}
            <div className="space-y-2">
              <label htmlFor="checkInTime" className="text-sm text-gray-600">Check-in Time</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time1">10:00 AM</SelectItem>
                  <SelectItem value="time2">12:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm text-gray-600">Event Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event1">Event 1</SelectItem>
                  <SelectItem value="event2">Event 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm text-gray-600">Notes</label>
              <Textarea id="notes" className="min-h-[80px]" placeholder="Enter notes" />
            </div>
          </div>

          {/* Items Issued Section - Update styling */}
          <div className="border-t border-dashed pt-6 mb-8">
            <h2 className="text-hotel-primary-text font-semibold text-lg mb-4">Items Issued</h2>
            
            <Table aria-label="Items issued table">
              <TableHeader>
                <TableColumn>Category</TableColumn>
                <TableColumn>Sub Category</TableColumn>
                <TableColumn>Brand</TableColumn>
                <TableColumn>Model</TableColumn>
                <TableColumn>Quantity</TableColumn>
                <TableColumn>Condition</TableColumn>
                <TableColumn>Remarks</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {itemsIssued.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="type1">Type 1</SelectItem>
                          <SelectItem value="type2">Type 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Sub Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sub1">Sub Category 1</SelectItem>
                          <SelectItem value="sub2">Sub Category 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brand1">Brand 1</SelectItem>
                          <SelectItem value="brand2">Brand 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="model1">Model 1</SelectItem>
                          <SelectItem value="model2">Model 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="No. of Quantity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue="Good">
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Good" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Text" className="h-9 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Buttons
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500"
                        onClick={() => removeItemRow(index)}
                      >
                        <X className="h-5 w-5" />
                      </Buttons>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add Item button and Totals */}
            <div className="flex items-center mt-2">
              <Buttons variant="ghost" size="sm" className="gap-1" onClick={addItemRow}>
                <Plus className="h-4 w-4" />
              </Buttons>

              <div className="ml-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-end">
                {/* Total Items */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Items</span>
                  <span className="text-lg font-bold text-hotel-primary-text">{itemsIssued.length.toString().padStart(2, '0')}</span>
                </div>
                {/* Total Amount */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Amount</span>
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <span className="text-base text-gray-500">₹</span>
                    <Input
                      type="number"
                      min="0"
                      // step="0.01"
                      className="h-8 text-sm text-right bg-transparent border-0 focus:ring-0 focus-visible:ring-0"
                      placeholder="00.00"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      style={{ maxWidth: 80, textAlign: "right" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Electricity/Generator Section - Update styling */}
          <div className="border-t border-dashed pt-6 mb-8">
            <h2 className="text-hotel-primary-text font-semibold text-lg mb-4">Electricity / Generator</h2>
            
            <Table aria-label="Electricity readings table">
              <TableHeader>
                <TableColumn>Type</TableColumn>
                <TableColumn>Start Reading</TableColumn>
                <TableColumn>Unit Type</TableColumn>
                <TableColumn>Remarks</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {electricityReadings.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="type1">Type 1</SelectItem>
                          <SelectItem value="type2">Type 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Enter the Reading" className="h-9 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Enter the unit type ( EgkWh, Hours)" className="h-9 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Text" className="h-9 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Buttons
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500"
                        onClick={() => removeElectricityRow(index)}
                      >
                        <X className="h-5 w-5" />
                      </Buttons>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center mt-2">
              <Buttons variant="ghost" size="sm" className="gap-1" onClick={addElectricityRow}>
                <Plus className="h-4 w-4" />
              </Buttons>
            </div>
          </div>

          {/* Action Buttons - Update styling */}
          <div className="flex justify-center gap-4 mt-8 border-t border-dashed pt-6">
            <Buttons 
              className="min-w-[120px] bg-hotel-primary text-hotel-primary-text"
            >
              Save
            </Buttons>
            <Buttons 
              variant="bordered" 
              className="min-w-[120px]"
            >
              Cancel
            </Buttons>
          </div>
        </div>
      </div>
    </div>
  )
}