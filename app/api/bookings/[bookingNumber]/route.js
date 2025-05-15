// app/api/[hotelDb]/bookings/[bookingNumber]/route.js
import { NextResponse } from "next/server";
import Guest from "../../../../utils/model/booking/bookingSchema";
import RoomSettings from "../../../../utils/model/settings/room/roomSettingsSchema";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import { updateComplementaryInventory } from "../../../../utils/helpers/inventoryHelpers";
import fs from "fs/promises";
import path from "path";
import { sendBookingCancellationEmail } from "../../../../lib/bookingMail";

export async function GET(request, { params }) {
  const { bookingNumber } = params;

  try {
    await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);

    const booking = await GuestModel.findOne({ bookingNumber });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error retrieving booking:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { bookingNumber } = params;
  console.log("Received bookingNumber:", bookingNumber);

  if (!bookingNumber) {
    return NextResponse.json(
      { success: false, message: "Booking number is missing" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    // Find the existing booking
    const existingBooking = await GuestModel.findOne({
      bookingNumber: bookingNumber,
    });
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const newStatus = formData.get("status");
    let emailSent = false; // Add this flag

    // Handle check-in inventory updates
    if (newStatus === "checkin" && existingBooking.status !== "checkin") {
      try {
        const inventoryUpdated = await updateComplementaryInventory(
          existingBooking
        );
        if (!inventoryUpdated) {
          console.warn(
            "Some complementary items could not be updated in inventory"
          );
        }
      } catch (error) {
        console.error("Error updating complementary inventory:", error);
        // Continue with booking update even if inventory update fails
      }
    }

    // If the booking is being cancelled, send cancellation email
    if (newStatus === "cancelled" && existingBooking.status !== "cancelled") {
      try {
        // Get hotel details first
        const { hotelData } = await getHotelDatabase();
        if (!hotelData) {
          console.warn("Hotel details not found, using fallback values");
        }

        // Clean up hotel name
        const hotelName = hotelData?.hotelName || hotelDb;

        // Create address string with fallbacks
        const addressParts = [];
        if (hotelData?.doorNo) addressParts.push(hotelData.doorNo);
        if (hotelData?.streetName) addressParts.push(hotelData.streetName);
        if (hotelData?.district) addressParts.push(hotelData.district);
        const hotelAddress =
          addressParts.length > 0
            ? addressParts.join(", ")
            : "Address not available";

        await sendBookingCancellationEmail({
          to: existingBooking.email,
          bookingDetails: {
            bookingNumber: existingBooking.bookingNumber,
            firstName: existingBooking.firstName,
            checkIn: existingBooking.checkInDate.toLocaleDateString(),
            checkOut: existingBooking.checkOutDate.toLocaleDateString(),
            numberOfRooms: existingBooking.numberOfRooms,
            roomTypes: existingBooking.rooms.map((r) => r.type).join(", "),
            hotelName: hotelName,
            hotelDisplayName: hotelName,
            hotelAddress: hotelAddress,
            hotelPhone: hotelData?.mobileNo || "Contact number not available",
            hotelEmail: hotelData?.emailId || "Email not available",
            /*    hotelName: existingHotel.hotelName,
              hotelDisplayName: cleanHotelName, // Add this line
              hotelAddress: `${existingHotel.doorNo}, ${existingHotel.streetName}, ${existingHotel.district}`,
              hotelPhone: existingHotel.mobileNo,
              hotelEmail: existingHotel.emailId */
          },
        });
        emailSent = true; // Set flag when email is sent successfully
        console.log("Cancellation email sent successfully");
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
        emailSent = false;
        // Continue with cancellation even if email fails
      }
    }

    // Create updated data object
    const updatedData = {};
    // Update status timestamp if status is changing
    if (newStatus && newStatus !== existingBooking.status) {
      updatedData[`statusTimestamps.${newStatus}`] = new Date();
    }
    // Handle basic fields
    for (const [key, value] of formData.entries()) {
      if (key === "rooms") {
        updatedData.rooms = JSON.parse(value);
      } else if (key === "guests") {
        updatedData.guests = JSON.parse(value);
      } else if (key === "checkInDate" || key === "checkOutDate") {
        updatedData[key] = new Date(value);
      } else if (key === "existingFiles") {
        // Set existing files as the base for uploadedFiles array
        updatedData.uploadedFiles = JSON.parse(value);
      } else if (!["newFiles", "uploadedFiles"].includes(key)) {
        updatedData[key] = value;
      }
    }

    // Handle verification fields
    if (formData.get("verificationType")) {
      updatedData.verificationType = formData.get("verificationType");
      updatedData.verificationId = formData.get("verificationId");
    }

    // Handle new file uploads
    const newFiles = formData.getAll("newFiles");
    if (newFiles.length > 0) {
      updatedData.uploadedFiles = updatedData.uploadedFiles || [];

      for (const file of newFiles) {
        if (!file.name) continue;

        // Existing file validation code
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.type}`);
        }

        if (file.size > maxSize) {
          throw new Error(`File size exceeds 5MB limit`);
        }

        // Save new file
        const uploadsDir = path.join(
          process.cwd(),
          "public",
          "assets",
          "images",
          "bookings",
          "guest_files"
        );
        await fs.mkdir(uploadsDir, { recursive: true });

        const filePath = path.join(uploadsDir, file.name);
        await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

        // Add new file to uploadedFiles array
        updatedData.uploadedFiles.push({
          fileName: file.name,
          filePath: `/assets/images/bookings/guest_files/${file.name}`,
          uploadDate: new Date(),
        });
      }
    }

    // Update the booking with merged data
    const updatedBooking = await GuestModel.findOneAndUpdate(
      { bookingNumber: bookingNumber },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    // // Create housekeeping tasks if status changed to checkout
    // if (
    //   formData.get("status") === "checkout" &&
    //   existingBooking.status !== "checkout"
    // ) {
    //   // Get housekeeping buffer from settings
    //   const settings = await RoomSettingsModel.findOne({});
    //   const bufferHours = settings?.housekeepingBuffer || 2; // Default 2 hours if not set

    //   for (const room of updatedBooking.rooms) {
    //     // Check for existing incomplete task
    //     const existingTask = await HousekeepingModel.findOne({
    //       roomNumber: room.number,
    //       bookingNumber: bookingNumber,
    //       status: { $ne: "completed" },
    //     });

    //     if (!existingTask) {
    //       const currentTime = new Date();
    //       const task = new HousekeepingModel({
    //         roomNumber: room.number,
    //         roomType: room.type,
    //         bookingNumber: bookingNumber,
    //         checkOutDate: currentTime,
    //         guests: updatedBooking.guests,
    //         status: "pending",
    //         priority: "medium",
    //         reservationStatus: "checkout",
    //         expectedStartTime: currentTime,
    //         expectedEndTime: new Date(
    //           currentTime.getTime() + bufferHours * 60 * 60 * 1000
    //         ),
    //         notes:
    //           existingBooking.checkOutDate > currentTime
    //             ? `Early checkout - Original checkout date was: ${existingBooking.checkOutDate.toLocaleDateString()}`
    //             : undefined,
    //       });

    //       await task.save();
    //     }
    //   }
    // }

    return NextResponse.json(
      {
        success: true,
        booking: updatedBooking,
        message: "Booking updated successfully",
        emailSent: emailSent, // Add this line to include email status in response
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating booking:", error);
    let statusCode = 500;
    let errorMessage =
      "An unexpected error occurred while updating the booking.";

    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Validation error: " + error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function DELETE(request, { params }) {
  const { bookingNumber } = params;
  console.log("Received bookingNumber:", bookingNumber);

  if (!bookingNumber) {
    return NextResponse.json(
      { success: false, message: "Booking number is missing" },
      { status: 400 }
    );
  }

  try {
    await getHotelDatabase();

    const GuestModel = getModel("Guest", Guest);

    // Find the booking by booking number
    const booking = await GuestModel.findOne({ bookingNumber: bookingNumber });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete associated files
    if (booking.uploadedFiles && booking.uploadedFiles.length > 0) {
      for (const file of booking.uploadedFiles) {
        const filePath = path.join(process.cwd(), "public", file.filePath);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
        }
      }
    }

    // Delete the booking
    await GuestModel.deleteOne({ bookingNumber: bookingNumber });

    return NextResponse.json(
      { success: true, message: "Booking deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
