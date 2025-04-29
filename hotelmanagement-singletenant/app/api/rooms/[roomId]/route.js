import { NextResponse } from "next/server";
import Room from "../../../../utils/model/room/roomSchema";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
  const { roomId } = params;

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

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error("Error retrieving room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { roomId } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);
    const formData = await request.formData();

    // Parse form data
    const updateData = {};

    if (formData.has("name")) updateData.name = formData.get("name");
    if (formData.has("description"))
      updateData.description = formData.get("description");
    if (formData.has("igst")) updateData.igst = formData.get("igst");
    if (formData.has("additionalGuestCosts"))
      updateData.additionalGuestCosts = formData.get("additionalGuestCosts");
    if (formData.has("price")) {
      const price = parseFloat(formData.get("price"));
      if (!isNaN(price)) updateData.price = price;
    }
    if (formData.has("size")) updateData.size = formData.get("size");
    if (formData.has("bedModel"))
      updateData.bedModel = formData.get("bedModel");
    if (formData.has("maxGuests"))
      updateData.maxGuests = parseInt(formData.get("maxGuests"));
    if (formData.has("numberOfRooms"))
      updateData.numberOfRooms = parseInt(formData.get("numberOfRooms"));

    const roomNumber = formData.get("roomNumber");
    const action = formData.get("action");
    const bookingNumber = formData.get("bookingNumber");

    // Update complementary foods handling
    updateData.complementaryFoods = formData.getAll("complementaryFoods");
    // Handle the case when no complementary foods are selected
    if (!formData.has("complementaryFoods")) {
      updateData.complementaryFoods = [];
    }

    if (formData.has("amenities")) {
      updateData.amenities = formData.getAll("amenities").map((amenity) => {
        const [icon, name] = amenity.split("-");
        return { icon, name };
      });
    }

    // Add sanitizeFileName function
    const sanitizeFileName = (originalFileName) => {
      // Split the filename into name and extension
      const [name, extension] = originalFileName.split(/\.(?=[^.]+$)/);
      // Remove all spaces from the name
      const sanitizedName = name.replace(/\s+/g, "");
      return `${sanitizedName}.${extension}`;
    };

    const mainImageFile = formData.get("mainImage");
    const thumbnailFiles = formData.getAll("thumbnailImages");

    let mainImageUrl = null;
    if (mainImageFile && mainImageFile.name) {
      const sanitizedMainImageName = sanitizeFileName(mainImageFile.name);
      const mainImagePath = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "mainimage",
        sanitizedMainImageName
      );
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "mainimage"
      );

      try {
        await fs.access(uploadsDir);
      } catch (error) {
        if (error.code === "ENOENT") {
          await fs.mkdir(uploadsDir, { recursive: true });
        } else {
          throw error;
        }
      }

      await fs.writeFile(
        mainImagePath,
        Buffer.from(await mainImageFile.arrayBuffer())
      );
      mainImageUrl = `/assets/images/rooms/mainimage/${sanitizedMainImageName}`;
    }

    if (mainImageUrl) updateData.mainImage = mainImageUrl;

    const thumbnailImageUrls = [];
    for (const thumbnailFile of thumbnailFiles) {
      if (!thumbnailFile.name) continue;
      const sanitizedThumbnailName = sanitizeFileName(thumbnailFile.name);
      const thumbnailPath = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "thumbnailimages",
        sanitizedThumbnailName
      );
      const thumbnailDir = path.dirname(thumbnailPath);

      try {
        await fs.access(thumbnailDir);
      } catch (error) {
        if (error.code === "ENOENT") {
          await fs.mkdir(thumbnailDir, { recursive: true });
        } else {
          throw error;
        }
      }

      await fs.writeFile(
        thumbnailPath,
        Buffer.from(await thumbnailFile.arrayBuffer())
      );
      thumbnailImageUrls.push(
        `/assets/images/rooms/thumbnailimages/${sanitizedThumbnailName}`
      );
    }

    if (thumbnailImageUrls.length > 0)
      updateData.thumbnailImages = thumbnailImageUrls;

    // Handle room numbers update
    if (formData.has("roomNumbers")) {
      const numberOfRooms = parseInt(formData.get("numberOfRooms"));
      const newRoomNumbers = JSON.parse(formData.get("roomNumbers"));

      // Get existing room to preserve booking data
      const existingRoom = await RoomModel.findById(roomId);
      if (!existingRoom) {
        return NextResponse.json(
          { success: false, message: "Room not found" },
          { status: 404 }
        );
      }

      // Create a map of existing room numbers to their booking data
      const existingBookingsMap = new Map(
        existingRoom.roomNumbers.map((room) => [room.number, room.bookeddates])
      );

      // Merge existing booking data with new room numbers
      updateData.roomNumbers = newRoomNumbers.map((room) => ({
        number: room.number,
        bookeddates: existingBookingsMap.get(room.number) || [],
      }));

      updateData.numberOfRooms = numberOfRooms;
    }

    const room = await RoomModel.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found." },
        { status: 404 }
      );
    }

    const roomNumberIndex = room.roomNumbers.findIndex(
      (r) => r.number === roomNumber
    );
    if (roomNumberIndex !== -1) {
      // if (action === "clear") {
      //   // Remove the booking from bookeddates
      //   room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[
      //     roomNumberIndex
      //   ].bookeddates.filter(
      //     (booking) => booking.bookingNumber !== bookingNumber
      //   );
      // }
      if (action === "clear" && roomNumber && bookingNumber) {
        const roomIndex = room.roomNumbers.findIndex(
          (r) => r.number === roomNumber
        );
        if (roomIndex !== -1) {
          // Remove the specific booking from bookeddates array
          room.roomNumbers[roomIndex].bookeddates = room.roomNumbers[
            roomIndex
          ].bookeddates.filter(
            (booking) => booking.bookingNumber !== bookingNumber
          );

          // Update only the room numbers array
          const updateResult = await RoomModel.findByIdAndUpdate(
            roomId,
            {
              $set: {
                roomNumbers: room.roomNumbers,
              },
            },
            { new: true }
          );

          if (!updateResult) {
            return NextResponse.json(
              { success: false, message: "Failed to update room booking data" },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            room: updateResult,
            message:
              "Booking cancelled and room availability updated successfully",
          });
        }
      } else {
        // Add new booked dates
        if (bookingNumber && unavailableDates.length === 2) {
          room.roomNumbers[roomNumberIndex].bookeddates.push({
            bookingNumber: bookingNumber,
            checkIn: new Date(unavailableDates[0]),
            checkout: new Date(unavailableDates[1]),
            status: "booked",
          });
        }
      }
    }

    // Update the room with all changes
    const updatedRoom = await RoomModel.findByIdAndUpdate(
      roomId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, message: "Room not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        room: updatedRoom,
        message:
          action === "clear"
            ? "Unavailable dates cleared successfully"
            : "Room Updated Successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { roomId } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const roomToDelete = await RoomModel.findById(roomId);
    if (!roomToDelete) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Delete image files and room record
    if (roomToDelete.mainImage) {
      const mainImagePath = path.join(
        process.cwd(),
        "public",
        roomToDelete.mainImage
      );
      await fs
        .unlink(mainImagePath)
        .catch((err) => console.error("Error deleting main image:", err));
    }

    if (
      roomToDelete.thumbnailImages &&
      roomToDelete.thumbnailImages.length > 0
    ) {
      for (const thumbnailImage of roomToDelete.thumbnailImages) {
        const thumbnailPath = path.join(
          process.cwd(),
          "public",
          thumbnailImage
        );
        await fs
          .unlink(thumbnailPath)
          .catch((err) =>
            console.error("Error deleting thumbnail image:", err)
          );
      }
    }

    await RoomModel.findByIdAndDelete(roomId);

    return NextResponse.json({
      success: true,
      message: "Room and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
