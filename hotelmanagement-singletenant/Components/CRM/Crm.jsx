"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";

import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { SearchIcon } from "../ui/Table/SearchIcon";
import { PlusIcon } from "../ui/Table/PlusIcon";
import TableSkeleton from "../ui/TableSkeleton";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  User,
  Button,
  Pagination,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { usePagePermission } from "../../hooks/usePagePermission";

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "email",
  "mobileno",
  "notes",
  "actions",
];

export default function CrmList() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  // Initialize columns with default structure
  const [columns] = useState([
    {
      key: "name",
      label: "Name",
      allowsSorting: true,
    },
    {
      key: "email",
      label: "Email",
      allowsSorting: true,
    },
    {
      key: "mobileno",
      label: "Mobile No",
      allowsSorting: true,
    },
    {
      key: "notes",
      label: "Notes",
      allowsSorting: true,
    },
    {
      key: "actions",
      label: "Actions",
      allowsSorting: false,
    },
  ]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "name",
    direction: "ascending",
  });

  const hasAddPermission = usePagePermission("crm/add-contact", "add");
  const hasMovePermission = usePagePermission("bookings", "add");

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/crm`);
      if (response.data.success) {
        setContacts(response.data.contacts);
      } else {
        console.error("Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredContacts = [...contacts];

    if (hasSearchFilter) {
      filteredContacts = filteredContacts.filter((contact) =>
        contact.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredContacts;
  }, [contacts, filterValue, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column] ?? "";
      const second = b[sortDescriptor.column] ?? "";

      // Handle non-string values
      const firstValue = String(first).toLowerCase();
      const secondValue = String(second).toLowerCase();

      const cmp =
        firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const handleMoveToBooking = useCallback(
    (contact) => {
      const queryParams = new URLSearchParams({
        firstName: contact.name.split(" ")[0] || "",
        lastName: contact.name.split(" ").slice(1).join(" ") || "",
        email: contact.email || "",
        mobileNo: contact.mobileno || "",
        notes: contact.notes || "",
      }).toString();

      router.push(`/dashboard/bookings/add-booking?${queryParams}`);
    },
    [router]
  );

  const renderCell = useCallback(
    (contact, columnKey) => {
      // Add null check for contact
      if (!contact) return null;

      const cellValue = contact[columnKey];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: "https://i.pravatar.cc/150",
              }}
              name={contact.name}
            >
              {contact.email}
            </User>
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasMovePermission && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary text-white"
                  onClick={() => handleMoveToBooking(contact)}
                >
                  MoveTo
                </Button>
              )}
            </div>
          );
        default:
          return cellValue;
      }
    },
    [handleMoveToBooking, hasMovePermission]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {`Showing ${start}-${end} of ${filteredItems.length}`}
        </span>
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
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
  }, [page, pages, rowsPerPage, filteredItems.length]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <h2 className="text-hotel-primary-text font-[500]">Contact List</h2>
          <div className="flex gap-3">
            <Input
              isClearable
              classNames={{
                base: "w-full sm:max-w-[44%]",
                inputWrapper: "bg-hotel-secondary",
              }}
              placeholder="Search by name..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={setFilterValue}
            />
            {hasAddPermission && (
              <Link href="/dashboard/crm/add-contact">
                <Button
                  className="bg-hotel-primary-yellow text-hotel-primary-text"
                  endContent={<PlusIcon />}
                >
                  Add Contact
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {contacts.length} contacts
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
    rowsPerPage,
    onRowsPerPageChange,
    contacts.length,
    hasAddPermission,
  ]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <Table
      aria-label="CRM contacts table"
      isHeaderSticky
      classNames={{
        wrapper: "",
      }}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="inside"
      bottomContent={bottomContent}
      bottomContentPlacement="inside"
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn
            key={column.key}
            align={column.key === "actions" ? "center" : "start"}
            allowsSorting={column.allowsSorting}
          >
            {column.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent={"No contacts found"} items={sortedItems || []}>
        {(item) => (
          <TableRow key={item._id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
