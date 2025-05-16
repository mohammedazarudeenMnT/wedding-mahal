"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, addDays, isSameDay } from "date-fns"

export default function WeeklySchedule({ currentDate, category, bookings }) {
  const [weeks, setWeeks] = useState([])

  useEffect(() => {
    const monthStart = startOfMonth(currentDate)
    const weeks = []

    for (let i = 0; i < 5; i++) {
      const week = []
      for (let j = 0; j < 7; j++) {
        const day = addDays(monthStart, i * 7 + j)
        week.push(day)
      }
      weeks.push(week)
    }

    setWeeks(weeks)
  }, [currentDate])

  const getBookingsForDay = (day) => {
    return bookings.filter((booking) => {
      const isSameDate = isSameDay(booking.date, day)
      if (category === 'all') return isSameDate
      if (category === 'hall') return isSameDate && booking.propertyType === 'hall'
      if (category === 'room') return isSameDate && booking.propertyType === 'room'
      return false
    })
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      <div className="text-center text-sm font-bold py-2 text-gray-600">Sunday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Monday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Tuesday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Wednesday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Thursday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Friday</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Saturday</div>

      {weeks.map((week, weekIndex) =>
        week.map((day, dayIndex) => (
          <div key={`${weekIndex}-${dayIndex}`} className="min-h-[120px] border border-gray-100 p-1">
            <div className="text-xs text-gray-500 mb-1">{format(day, "d")}</div>
            <div className="space-y-1">
              {getBookingsForDay(day).map((booking, index) => (
                <div key={`${booking.id}-${index}`} className={`${booking.color} p-2 rounded text-xs`}>
                  <div className="text-[10px] text-gray-600">
                    {booking.propertyId}
                  </div>
                  <div className="font-medium">
                    {booking.title} - {booking.type}
                  </div>
                  {booking.subtitle && <div className="text-[10px] mt-1">{booking.subtitle}</div>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
