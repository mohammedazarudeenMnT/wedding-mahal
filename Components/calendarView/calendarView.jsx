'use client'

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import MonthlyCalendar from "./monthlyCalendar"
import WeeklySchedule from "./weeklySchedule"
import { Button } from "@heroui/button"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { Calendar } from "@/Components/ui/calendar"

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1))
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateSelect = (date) => {
    setCurrentDate(date)
    setShowCalendar(false)
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
  }

  return (
    <div className="flex bg-gray-900">
      <div className="flex-1 flex flex-col bg-white">
        <div className="grid grid-cols-[300px,1fr] gap-4 m-4">
          {/* Calendar Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={handlePrevMonth} className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-medium">{format(currentDate, "MMMM yyyy")}</h2>
              <button onClick={handleNextMonth} className="p-1">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <MonthlyCalendar currentDate={currentDate} />
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Occasions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-sm">Mugartham</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                  <span className="text-sm">Special Day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Schedule</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  
                  {showCalendar && (
                    <div className="absolute right-0 mt-2 z-50 bg-white rounded-lg shadow-lg">
                      <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
                
                <Dropdown>
                  <DropdownTrigger className="hidden sm:flex">
                    <Button className="min-w-28 bg-hotel-secondary text-hotel-primary-text">
                      {selectedCategory === 'all' ? 'All Category' : 
                       selectedCategory === 'hall' ? 'Hall' : 'Room'}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={handleCategorySelect}>
                    <DropdownItem key="all">All Category</DropdownItem>
                    <DropdownItem key="hall">Hall</DropdownItem>
                    <DropdownItem key="room">Room</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            
            <WeeklySchedule currentDate={currentDate} category={selectedCategory} />
          </div>
        </div>
      </div>
    </div>
  )
}