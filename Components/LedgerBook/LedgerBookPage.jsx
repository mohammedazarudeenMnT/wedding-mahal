import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import {
  IconPrinter,
  IconDownload,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { FileText, FileSpreadsheet, FileJson, Download } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { DateRangePicker } from "@heroui/date-picker";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTailwindColor = (element, className) => {
  const tempElement = document.createElement(element);
  tempElement.className = className;
  document.body.appendChild(tempElement);

  const color = window.getComputedStyle(tempElement).backgroundColor;
  document.body.removeChild(tempElement);

  const match = color.match(/\d+/g);
  return match ? match.map(Number) : [41, 128, 185]; // fallback color
};

const LedgerBookPage = () => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [bankBalance, setBankBalance] = useState(0);

  // Convert date range to month/year for API
  const getMonthYearFromDateRange = useCallback(() => {
    if (!dateRange?.from)
      return {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

    // We'll use the start date's month and year for the API
    const from = new Date(dateRange.from);
    return {
      month: from.getMonth() + 1,
      year: from.getFullYear(),
    };
  }, [dateRange]);

  // Fetch ledger data
  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const { month, year } = getMonthYearFromDateRange();

      const response = await axios.get(
        `/api/financials/ledger-book?month=${month}&year=${year}&accountType=${accountType}`
      );

      if (response.data.success) {
        setLedger(response.data.ledger);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  }, [accountType, getMonthYearFromDateRange]);

  // Fetch bank accounts
  const fetchBanks = async () => {
    try {
      const response = await axios.get("/api/financials/bank?isActive=true");
      if (response.data.success) {
        setBanks(response.data.bankAccounts);
        const totalBankBalance = response.data.bankAccounts.reduce(
          (total, bank) => total + Number(bank.currentBalance || 0),
          0
        );
        setBankBalance(totalBankBalance);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchLedger();
    fetchBanks();
  }, [fetchLedger]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    if (!range || !range.start || !range.end) {
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      });
      return;
    }

    const startDate = new Date(
      range.start.year,
      range.start.month - 1,
      range.start.day
    );
    const endDate = new Date(
      range.end.year,
      range.end.month - 1,
      range.end.day
    );

    setDateRange({
      from: startDate,
      to: endDate,
    });

    // Re-fetch ledger data when date range changes
    setTimeout(() => fetchLedger(), 0);
  };

  // Handle bank filter change
  const handleBankChange = (e) => {
    const bankId = e.target.value;
    setSelectedBank(bankId);

    // Update accountType based on selected bank
    if (bankId === "all") {
      setAccountType("all");
    } else {
      const selectedBankAccount = banks.find((bank) => bank._id === bankId);
      if (selectedBankAccount) {
        setAccountType(selectedBankAccount.type);
      }
    }
  };

  // Filter entries by bank and date range
  const filteredEntries = useMemo(() => {
    if (!ledger?.entries) return [];

    return ledger.entries.filter((entry) => {
      // First check if entry matches the selected bank
      if (selectedBank !== "all" && entry.bank?._id !== selectedBank) {
        return false;
      }

      // Then check if entry date is within the selected date range
      if (dateRange?.from && dateRange?.to) {
        const entryDate = new Date(entry.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);

        // Set hours to 0 for date-only comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        return entryDate >= fromDate && entryDate <= toDate;
      }

      return true;
    });
  }, [ledger, selectedBank, dateRange]);

  // Calculate summary values based on filtered entries
  const summary = useMemo(() => {
    if (!filteredEntries.length)
      return {
        income: 0,
        expenses: 0,
        netProfit: 0,
      };

    const income = filteredEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

    const expenses = filteredEntries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

    return {
      income,
      expenses,
      netProfit: income - expenses,
    };
  }, [filteredEntries]);

  // Generate month name
  const getMonthName = (monthNumber) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthNumber - 1];
  };

  // Get formatted date string for display
  const getFormattedDateRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return "";

    return `${format(new Date(dateRange.from), "MMM dd, yyyy")} - ${format(
      new Date(dateRange.to),
      "MMM dd, yyyy"
    )}`;
  }, [dateRange]);

  // Function to get data for export
  const getExportData = useCallback(() => {
    if (!filteredEntries || filteredEntries.length === 0) return [];

    return filteredEntries.map((entry) => {
      return {
        "Transaction Date": format(new Date(entry.date), "dd/MM/yyyy"),
        "Transaction Type": entry.type,
        Description: entry.description,
        Account: entry.bank?.name || "N/A",
        "Account Type": entry.bank?.type || "N/A",
        Reference: entry.reference || "N/A",
        Income: entry.type === "income" ? formatCurrency(entry.amount) : "",
        Expense: entry.type === "expense" ? formatCurrency(entry.amount) : "",
        Balance: formatCurrency(entry.runningBalance),
      };
    });
  }, [filteredEntries]);

  // Download PDF function
  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF("l", "mm", "a4");
      const exportData = getExportData();
      const hotelPrimaryColor = getTailwindColor("div", "bg-hotel-primary");

      // Add header banner
      doc.setFillColor(
        hotelPrimaryColor[0],
        hotelPrimaryColor[1],
        hotelPrimaryColor[2]
      );
      doc.rect(0, 0, doc.internal.pageSize.width, 25, "F");

      // Add title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("Ledger Book", 15, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const dateStr = getFormattedDateRange;
      doc.text(`Date Range: ${dateStr}`, 15, 35);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width - 65,
        35
      );

      // Add grand total
      const totalIncome = filteredEntries
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);

      const totalExpense = filteredEntries
        .filter((entry) => entry.type === "expense")
        .reduce((sum, entry) => sum + entry.amount, 0);

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 15, 40);
      doc.text(
        `Total Expense: ${formatCurrency(totalExpense)}`,
        doc.internal.pageSize.width - 80,
        40
      );
      doc.text(
        `Net: ${formatCurrency(totalIncome - totalExpense)}`,
        doc.internal.pageSize.width - 80,
        45
      );

      // Configure table
      doc.autoTable({
        head: [Object.keys(exportData[0] || {})],
        body: exportData.map(Object.values),
        startY: 50,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [80, 80, 80],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: hotelPrimaryColor,
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          "Transaction Date": { cellWidth: 20 },
          "Transaction Type": { cellWidth: 20 },
          Description: { cellWidth: 40 },
          Account: { cellWidth: 25 },
          "Account Type": { cellWidth: 20 },
          Reference: { cellWidth: 20 },
          Income: { cellWidth: 20, halign: "right" },
          Expense: { cellWidth: 20, halign: "right" },
          Balance: { cellWidth: 20, halign: "right" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: (data) => {
          // Restore header banner on each page
          doc.setFillColor(
            hotelPrimaryColor[0],
            hotelPrimaryColor[1],
            hotelPrimaryColor[2]
          );
          doc.rect(0, 0, doc.internal.pageSize.width, 25, "F");

          // Add footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(70, 70, 70);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
        margin: { top: 40, right: 15, bottom: 15, left: 15 },
      });

      doc.save("ledger-book.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, filteredEntries, getFormattedDateRange]);

  // Download Excel function
  const handleDownloadExcel = useCallback(() => {
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger Book");
      XLSX.writeFile(wb, "ledger-book.xlsx");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    }
  }, [getExportData]);

  // Download CSV function
  const handleDownloadCSV = useCallback(() => {
    try {
      const exportData = getExportData();
      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }
      const fields = Object.keys(exportData[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(exportData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ledger-book.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV file");
    }
  }, [getExportData]);

  // Download JSON function
  const handleDownloadJSON = useCallback(() => {
    try {
      const exportData = getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ledger-book.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    }
  }, [getExportData]);

  // Download button component
  const downloadButton = useMemo(
    () => (
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="flat"
            className="bg-hotel-secondary"
            isLoading={isExporting}
          >
            {isExporting ? <Spinner size="sm" /> : <Download size={18} />}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Download Options">
          <DropdownItem
            key="pdf"
            startContent={<FileText size={16} />}
            onPress={handleDownloadPDF}
            isDisabled={isExporting}
          >
            PDF
          </DropdownItem>
          <DropdownItem
            key="excel"
            startContent={<FileSpreadsheet size={16} />}
            onPress={handleDownloadExcel}
          >
            Excel
          </DropdownItem>
          <DropdownItem
            key="csv"
            startContent={<FileText size={16} />}
            onPress={handleDownloadCSV}
          >
            CSV
          </DropdownItem>
          <DropdownItem
            key="json"
            startContent={<FileJson size={16} />}
            onPress={handleDownloadJSON}
          >
            JSON
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    ),
    [
      isExporting,
      handleDownloadPDF,
      handleDownloadExcel,
      handleDownloadCSV,
      handleDownloadJSON,
    ]
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ledger Book</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Income</p>
              <h3 className="text-2xl font-bold">₹{summary.income || 0}</h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-md">
              <IconDownload className="text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold">₹{summary.expenses || 0}</h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-md">
              <IconPrinter className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Bank Balance</p>
              <h3 className="text-2xl font-bold">
                {selectedBank === "all"
                  ? `₹${bankBalance || 0}`
                  : `₹${
                      banks.find((bank) => bank._id === selectedBank)
                        ?.currentBalance || 0
                    }`}
              </h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-md">
              <IconDownload className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Net Profit</p>
              <h3 className="text-2xl font-bold">₹{summary.netProfit || 0}</h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-md">
              <IconDownload className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Overall Ledger</h2>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span>Type</span>
              <Select
                aria-label="Type"
                selectedKeys={[selectedBank]}
                onChange={handleBankChange}
                className="w-40"
              >
                <SelectItem key="all" value="all">
                  All
                </SelectItem>
                {banks.map((bank) => (
                  <SelectItem key={bank._id} value={bank._id}>
                    {bank.type === "bank" ? bank.bankName : bank.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <IconCalendarEvent size={18} />

              <DateRangePicker
                id="ledger-date-range"
                aria-label="Select date range"
                value={dateRange}
                onChange={handleDateRangeChange}
                locale="en-US"
                showMonthAndYearPickers
                popoverProps={{
                  placement: "bottom-end",
                  startIdentifier: "start",
                  endIdentifier: "end",
                }}
              />
            </div>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-default-100"
                  isLoading={isExporting}
                >
                  {isExporting ? <Spinner size="sm" /> : <Download size={18} />}
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Download Options">
                <DropdownItem
                  key="pdf"
                  startContent={<FileText size={16} />}
                  onPress={handleDownloadPDF}
                  isDisabled={isExporting}
                >
                  PDF
                </DropdownItem>
                <DropdownItem
                  key="excel"
                  startContent={<FileSpreadsheet size={16} />}
                  onPress={handleDownloadExcel}
                >
                  Excel
                </DropdownItem>
                <DropdownItem
                  key="csv"
                  startContent={<FileText size={16} />}
                  onPress={handleDownloadCSV}
                >
                  CSV
                </DropdownItem>
                <DropdownItem
                  key="json"
                  startContent={<FileJson size={16} />}
                  onPress={handleDownloadJSON}
                >
                  JSON
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button
              size="sm"
              color="primary"
              isIconOnly
              onClick={() => window.print()}
            >
              <IconPrinter size={18} />
            </Button>
          </div>
        </div>

        <Table aria-label="Ledger Book Entries">
          <TableHeader>
            <TableColumn>DATE</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>CATEGORY</TableColumn>
            <TableColumn>REF / BOOKING ID</TableColumn>
            <TableColumn>DEBIT</TableColumn>
            <TableColumn>CREDIT</TableColumn>
            <TableColumn>BALANCE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody>
            {!loading && ledger && (
              <>
                <TableRow>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell>₹{ledger.openingBalance}</TableCell>
                  <TableCell></TableCell>
                </TableRow>

                {filteredEntries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {entry.type === "income" ? "Income" : "Expenses"}
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.refId}</TableCell>
                    <TableCell>
                      {entry.debit > 0 ? `₹${entry.debit}` : ""}
                    </TableCell>
                    <TableCell>
                      {entry.credit > 0 ? `₹${entry.credit}` : ""}
                    </TableCell>
                    <TableCell>₹{entry.balance}</TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        variant="light"
                      >
                        <IconPrinter size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Opening Balance:
                  </TableCell>
                  <TableCell colSpan={3}>
                    ₹{ledger.accountTypeSummary?.openingBalance || 0}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Current Total:
                  </TableCell>
                  <TableCell>
                    ₹{ledger.accountTypeSummary?.totalDebited || 0}
                  </TableCell>
                  <TableCell>
                    ₹{ledger.accountTypeSummary?.totalCredited || 0}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Closing Balance:
                  </TableCell>
                  <TableCell colSpan={3}>
                    ₹{ledger.accountTypeSummary?.closingBalance || 0}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading ledger data...
                </TableCell>
              </TableRow>
            )}

            {!loading && (!ledger || filteredEntries.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No ledger entries found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LedgerBookPage;
