"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, addDays, isSameDay } from "date-fns"

export default function WeeklySchedule({ currentDate, category }) {
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

  const events = [
    // Hall Events
    { id: "1", hallId: "HALL01", title: "Occupied", date: new Date(2025, 3, 1), type: "Full day", subtitle: "Marriage", color: "bg-yellow-200" },
    { id: "2", hallId: "HALL01", title: "Occupied", date: new Date(2025, 3, 2), type: "Full day", subtitle: "Marriage", color: "bg-yellow-200" },
    { id: "3", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 6), type: "Evening", subtitle: "Naming Ceremony", color: "bg-orange-300" },
    { id: "4", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 7), type: "Evening", subtitle: "Reception", color: "bg-orange-300" },
    { id: "5", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 8), type: "Full Day", color: "bg-orange-300" },
    { id: "6", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 9), type: "Full Day", subtitle: "Engagement", color: "bg-orange-300" },
    { id: "7", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 12), type: "Morning", subtitle: "Puberty Ceremony", color: "bg-orange-300" },
    { id: "8", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 15), type: "Full Day", subtitle: "Marriage", color: "bg-orange-300" },
    { id: "9", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 18), type: "Full Day", subtitle: "Product Expo", color: "bg-orange-300" },
    { id: "10", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 19), type: "Full Day", subtitle: "Product Expo", color: "bg-orange-300" },
    { id: "11", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 20), type: "Full Day", subtitle: "Product Expo", color: "bg-orange-300" },
    { id: "12", hallId: "HALL02", title: "Booked", date: new Date(2025, 3, 23), type: "Full Day", subtitle: "", color: "bg-orange-300" },
    { id: "13", hallId: "HALL02", title: "Booked", date: new Date(2025, 3, 24), type: "Full Day", subtitle: "", color: "bg-orange-300" },
    { id: "14", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 29), type: "Full Day", subtitle: "Marriage", color: "bg-orange-300" },
    { id: "15", hallId: "HALL01", title: "Booked", date: new Date(2025, 3, 30), type: "Full Day", subtitle: "Reception", color: "bg-orange-300" },

    // Room Events
    { id: "16", roomId: "ROOM101", title: "Booked", date: new Date(2025, 3, 1), type: "Full Day", subtitle: "Family Stay", color: "bg-blue-200" },
    { id: "17", roomId: "ROOM102", title: "Occupied", date: new Date(2025, 3, 2), type: "Full Day", subtitle: "Business Stay", color: "bg-blue-300" },
    { id: "18", roomId: "ROOM103", title: "Booked", date: new Date(2025, 3, 5), type: "Evening", subtitle: "Guest Stay", color: "bg-blue-200" },
    { id: "19", roomId: "ROOM101", title: "Booked", date: new Date(2025, 3, 8), type: "Full Day", subtitle: "Wedding Guest", color: "bg-blue-200" },
    { id: "20", roomId: "ROOM104", title: "Occupied", date: new Date(2025, 3, 10), type: "Full Day", subtitle: "Family Stay", color: "bg-blue-300" }
  ]

  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const isSameDate = isSameDay(event.date, day)
      if (category === 'all') return isSameDate
      if (category === 'hall') return isSameDate && event.hallId?.startsWith('HALL')
      if (category === 'room') return isSameDate && event.roomId?.startsWith('ROOM')
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
              {getEventsForDay(day).map((event, eventIndex) => (
                <div key={eventIndex} className={`${event.color} p-2 rounded text-xs`}>
                  <div className="text-[10px] text-gray-600">
                    {event.hallId || event.roomId}
                  </div>
                  <div className="font-medium">
                    {event.title} - {event.type}
                  </div>
                  {event.subtitle && <div className="text-[10px] mt-1">{event.subtitle}</div>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
