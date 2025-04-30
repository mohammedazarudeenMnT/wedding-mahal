import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import RoomSettings from "../../../../utils/model/settings/room/roomSettingsSchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    let roomSettings = await RoomSettingsModel.findOne({});

    if (!roomSettings) {
      // Create default settings
      const defaultSettings = {
        checkIn: "10:00",
        checkOut: "09:00",
        weekend: ["Sun"],
        weekendPriceHike: 0,
        housekeepingBuffer: roomSettings?.manualControl ? undefined : 2,
        manualControl: false,
      };

      roomSettings = await RoomSettingsModel.create(defaultSettings);
    }

    return NextResponse.json(
      {
        success: true,
        settings: roomSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching room settings:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "An unexpected error occurred while fetching the room settings.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    const formData = await request.formData();
    const checkIn = formData.get("checkIn");
    const checkOut = formData.get("checkOut");
    const weekend = formData.getAll("weekend");
    const weekendPriceHike = parseFloat(formData.get("weekendPriceHike"));
    const manualControl = formData.get("manualControl");

    if (!checkIn || !checkOut || !weekend.length || isNaN(weekendPriceHike)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing form data" },
        { status: 400 }
      );
    }

    let updateData = {
      checkIn,
      checkOut,
      weekend,
      weekendPriceHike,
      manualControl: !!manualControl,
    };

    if (manualControl) {
      updateData.housekeepingBuffer = null;
    } else {
      const { bufferHours } = calculateBufferHours(checkIn, checkOut);
      updateData.housekeepingBuffer = bufferHours;
    }

    const updatedSettings = await RoomSettingsModel.findOneAndUpdate(
      {},
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: false,
        setDefaultsOnInsert: true,
      }
    );

    const responseSettings = updatedSettings.toObject();
    if (responseSettings.manualControl) {
      responseSettings.housekeepingBuffer = undefined;
    }

    return NextResponse.json(
      {
        success: true,
        settings: responseSettings,
        message: "Room settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing room settings:", error);
    let statusCode = error.message === "Hotel not found" ? 404 : 500;
    let errorMessage =
      error.message ||
      "An unexpected error occurred while processing the room settings.";

    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Validation error: " + error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}

function calculateBufferHours(checkIn, checkOut) {
  const [checkInHour] = checkIn.split(":").map(Number);
  const [checkOutHour] = checkOut.split(":").map(Number);
  const stayHours = 24 - checkInHour + checkOutHour;
  return {
    stayHours,
    bufferHours: 24 - stayHours,
  };
}
