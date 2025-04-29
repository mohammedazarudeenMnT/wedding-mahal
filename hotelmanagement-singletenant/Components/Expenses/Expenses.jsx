"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import axios from "axios";
import { FaRegEdit, FaTrash } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import { format, isWithinInterval, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { PiFadersHorizontal } from "react-icons/pi";
import { usePagePermission } from "../../hooks/usePagePermission";

import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Buttons } from "../ui/button";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import TableSkeleton from "../ui/TableSkeleton";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
} from "@nextui-org/react";
import { PlusIcon } from "../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import { capitalize } from "../ui/Table/utils";
import Link from "next/link";

// Define columns array with correct order
const INITIAL_VISIBLE_COLUMNS = [
  "date",
  "category",
  "expense",
  "amount",
  "description",
  "actions",
];

export default function Expenses() {
  const hasViewPermission = usePagePermission("Financials/Expenses", "view");
  const hasAddPermission = usePagePermission("Financials/Expenses", "add");
  const hasEditPermission = usePagePermission("Financials/Expenses", "edit");
  const hasDeletePermission = usePagePermission(
    "Financials/Expenses",
    "delete"
  );

  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [expensesData, setExpensesData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add date state
  const [date, setDate] = useState({
    from: null,
    to: null,
  });

  // Update filter states to use Set
  const [categoryFilter, setCategoryFilter] = useState(new Set([]));
  const [expenseTypeFilter, setExpenseTypeFilter] = useState(new Set([]));

  const hasSearchFilter = Boolean(filterValue);

  // Add constant for "All" option
  const ALL_OPTION = "all";

  // Dynamic columns based on available data
  const columns = useMemo(
    () => [
      { name: "DATE", uid: "date", sortable: true },
      { name: "CATEGORY", uid: "category", sortable: true },
      { name: "EXPENSE", uid: "expense", sortable: true },
      { name: "AMOUNT", uid: "amount", sortable: true },
      { name: "DESCRIPTION", uid: "description", sortable: true },
      { name: "ACTIONS", uid: "actions" },
    ],
    []
  );

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  // Fetch expenses data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/expenses`);
        if (response.data.success) {
          setExpensesData(response.data.expenses);

          // Extract unique categories and expense types from expenses data
          const uniqueCategories = [
            ...new Set(
              response.data.expenses.map((expense) => expense.category)
            ),
          ];
          const uniqueExpenseTypes = [
            ...new Set(
              response.data.expenses.map((expense) => expense.expense)
            ),
          ];

          setCategories(uniqueCategories.map((cat) => ({ name: cat })));
          setExpenseTypes(uniqueExpenseTypes.map((type) => ({ name: type })));
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add date selection handler
  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) {
      setDate({ from: null, to: null });
    } else {
      setDate(selectedDate);
    }
  };

  // Update status handlers for filters
  const handleCategoryChange = useCallback((keys) => {
    const selectedCategories = Array.from(keys);
    if (selectedCategories.includes(ALL_OPTION)) {
      setCategoryFilter(new Set([ALL_OPTION]));
    } else {
      setCategoryFilter(
        new Set(selectedCategories.map((cat) => cat.toLowerCase()))
      );
    }
  }, []);

  const handleExpenseTypeChange = useCallback((keys) => {
    const selectedTypes = Array.from(keys);
    if (selectedTypes.includes(ALL_OPTION)) {
      setExpenseTypeFilter(new Set([ALL_OPTION]));
    } else {
      setExpenseTypeFilter(
        new Set(selectedTypes.map((type) => type.toLowerCase()))
      );
    }
  }, []);

  // Update filtered items with better status handling
  const filteredItems = useMemo(() => {
    let filtered = [...expensesData];

    // Search filter
    if (hasSearchFilter) {
      filtered = filtered.filter((item) =>
        item.category.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Category filter with improved status handling
    if (categoryFilter.size > 0 && !categoryFilter.has(ALL_OPTION)) {
      filtered = filtered.filter((item) =>
        Array.from(categoryFilter).includes(item.category.toLowerCase())
      );
    }

    // Expense type filter with improved status handling
    if (expenseTypeFilter.size > 0 && !expenseTypeFilter.has(ALL_OPTION)) {
      filtered = filtered.filter((item) =>
        Array.from(expenseTypeFilter).includes(item.expense.toLowerCase())
      );
    }

    // Date range filter
    if (date?.from && date?.to) {
      filtered = filtered.filter((item) => {
        try {
          const expenseDate = parseISO(item.date);
          return isWithinInterval(expenseDate, {
            start: date.from,
            end: date.to,
          });
        } catch (error) {
          console.error("Date filtering error:", error);
          return true;
        }
      });
    }

    return filtered;
  }, [expensesData, filterValue, categoryFilter, expenseTypeFilter, date]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Replace the handleDelete function with this new version
  const handleDelete = async (id) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `/api/expenses?id=${expenseToDelete}`
      );
      if (response.data.success) {
        setExpensesData(
          expensesData.filter((expense) => expense._id !== expenseToDelete)
        );
        toast.success("Expense deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const renderCell = useCallback(
    (item, columnKey) => {
      const cellValue = item[columnKey];

      switch (columnKey) {
        case "date":
          return (
            <div className="flex flex-row justify-start">
              <span>
                {new Date(cellValue).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          );
        case "category":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">{cellValue}</p>
            </div>
          );
        case "expense":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">{cellValue}</p>
            </div>
          );
        case "description":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">{cellValue}</p>
            </div>
          );
        case "amount":
          return (
            <div className="flex flex-row justify-start">
              <Chip size="sm" variant="flat" color="success">
                ₹{cellValue}
              </Chip>
            </div>
          );

        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                {hasDeletePermission && (
                  <FaTrash
                    style={{ color: "#EE4C4C", cursor: "pointer" }}
                    onClick={() => handleDelete(item._id)}
                  />
                )}
                {hasEditPermission && (
                  <Link
                    href={`/dashboard/financials/expenses/edit-expense/${item._id}`}
                  >
                    <FaRegEdit style={{ color: "#6E6E6E" }} />
                  </Link>
                )}
              </div>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [hasEditPermission, hasDeletePermission]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  // Update topContent with new filter handlers
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[20%] date-btn"
            classNames={{
              base: "w-full sm:max-w-[44%] ",
              inputWrapper: "bg-hotel-secondary ",
              input: "text-hotel-primary-text",
            }}
            placeholder="Search by category..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Buttons
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Buttons>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className=" min-w-28 bg-hotel-secondary "
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {categoryFilter.has(ALL_OPTION)
                    ? "All Categories"
                    : categoryFilter.size
                    ? `${categoryFilter.size} Selected`
                    : "Category"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Filter by category"
                closeOnSelect={false}
                selectedKeys={categoryFilter}
                selectionMode="multiple"
                onSelectionChange={handleCategoryChange}
              >
                <DropdownItem key={ALL_OPTION}>All </DropdownItem>
                {categories.map((category) => (
                  <DropdownItem
                    key={category.name.toLowerCase()}
                    className="capitalize"
                  >
                    {capitalize(category.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className=" min-w-28 bg-hotel-secondary "
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {expenseTypeFilter.has(ALL_OPTION)
                    ? "All Expense Types"
                    : expenseTypeFilter.size
                    ? `${expenseTypeFilter.size} Selected`
                    : "Expense Type"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Filter by expense type"
                closeOnSelect={false}
                selectedKeys={expenseTypeFilter}
                selectionMode="multiple"
                onSelectionChange={handleExpenseTypeChange}
              >
                <DropdownItem key={ALL_OPTION}>All </DropdownItem>
                {expenseTypes.map((type) => (
                  <DropdownItem
                    key={type.name.toLowerCase()}
                    className="capitalize"
                  >
                    {capitalize(type.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button className="min-w-12 bg-hotel-secondary text-hotel-primary-text">
                  <PiFadersHorizontal />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {hasAddPermission && (
              <Link href={`/dashboard/financials/expenses/add-expense`}>
                <Button
                  className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                  endContent={<PlusIcon />}
                >
                  Add Expenses
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {filteredItems.length} Expenses
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value={rowsPerPage}>{rowsPerPage}</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    categoryFilter,
    expenseTypeFilter,
    visibleColumns,
    categories,
    expenseTypes,
    filteredItems.length,
    onRowsPerPageChange,
    onSearchChange,
    date,
    handleCategoryChange,
    handleExpenseTypeChange,
    hasAddPermission,
  ]);

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          {`Showing ${start}-${end} of ${filteredItems.length}`}
        </span>
        <div className="hidden sm:flex justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              page={page}
              total={pages}
              onChange={setPage}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages, rowsPerPage]);

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view expenses
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Table
          aria-label="Expenses table"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="inside"
          classNames={{
            wrapper: "",
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="inside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
                className="table-header"
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<div>Loading expenses...</div>}
            emptyContent={"No expenses found"}
            items={sortedItems}
          >
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
}
