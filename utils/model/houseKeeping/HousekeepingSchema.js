import mongoose from "mongoose";
import RoomSettings from "../settings/room/roomSettingsSchema";
import Room from "../room/roomSchema";
import { getModel } from "../../../utils/helpers/getModel";

const housekeepingSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    roomType: { type: String, required: true },
    bookingNumber: { type: String },
    checkOutDate: { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    reservationStatus: {
      type: String,
      enum: ["checkin", "checkout", "available", "booked", "maintenance"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "maintenance"],
      default: "pending",
    },
    startTime: Date,
    endTime: Date,
    assignedTo: String,
    notes: String,
    expectedStartTime: { type: Date },
    expectedEndTime: { type: Date },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    isDelayed: { type: Boolean, default: false },
    guests: {
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Add method to check if housekeeping can be created for booked status
housekeepingSchema.methods.canCreateHousekeepingForBooked = async function () {
  try {
    const RoomModel = getModel("Room", Room);
    const room = await RoomModel.findOne({
      "roomNumbers.number": this.roomNumber,
    });

    if (room) {
      const roomData = room.roomNumbers.find(
        (rn) => rn.number === this.roomNumber
      );
      const currentBooking = roomData?.bookeddates?.find(
        (date) => date.status === "booked" && date.checkIn
      );

      if (currentBooking) {
        // Calculate time until check-in
        const timeUntilCheckIn = new Date(currentBooking.checkIn) - new Date();
        const hoursUntilCheckIn = timeUntilCheckIn / (1000 * 60 * 60);

        return {
          canCreate: hoursUntilCheckIn >= 2, // Minimum 2 hours before check-in
          checkInTime: currentBooking.checkIn,
          message:
            hoursUntilCheckIn >= 2
              ? `Must complete before check-in at ${new Date(
                  currentBooking.checkIn
                ).toLocaleString()}`
              : "Not enough time before check-in",
        };
      }
    }
    return { canCreate: false, message: "No booking found" };
  } catch (error) {
    console.error("Error checking booked status:", error);
    return { canCreate: false, message: "Error checking booking status" };
  }
};

// Add pre-save middleware to set expectedEndTime
housekeepingSchema.pre("save", async function (next) {
  const previousStatus = this.isModified("status")
    ? this._original?.status
    : undefined;

  // Store the original status before any changes
  if (this.isNew) {
    this._original = { status: this.status };
  }

  try {
    // Handle maintenance task creation
    if (
      (this.isNew || this.isModified("status")) &&
      this.status === "maintenance"
    ) {
      const RoomModel = getModel("Room", Room);

      const room = await RoomModel.findOne({
        name: this.roomType,
      });

      if (room) {
        const roomNumberIndex = room.roomNumbers.findIndex(
          (rn) => rn.number === this.roomNumber
        );
        if (roomNumberIndex !== -1) {
          // Generate maintenance booking number if not exists
          if (!this.bookingNumber) {
            this.bookingNumber = `MAINT-${Date.now()}`;
          }

          // Calculate start time based on future bookings
          const futureBookings = room.roomNumbers[
            roomNumberIndex
          ].bookeddates?.filter(
            (date) => date.checkOut && new Date(date.checkOut) > new Date()
          );

          const startTime =
            futureBookings?.length > 0
              ? new Date(
                  Math.max(...futureBookings.map((b) => new Date(b.checkOut)))
                )
              : new Date();

          // Set all time fields consistently
          this.startTime = startTime;
          this.expectedStartTime = startTime;
          this.actualStartTime = startTime;

          // First remove any existing maintenance entries for this room
          room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[
            roomNumberIndex
          ].bookeddates.filter((date) => !(date.status === "maintenance"));

          // Add new maintenance entry
          room.roomNumbers[roomNumberIndex].bookeddates.push({
            bookingNumber: this.bookingNumber,
            status: "maintenance",
            checkIn: startTime,
            checkOut: null,
          });

          await room.markModified("roomNumbers");
          await room.save();

          // Verify the maintenance entry
          const verifyRoom = await RoomModel.findOne({
            name: this.roomType,
            "roomNumbers.number": this.roomNumber,
          });
          console.log(
            "Maintenance entries after save:",
            verifyRoom.roomNumbers[roomNumberIndex].bookeddates.filter(
              (d) => d.status === "maintenance"
            )
          );
        }
      }
    }

    // Handle maintenance completion
    if (
      this.isModified("status") &&
      this.status === "completed" &&
      this.reservationStatus === "maintenance"
    ) {
      const RoomModel = getModel("Room", Room);
      const completionTime = new Date();

      // Set completion times
      this.endTime = completionTime;
      this.actualEndTime = completionTime;

      const room = await RoomModel.findOne({
        name: this.roomType,
      });

      if (room) {
        // Find the specific room number
        const roomNumberIndex = room.roomNumbers.findIndex(
          (rn) => rn.number === this.roomNumber
        );
        if (roomNumberIndex !== -1) {
          // Find and remove only the specific maintenance booking
          const maintenanceBooking = room.roomNumbers[
            roomNumberIndex
          ].bookeddates.find(
            (date) =>
              date.status === "maintenance" &&
              date.bookingNumber === this.bookingNumber
          );

          if (maintenanceBooking) {
            room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[
              roomNumberIndex
            ].bookeddates.filter(
              (date) =>
                !(
                  date.status === "maintenance" &&
                  date.bookingNumber === this.bookingNumber
                )
            );

            // Set the maintenance end time
            this.actualEndTime = completionTime;
            this.endTime = completionTime;

            await room.markModified("roomNumbers");
            await room.save();

            // Verify the changes
            const verifyRoom = await RoomModel.findOne({
              name: this.roomType,
              "roomNumbers.number": this.roomNumber,
            });
            console.log("Maintenance booking removed:", this.bookingNumber);
            console.log(
              "Current bookeddates:",
              verifyRoom.roomNumbers[roomNumberIndex].bookeddates
            );
          } else {
            console.log("Maintenance booking not found:", this.bookingNumber);
          }
        }
      }
    }
    // Handle checkout and available status
    if (
      this.isNew &&
      (this.reservationStatus === "checkout" ||
        this.reservationStatus === "available")
    ) {
      const RoomModel = getModel("Room", Room);
      const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

      // Get room settings to check manual control
      const settings = await RoomSettingsModel.findOne({});

      const room = await RoomModel.findOne({
        name: this.roomType,
      });

      if (room) {
        const roomNumberIndex = room.roomNumbers.findIndex(
          (rn) => rn.number === this.roomNumber
        );

        if (roomNumberIndex !== -1) {
          // Remove the existing checkout booking
          room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[
            roomNumberIndex
          ].bookeddates.filter(
            (date) => date.bookingNumber !== this.bookingNumber
          );

          const startTime = new Date();
          this.expectedStartTime = startTime;

          const housekeepingEntry = {
            bookingNumber: this.bookingNumber,
            status: "pending",
            checkIn: startTime,
            // Set checkOut based on reservationStatus and manualControl
            checkOut:
              this.reservationStatus === "available"
                ? null
                : settings?.manualControl
                ? null
                : this.expectedEndTime,
          };

          room.roomNumbers[roomNumberIndex].bookeddates.push(housekeepingEntry);
          await room.markModified("roomNumbers");
          await room.save();
        }
      }
    }
    // Handle cleanup after housekeeping completion
    if (this.isModified("status") && this.status === "completed") {
      const RoomModel = getModel("Room", Room);
      const room = await RoomModel.findOne({
        name: this.roomType,
      });

      if (room) {
        const roomNumberIndex = room.roomNumbers.findIndex(
          (rn) => rn.number === this.roomNumber
        );

        if (roomNumberIndex !== -1) {
          // Remove the housekeeping entry
          room.roomNumbers[roomNumberIndex].bookeddates = room.roomNumbers[
            roomNumberIndex
          ].bookeddates.filter(
            (date) => date.bookingNumber !== this.bookingNumber
          );

          await room.markModified("roomNumbers");
          await room.save();
        }
      }
    }
    // Normal task handling
    // Add new cleanup logic for manual completion
    if (this.isModified("status") && this.status === "completed") {
      try {
        if (this.reservationStatus === "checkout") {
          const RoomModel = getModel("Room", Room);
          const room = await RoomModel.findOne({
            name: this.roomType,
          });

          if (room) {
            const roomIndex = room.roomNumbers.findIndex(
              (rn) => rn.number === this.roomNumber
            );

            if (roomIndex !== -1) {
              console.log(
                "Before cleanup:",
                room.roomNumbers[roomIndex].bookeddates
              );

              // Remove the specific booking
              room.roomNumbers[roomIndex].bookeddates = room.roomNumbers[
                roomIndex
              ].bookeddates.filter(
                (date) => date.bookingNumber !== this.bookingNumber
              );

              console.log(
                "After cleanup:",
                room.roomNumbers[roomIndex].bookeddates
              );
              await room.markModified("roomNumbers");
              await room.save();
            }
          }
        }
      } catch (error) {
        console.error("Error cleaning up room data:", error);
      }
    }

    if (this.isNew || !this.expectedEndTime) {
      try {
        const RoomSettingsModel = getModel("RoomSettings", RoomSettings);
        const settings = await RoomSettingsModel.findOne({});

        if (settings?.manualControl) {
          // When manual control is enabled, don't set expectedEndTime
          this.expectedStartTime = new Date();
          this.expectedEndTime = null;
          console.log(
            "Manual housekeeping control enabled - no buffer time set"
          );
        } else {
          // Get buffer time from settings or use default
          const bufferHours = settings?.housekeepingBuffer || 2;
          this.expectedStartTime = new Date();
          this.expectedEndTime = new Date(
            new Date().getTime() + bufferHours * 60 * 60 * 1000
          );
          console.log(`Using housekeeping buffer of ${bufferHours} hours`);
        }
      } catch (error) {
        console.error(
          "Error getting RoomSettings, using default buffer:",
          error
        );
        // Fallback to default 10 minutes if settings unavailable
        this.expectedStartTime = new Date();
        this.expectedEndTime = new Date(
          new Date().getTime() + 10 * 60 * 1000 // 10 minutes in milliseconds
        );
      }
    }

    // Handle booked status
    if (this.reservationStatus === "booked") {
      const bookingCheck = await this.canCreateHousekeepingForBooked();
      if (!bookingCheck.canCreate) {
        throw new Error(bookingCheck.message);
      }

      // Set end time to 2 hours before check-in
      const checkInTime = new Date(bookingCheck.checkInTime);
      this.expectedEndTime = new Date(
        checkInTime.getTime() - 2 * 60 * 60 * 1000
      );
      this.expectedStartTime = new Date();
    }
  } catch (error) {
    console.error("Error in housekeeping pre-save middleware:", error);
    throw error;
  }

  next();
});

export default housekeepingSchema;
