import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import Housekeeping from "../../../utils/model/houseKeeping/HousekeepingSchema";
import Room from "../../../utils/model/room/roomSchema";
import { getModel } from "../../../utils/helpers/getModel";

// GET - Fetch all housekeeping tasks
export async function GET() {
  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);
    const HousekeepingModel = getModel("Housekeeping", Housekeeping);

    // Check and auto-complete tasks that have exceeded buffer time
    const incompleteTasks = await HousekeepingModel.find({
      status: { $ne: "completed" },
      expectedEndTime: { $lte: new Date() },
      reservationStatus: "checkout" // Only check checkout status tasks
    });

    for (const task of incompleteTasks) {
      if (task.expectedEndTime && new Date() >= task.expectedEndTime) {
        task.status = "completed";
        task.actualEndTime = new Date();
        task.notes = task.notes
          ? `${task.notes}\nAuto-completed at buffer time limit.`
          : "Auto-completed at buffer time limit.";

        const room = await RoomModel.findOne({
          "roomNumbers.number": task.roomNumber,
        });

        if (room) {
          const roomNumber = room.roomNumbers.find(
            (rn) => rn.number === task.roomNumber
          );
          if (roomNumber) {
            roomNumber.bookeddates = roomNumber.bookeddates.filter(
              (date) => date.bookingNumber !== task.bookingNumber
            );
            await room.save();
          }
        }

        await task.save();
      }
    }

    // Get all rooms
    const rooms = await RoomModel.find({});
    let housekeepingTasks = [];

    // Process each room's checkout data
    for (const room of rooms) {
      for (const roomNum of room.roomNumbers) {
        // Modified checkout booking filter
        const checkoutBookings = roomNum.bookeddates.filter((date) => {
          if (!date || !date.bookingNumber) return false;

          const checkOutDate = date.checkOut ? new Date(date.checkOut) : null;

          // Include bookings that:
          // 1. Have checkout status OR
          // 2. Have a checkout date within 24 hours (future or past)
          return date.status === "checkout" && checkOutDate;
        });

        for (const booking of checkoutBookings) {
          // Check for existing incomplete task
          const existingTask = await HousekeepingModel.findOne({
            roomNumber: roomNum.number,
            bookingNumber: booking.bookingNumber,
            status: { $ne: "completed" },
          });

          if (!existingTask) {
            try {
              const task = new HousekeepingModel({
                roomNumber: roomNum.number,
                roomType: room.name,
                bookingNumber: booking.bookingNumber,
                checkOutDate: booking.checkOut,
                guests: booking.guests,
                status: "pending",
                priority: "medium",
                reservationStatus: "checkout",
                expectedStartTime: new Date(),
                // Remove expectedEndTime here as it will be set by pre-save middleware
              });

              await task.save();
              housekeepingTasks.push(task);
              console.log(`Created task for booking ${booking.bookingNumber}`);
            } catch (err) {
              console.error(
                `Error creating task for room ${roomNum.number}:`,
                err
              );
            }
          }
        }
      }
    }

    // Get all tasks including completed ones
    const allTasks = await HousekeepingModel.find({}).sort({
      checkOutDate: -1,
    });

    // Calculate status counts
    const statusCounts = allTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      tasks: allTasks,
      statusCounts,
      newTasksCreated: housekeepingTasks.length,
      debug: {
        totalRooms: rooms.length,
        newTasks: housekeepingTasks.length,
        currentTasks: allTasks.length,
      },
    });
  } catch (error) {
    console.error("Error in GET housekeeping:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new housekeeping task
export async function POST(request) {
  try {
    await getHotelDatabase();
    const HousekeepingModel = getModel("Housekeeping", Housekeeping);
    const RoomModel = getModel("Room", Room);
  
    const formData = await request.formData();
    const status = formData.get("status");
    const roomNumber = formData.get("roomNumber");
    const reservationStatus = formData.get("reservationStatus");

    // Add check-in status handling
    if (reservationStatus === "checkin") {
      const task = new HousekeepingModel({
        roomNumber: formData.get("roomNumber"),
        roomType: formData.get("roomType"),
        bookingNumber: formData.get("bookingNumber"),
        status: "pending",
        priority: "high",
        reservationStatus: "checkin",
        expectedStartTime: new Date(),
        notes: formData.get("notes"),
        assignedTo: formData.get("assignedTo"),
      });

      await task.save();
      return NextResponse.json({ success: true, task });
    }

    if (reservationStatus === "booked") {
      const room = await RoomModel.findOne({
        "roomNumbers.number": roomNumber
      });

      if (room) {
        const roomData = room.roomNumbers.find(rn => rn.number === roomNumber);
        const booking = roomData?.bookeddates?.find(date => 
          date.status === "booked" && 
          new Date(date.checkIn) > new Date()
        );

        if (booking) {
          const hoursUntilCheckIn = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
          if (hoursUntilCheckIn < 2) {
            return NextResponse.json({
              success: false,
              message: "Not enough time before check-in"
            }, { status: 400 });
          }

          const task = new HousekeepingModel({
            roomNumber,
            roomType: formData.get("roomType"),
            status: "pending",
            priority: "high", // Higher priority for booked rooms
            reservationStatus: "booked",
            expectedEndTime: new Date(new Date(booking.checkIn).getTime() - (2 * 60 * 60 * 1000)),
            notes: `Must complete before check-in at ${new Date(booking.checkIn).toLocaleString()}`,
            assignedTo: formData.get("assignedTo")
          });

          await task.save();
          return NextResponse.json({ success: true, task });
        }
      }
    }

    if (status === "maintenance") {
      const room = await RoomModel.findOne({
        "roomNumbers.number": roomNumber
      });

      if (room) {
        const roomNumberIndex = room.roomNumbers.findIndex(rn => rn.number === roomNumber);
        if (roomNumberIndex !== -1) {
          const futureBookings = room.roomNumbers[roomNumberIndex].bookeddates?.filter(date => 
            date.checkOut && new Date(date.checkOut) > new Date()
          );

          // Calculate the earliest possible start time
          const startTime = futureBookings?.length > 0 
            ? new Date(Math.max(...futureBookings.map(b => new Date(b.checkOut))))
            : new Date();

          const maintenanceNumber = `MAINT-${Date.now()}`;

          // Create the maintenance task
          const task = new HousekeepingModel({
            roomNumber,
            roomType: formData.get("roomType"),
            status: "maintenance",
            reservationStatus: "maintenance",
            priority: formData.get("priority") || "medium",
            notes: formData.get("notes"),
            assignedTo: formData.get("assignedTo"),
            startTime,
            expectedStartTime: startTime,
            actualStartTime: startTime,
            bookingNumber: maintenanceNumber
          });

          await task.save();
          return NextResponse.json({ success: true, task });
        }
      }
    }

    // Handle normal housekeeping tasks
    const task = new HousekeepingModel({
      roomNumber: formData.get("roomNumber"),
      roomType: formData.get("roomType"),
      checkOutDate: new Date(formData.get("checkOutDate")),
      priority: formData.get("priority") || "medium",
      reservationStatus: formData.get("reservationStatus") || "checkout",
      status: "pending",
      notes: formData.get("notes"),
      expectedStartTime: new Date(),
      assignedTo: formData.get("assignedTo"),
      // Remove expectedEndTime here as it will be set by pre-save middleware
    });

    await task.save(); // This will trigger pre-save middleware to set expectedEndTime

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
