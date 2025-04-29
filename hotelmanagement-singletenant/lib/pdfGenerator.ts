
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { UserOptions } from "jspdf-autotable"
import type { BookingDetails } from "./types"

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDFWithAutoTable
  lastAutoTable?: AutoTableOutput
}

export async function generateBookingPDF(bookingDetails: BookingDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDFDocument()
      const { pageWidth, pageHeight, margin, contentWidth } = getPageDimensions(doc)

      addHeader(doc, bookingDetails, pageWidth)
      const currentY = addBookingDetails(doc, bookingDetails, margin, contentWidth)
      addImportantNotice(doc, currentY, margin, contentWidth)
      addFooter(doc, bookingDetails, pageHeight, margin, pageWidth)

      resolve(Buffer.from(doc.output("arraybuffer")))
    } catch (error) {
      reject(error)
    }
  })
}

function createPDFDocument(): jsPDFWithAutoTable {
  return new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable
}

function getPageDimensions(doc: jsPDFWithAutoTable) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  return { pageWidth, pageHeight, margin, contentWidth }
}

function addHeader(doc: jsPDFWithAutoTable, bookingDetails: BookingDetails, pageWidth: number) {
  // Add blue header background
  doc.setFillColor(0, 86, 155)
  doc.rect(0, 0, pageWidth, 50, "F")

  // Add header text
  doc.setTextColor(255, 255, 255)
  /* addCenteredText(doc, bookingDetails.hotelName, 25, 24, "bold") */
  addCenteredText(doc, bookingDetails.hotelDisplayName, 25, 24, "bold")
  addCenteredText(doc, "Booking Confirmation", 40, 20)
  doc.setTextColor(0, 0, 0)
}

interface AutoTableOutput {
  finalY: number;
}

function addBookingDetails(
  doc: jsPDFWithAutoTable,
  bookingDetails: BookingDetails,
  margin: number,
  contentWidth: number,
): number {
  const startY = 65
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Booking Details", margin, startY)

  // Format total amount with proper spacing
  const formattedAmount = `Rs. ${bookingDetails.totalAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const details = [
    { label: "Booking Reference:", value: bookingDetails.bookingNumber },
    { label: "Guest Name:", value: bookingDetails.firstName },
    { label: "Check-in:", value: bookingDetails.checkIn },
    { label: "Check-out:", value: bookingDetails.checkOut },
    { label: "Number of Rooms:", value: bookingDetails.numberOfRooms.toString() },
    { label: "Number of Guests:", value: bookingDetails.numberOfGuests.toString() },
    { label: "Room Type(s):", value: bookingDetails.roomTypes },
    { label: "Room Number(s):", value: bookingDetails.roomNumbers },
    { label: "Total Amount:", value: formattedAmount },
  ]

  doc.autoTable({
    startY: startY + 10,
    head: [["Details", "Information"]],
    body: details.map((detail) => [detail.label, detail.value]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [0, 86, 155],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 12,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.6 },
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  })

  return (doc.lastAutoTable?.finalY ?? startY + 50) + 10
}

function addImportantNotice(doc: jsPDFWithAutoTable, currentY: number, margin: number, contentWidth: number) {
  const noticeText =
    "Important: If you need to modify or cancel your reservation, please contact us at least 24 hours before your check-in date."

  // Add notice box
  doc.setFillColor(230, 247, 255)
  doc.setDrawColor(0, 86, 155)
  doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, "FD")

  // Add notice text
  doc.setTextColor(0, 86, 155)
  doc.setFontSize(11)
  const splitNotice = doc.splitTextToSize(noticeText, contentWidth - 10)
  doc.text(splitNotice, margin + 5, currentY + 7)
  doc.setTextColor(0, 0, 0)
}

function addFooter(
  doc: jsPDFWithAutoTable,
  bookingDetails: BookingDetails,
  pageHeight: number,
  margin: number,
  pageWidth: number,
): number {
  const footerY = pageHeight - margin

  // Add generation date above the footer line
  addCenteredText(doc, `Generated on ${new Date().toLocaleDateString("en-IN")}`, footerY - 35, 9)

  // Add footer line
  doc.setDrawColor(0, 86, 155)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 25, pageWidth - margin, footerY - 25)

  // Add footer content
  let currentY = footerY - 20
/*   currentY = addCenteredText(doc, bookingDetails.hotelName, currentY, 14, "bold") */
  currentY = addCenteredText(doc, bookingDetails.hotelDisplayName, currentY, 14, "bold")

  if (bookingDetails.hotelAddress) {
    currentY = addCenteredText(doc, bookingDetails.hotelAddress, currentY + 5, 11)
  }

  if (bookingDetails.hotelPhone) {
    currentY = addCenteredText(doc, `Phone: ${bookingDetails.hotelPhone}`, currentY + 5, 11)
  }

  if (bookingDetails.hotelEmail) {
    currentY = addCenteredText(doc, `Email: ${bookingDetails.hotelEmail}`, currentY + 5, 11)
  }

  return currentY
}

function addCenteredText(
  doc: jsPDFWithAutoTable,
  text: string,
  y: number,
  fontSize: number,
  fontStyle = "normal",
): number {
  doc.setFontSize(fontSize)
  doc.setFont("helvetica", fontStyle)
  doc.text(text, doc.internal.pageSize.width / 2, y, { align: "center" })
  return y + fontSize / 3
}



