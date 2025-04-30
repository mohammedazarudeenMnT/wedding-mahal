import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import Housekeeping from "../../../../utils/model/houseKeeping/HousekeepingSchema";
import Room from "../../../../utils/model/room/roomSchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function GET(request, { params }) {
  const { taskId } = params;

  try {
    await getHotelDatabase();
    const HousekeepingModel = getModel("Housekeeping", Housekeeping);

    const task = await HousekeepingModel.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { taskId } = params;

  try {
    await getHotelDatabase();
    const HousekeepingModel = getModel("Housekeeping", Housekeeping);
    const RoomModel = getModel("Room", Room);
    const updateData = await request.json();
    const task = await HousekeepingModel.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Update task fields
    const updatedFields = [
      'roomNumber', 'roomType', 'bookingNumber', 'priority',
      'status', 'notes', 'assignedTo', 'reservationStatus'
    ];

    updatedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    // Handle status changes and timing updates
    if (updateData.status === 'completed' && task.status !== 'completed') {
      const currentTime = new Date();
      
      // Set completion times for all reservation statuses
      task.endTime = currentTime;
      task.actualEndTime = currentTime;

      // Handle specific reservation statuses
      if (task.reservationStatus === 'maintenance') {
        // Existing maintenance completion logic
        const room = await RoomModel.findOne({
          name: task.roomType
        });

        if (room) {
          const roomNumberIndex = room.roomNumbers.findIndex(rn => rn.number === task.roomNumber);
          if (roomNumberIndex !== -1) {
            // Find the specific maintenance booking
            const maintenanceBooking = room.roomNumbers[roomNumberIndex].bookeddates.find(
              date => date.status === "maintenance" && date.bookingNumber === task.bookingNumber
            );

            if (maintenanceBooking) {
              // Remove only the specific maintenance booking
              room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[roomNumberIndex].bookeddates.filter(
                date => !(date.status === "maintenance" && date.bookingNumber === task.bookingNumber)
              );

              console.log('Found maintenance booking:', maintenanceBooking);
              await room.markModified('roomNumbers');
              await room.save();

              // Set completion times
              task.endTime = currentTime;
              task.actualEndTime = currentTime;
              
              console.log('Maintenance task completed:', task.bookingNumber);
            } else {
              console.log('Maintenance booking not found:', task.bookingNumber);
            }
          }
        }
      }
      // For booked and checkin statuses, just update the times
      else if (['booked', 'checkin'].includes(task.reservationStatus)) {
        console.log(`Completing ${task.reservationStatus} task at:`, currentTime);
      }
    } else if (updateData.status === 'in-progress' && !task.startTime) {
      task.startTime = new Date();
      task.actualStartTime = new Date();
    }

    await task.save();
    return NextResponse.json({ 
      success: true, 
      task,
      message: "Task updated successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { taskId } = params;

  try {
    await getHotelDatabase();
    const HousekeepingModel = getModel("Housekeeping", Housekeeping);

    const task = await HousekeepingModel.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    await HousekeepingModel.findByIdAndDelete(taskId);

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
