import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import ApiKeySchema from "../../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET(request, { params }) {
  const { paymentLinkId } = params;

  if (!paymentLinkId) {
    return NextResponse.json(
      { success: false, message: "Payment link ID is required" },
      { status: 400 }
    );
  }

  try {
    await getHotelDatabase();
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    const keys = await ApiKeys.findOne();

    let apiKey = keys?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_API_KEY;
    let secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Razorpay keys not found" },
        { status: 404 }
      );
    }

    const razorpay = new Razorpay({
      key_id: apiKey,
      key_secret: secretKey,
    });

    const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);

    return NextResponse.json({
      success: true,
      status: paymentLink.status,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
