import { NextResponse } from "next/server";
import Guest from "../../../utils/model/booking/bookingSchema";
import Room from "../../../utils/model/room/roomSchema";
import RoomSettings from "../../../utils/model/settings/room/roomSettingsSchema";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";
import fs from "fs";
import path from "path";

async function updateRoomStatuses(RoomModel, GuestModel) {
  const now = new Date();
  const rooms = await RoomModel.find({});
  let updatedCount = 0;

  // Get all guests with their current status
  const guests = await GuestModel.find({
    status: { $in: ["checkin", "checkout"] },
  });
  const guestBookings = new Map(
    guests.map((guest) => [guest.bookingNumber, guest])
  );

  for (const room of rooms) {
    for (const roomNumber of room.roomNumbers) {
      for (const bookedDate of roomNumber.bookeddates) {
        // Skip if no booking number
        if (!bookedDate.bookingNumber) continue;

        const guest = guestBookings.get(bookedDate.bookingNumber);
        if (guest) {
          // Update status to match guest status
          bookedDate.status = guest.status;
          updatedCount++;
        } else if (
          bookedDate.status === "booked" &&
          new Date(bookedDate.checkOut) < now
        ) {
          bookedDate.status = "checkout";
          updatedCount++;
        }
      }
    }
    await room.save();
  }

  return updatedCount;
}

export async function GET() {
  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);
    const GuestModel = getModel("Guest", Guest);
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    // Update room statuses
    const updatedCount = await updateRoomStatuses(RoomModel, GuestModel);

    // Fetch room settings
    const roomSettings = await RoomSettingsModel.findOne({});
    const weekend = roomSettings?.weekend || [];
    const weekendPriceHike = roomSettings?.weekendPriceHike || 0;

    // Fetch all rooms for this hotel
    const rooms = await RoomModel.find({});

    // Add weekend pricing information to each room
    const roomsWithWeekendPricing = rooms.map((room) => {
      const weekendPrice = room.price * (1 + weekendPriceHike / 100);
      return {
        ...room.toObject(),
        weekendPrice,
        weekend,
        weekendPriceHike,
      };
    });

    // Return success response with rooms data
    return new Response(
      JSON.stringify({
        success: true,
        rooms: roomsWithWeekendPricing,
        updatedStatusCount: updatedCount,
        roomSettings: {
          weekend,
          weekendPriceHike,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const igst = formData.get("igst");
    const additionalGuestCosts = formData.get("additionalGuestCosts");
    const price = parseFloat(formData.get("price"));
    const size = formData.get("size");
    const bedModel = formData.get("bedModel");
    const maxGuests = parseInt(formData.get("maxGuests"));
    const roomNumbersJson = formData.get("roomNumbers");
    const roomNumbers = JSON.parse(roomNumbersJson); // Parse the JSON string directly
    const numberOfRooms = parseInt(formData.get("numberOfRooms"));
    const complementaryFoods = formData.getAll("complementaryFoods");
    // Extract and format amenities
    const amenities = formData.getAll("amenities").map((amenity) => {
      const [icon, name] = amenity.split("-");
      return { icon, name };
    });

    // Function to sanitize filename
    const sanitizeFileName = (originalFileName) => {
      // Split the filename into name and extension.
      const [name, extension] = originalFileName.split(/\.(?=[^.]+$)/);
      // Remove all spaces from the name.
      const sanitizedName = name.replace(/\s+/g, "");

      return `${sanitizedName}.${extension}`;
    };

    // Handle main image
    const mainImageFile = formData.get("mainImage");
    let mainImageUrl = null;
    if (mainImageFile) {
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
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(
        mainImagePath,
        Buffer.from(await mainImageFile.arrayBuffer())
      );
      mainImageUrl = `/assets/images/rooms/mainimage/${sanitizedMainImageName}`;
    }

    // Handle thumbnail images
    const thumbnailFiles = formData.getAll("thumbnailImages");
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
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "thumbnailimages"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(
        thumbnailPath,
        Buffer.from(await thumbnailFile.arrayBuffer())
      );
      thumbnailImageUrls.push(
        `/assets/images/rooms/thumbnailimages/${sanitizedThumbnailName}`
      );
    }

    const newRoom = new RoomModel({
      name,
      description,
      igst,
      additionalGuestCosts,
      mainImage: mainImageUrl,
      thumbnailImages: thumbnailImageUrls,
      price,
      size,
      bedModel,
      maxGuests,
      roomNumbers, // Use the parsed data directly
      numberOfRooms,
      amenities,
      complementaryFoods,
    });

    await newRoom.save();

    return NextResponse.json({
      success: true,
      room: newRoom,
      message: "Room Added Successfully",
    });
  } catch (error) {
    console.error("Error processing the form data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
