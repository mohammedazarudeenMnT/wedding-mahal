"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns"

export default function MonthlyCalendar({ currentDate }) {
  const [days, setDays] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 3, 12)) // April 12, 2025

  useEffect(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfMonth = monthStart.getDay()
    const lastDayOfMonth = monthEnd.getDay()

    const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) =>
      addDays(monthStart, -firstDayOfMonth + i)
    )

    const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) => addDays(monthEnd, i + 1))

    setDays([...previousMonthDays, ...daysInMonth, ...nextMonthDays])
  }, [currentDate])

  const isSpecialDay = (date) => {
    const specialDays = [2, 12]
    return specialDays.includes(date.getDate()) && date.getMonth() === 3 && date.getFullYear() === 2025
  }

  const isMugarthamDay = (date) => {
    const mugarthamDays = [18]
    return mugarthamDays.includes(date.getDate()) && date.getMonth() === 3 && date.getFullYear() === 2025
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
        <div className="py-1">Sun</div>
        <div className="py-1">Mon</div>
        <div className="py-1">Tue</div>
        <div className="py-1">Wed</div>
        <div className="py-1">Thu</div>
        <div className="py-1">Fri</div>
        <div className="py-1">Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = isSameDay(day, selectedDate)
          const isSpecial = isSpecialDay(day)
          const isMugartham = isMugarthamDay(day)

          return (
            <div
              key={index}
              className={`
                h-8 w-8 flex items-center justify-center rounded-full cursor-pointer
                ${!isCurrentMonth ? "text-gray-400" : "text-gray-700"}
                ${isSelected ? "bg-purple-600 text-white" : ""}
                ${isMugartham && !isSelected ? "bg-yellow-400 text-white" : ""}
                ${isSpecial && !isSelected && !isMugartham ? "bg-purple-600 text-white" : ""}
              `}
              onClick={() => setSelectedDate(day)}
            >
              {format(day, "d")}
            </div>
          )
        })}
      </div>
    </div>
  )
}
