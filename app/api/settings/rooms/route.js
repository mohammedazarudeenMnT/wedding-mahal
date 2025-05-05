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
        weekend: ["Sun"],
        weekendPriceHike: 0,
        propertyTypes: [],
        eventTypes: [],
        timeSlots: [],
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

    const data = await request.json();

    // Handle basic room settings
    const {
      weekend,
      weekendPriceHike,
      operation,
      type,
      name,
      oldName,
      fromTime,
      toTime,
    } = data;

    let updateQuery = {};

    if (operation) {
      // Handle CRUD operations for types
      switch (operation) {
        case "create":
          if (type === "timeSlot") {
            updateQuery = {
              $push: {
                [`${type}s`]: {
                  name,
                  fromTime,
                  toTime,
                },
              },
            };
          } else {
            updateQuery = {
              $push: { [`${type}s`]: { name } },
            };
          }
          break;
        case "update":
          if (type === "timeSlot") {
            updateQuery = {
              $set: {
                [`${type}s.$[elem].name`]: name,
                [`${type}s.$[elem].fromTime`]: fromTime,
                [`${type}s.$[elem].toTime`]: toTime,
              },
            };
          } else {
            updateQuery = {
              $set: { [`${type}s.$[elem].name`]: name },
            };
          }
          break;
        case "delete":
          updateQuery = {
            $pull: { [`${type}s`]: { name } },
          };
          break;
      }
    } else {
      // Handle basic settings update
      if (!weekend?.length || isNaN(weekendPriceHike)) {
        return NextResponse.json(
          { success: false, error: "Invalid or missing data" },
          { status: 400 }
        );
      }

      updateQuery = {
        $set: {
          weekend,
          weekendPriceHike,
        },
      };
    }

    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    // Add arrayFilters for update operations
    if (operation === "update") {
      options.arrayFilters = [{ "elem.name": oldName }];
    }

    const updatedSettings = await RoomSettingsModel.findOneAndUpdate(
      {},
      updateQuery,
      options
    );

    return NextResponse.json(
      {
        success: true,
        settings: updatedSettings,
        message: operation
          ? `${type} ${operation}d successfully`
          : "Room settings updated successfully",
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
