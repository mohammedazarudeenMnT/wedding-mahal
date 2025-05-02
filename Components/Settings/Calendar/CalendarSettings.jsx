"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Buttons } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"

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

  const handleDelete = (id) => {
    setOccasions(occasions.filter((occasion) => occasion.id !== id))
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
                className="border border-gray-300 rounded-md pr-10" 
              />
              <Calendar 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                size={18} 
              />
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
              />
              <div 
                className="w-24 h-10 rounded-r-md" 
                style={{ backgroundColor: selectedColor }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Buttons className="bg-yellow-400 hover:bg-yellow-500 text-black px-8">
              Save
            </Buttons>
            <Buttons variant="outline" className="bg-gray-600 hover:bg-gray-700 text-white border-0 px-8">
              Cancel
            </Buttons>
          </div>
        </div>

        <div className="mt-12 border-t border-dashed pt-8">
          <div className="bg-yellow-400 rounded-t-lg grid grid-cols-4 text-black font-medium">
            <div className="p-4">Occasion Name</div>
            <div className="p-4">Select Date</div>
            <div className="p-4">Color</div>
            <div className="p-4">Action</div>
          </div>

          {occasions.map((occasion) => (
            <div key={occasion.id} className="grid grid-cols-4 border-b">
              <div className="p-4">{occasion.name}</div>
              <div className="p-4">{occasion.dates}</div>
              <div className="p-4 flex items-center">
                <span className="mr-2">{occasion.color}</span>
                <div 
                  className="w-4 h-4 rounded-sm" 
                  style={{ backgroundColor: occasion.color }}
                ></div>
              </div>
              <div className="p-4 flex space-x-2">
                <button 
                  onClick={() => handleDelete(occasion.id)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    <path d="m15 5 4 4"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}