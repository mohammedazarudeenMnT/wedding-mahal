// app/api/bookings/route.js
import { NextResponse } from "next/server";
import Guest from "../../../utils/model/booking/bookingSchema";
import FinanceSettings from "../../../utils/model/settings/finance/invoice/invoiceSettingsSchema";
import Invoice from "../../../utils/model/financials/invoices/invoiceSchema";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";
import { getUniqueGuestId } from "../../../utils/helpers/guestIdGenerator";

// Add export config for static rendering
export const dynamic = "force-dynamic";

// Update getNextInvoiceNumber function
async function getNextInvoiceNumber(FinanceSettingsModel) {
  let settings = await FinanceSettingsModel.findOne({});
  if (!settings) {
    throw new Error("Finance settings not found");
  }

  const activeYear = settings.financialYearHistory.find(
    (year) => year.isActive
  );
  if (!activeYear) {
    throw new Error("No active financial year found");
  }

  // Always increment by 1, starting from 0
  const nextSequence = (activeYear.sequence || 0) + 1;

  // Update both sequences atomically in one operation
  const updatedSettings = await FinanceSettingsModel.findOneAndUpdate(
    {
      _id: settings._id,
      "financialYearHistory._id": activeYear._id,
    },
    {
      $set: {
        "invoiceFormat.sequence": nextSequence,
        "financialYearHistory.$.sequence": nextSequence,
      },
    },
    { new: true }
  );

  if (!updatedSettings) {
    throw new Error("Failed to update sequence numbers");
  }

  return `${settings.invoiceFormat.prefix}/${activeYear.yearFormat}/${nextSequence}`;
}

async function createInvoiceRecord(booking, hotelData, InvoiceModel) {
  // Ensure booking has invoice number
  if (!booking.invoiceNumber) {
    throw new Error("Invoice number is required");
  }

  const invoiceData = {
    invoiceNumber: booking.invoiceNumber, // This should now be defined
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerDetails: {
      name: `${booking.firstName} ${booking.lastName}`,
      email: booking.email,
      phone: booking.mobileNo,
      address: booking.address,
    },
    hotelDetails: {
      name: hotelData.hotelName,
      gstNo: hotelData.gstNo,
      address: `${hotelData.doorNo}, ${hotelData.streetName}, ${hotelData.district}, ${hotelData.state} - ${hotelData.pincode}`,
      email: hotelData.emailId,
      phone: hotelData.mobileNo,
    },
    stayDetails: {
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      numberOfNights: booking.numberOfNights,
      numberOfRooms: booking.numberOfRooms,
      numberOfGuests: booking.guests,
    },
    rooms: booking.rooms.map((room) => ({
      roomNumber: room.number,
      roomType: room.type,
      ratePerNight: room.price,
      additionalGuestCharge: room.additionalGuestCharge || 0,
      taxes: {
        cgst: room.cgst || 0,
        sgst: room.sgst || 0,
        igst: room.igst || 0,
      },
      totalAmount: room.totalAmount,
    })),
    paymentDetails: {
      method: booking.paymentMethod,
      status: booking.paymentStatus,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      razorpayPaymentLinkId: booking.razorpayPaymentLinkId,
      razorpayQrCodeId: booking.razorpayQrCodeId,
    },
    amounts: {
      subtotal: booking.rooms.reduce((sum, room) => sum + room.price, 0),
      totalTax: booking.rooms.reduce(
        (sum, room) =>
          sum + (room.igst || 0) + (room.cgst || 0) + (room.sgst || 0),
        0
      ),
      totalAmount: booking.rooms.reduce(
        (sum, room) => sum + room.totalAmount,
        0
      ),
    },
  };

  try {
    // Check if invoice already exists
    const existingInvoice = await InvoiceModel.findOne({
      invoiceNumber: booking.invoiceNumber,
    });

    if (!existingInvoice) {
      await InvoiceModel.create(invoiceData);
    }
  } catch (error) {
    console.error("Error creating invoice record:", error);
    throw error;
  }
}

async function updateBookingStatuses(
  GuestModel,
  FinanceSettingsModel,
  hotelData,
  InvoiceModel
) {
  const now = new Date();
  const bookingsToUpdate = await GuestModel.find({
    status: { $in: ["booked", "checkin"] },
    checkOutDate: { $lt: now },
  });

  const updatePromises = bookingsToUpdate.map(async (booking) => {
    if (booking.status !== "checkout") {
      try {
        // First generate invoice number
        const invoiceNumber = await getNextInvoiceNumber(FinanceSettingsModel);
        if (!invoiceNumber) {
          throw new Error("Failed to generate invoice number");
        }

        // Update booking with invoice number
        booking.status = "checkout";
        booking.invoiceNumber = invoiceNumber;
        await booking.save();

        // Then create invoice record
        await createInvoiceRecord(
          {
            ...booking.toObject(),
            invoiceNumber, // Ensure invoiceNumber is passed
          },
          hotelData,
          InvoiceModel
        );
      } catch (error) {
        console.error("Error processing checkout:", error);
        booking.status = "checkout";
        await booking.save();
      }
    }
    return booking;
  });

  await Promise.all(updatePromises);
  return bookingsToUpdate.length;
}

export async function GET(request) {
  try {
    const { hotelData } = await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);
    const FinanceSettingsModel = getModel("FinanceSettings", FinanceSettings);
    const InvoiceModel = getModel("Invoice", Invoice);

    // Update booking statuses with invoice generation
    const updatedCount = await updateBookingStatuses(
      GuestModel,
      FinanceSettingsModel,
      hotelData,
      InvoiceModel
    );

    // Get search params safely
    const searchParams = new URL(request.url).searchParams;
    const query = {
      ...(searchParams.get("bookingNumber") && {
        bookingNumber: searchParams.get("bookingNumber"),
      }),
      ...(searchParams.get("email") && { email: searchParams.get("email") }),
      ...(searchParams.get("checkInDate") && {
        checkInDate: { $gte: new Date(searchParams.get("checkInDate")) },
      }),
      ...(searchParams.get("checkOutDate") && {
        checkOutDate: { $lte: new Date(searchParams.get("checkOutDate")) },
      }),
    };

    // Fetch bookings based on the query
    const bookings = await GuestModel.find(query).lean();

    // Add guest IDs to the bookings with enhanced error handling
    const bookingsWithGuestIds = await Promise.all(
      bookings.map(async (booking) => {
        if (!booking.email && !booking.mobileNo) {
          console.warn(`Booking ${booking.bookingNumber} missing contact info`);
          return { ...booking, guestId: null };
        }

        try {
          const guestId = await getUniqueGuestId({
            email: booking.email,
            mobileNo: booking.mobileNo,
          });
          return { ...booking, guestId };
        } catch (error) {
          console.error(
            `Error adding guest ID for booking ${booking.bookingNumber}:`,
            error
          );
          return { ...booking, guestId: null };
        }
      })
    );

    // Generate invoice numbers for checkout bookings that don't have one
    const updatedBookings = await Promise.all(
      bookingsWithGuestIds.map(async (booking) => {
        if (booking.status === "checkout" && !booking.invoiceNumber) {
          try {
            // Lock the document while updating
            const updatedBooking = await GuestModel.findOneAndUpdate(
              {
                _id: booking._id,
                invoiceNumber: { $exists: false }, // Only update if no invoice number
              },
              {
                $set: {
                  invoiceNumber: await getNextInvoiceNumber(
                    FinanceSettingsModel
                  ),
                },
              },
              { new: true, runValidators: true }
            ).lean();

            if (updatedBooking) {
              await createInvoiceRecord(
                updatedBooking,
                hotelData,
                InvoiceModel
              );
              return updatedBooking;
            }
            return booking;
          } catch (error) {
            console.error("Error generating invoice:", error);
            return booking;
          }
        }
        return booking;
      })
    );

    // Remove sensitive information before sending the response
    const sanitizedBookings = updatedBookings.map((booking) => {
      const { ...sanitizedBooking } = booking;
      return sanitizedBooking;
    });

    return NextResponse.json(
      {
        success: true,
        bookings: sanitizedBookings,
        message: "Bookings retrieved successfully",
        updatedBookings: updatedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: error.status || 500 }
    );
  }
}
