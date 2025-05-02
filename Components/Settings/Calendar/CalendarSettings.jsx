"use client"

import { useState, useRef } from "react"
import { Calendar as CalendarIcon, Trash2, Edit } from "lucide-react"
import { Button } from "@heroui/button"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Calendar } from "../../ui/calendar"

export default function CalendarSettings() {
  const [occasions, setOccasions] = useState([
    {
      id: "1",
      name: "Mugartham Days",
      dates: "Feb21, Feb23, Mar12, Mar18",
      color: "#FFB800",
    },
    {
      id: "2",
      name: "Special Day",
      dates: "Apr 2",
      color: "#9747FF",
    },
  ])

  const [selectedColor, setSelectedColor] = useState("#FFB800")
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const colorInputRef = useRef(null)

  const handleDelete = (id) => {
    setOccasions(occasions.filter((occasion) => occasion.id !== id))
  }

  const handleDateSelect = (dates) => {
    setSelectedDates(dates)
    setShowCalendar(false)
  }

  const triggerColorPicker = () => {
    colorInputRef.current?.click()
  }

  return (
    <div className="mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
      <div>
        <h1 className="text-2xl font-medium text-gray-700">Add Mugartham / special occasions</h1>

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="occasion-name" className="block text-sm font-medium text-gray-700 mb-2">
              Occasion Name
            </label>
            <Select>
              <SelectTrigger className="w-full max-w-md border border-gray-300 rounded-md">
                <SelectValue placeholder="Occasion Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mugartham">Mugartham</SelectItem>
                <SelectItem value="special-day">Special Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="select-date" className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative w-full max-w-md">
              <Input 
                id="select-date" 
                placeholder="Select Dates"
                value={selectedDates.map(date => date.toLocaleDateString()).join(", ")}
                readOnly
                onClick={() => setShowCalendar(!showCalendar)}
                className="border border-gray-300 rounded-md pr-10 cursor-pointer" 
              />
              <CalendarIcon 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" 
                size={18}
                onClick={() => setShowCalendar(!showCalendar)}
              />
              {showCalendar && (
                <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="select-color" className="block text-sm font-medium text-gray-700 mb-2">
              Select Color
            </label>
            <div className="flex w-full max-w-md">
              <Input
                id="select-color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="border border-gray-300 rounded-l-md"
                onClick={triggerColorPicker}
                readOnly
              />
              <div 
                className="w-24 h-10 rounded-r-md cursor-pointer" 
                style={{ backgroundColor: selectedColor }}
                onClick={triggerColorPicker}
              />
              <input
                type="color"
                ref={colorInputRef}
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8">
              Save
            </Button>
            <Button variant="bordered" className="bg-gray-600 hover:bg-gray-700 text-white px-8">
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-12 border rounded-lg overflow-hidden">
          <div className="bg-yellow-400 grid grid-cols-4 text-black font-medium text-sm">
            <div className="p-4 pl-6">OCCASION NAME</div>
            <div className="p-4">SELECT DATE</div>
            <div className="p-4">COLOR</div>
            <div className="p-4">ACTION</div>
          </div>

          <div className="divide-y divide-gray-200">
            {occasions.map((occasion) => (
              <div key={occasion.id} className="grid grid-cols-4 hover:bg-gray-50">
                <div className="p-4 pl-6 flex items-center">{occasion.name}</div>
                <div className="p-4 flex items-center text-gray-600">{occasion.dates}</div>
                <div className="p-4 flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-md" 
                    style={{ backgroundColor: occasion.color }}
                  />
                  <span className="text-gray-600 text-sm">{occasion.color}</span>
                </div>
                <div className="p-4 flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-md">
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-md"
                    onClick={() => handleDelete(occasion.id)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}