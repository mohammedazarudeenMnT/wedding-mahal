import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";
import Crm from "../../../utils/model/Crm/CrmSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getHotelDatabase();
    const CrmModel = getModel("Crm", Crm);

    const contacts = await CrmModel.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        contacts,
        message: "Contacts retrieved successfully",
      },
      { status: 200 }
    );
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

export async function POST(request) {
  try {
    await getHotelDatabase();
    const CrmModel = getModel("Crm", Crm);

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      mobileno,
      propertyType,
      eventType,
      eventStartDate,
      eventEndDate,
      notes,
    } = body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobileno ||
      !propertyType ||
      !eventType ||
      !eventStartDate ||
      !eventEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const contact = await CrmModel.create({
      firstName,
      lastName,
      email,
      mobileno,
      propertyType,
      eventType,
      eventStartDate,
      eventEndDate,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        contact,
        message: "Contact created successfully",
      },
      { status: 201 }
    );
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
