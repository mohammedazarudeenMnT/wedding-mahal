import nodemailer from "nodemailer";
import Handlebars from 'handlebars';
import { bookingConfirmationTemplate } from "./templates/bookingConfirmationTemplate";
import { getHotelDatabase } from "../utils/config/hotelConnection";
import emailConfigurationSchema from "../utils/model/settings/emailConfiguration/emailConfigurationSchema";
import { generateBookingPDF } from "../lib/pdfGenerator"
import { bookingCancellationTemplate } from "./templates/bookingCancellationTemplate";
import { getModel } from "../utils/helpers/getModel";

export async function sendBookingConfirmationEmail({
  to,
  name,
  bookingDetails,
 
}: {
  to: string;
  name: string;
  bookingDetails: {
    bookingNumber: string;
    firstName: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    numberOfGuests: number;
    roomTypes: string;
    roomNumbers: string;
    hotelName: string;
    hotelDisplayName: string;
    hotelWebsite?: string;
    hotelAddress: string;  // Make this required
    hotelPhone: string;    // Make this required
    hotelEmail: string;    // Make this required
    totalAmount: number;
  };
 
}) {
  try {
    // Get hotel database using the same method as addbooking route
    const { hotelData } = await getHotelDatabase();  
    // Get email configuration from the user's database
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const emailConfig = await EmailConfig.findOne();

    if (!emailConfig) {
      throw new Error("Email configuration not found");
    }

      // Clean up the hotel name
      const cleanHotelName = bookingDetails.hotelName
      .split('-')
      .slice(0, -1) // Remove the last part (ID)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join with spaces instead of hyphens

      // Format the amount to Indian Rupees
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(bookingDetails.totalAmount);

    // Validate required fields
    const requiredFields = ['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'senderEmail'];
    for (const field of requiredFields) {
      if (!emailConfig[field]) {
        throw new Error(`Missing email configuration: ${field}`);
      }
    }

    // Create transport with email configuration
    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword
      },
      tls: {
        rejectUnauthorized: false // Only use this in development
      }
    });

    // const transport = nodemailer.createTransport({
    //   host: 'smtp.example.com',
    //   port: 465,
    //   secure: true, // Use SSL/TLS
    //   auth: {
    //     user: 'user@example.com',
    //     pass: 'password'
    //   },
    //   tls: {
    //     rejectUnauthorized: true // Always validate certificates in production
    //   }
    // });

    // Format dates if they are Date objects
    if (bookingDetails.checkIn && new Date(bookingDetails.checkIn).toString() !== 'Invalid Date') {
      bookingDetails.checkIn = new Date(bookingDetails.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (bookingDetails.checkOut && new Date(bookingDetails.checkOut).toString() !== 'Invalid Date') {
      bookingDetails.checkOut = new Date(bookingDetails.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Compile template with booking details
    const compiledTemplate = Handlebars.compile(bookingConfirmationTemplate);
    const htmlBody = compiledTemplate({
      ...bookingDetails,
      hotelDisplayName: bookingDetails.hotelDisplayName || cleanHotelName, // Use cleaned hotel name in template
      totalAmount: formattedAmount,
      name, // Add guest name to template context
      currentYear: new Date().getFullYear() // Add current year for footer
    });

    // Verify SMTP connection
    await transport.verify();

        // Generate PDF
        const pdfBuffer = await generateBookingPDF({
          ...bookingDetails,
          hotelDisplayName: bookingDetails.hotelDisplayName || cleanHotelName,
          totalAmount: bookingDetails.totalAmount // Use the original number value
        });

    // Send email
    const sendResult = await transport.sendMail({
      from: {
        name: bookingDetails.hotelDisplayName || cleanHotelName, // Use hotelDisplayName or cleanHotelName
        address: emailConfig.senderEmail
      },
      to,
      subject: `Booking Confirmation - ${bookingDetails.hotelDisplayName || cleanHotelName} - #${bookingDetails.bookingNumber}`,
      html: htmlBody,
      attachments: [
        {
          filename: `booking-confirmation-${bookingDetails.bookingNumber}.pdf`,
          content: pdfBuffer as Buffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("Email sent successfully with PDF attachment:", sendResult);
    return true;

  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  } finally {
    // Connection cleanup is handled by getHotelDatabase
  }
}

export async function sendBookingCancellationEmail({
  to,
  bookingDetails,
  
}: {
  to: string;
  bookingDetails: {
    bookingNumber: string;
    firstName: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    roomTypes: string;
    hotelName: string;
    hotelDisplayName: string; // Add this field
    hotelAddress?: string;
    hotelPhone?: string;
    hotelEmail?: string;
  };
}) {
  try {
    const { hotelData } = await getHotelDatabase();
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const emailConfig = await EmailConfig.findOne();

    if (!emailConfig) {
      throw new Error("Email configuration not found");
    }

    const cleanHotelName = bookingDetails.hotelName
      .split('-')
      .slice(0, -1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const compiledTemplate = Handlebars.compile(bookingCancellationTemplate);
    const htmlBody = compiledTemplate({
      ...bookingDetails,
      hotelDisplayName: bookingDetails.hotelDisplayName
    });

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword
      }
    });

    await transport.sendMail({
      from: {
        name: bookingDetails.hotelDisplayName || cleanHotelName, // Add the hotel name here
        address: emailConfig.senderEmail
      },
      to,
      subject: `Booking Cancellation - ${bookingDetails.hotelDisplayName || cleanHotelName} - #${bookingDetails.bookingNumber}`,
      html: htmlBody
    });

    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}