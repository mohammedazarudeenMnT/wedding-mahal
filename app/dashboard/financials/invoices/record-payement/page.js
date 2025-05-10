"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader";
import { usePagePermission } from "../../../../../hooks/usePagePermission";
import { Button } from "@heroui/button";
import { RadioGroup, Radio } from "@heroui/radio";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card } from "@heroui/card";
import { Spinner } from "react-bootstrap";
import Script from "next/script";
import { FaSearch, FaTimes } from "react-icons/fa";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";

const RecordPaymentPage = () => {
  const hasPermission = usePagePermission(
    "Financials/Invoices/record-payement",
    "view"
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get booking data from URL parameters
  const bookingData = searchParams.get("bookingData");
  const [decodedBookingData, setDecodedBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // For customer name search and transaction fetching
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    customerName: "",
    payableAmount: "",
    amount: "",
    paymentType: "",
    bank: "",
    transactionId: "",
    paymentDate: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});

  const banks = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Other"];

  // Add pagination logic - calculate paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return transactions.slice(start, end);
  }, [transactions, currentPage, rowsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Adjust the total pages calculation
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  // Decode booking data on component mount
  useEffect(() => {
    if (!hasPermission) return;

    // If no booking data is provided, show customer search
    if (!bookingData) {
      setShowCustomerSearch(true);
      setIsLoading(false);
      return;
    }

    try {
      const decoded = JSON.parse(decodeURIComponent(bookingData));
      setDecodedBookingData(decoded);

      // Initialize form data with booking information
      setFormData({
        customerName: `${decoded.firstName} ${decoded.lastName}`,
        payableAmount: decoded.totalAmount.total.toString(),
        amount: decoded.totalAmount.total.toString(),
        paymentDate: getCurrentDate(),
        paymentType: "",
        bank: "",
        transactionId: "",
        remarks: "",
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to parse booking data:", error);
      toast.error("Invalid booking data");
      router.push("/dashboard/bookings");
    }
  }, [bookingData, hasPermission, router]);

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  // Function to search transactions by customer name
  const searchTransactionsByCustomerName = async () => {
    if (!customerNameSearch.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `/api/financials/transactions/search?customerName=${encodeURIComponent(
          customerNameSearch
        )}`
      );

      if (response.data.success && response.data.transactions.length > 0) {
        setTransactions(response.data.transactions);
      } else {
        setTransactions([]);
        toast.info("No transactions found for this customer");
      }
    } catch (error) {
      console.error("Error searching transactions:", error);
      toast.error("Failed to search transactions");
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle selecting a transaction
  const handleSelectTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setSelectedBookingId(transaction.bookingId);

    try {
      // Fetch all transactions for this booking
      const response = await axios.get(
        `/api/financials/transactions?bookingId=${transaction.bookingId}`
      );

      if (response.data.success) {
        setPaymentHistory(response.data.transactions);

        // Set form data based on the transaction
        setFormData({
          customerName: transaction.customerName,
          payableAmount: transaction.payableAmount.toString(),
          amount:
            response.data.paymentSummary?.remainingBalance.toString() || "0",
          paymentDate: getCurrentDate(),
          paymentType: "",
          bank: "",
          transactionId: "",
          remarks: "",
        });
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      toast.error("Failed to fetch transaction history");

      // Set form data even if transaction history fails
      setFormData({
        customerName: transaction.customerName,
        payableAmount: transaction.payableAmount.toString(),
        amount: transaction.remainingBalance?.toString() || "0",
        paymentDate: getCurrentDate(),
        paymentType: "",
        bank: "",
        transactionId: "",
        remarks: "",
      });
    }
  };

  const handleInputChange = (name, value) => {
    // Special handling for amount field to ensure it's a proper number
    if (name === "amount") {
      // Parse as float and ensure it's a valid number
      const numValue = parseFloat(value);
      value = isNaN(numValue) ? "" : value;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // All payment methods require amount
    if (
      !formData.amount ||
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Please enter a valid amount";
    }

    // Payment date is required for all methods
    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    // Method-specific validations
    if (paymentMethod === "online") {
      if (!formData.paymentType) {
        newErrors.paymentType = "Payment type is required";
      }
      if (!formData.bank) {
        newErrors.bank = "Bank selection is required";
      }
      if (!formData.transactionId) {
        newErrors.transactionId = "Transaction ID is required";
      }
    } else if (paymentMethod === "cod") {
      if (!formData.paymentType) {
        newErrors.paymentType = "Payment type is required";
      }
    }
    // Payment links don't require paymentType, bank, or transactionId

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Ensure amount is properly parsed as a number
      const paymentDetails = {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentMethod,
      };

      // Set default valid paymentType based on payment method if not already set
      if (paymentMethod === "paymentLink" && !paymentDetails.paymentType) {
        paymentDetails.paymentType = "";
      } else if (paymentMethod === "cod" && !paymentDetails.paymentType) {
        paymentDetails.paymentType = "cash";
      }

      // For existing transactions (from customer search)
      if (selectedTransaction) {
        // Record an additional payment
        const transactionData = {
          bookingId: selectedTransaction.bookingId,
          bookingNumber: selectedTransaction.bookingNumber,
          paymentMethod: paymentDetails.paymentMethod,
          amount: paymentDetails.amount,
          transactionId: paymentDetails.transactionId || "",
          paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
          remarks: paymentDetails.remarks || "",
          status: "completed",
          customerName: paymentDetails.customerName,
          payableAmount: parseFloat(formData.payableAmount),
          paymentType: paymentDetails.paymentType || "",
          ...(paymentDetails.bank && { bank: paymentDetails.bank }),
        };

        if (paymentMethod === "paymentLink") {
          // Create payment link for existing booking
          const paymentLinkResponse = await axios.post(
            `/api/bookings/create-razorpay-payment-link`,
            {
              amount: paymentDetails.amount,
              currency: "INR",
              customer: {
                name: paymentDetails.customerName,
                email: selectedTransaction.customerEmail || "",
                contact: selectedTransaction.customerPhone || "",
              },
            }
          );

          if (paymentLinkResponse.data.success) {
            transactionData.razorpayPaymentLinkId =
              paymentLinkResponse.data.paymentLinkId;
            transactionData.status = "pending";

            // Save the transaction
            await axios.post("/api/financials/transactions", transactionData);

            // Open payment link in a new window
            window.open(paymentLinkResponse.data.paymentLink, "_blank");

            toast.success("Payment link generated and transaction recorded!");
            setTimeout(() => {
              router.push("/dashboard/bookings");
            }, 2000);
          } else {
            toast.error("Failed to generate payment link");
          }
        } else {
          // Process direct payment (cash, online)
          await axios.post("/api/financials/transactions", transactionData);

          toast.success("Payment recorded successfully!");
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);
        }
      } else if (decodedBookingData) {
        // New booking process
        const bookingFormData = new FormData();

        // Add all the properties from the decoded booking data
        Object.entries(decodedBookingData).forEach(([key, value]) => {
          if (key === "uploadedFiles") {
            // Skip uploadedFiles array as it will contain file objects that can't be properly serialized
            // We'll handle file uploads separately if needed
            return;
          }

          if (typeof value === "object" && value !== null) {
            bookingFormData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            bookingFormData.append(key, value.toString());
          }
        });

        // Special handling for hall-specific fields
        if (decodedBookingData.propertyType === "hall") {
          // Handle timeSlot (add individual fields)
          if (decodedBookingData.timeSlot) {
            bookingFormData.append(
              "timeSlotName",
              decodedBookingData.timeSlot.name || ""
            );
            bookingFormData.append(
              "timeSlotFromTime",
              decodedBookingData.timeSlot.fromTime || ""
            );
            bookingFormData.append(
              "timeSlotToTime",
              decodedBookingData.timeSlot.toTime || ""
            );
          }

          // Handle groomDetails (add individual fields)
          if (decodedBookingData.groomDetails) {
            bookingFormData.append(
              "groomName",
              decodedBookingData.groomDetails.name || ""
            );
            bookingFormData.append(
              "groomMobileNo",
              decodedBookingData.groomDetails.mobileNo || ""
            );
            bookingFormData.append(
              "groomEmail",
              decodedBookingData.groomDetails.email || ""
            );
            bookingFormData.append(
              "groomAddress",
              decodedBookingData.groomDetails.address || ""
            );
            bookingFormData.append(
              "groomDob",
              decodedBookingData.groomDetails.dob || ""
            );
            bookingFormData.append(
              "groomGender",
              decodedBookingData.groomDetails.gender || ""
            );
            bookingFormData.append(
              "groomVerificationId",
              decodedBookingData.groomDetails.verificationId || ""
            );
          }

          // Handle brideDetails (add individual fields)
          if (decodedBookingData.brideDetails) {
            bookingFormData.append(
              "brideName",
              decodedBookingData.brideDetails.name || ""
            );
            bookingFormData.append(
              "brideMobileNo",
              decodedBookingData.brideDetails.mobileNo || ""
            );
            bookingFormData.append(
              "brideEmail",
              decodedBookingData.brideDetails.email || ""
            );
            bookingFormData.append(
              "brideAddress",
              decodedBookingData.brideDetails.address || ""
            );
            bookingFormData.append(
              "brideDob",
              decodedBookingData.brideDetails.dob || ""
            );
            bookingFormData.append(
              "brideGender",
              decodedBookingData.brideDetails.gender || ""
            );
            bookingFormData.append(
              "brideVerificationId",
              decodedBookingData.brideDetails.verificationId || ""
            );
          }

          // Handle eventType (already handled in the default loop above)

          // Handle services
          if (decodedBookingData.services) {
            bookingFormData.append(
              "services",
              JSON.stringify(decodedBookingData.services)
            );
          }
        }

        // Add payment-specific details
        bookingFormData.append("paymentMethod", paymentDetails.paymentMethod);
        bookingFormData.append("paymentStatus", "completed");

        if (paymentDetails.paymentType) {
          bookingFormData.append("paymentType", paymentDetails.paymentType);
        }

        if (paymentDetails.transactionId) {
          bookingFormData.append("transactionId", paymentDetails.transactionId);
        }

        if (paymentDetails.bank) {
          bookingFormData.append("bank", paymentDetails.bank);
        }

        // For payment links, create the link first
        if (paymentDetails.paymentMethod === "paymentLink") {
          const paymentAmount = parseFloat(paymentDetails.amount);

          const linkResponse = await axios.post(
            `/api/bookings/create-razorpay-payment-link`,
            {
              amount: paymentAmount,
              currency: "INR",
              customer: {
                name: paymentDetails.customerName,
                email: decodedBookingData.email,
                contact: decodedBookingData.mobileNo,
              },
            }
          );

          if (linkResponse.data.success) {
            bookingFormData.append(
              "razorpayPaymentLinkId",
              linkResponse.data.paymentLinkId
            );
            bookingFormData.append("razorpayAmount", paymentAmount.toString());

            // Add property to indicate partial payment if needed
            if (paymentAmount < parseFloat(formData.payableAmount)) {
              bookingFormData.append("isPartialPayment", "true");
              bookingFormData.append(
                "remainingBalance",
                (parseFloat(formData.payableAmount) - paymentAmount).toString()
              );
            }

            // Open payment link in a new window
            window.open(linkResponse.data.paymentLink, "_blank");

            toast.info("Payment link generated. Waiting for payment...");

            // Poll for payment status
            const pollInterval = setInterval(async () => {
              try {
                const statusResponse = await axios.get(
                  `/api/bookings/check-payment-status/${linkResponse.data.paymentLinkId}`
                );

                if (statusResponse.data.status === "paid") {
                  clearInterval(pollInterval);
                  bookingFormData.append("paymentStatus", "completed");

                  // Create the booking
                  await processBooking(bookingFormData, {
                    ...paymentDetails,
                    razorpayPaymentLinkId: linkResponse.data.paymentLinkId,
                  });
                } else if (
                  statusResponse.data.status === "cancelled" ||
                  statusResponse.data.status === "expired"
                ) {
                  clearInterval(pollInterval);
                  toast.error("Payment was cancelled or expired");
                  setIsProcessing(false);
                }
              } catch (error) {
                console.error("Error checking payment status:", error);
              }
            }, 5000);

            // Set a timeout to stop polling after a reasonable time
            setTimeout(() => {
              clearInterval(pollInterval);
              if (isProcessing) {
                setIsProcessing(false);
                toast.warn(
                  "Payment time expired. Please try again if payment was made."
                );
              }
            }, 300000); // 5 minutes

            return;
          } else {
            toast.error("Failed to generate payment link");
            setIsProcessing(false);
            return;
          }
        } else {
          // For other payment methods, process the booking directly
          await processBooking(bookingFormData, paymentDetails);
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("An error occurred while processing the payment");
      setIsProcessing(false);
    }
  };

  const processBooking = async (bookingFormData, paymentDetails) => {
    try {
      // Create the booking
      const bookingResponse = await axios.post(
        `/api/bookings/addbooking`,
        bookingFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (bookingResponse.data.success) {
        const bookingData = bookingResponse.data.guest;

        // Save transaction data
        try {
          const paymentAmount = parseFloat(paymentDetails.amount);

          // Prepare transaction data
          const transactionData = {
            bookingId: bookingData._id,
            bookingNumber: bookingData.bookingNumber,
            paymentMethod: paymentDetails.paymentMethod,
            amount: paymentAmount,
            transactionId: paymentDetails.transactionId || "",
            paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
            remarks: paymentDetails.remarks || "",
            status: "completed",
            customerName: paymentDetails.customerName,
            payableAmount: parseFloat(formData.payableAmount),
            paymentType: paymentDetails.paymentType || "",
            ...(paymentDetails.razorpayPaymentLinkId && {
              razorpayPaymentLinkId: paymentDetails.razorpayPaymentLinkId,
            }),
            ...(paymentDetails.bank && { bank: paymentDetails.bank }),
          };

          // Save transaction data
          await axios.post("/api/financials/transactions", transactionData);

          toast.success("Booking completed successfully!");

          // Redirect to bookings page
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);
        } catch (transactionError) {
          console.error("Error saving transaction data:", transactionError);
          toast.warn(
            "Booking was successful but there was an error recording the transaction"
          );

          // Still redirect to bookings page
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);
        }
      } else {
        toast.error(bookingResponse.data.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);

      // Extract error message from the response if available
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An error occurred while creating the booking";

      toast.error(errorMessage);

      // Log additional information for debugging
      if (error.response?.data?.stack) {
        console.error("Error stack:", error.response.data.stack);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Show different fields based on payment method
  const showOnlineFields = paymentMethod === "online";
  const showPaymentLinkFields = paymentMethod === "paymentLink";
  const showHotelFields = paymentMethod === "cod";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Record Payment" />
      </div>

      <div className="container-fluid py-4">
        {isLoading ? (
          <div className="d-flex justify-content-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : showCustomerSearch && !selectedTransaction ? (
          // Show customer search form when no booking data and no transaction selected
          <div className="card shadow-sm mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="text-lg font-semibold mb-0">
                Find Existing Booking
              </h2>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-12">
                  <label className="form-label mb-1 fw-medium">
                    Customer name
                  </label>
                  <div className="search-input-container position-relative mb-1">
                    <Input
                      type="text"
                      value={customerNameSearch}
                      onChange={(e) => setCustomerNameSearch(e.target.value)}
                      placeholder="Search customer by name"
                      className="shadow-sm form-control ps-4 pe-4 border"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchTransactionsByCustomerName();
                        }
                      }}
                      aria-label="Search customer by name"
                    />
                    <div
                      className="position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        left: "0",
                        top: "0",
                        height: "100%",
                        width: "34px",
                        borderRight: customerNameSearch
                          ? "1px solid #eee"
                          : "none",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onClick={searchTransactionsByCustomerName}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                        e.currentTarget.querySelector("svg").style.opacity =
                          "1";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.querySelector("svg").style.opacity =
                          "0.7";
                      }}
                      role="button"
                      tabIndex="0"
                      aria-label="Search"
                      title="Click to search"
                    >
                      <FaSearch
                        className="text-hotel-primary"
                        style={{
                          fontSize: "0.9rem",
                          opacity: 0.7,
                          transition: "opacity 0.2s ease",
                        }}
                      />
                    </div>
                    {isSearching ? (
                      <div
                        className="position-absolute d-flex align-items-center justify-content-center"
                        style={{
                          right: "8px",
                          top: "0",
                          height: "100%",
                          width: "34px",
                        }}
                      >
                        <Spinner
                          animation="border"
                          size="sm"
                          role="status"
                          className="text-hotel-primary"
                        />
                      </div>
                    ) : (
                      customerNameSearch && (
                        <div
                          className="position-absolute d-flex align-items-center justify-content-center"
                          style={{
                            right: "8px",
                            top: "0",
                            height: "100%",
                            width: "34px",
                            cursor: "pointer",
                            borderLeft: "1px solid #eee",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            setCustomerNameSearch("");
                            setTransactions([]);
                          }}
                          aria-label="Clear search"
                          role="button"
                          tabIndex="0"
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f5f5f5")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <FaTimes
                            className="text-muted"
                            style={{
                              fontSize: "0.9rem",
                              transition: "color 0.2s ease",
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Search by customer&apos;s first or last name
                    </small>
                    <small className="text-muted d-none d-sm-block">
                      Press Enter or click{" "}
                      <FaSearch
                        className="text-hotel-primary mx-1"
                        style={{ fontSize: "0.7rem" }}
                      />{" "}
                      to search
                    </small>
                  </div>
                </div>
              </div>

              {transactions.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-3">
                    Found Transactions
                  </h3>
                  <Table
                    aria-label="Transactions table"
                    isStriped
                    shadow="sm"
                    selectionMode="none"
                    isHeaderSticky
                    className="mb-4"
                  >
                    <TableHeader>
                      <TableColumn>Booking #</TableColumn>
                      <TableColumn>Customer</TableColumn>
                      <TableColumn>Total Amount</TableColumn>
                      <TableColumn>Paid Amount</TableColumn>
                      <TableColumn>Remaining</TableColumn>
                      <TableColumn>Actions</TableColumn>
                    </TableHeader>
                    <TableBody
                      isLoading={isSearching}
                      loadingContent={<Spinner size="sm" />}
                      emptyContent={
                        transactions.length === 0
                          ? "No transactions found"
                          : null
                      }
                      items={paginatedTransactions}
                    >
                      {(transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>{transaction.bookingNumber}</TableCell>
                          <TableCell>{transaction.customerName}</TableCell>
                          <TableCell>₹{transaction.payableAmount}</TableCell>
                          <TableCell>₹{transaction.totalPaid}</TableCell>
                          <TableCell>₹{transaction.remainingBalance}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className={`${
                                transaction.isFullyPaid
                                  ? "bg-secondary"
                                  : "bg-hotel-primary"
                              } text-white px-3 py-1`}
                              onPress={() =>
                                handleSelectTransaction(transaction)
                              }
                              disabled={transaction.isFullyPaid}
                            >
                              {transaction.isFullyPaid ? "Fully Paid" : "Pay"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Add Pagination component */}
                  {transactions.length > 0 && (
                    <div className="d-flex justify-content-center my-3">
                      <Pagination
                        total={totalPages}
                        initialPage={1}
                        page={currentPage}
                        onChange={handlePageChange}
                        showControls
                        size="sm"
                        color="primary"
                        variant="bordered"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Payment Details</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Booking Summary */}
                <div className="bg-gray-50 p-3 p-md-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Booking Summary
                  </h3>
                  <div className="row g-2 g-md-4">
                    <div className="col-6 col-md-4 mb-2">
                      <p className="text-gray-600">Guest Name</p>
                      <p className="font-semibold">{formData.customerName}</p>
                    </div>
                    {selectedTransaction ? (
                      // Display booking details for existing transaction
                      <>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Booking Number</p>
                          <p className="font-semibold">
                            {selectedTransaction.bookingNumber}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold">
                            ₹{formData.payableAmount}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Total Paid</p>
                          <p className="font-semibold">
                            ₹{selectedTransaction.totalPaid}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Remaining Balance</p>
                          <p className="font-semibold">
                            ₹{selectedTransaction.remainingBalance}
                          </p>
                        </div>
                      </>
                    ) : (
                      // Display booking details for new booking
                      <>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Check-in</p>
                          <p className="font-semibold">
                            {new Date(
                              decodedBookingData.checkInDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Check-out</p>
                          <p className="font-semibold">
                            {new Date(
                              decodedBookingData.checkOutDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold">
                            ₹
                            {decodedBookingData.totalAmount.total.toLocaleString()}
                          </p>
                        </div>
                        <div className="col-6 col-md-4 mb-2">
                          <p className="text-gray-600">Number of Rooms</p>
                          <p className="font-semibold">
                            {decodedBookingData.numberOfRooms}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment History - Only show for existing transactions */}
                {selectedTransaction && paymentHistory.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Payment History
                    </h3>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.flatMap((transaction) =>
                            transaction.payments.map((payment, idx) => (
                              <tr key={`${transaction._id}-${idx}`}>
                                <td>
                                  {new Date(
                                    payment.paymentDate
                                  ).toLocaleDateString()}
                                </td>
                                <td>₹{payment.amount}</td>
                                <td>{payment.paymentMethod}</td>
                                <td>{payment.status}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    orientation="horizontal"
                    className="mb-4 flex-wrap gap-3"
                  >
                    <Radio value="online" color="primary" className="p-2">
                      Pay Via Online
                    </Radio>
                    <Radio value="cod" color="primary" className="p-2">
                      Pay at Hotel
                    </Radio>
                    <Radio value="paymentLink" color="primary" className="p-2">
                      Generate Payment Link
                    </Radio>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                <div className="row g-3">
                  <div className="col-md-6 col-sm-12 mb-2">
                    <label className="block text-sm font-medium mb-1">
                      Customer Name
                    </label>
                    <Input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        handleInputChange("customerName", e.target.value)
                      }
                      className="w-full"
                      readOnly
                    />
                  </div>

                  <div className="col-md-6 col-sm-12 mb-2">
                    <label className="block text-sm font-medium mb-1">
                      Payable Amount(INR)
                    </label>
                    <Input
                      type="text"
                      value={formData.payableAmount}
                      className="w-full"
                      readOnly
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Total payable amount for the booking
                    </p>
                  </div>

                  <div className="col-md-6 col-sm-12 mb-2">
                    <label className="block text-sm font-medium mb-1">
                      Amount(INR) *
                    </label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      placeholder="Amount"
                      className={`w-full ${
                        errors.amount ? "border-red-500" : ""
                      }`}
                    />
                    {errors.amount && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.amount}
                      </p>
                    )}
                    {showPaymentLinkFields && (
                      <p className="text-xs text-blue-600 mt-1">
                        This amount will be used to generate the payment link.
                        The guest will only need to pay this amount.
                      </p>
                    )}
                    {!showPaymentLinkFields && (
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>Partial payment supported.</strong> Enter the
                        amount guest is paying now. Multiple payments can be
                        made later to reach the total amount.
                      </p>
                    )}
                  </div>

                  {/* Only show payment type for online and hotel payments */}
                  {(showOnlineFields || showHotelFields) && (
                    <div className="col-md-6 col-sm-12 mb-2">
                      <label className="block text-sm font-medium mb-1">
                        Payment Type *
                      </label>
                      <Select
                        value={formData.paymentType}
                        onChange={(e) =>
                          handleInputChange("paymentType", e.target.value)
                        }
                        placeholder="Type"
                        className={`w-full ${
                          errors.paymentType ? "border-red-500" : ""
                        }`}
                      >
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="netbanking">Net Banking</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </Select>
                      {errors.paymentType && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.paymentType}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Only show bank for online payments */}
                  {showOnlineFields && (
                    <div className="col-md-6 col-sm-12 mb-2">
                      <label className="block text-sm font-medium mb-1">
                        Bank *
                      </label>
                      <Select
                        value={formData.bank}
                        onChange={(e) =>
                          handleInputChange("bank", e.target.value)
                        }
                        placeholder="Select Bank"
                        className={`w-full ${
                          errors.bank ? "border-red-500" : ""
                        }`}
                      >
                        {banks.map((bank, index) => (
                          <SelectItem key={index} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </Select>
                      {errors.bank && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.bank}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Only show transaction ID for online payments */}
                  {showOnlineFields && (
                    <div className="col-md-6 col-sm-12 mb-2">
                      <label className="block text-sm font-medium mb-1">
                        Transaction Id/Receipt *
                      </label>
                      <Input
                        type="text"
                        value={formData.transactionId}
                        onChange={(e) =>
                          handleInputChange("transactionId", e.target.value)
                        }
                        placeholder="Number"
                        className={`w-full ${
                          errors.transactionId ? "border-red-500" : ""
                        }`}
                      />
                      {errors.transactionId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.transactionId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Always show payment date */}
                  <div className="col-md-6 col-sm-12 mb-2">
                    <label className="block text-sm font-medium mb-1">
                      Payment Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) =>
                        handleInputChange("paymentDate", e.target.value)
                      }
                      className={`w-full ${
                        errors.paymentDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.paymentDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.paymentDate}
                      </p>
                    )}
                  </div>

                  {/* Always show remarks */}
                  <div className="col-12 mb-2">
                    <label className="block text-sm font-medium mb-1">
                      Remarks
                    </label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) =>
                        handleInputChange("remarks", e.target.value)
                      }
                      placeholder="Additional notes"
                      className="w-full"
                    />
                  </div>

                  {/* Payment link message */}
                  {showPaymentLinkFields && (
                    <div className="col-12">
                      <div className="p-3 p-md-4 bg-blue-50 text-blue-700 rounded-md">
                        <p className="font-medium">Payment Link Info</p>
                        <p className="text-sm">
                          A payment link for the amount specified will be
                          generated and sent to the guest&apos;s email. The
                          booking will be considered complete only after the
                          payment is received.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card-footer d-flex flex-column flex-sm-row justify-content-end gap-3 py-3">
              <Button
                color="danger"
                variant="light"
                onPress={() => router.push("/dashboard/bookings")}
                disabled={isProcessing}
                className="mb-2 mb-sm-0 py-2 px-3"
              >
                Cancel
              </Button>
              <Button
                className="bg-hotel-primary text-white py-2 px-4"
                onPress={handleSubmitPayment}
                isLoading={isProcessing}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing..."
                  : selectedTransaction
                  ? "Record Additional Payment"
                  : "Process Payment"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RecordPaymentPage;
