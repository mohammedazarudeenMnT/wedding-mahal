'use client'

import { useState, useEffect } from "react"
import axios from "axios"
import { format, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import MonthlyCalendar from "./monthlyCalendar"
import WeeklySchedule from "./weeklySchedule"
import { Button } from "@heroui/button"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { Calendar } from "@/Components/ui/calendar"

export default function CalendarView() {
  // Add state for occasions
  const [occasions, setOccasions] = useState([])

  // Separate states for each calendar
  const [occasionsDate, setOccasionsDate] = useState(new Date())
  const [bookingsDate, setBookingsDate] = useState(new Date(2025, 3, 1))
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Separate handlers for each calendar
  const handleOccasionsPrevMonth = () => {
    setOccasionsDate(subMonths(occasionsDate, 1))
  }

  const handleOccasionsNextMonth = () => {
    setOccasionsDate(addMonths(occasionsDate, 1))
  }

  const handleBookingsPrevMonth = () => {
    setBookingsDate(subMonths(bookingsDate, 1))
  }

  const handleBookingsNextMonth = () => {
    setBookingsDate(addMonths(bookingsDate, 1))
  }

  // Add useEffect to fetch occasions
  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const response = await axios.get('/api/settings/calendar')
        if (response.data.success) {
          setOccasions(response.data.data.occasions || [])
        }
      } catch (error) {
        console.error('Error fetching occasions:', error)
      }
    }

    fetchOccasions()
  }, [])

  // Get unique occasion names for the legend
  const uniqueOccasions = [...new Set(occasions.map(occ => ({
    name: occ.name,
    color: occ.color
  })))].reduce((acc, curr) => {
    if (!acc.find(item => item.name === curr.name)) {
      acc.push(curr)
    }
    return acc
  }, [])

  return (
    <div className="flex bg-gray-900">
      <div className="flex-1 flex flex-col bg-white">
        <div className="grid grid-cols-[300px,1fr] gap-4 m-4">
          {/* Occasions Calendar Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={handleOccasionsPrevMonth} className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-medium">
                {format(occasionsDate, "MMMM yyyy")}
              </h2>
              <button onClick={handleOccasionsNextMonth} className="p-1">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <MonthlyCalendar 
              currentDate={occasionsDate} 
              occasions={occasions}
            />
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Occasions</h3>
              <div className="space-y-3">
                {uniqueOccasions.map((occasion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: occasion.color }}
                    />
                    <span className="text-sm capitalize">{occasion.name}</span>
                  </div>
                ))}
                {uniqueOccasions.length === 0 && (
                  <p className="text-sm text-gray-500">No occasions configured</p>
                )}
              </div>
            </div>
          </div>

          {/* Bookings Schedule Section */}
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
                        selected={bookingsDate}
                        onSelect={(date) => {
                          setBookingsDate(date)
                          setShowCalendar(false)
                        }}
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
                  <DropdownMenu onAction={setSelectedCategory}>
                    <DropdownItem key="all">All Category</DropdownItem>
                    <DropdownItem key="hall">Hall</DropdownItem>
                    <DropdownItem key="room">Room</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            
            <WeeklySchedule 
              currentDate={bookingsDate} 
              category={selectedCategory} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}