"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./print.css";
import { format } from "date-fns";

const PaidStamp = () => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-10">
    <div className="border-[6px] border-[#00b976] rounded-xl px-8 py-4">
      <div
        className="text-[#00b976] text-5xl font-extrabold tracking-wider"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        PAID
      </div>
    </div>
    <div className="absolute inset-0 bg-[#00b976] opacity-5 rounded-xl"></div>
  </div>
);

const InvoiceContent = React.forwardRef(({ ...props }, ref) => {
  // Calculate daily rates and totals for each room
  const calculateDailyRates = (room, checkIn, checkOut, roomSettings) => {
    const dates = [];
    let currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    while (currentDate < endDate) {
      const dayOfWeek = format(currentDate, "EEE");
      const isWeekend = roomSettings?.weekend?.includes(dayOfWeek);
      const baseRate = parseFloat(room.ratePerNight) || 0;
      const weekendMultiplier = isWeekend
        ? 1 + (roomSettings?.weekendPriceHike || 0) / 100
        : 1;
      const dailyRate = baseRate * weekendMultiplier;

      dates.push({
        date: new Date(currentDate),
        isWeekend,
        baseRate: dailyRate,
        weekendHike: isWeekend ? roomSettings?.weekendPriceHike || 0 : 0,

        additionalCharge: parseFloat(room.additionalGuestCharge) || 0,
        taxes: {
          cgst: dailyRate * (parseFloat(room.taxes?.cgst || 0) / 100),
          sgst: dailyRate * (parseFloat(room.taxes?.sgst || 0) / 100),
          igst: dailyRate * (parseFloat(room.taxes?.igst || 0) / 100),
        },
        total: dailyRate + (parseFloat(room.additionalGuestCharge) || 0),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Transform rooms data for the invoice table
  const invoiceItems = props.rooms?.map((room) => {
    const dailyRates = calculateDailyRates(
      room,
      props.stayDetails?.checkIn,
      props.stayDetails?.checkOut,
      props.roomSettings
    );

    const subtotal = dailyRates.reduce((sum, day) => sum + day.baseRate, 0);
    const totalTaxes = dailyRates.reduce(
      (sum, day) => sum + day.taxes.cgst + day.taxes.sgst + day.taxes.igst,
      0
    );

    return {
      description: `${room.roomType} - Room ${room.roomNumber}`,
      dailyRates,
      subtotal,
      additionalGuestCharge: parseFloat(room.additionalGuestCharge) || 0, // Use the total from API
      taxes: totalTaxes,
      total:
        subtotal + (parseFloat(room.additionalGuestCharge) || 0) + totalTaxes,
    };
  });

  return (
    <div
      ref={ref}
      id="invoice-content"
      className="bg-white shadow-lg rounded-lg overflow-hidden print:bg-white print:shadow-none print:p-0 relative print:break-after-auto"
      style={{
        "--invoice-color": props.style?.color || "#00569B",
        width: "100%",
        minHeight: "fit-content",
        margin: "0 auto",
        pageBreakInside: "avoid",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        breakAfter: "auto",
      }}
    >
      {/* Add Paid Stamp if payment is completed */}
      {props.paymentDetails?.status === "completed" && <PaidStamp />}

      <div className="p-6 print:p-2">
        {" "}
        {/* Reduced padding */}
        <div className="flex justify-between items-start mb-6 print:mb-2">
          {" "}
          {/* Reduced margin */}
          <div>
            <h1
              className="text-3xl font-bold print:text-2xl"
              style={{ color: props.style?.color || "#00569B" }}
            >
              TAX INVOICE
            </h1>
            <p className="text-sm text-gray-600 print:text-sm">
              GST No: {props.hotelDetails?.gstNo}
            </p>
            <p className="text-sm text-gray-600 print:text-sm">
              Invoice No: {props.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600 print:text-sm">
              Booking No: {props.bookingNumber}
            </p>
            <p className="text-sm text-gray-600 print:text-sm">
              Date: {new Date(props.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="w-32 h-16 flex items-center justify-center print:w-20 print:h-10">
            {props.style?.logo?.url ? (
              <Image
                src={props.style.logo.url}
                alt="Company Logo"
                width={128}
                height={64}
                objectFit="contain"
                className="print:w-20"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                Logo
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6 print:gap-2 print:mb-2">
          {" "}
          {/* Reduced spacing */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700 print:text-base">
              Hotel Details
            </h2>
            <p className="font-medium text-gray-800 print:text-sm">
              {props.hotelDetails?.name}
            </p>
            <p className="text-sm text-gray-600 print:text-xs whitespace-pre-line">
              {props.hotelDetails?.address}
            </p>
            <p className="text-sm text-gray-600 print:text-xs">
              Email: {props.hotelDetails?.email}
            </p>
            <p className="text-sm text-gray-600 print:text-xs">
              Phone: {props.hotelDetails?.phone}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700 print:text-base">
              Billed To
            </h2>
            <p className="font-medium text-gray-800 print:text-sm">
              {props.customerDetails?.name}
            </p>
            <p className="text-sm text-gray-600 print:text-xs">
              {props.customerDetails?.address}
            </p>
            <p className="text-sm text-gray-600 print:text-xs">
              Email: {props.customerDetails?.email}
            </p>
            <p className="text-sm text-gray-600 print:text-xs">
              Phone: {props.customerDetails?.phone}
            </p>
          </div>
        </div>
        <div className="mb-6 print:mb-2">
          {" "}
          {/* Reduced margin */}
          <h2 className="text-lg font-semibold mb-2 text-gray-700 print:text-base">
            Payment Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 print:text-xs">
                <span className="font-medium">Payment Method:</span>{" "}
                <span className="capitalize">
                  {props.paymentDetails?.method}
                </span>
              </p>
              <p className="text-sm text-gray-600 print:text-xs">
                <span className="font-medium">Payment Status:</span>{" "}
                <span
                  className={`capitalize ${
                    props.paymentDetails?.status === "completed"
                      ? "text-green-600"
                      : props.paymentDetails?.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {props.paymentDetails?.status}
                </span>
              </p>
            </div>
          </div>
        </div>
        {/* Hall Details Section - Only display if hallDetails exists */}
        {props.hallDetails && (
          <div className="mb-6 print:mb-2">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 print:text-base">
              Hall Event Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-sm text-gray-600 print:text-xs">
                  <span className="font-medium">Event Type:</span>{" "}
                  {props.hallDetails.eventType}
                </p>
                <p className="text-sm text-gray-600 print:text-xs">
                  <span className="font-medium">Event Name:</span>{" "}
                  {props.hallDetails.eventName}
                </p>
                <p className="text-sm text-gray-600 print:text-xs">
                  <span className="font-medium">Guest Capacity:</span>{" "}
                  {props.hallDetails.guestCapacity} persons
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 print:text-xs">
                  <span className="font-medium">Decoration Package:</span>{" "}
                  {props.hallDetails.decorationPackage}
                </p>
                {props.hallDetails.additionalServices &&
                  props.hallDetails.additionalServices.length > 0 && (
                    <p className="text-sm text-gray-600 print:text-xs">
                      <span className="font-medium">Additional Services:</span>{" "}
                      {props.hallDetails.additionalServices.join(", ")}
                    </p>
                  )}
                {props.hallDetails.specialRequirements && (
                  <p className="text-sm text-gray-600 print:text-xs">
                    <span className="font-medium">Special Requirements:</span>{" "}
                    {props.hallDetails.specialRequirements}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Transaction History Section - Only display if transactions exist */}
        {props.transactions &&
          props.transactions.payments &&
          props.transactions.payments.length > 0 && (
            <div className="mb-6 print:mb-2">
              <h2 className="text-lg font-semibold mb-2 text-gray-700 print:text-base">
                Payment Transactions
              </h2>
              <table className="w-full mb-3 text-sm">
                <thead>
                  <tr
                    className="bg-gray-100 print:bg-gray-200"
                    style={{
                      backgroundColor: props.style?.color || "#00569B",
                      color: "#ffffff",
                    }}
                  >
                    <th className="py-2 px-2 text-left text-white-700">No.</th>
                    <th className="py-2 px-2 text-left text-white-700">Date</th>
                    <th className="py-2 px-2 text-right text-white-700">
                      Amount
                    </th>
                    <th className="py-2 px-2 text-left text-white-700">
                      Method
                    </th>
                    <th className="py-2 px-2 text-left text-white-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.transactions.payments.map((payment, index) => (
                    <tr
                      key={`payment-${index}`}
                      className="border-b border-gray-200"
                    >
                      <td className="py-1 px-2 text-gray-800 print:text-xs">
                        {payment.paymentNumber || index + 1}
                      </td>
                      <td className="py-1 px-2 text-gray-800 print:text-xs">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-1 px-2 text-right text-gray-800 print:text-xs">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-left text-gray-800 print:text-xs capitalize">
                        {payment.paymentMethod}{" "}
                        {payment.paymentType ? `(${payment.paymentType})` : ""}
                      </td>
                      <td className="py-1 px-2 text-left print:text-xs">
                        <span
                          className={`capitalize ${
                            payment.status === "completed"
                              ? "text-green-600"
                              : payment.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="py-1 px-2 font-semibold">
                      Total Paid
                    </td>
                    <td className="py-1 px-2 text-right font-semibold text-green-600">
                      ₹{props.transactions.totalPaid.toFixed(2)}
                    </td>
                    <td colSpan="2" className="py-1 px-2">
                      {props.transactions.isFullyPaid ? (
                        <span className="text-green-600 font-medium">
                          Fully Paid
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Remaining: ₹
                          {(
                            props.transactions.payableAmount -
                            props.transactions.totalPaid
                          ).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        <table className="w-full mb-6 print:mb-2">
          {/* Reduced margin */}
          <thead>
            <tr
              className="bg-gray-100 print:bg-gray-200"
              style={{
                backgroundColor: props.style?.color || "#00569B",
                color: "#ffffff",
              }}
            >
              <th className="py-2 px-4 text-left text-white-700">
                Room Details
              </th>
              <th className="py-2 px-4 text-right text-white-700">Date</th>
              <th className="py-2 px-4 text-right text-white-700">Base Rate</th>
              <th className="py-2 px-4 text-right text-white-700">Taxes</th>
              <th className="py-2 px-4 text-right text-white-700">
                Daily Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems?.map((item, roomIndex) => (
              // Replace fragment with div and add key
              <React.Fragment key={`room-${roomIndex}`}>
                {item.dailyRates.map((day, dayIndex) => (
                  <tr
                    key={`${roomIndex}-${dayIndex}-${day.date.toISOString()}`}
                    className="border-b border-gray-200"
                  >
                    <td className="py-2 px-4 text-gray-800 print:text-xs">
                      {dayIndex === 0 ? item.description : ""}
                      {day.isWeekend && (
                        <span className="text-xs text-blue-600">
                          {" "}
                          (Weekend Rate)
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                      {format(day.date, "dd MMM yyyy")}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                      ₹{day.baseRate.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                      ₹
                      {(
                        day.taxes.cgst +
                        day.taxes.sgst +
                        day.taxes.igst
                      ).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                      ₹
                      {(
                        day.baseRate +
                        (day.taxes.cgst + day.taxes.sgst + day.taxes.igst)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr key={`room-total-${roomIndex}`} className="bg-gray-50">
                  <td colSpan="2" className="py-2 px-4 font-semibold">
                    Room Total
                  </td>
                  <td className="py-2 px-4 text-right">
                    ₹{item.subtotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    ₹{item.taxes.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold">
                    ₹{(item.subtotal + item.taxes).toFixed(2)}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {/* Services Table - Only show if there are services */}
        {props.selectedServices && props.selectedServices.length > 0 && (
          <table className="w-full mb-6 print:mb-2">
            <thead>
              <tr
                className="bg-gray-100 print:bg-gray-200"
                style={{
                  backgroundColor: props.style?.color || "#00569B",
                  color: "#ffffff",
                }}
              >
                <th className="py-2 px-4 text-left text-white-700">
                  Additional Services
                </th>
                <th className="py-2 px-4 text-right text-white-700">
                  Quantity
                </th>
                <th className="py-2 px-4 text-right text-white-700">Price</th>
                <th className="py-2 px-4 text-right text-white-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {props.selectedServices.map((service, index) => (
                <tr
                  key={`service-${index}`}
                  className="border-b border-gray-200"
                >
                  <td className="py-2 px-4 text-gray-800 print:text-xs">
                    {service.name}
                  </td>
                  <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                    {service.quantity || 1}
                  </td>
                  <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                    ₹{service.price.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right text-gray-800 print:text-xs">
                    ₹
                    {(
                      service.totalAmount ||
                      service.price * (service.quantity || 1)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan="3" className="py-2 px-4 font-semibold">
                  Services Total
                </td>
                <td className="py-2 px-4 text-right font-semibold">
                  ₹
                  {props.selectedServices
                    .reduce(
                      (sum, service) =>
                        sum +
                        (service.totalAmount ||
                          service.price * (service.quantity || 1)),
                      0
                    )
                    .toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
        <div className="mb-6 print:mb-2">
          {" "}
          {/* Reduced margin */}
          <div className="flex justify-between py-2 print:py-1">
            <span className="text-gray-700 print:text-xs">Sub Total</span>
            <span className="text-gray-800 print:text-xs">
              ₹
              {invoiceItems
                ?.reduce((sum, item) => sum + item.subtotal, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 print:py-1">
            <span className="text-gray-700 print:text-xs">
              Additional Guest Charges
            </span>
            <span className="text-gray-800 print:text-xs">
              ₹
              {invoiceItems
                ?.reduce((sum, item) => sum + item.additionalGuestCharge, 0)
                .toFixed(2)}
            </span>
          </div>
          {/* Selected Services */}
          {props.selectedServices && props.selectedServices.length > 0 && (
            <div className="flex justify-between py-2 print:py-1">
              <span className="text-gray-700 print:text-xs">
                Additional Services
              </span>
              <span className="text-gray-800 print:text-xs">
                ₹
                {props.selectedServices
                  ?.reduce(
                    (sum, service) => sum + (service.totalAmount || 0),
                    0
                  )
                  .toFixed(2)}
              </span>
            </div>
          )}
          {/* Service Charge */}
          {props.amounts?.servicesCharge > 0 && (
            <div className="flex justify-between py-2 print:py-1">
              <span className="text-gray-700 print:text-xs">
                Service Charge
              </span>
              <span className="text-gray-800 print:text-xs">
                ₹{(props.amounts?.servicesCharge || 0).toFixed(2)}
              </span>
            </div>
          )}
          {/* Discount */}
          {props.amounts?.discount > 0 && (
            <div className="flex justify-between py-2 print:py-1">
              <span className="text-gray-700 print:text-xs">
                Discount ({props.amounts.discount}%)
              </span>
              <span className="text-green-600 print:text-xs">
                -₹{(props.amounts?.discountAmount || 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 print:py-1">
            <span className="text-gray-700 print:text-xs">Total Taxes</span>
            <span className="text-gray-800 print:text-xs">
              ₹
              {invoiceItems
                ?.reduce((sum, item) => sum + item.taxes, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 font-semibold text-lg print:text-sm">
            <span className="text-gray-800">Total Amount</span>
            <span className="text-gray-800">
              ₹
              {props.amounts?.totalAmount
                ? props.amounts.totalAmount.toFixed(2)
                : invoiceItems
                    ?.reduce((sum, item) => sum + item.total, 0)
                    .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div
        className="p-4 text-center text-sm print:hidden"
        style={{
          backgroundColor: props.style?.color || "#00569B",
          color: "#ffffff",
        }}
      >
        Discover more of our Products in Magizh
      </div>
    </div>
  );
});

InvoiceContent.displayName = "InvoiceContent";

export default function Invoice(props) {
  const invoiceRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!invoiceRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      const element = invoiceRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const content = clonedDoc.getElementById("invoice-content");
          if (content) {
            content.style.transform = "scale(0.95)";
            content.style.transformOrigin = "top center";
            content.style.margin = "0";
            content.style.padding = "0.3cm";
            content.style.width = "100%";
            content.style.height = "auto"; // Add this line
            content.style.breakAfter = "auto"; // Add this line
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        hotfixes: ["px_scaling"],
        putOnlyUsedFonts: true, // Add this line
        precision: 16, // Add this line
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Increased quality

      // Only use the exact height needed
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        imgWidth,
        Math.min(imgHeight, pageHeight),
        undefined,
        "FAST"
      );
      return pdf;
    } catch (error) {
      console.error("PDF generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await generatePDF();
      const pdfBlob = pdf.output("blob");
      window.open(URL.createObjectURL(pdfBlob));
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      pdf.save(`invoice-${props.invoiceNumber}.pdf`);
    } catch (error) {
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-end space-x-2 print:hidden">
        <button
          onClick={handlePrint}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? "Generating..." : "Open PDF"}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? "Generating..." : "Download PDF"}
        </button>
      </div>
      <InvoiceContent ref={invoiceRef} {...props} />
    </div>
  );
}
