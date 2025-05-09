"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Input } from "@/Components/ui/input"
import { Buttons } from "@/Components/ui/button"
import { Textarea } from "@/Components/ui/textarea"
import { X, Plus } from "lucide-react"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table"
import { DateRangePicker } from "@heroui/date-picker"
import { addDays } from "date-fns"
import axios from "axios"
import { toast } from "react-toastify"

export default function AddLogForm() {
  const [itemsIssued, setItemsIssued] = useState([{}])
  const [electricityReadings, setElectricityReadings] = useState([{}])
  const [totalAmount, setTotalAmount] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  })
  const [inventory, setInventory] = useState([])
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [electricityTypes, setElectricityTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    bookingId: "",
    customerName: "",
    mobileNo: "",
    propertyType: "",
    eventType: "",
    checkInTime: "",
    notes: ""
  })

  useEffect(() => {
    fetchInventory()
    fetchElectricityTypes()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/api/inventory')
      if (response.data.success) {
        const inventoryData = response.data.data
        setInventory(inventoryData)
        
        // Extract unique values for dropdowns
        const uniqueCategories = [...new Set(inventoryData.map(item => item.category))]
        setCategories(uniqueCategories)
        
        const uniqueSubCategories = [...new Set(inventoryData.map(item => item.subCategory))]
        setSubCategories(uniqueSubCategories)
        
        const uniqueBrands = [...new Set(inventoryData.map(item => item.brandName))]
        setBrands(uniqueBrands)
        
        const uniqueModels = [...new Set(inventoryData.map(item => item.model))]
        setModels(uniqueModels)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchElectricityTypes = async () => {
    try {
      const response = await axios.get('/api/settings/inventory')
      if (response.data.success) {
        setElectricityTypes(response.data.settings.electricityTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch electricity types:', error)
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...itemsIssued]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setItemsIssued(newItems)
  }

  const getFilteredSubCategories = (category) => {
    return [...new Set(inventory
      .filter(item => item.category === category)
      .map(item => item.subCategory))]
  }

  const getFilteredBrands = (category, subCategory) => {
    return [...new Set(inventory
      .filter(item => item.category === category && item.subCategory === subCategory)
      .map(item => item.brandName))]
  }

  const getFilteredModels = (category, subCategory, brand) => {
    return [...new Set(inventory
      .filter(item => 
        item.category === category && 
        item.subCategory === subCategory && 
        item.brandName === brand
      )
      .map(item => item.model))]
  }

  const getAvailableQuantity = (category, subCategory, brand, model) => {
    const item = inventory.find(item => 
      item.category === category && 
      item.subCategory === subCategory && 
      item.brandName === brand && 
      item.model === model
    )
    return item ? item.quantityInStock : 0
  }

  const getTotalIssuedQuantity = (category, subCategory, brand, model, currentIndex) => {
    return itemsIssued.reduce((total, item, index) => {
      // Skip the current item being edited
      if (index === currentIndex) return total;
      
      // Only count items that match the category, subcategory, brand, and model
      if (item.category === category && 
          item.subCategory === subCategory && 
          item.brand === brand && 
          item.model === model) {
        return total + (parseInt(item.quantity) || 0);
      }
      return total;
    }, 0);
  }

  const handleQuantityChange = (index, value) => {
    const item = itemsIssued[index]
    const availableQuantity = getAvailableQuantity(
      item.category,
      item.subCategory,
      item.brand,
      item.model
    )
    
    // Get total quantity already issued for this item (excluding current item)
    const alreadyIssuedQuantity = getTotalIssuedQuantity(
      item.category,
      item.subCategory,
      item.brand,
      item.model,
      index
    )
    
    // Calculate remaining available quantity
    const remainingQuantity = availableQuantity - alreadyIssuedQuantity
    
    // Ensure new quantity doesn't exceed remaining available quantity
    const newQuantity = Math.min(parseInt(value) || 0, remainingQuantity)
    
    handleItemChange(index, 'quantity', newQuantity)
  }

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

  const handleFormChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const handleElectricityChange = (index, field, value) => {
    const newReadings = [...electricityReadings]
    newReadings[index] = {
      ...newReadings[index],
      [field]: value
    }
    setElectricityReadings(newReadings)
  }

  const validateForm = () => {
    if (!formData.bookingId) {
      toast.error("Booking ID is required")
      return false
    }
    if (!formData.customerName) {
      toast.error("Customer name is required")
      return false
    }
    if (!formData.mobileNo) {
      toast.error("Mobile number is required")
      return false
    }
    if (!formData.propertyType) {
      toast.error("Property type is required")
      return false
    }
    if (!formData.eventType) {
      toast.error("Event type is required")
      return false
    }
    if (!formData.checkInTime) {
      toast.error("Check-in time is required")
      return false
    }

    // Validate items issued
    if (itemsIssued.length < 1 || !itemsIssued[0].category) {
      toast.error("At least one item must be issued")
      return false
    }

    for (const item of itemsIssued) {
      if (!item.category || !item.subCategory || !item.brand || !item.model || !item.quantity) {
        toast.error("Please complete all fields for issued items")
        return false
      }
    }

    // Validate electricity readings if any are provided
    if (electricityReadings.length > 0 && electricityReadings[0].type) {
      for (const reading of electricityReadings) {
        if (!reading.type || !reading.startReading || !reading.unitType) {
          toast.error("Please complete all fields for electricity readings")
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      // Filter out empty items and readings
      const validItems = itemsIssued.filter(item => 
        item.category && 
        item.subCategory && 
        item.brand && 
        item.model && 
        item.quantity
      );
      
      const validReadings = electricityReadings.filter(reading => 
        reading.type && 
        reading.startReading && 
        reading.unitType
      );

      // Format the data to match the schema requirements
      const payload = {
        ...formData,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to
        },
        itemsIssued: validItems.map(item => ({
          category: item.category,
          subCategory: item.subCategory,
          brand: item.brand,
          model: item.model,
          quantity: parseInt(item.quantity) || 1,
          condition: item.condition || 'Good',
          remarks: item.remarks || ''
        })),
        electricityReadings: validReadings.map(reading => ({
          type: reading.type,
          startReading: parseFloat(reading.startReading) || 0,
          unitType: reading.unitType,
          remarks: reading.remarks || ''
        })),
        totalAmount: parseFloat(totalAmount) || 0
      };

      console.log('Submitting log entry:', payload);
      const response = await axios.post('/api/logBook', payload);

      if (response.data.success) {
        toast.success("Log entry added successfully");
        // Reset the form or redirect
        resetForm();
      } else {
        toast.error(response.data.error || "Failed to add log entry");
      }
    } catch (error) {
      console.error("Error submitting log entry:", error);
      toast.error(error.response?.data?.error || "Failed to add log entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setItemsIssued([{}])
    setElectricityReadings([{}])
    setTotalAmount("")
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 1),
    })
    setFormData({
      bookingId: "",
      customerName: "",
      mobileNo: "",
      propertyType: "",
      eventType: "",
      checkInTime: "",
      notes: ""
    })
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
              <Select 
                value={formData.bookingId}
                onValueChange={(value) => handleFormChange("bookingId", value)}
              >
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
              <Select
                value={formData.customerName}
                onValueChange={(value) => handleFormChange("customerName", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer1">Customer 1</SelectItem>
                  <SelectItem value="customer2">Customer 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm text-gray-600">Phone Number</label>
              <Select
                value={formData.mobileNo}
                onValueChange={(value) => handleFormChange("mobileNo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Phone Number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9876543210">+91 9876543210</SelectItem>
                  <SelectItem value="8765432109">+91 8765432109</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label htmlFor="propertyType" className="text-sm text-gray-600">Property Type</label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => handleFormChange("propertyType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hall A">Hall A</SelectItem>
                  <SelectItem value="Hall B">Hall B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Time */}
            <div className="space-y-2">
              <label htmlFor="checkInTime" className="text-sm text-gray-600">Check-in Time</label>
              <Select
                value={formData.checkInTime}
                onValueChange={(value) => handleFormChange("checkInTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm text-gray-600">Event Type</label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => handleFormChange("eventType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wedding">Wedding</SelectItem>
                  <SelectItem value="Birthday">Birthday</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm text-gray-600">Notes</label>
              <Textarea 
                id="notes" 
                className="min-h-[80px]" 
                placeholder="Enter notes" 
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
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
                {itemsIssued.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.category}
                        onValueChange={(value) => handleItemChange(index, 'category', value)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.subCategory}
                        onValueChange={(value) => handleItemChange(index, 'subCategory', value)}
                        disabled={!item.category}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Sub Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredSubCategories(item.category).map((subCategory) => (
                            <SelectItem key={subCategory} value={subCategory}>
                              {subCategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.brand}
                        onValueChange={(value) => handleItemChange(index, 'brand', value)}
                        disabled={!item.category || !item.subCategory}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredBrands(item.category, item.subCategory).map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.model}
                        onValueChange={(value) => handleItemChange(index, 'model', value)}
                        disabled={!item.category || !item.subCategory || !item.brand}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredModels(item.category, item.subCategory, item.brand).map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-xs h-9"
                        placeholder={item.category && item.subCategory && item.brand && item.model 
                          ? `${getAvailableQuantity(item.category, item.subCategory, item.brand, item.model)}`
                          : "Enter quantity"}
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        max={getAvailableQuantity(item.category, item.subCategory, item.brand, item.model)}
                        min="1"
                        disabled={!item.category || !item.subCategory || !item.brand || !item.model}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.condition}
                        onValueChange={(value) => handleItemChange(index, 'condition', value)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="text-xs"
                        placeholder="Remarks"
                        value={item.remarks || ''}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Buttons
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
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
                {electricityReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={reading.type}
                        onValueChange={(value) => handleElectricityChange(index, 'type', value)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {electricityTypes.map((type) => (
                            <SelectItem key={type._id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter the Reading" 
                        className="h-9 text-xs"
                        value={reading.startReading || ''}
                        onChange={(e) => handleElectricityChange(index, 'startReading', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter the unit type (Eg: kWh, Hours)" 
                        className="h-9 text-xs"
                        value={reading.unitType || ''}
                        onChange={(e) => handleElectricityChange(index, 'unitType', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter Remarks" 
                        className="h-9 text-xs"
                        value={reading.remarks || ''}
                        onChange={(e) => handleElectricityChange(index, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Buttons
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500"
                        onClick={() => removeElectricityRow(index)}
                        disabled={electricityReadings.length === 1}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Buttons>
            <Buttons 
              variant="bordered" 
              className="min-w-[120px]"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Buttons>
          </div>
        </div>
      </div>
    </div>
  )
}