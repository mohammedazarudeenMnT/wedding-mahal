import { NextResponse } from "next/server";
import Room from "../../../../../../utils/model/room/roomSchema";
import { getHotelDatabase } from "../../../../../../utils/config/hotelConnection";
import { getModel } from "../../../../../../utils/helpers/getModel";

export async function DELETE(request, { params }) {
  const { roomId, number } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const room = await RoomModel.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Check if the room number exists and has any bookings
    const roomNumberData = room.roomNumbers.find(r => r.number === number);
    if (!roomNumberData) {
      return NextResponse.json(
        { success: false, message: "Room number not found" },
        { status: 404 }
      );
    }

    // Check if the room has any active bookings
    const hasActiveBookings = roomNumberData.bookeddates.some(booking => 
      booking.status === "booked" && 
      new Date(booking.checkOut) > new Date()
    );

    if (hasActiveBookings) {
      return NextResponse.json(
        { success: false, message: "Cannot delete room number with active bookings" },
        { status: 400 }
      );
    }

    // Remove the room number
    room.roomNumbers = room.roomNumbers.filter(r => r.number !== number);
    room.numberOfRooms = room.numberOfRooms - 1;

    // Save the updated room
    await room.save();

    return NextResponse.json({
      success: true,
      message: "Room number deleted successfully",
      numberOfRooms: room.numberOfRooms
    });
  } catch (error) {
    console.error("Error deleting room number:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
