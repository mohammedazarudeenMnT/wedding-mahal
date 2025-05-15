"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";

import { toast } from "react-toastify";
import axios from "axios";
import { usePagePermission } from "../../hooks/usePagePermission";

export default function AddExpenses({ params }) {
  const router = useRouter();
  const hasAddPermission = usePagePermission("Financials/Expenses", "add");
  const hasEditPermission = usePagePermission("Financials/Expenses", "edit");

  const expenseId = params?.id;
  const isEditing = !!expenseId;

  // Check appropriate permission based on action
  const hasPermission = isEditing ? hasEditPermission : hasAddPermission;

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    expense: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    receipt: null,
    paymentType: "",
    bank: "",
    reference: "",
  });

  // Add states for API data
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [bankListAccounts, setBankListAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null);

  // Fetch expense data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchExpense = async () => {
        try {
          const { data } = await axios.get(`/api/expenses?id=${expenseId}`);
          if (data.success) {
            const expenseData = {
              ...data.expense,
              date: data.expense.date
                ? new Date(data.expense.date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            };
            setFormData(expenseData);
            // Set existing receipt URL if available
            if (data.expense.receipt?.url) {
              setExistingReceiptUrl(data.expense.receipt.url);
            }
          }
        } catch (error) {
          console.error("Failed to fetch expense:", error);
          toast.error("Failed to fetch expense details");
        }
      };
      fetchExpense();
    }
  }, [expenseId]);

  // Fetch bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await axios.get("/api/financials/bank");
        if (response.data.success) {
          const accounts = response.data.bankAccounts;

          // Filter cash type accounts
          const cashTypeAccounts = accounts.filter(
            (account) => account.type === "cash"
          );
          setCashAccounts(cashTypeAccounts);

          // Filter bank type accounts
          const bankTypeAccounts = accounts.filter(
            (account) => account.type === "bank"
          );
          setBankListAccounts(bankTypeAccounts);

          // Set all accounts
          setBankAccounts(accounts);
        }
      } catch (error) {
        console.error("Error loading bank accounts:", error);
        toast.error("Failed to load payment account options");
      }
    };

    fetchBankAccounts();
  }, []);

  // Fetch categories and expenses from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`/api/settings/finance/expenses`);
        if (data.success) {
          setCategories(data.settings.category || []);
          setExpenses(data.settings.expense || []);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to fetch settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Add validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.category?.trim()) {
      newErrors.category = "Category is required";
    }
    if (!formData.expense?.trim()) {
      newErrors.expense = "Expense type is required";
    }
    if (!formData.paymentType) {
      newErrors.paymentType = "Payment type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced input handler with clear button support
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Clear input field handler
  const handleClearInput = (name) => {
    handleInputChange(name, "");
  };

  // Add resetForm function
  const resetForm = () => {
    setFormData({
      amount: "",
      category: "",
      expense: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      receipt: null,
      paymentType: "",
      bank: "",
      reference: "",
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, receipt: file }));
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "application/pdf")
    ) {
      setFormData((prev) => ({ ...prev, receipt: file }));
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      }
    } else {
      toast.error("Please upload an image or PDF file");
    }
  };

  const handleReceiptClear = () => {
    setFormData((prev) => ({ ...prev, receipt: null }));
    setPreviewUrl(null);
    setExistingReceiptUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create the expense entry
      const formDataToSend = new FormData();

      // Add basic expense data
      Object.keys(formData).forEach((key) => {
        if (key !== "receipt") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Handle receipt
      if (formData.receipt instanceof File) {
        // New file being uploaded
        formDataToSend.append("receipt", formData.receipt);
      } else if (existingReceiptUrl && !formData.receipt) {
        // No new file, but have existing receipt
        formDataToSend.append("keepExistingReceipt", "true");
      }

      // Save to expenses API
      const { data } = await axios({
        method: isEditing ? "put" : "post",
        url: `/api/expenses${isEditing ? `?id=${expenseId}` : ""}`,
        data: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        // Now create a bank entry for this expense
        const bankEntryData = {
          transactionType: "withdrawal",
          paymentType: formData.paymentType === "cash" ? "cash" : "bank",
          fromAccount: formData.paymentType,
          amount: Number(formData.amount),
          date: formData.date,
          description:
            formData.description ||
            `${formData.category} - ${formData.expense}`,
          reference: formData.reference || data.expense._id,
        };

        // Save to bank entry API
        const bankEntryResponse = await axios.post(
          "/api/financials/bank/entry",
          bankEntryData
        );

        if (bankEntryResponse.data.success) {
          toast.success(
            isEditing
              ? "Expense updated successfully!"
              : "Expense added successfully!",
            {
              position: "top-right",
              autoClose: 2000,
            }
          );

          if (!isEditing) {
            resetForm(); // Only reset form for new entries, not edits
          } else {
            setTimeout(() => {
              router.push(`/dashboard/financials/expenses`);
            }, 2000);
          }
        } else {
          toast.warning("Expense saved but bank entry failed to update");
        }
      } else {
        toast.error(data.message || "Failed to save expense");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting expense");
      console.error("Error submitting expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to {isEditing ? "edit" : "add"} expenses
      </div>
    );
  }

  return (
    <section className="p-4 md:p-6 bg-content1 rounded-large shadow-small w-full min-h-screen">
      <div className="container max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </h1>
          {isLoading && <Spinner size="sm" />}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reference ID Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reference ID
              </label>
              <Input
                type="text"
                placeholder="Enter reference ID"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full"
                isInvalid={!!errors.date}
                errorMessage={errors.date}
              />
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="w-full"
                isInvalid={!!errors.amount}
                errorMessage={errors.amount}
                startContent={<div className="pointer-events-none">₹</div>}
                endContent={
                  formData.amount && (
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onClick={() => handleClearInput("amount")}
                    >
                      ×
                    </Button>
                  )
                }
              />
            </div>

            {/* Payment Type Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Select payment type"
                value={formData.paymentType}
                onChange={(e) =>
                  handleInputChange("paymentType", e.target.value)
                }
                className="w-full"
                isInvalid={!!errors.paymentType}
                errorMessage={errors.paymentType}
              >
                <SelectItem
                  key="paymentType-header-bank"
                  className="text-primary font-bold"
                  isDisabled
                >
                  Bank Accounts
                </SelectItem>
                {bankListAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name || account.bankName}
                  </SelectItem>
                ))}

                <SelectItem
                  key="paymentType-header-cash"
                  className="text-primary font-bold"
                  isDisabled
                >
                  Cash Accounts
                </SelectItem>
                {cashAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select existing or type new category">
                <Input
                  placeholder="Select or type category"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  list="categoryOptions"
                  className="w-full"
                  isInvalid={!!errors.category}
                  errorMessage={errors.category}
                  endContent={
                    formData.category && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onClick={() => handleClearInput("category")}
                      >
                        ×
                      </Button>
                    )
                  }
                />
              </Tooltip>
              <datalist id="categoryOptions">
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name} />
                ))}
              </datalist>
            </div>

            {/* Expense Type Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Expense Type <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select existing or type new expense type">
                <Input
                  placeholder="Select or type expense"
                  value={formData.expense}
                  onChange={(e) => handleInputChange("expense", e.target.value)}
                  list="expenseOptions"
                  className="w-full"
                  isInvalid={!!errors.expense}
                  errorMessage={errors.expense}
                  endContent={
                    formData.expense && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onClick={() => handleClearInput("expense")}
                      >
                        ×
                      </Button>
                    )
                  }
                />
              </Tooltip>
              <datalist id="expenseOptions">
                {expenses.map((exp) => (
                  <option key={exp.name} value={exp.name} />
                ))}
              </datalist>
            </div>

            {/* Description Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                placeholder="Enter notes"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full"
                minRows={4}
              />
            </div>

            {/* Receipt Upload Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Upload Receipt
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 ${
                  isDragging
                    ? "border-hotel-primary bg-blue-50"
                    : "border-gray-300"
                } transition-colors duration-200`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-8 h-8 text-gray-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                  >
                    Click to upload
                  </label>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                  <p className="text-xs text-gray-500">
                    Supports images and PDF files
                  </p>
                </div>
              </div>

              {(formData.receipt || existingReceiptUrl) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {formData.receipt instanceof File
                          ? formData.receipt.name
                          : existingReceiptUrl
                          ? "Current Receipt"
                          : "Receipt"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onClick={handleReceiptClear}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                  {(previewUrl || existingReceiptUrl) && (
                    <Image
                      src={previewUrl || existingReceiptUrl}
                      alt="Receipt preview"
                      width={200}
                      height={160}
                      className="max-h-40 rounded-lg object-contain mx-auto"
                      unoptimized={!!previewUrl} // Skip optimization for local preview URLs
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <Button
              size="lg"
              className="bg-hotel-primary-red text-white"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={isSubmitting}
              className="bg-hotel-primary text-white"
            >
              {isSubmitting ? (
                <Spinner size="sm" color="white" />
              ) : (
                `${isEditing ? "Update" : "Save"} Expense`
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
