"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CiFilter } from "react-icons/ci";
import CountdownTimer from "./CountdownTimer";
import Link from "next/link";
import { FaRegEdit } from "react-icons/fa";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import { MdDelete } from "react-icons/md";
import { usePagePermission } from "../../hooks/usePagePermission";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";

import { PlusIcon } from "../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import { PiFadersHorizontal } from "react-icons/pi";
import { capitalize } from "../ui/Table/utils";
import { format } from "date-fns";
import TableSkeleton from "../ui/TableSkeleton";
import { toast } from "react-toastify";
// Add this time format helper function at the top of the component
const formatDateTime = (date) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy hh:mm a"); // Changed format to use AM/PM
};

// Add EditIcon component at the top of the file

// Add this constant near the top of the file with other constants
const PRIORITY_COLORS = {
  high: "bg-hotel-primary-red",
  medium: "bg-hotel-primary",
  low: "bg-hotel-primary-green",
};

const ALL_COLUMNS = [
  { name: "ROOM", uid: "roomNumber", sortable: true },
  { name: "TYPE", uid: "roomType", sortable: true },
  { name: "BOOKING", uid: "bookingNumber", sortable: true },
  { name: "CHECKOUT", uid: "checkOutDate", sortable: true },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "PRIORITY", uid: "priority", sortable: true },
  { name: "RESERVATION", uid: "reservationStatus", sortable: true },
  { name: "ASSIGNED TO", uid: "assignedTo", sortable: true },
  { name: "NOTES", uid: "notes", sortable: true },
  { name: "GUESTS", uid: "guests" },
  { name: "EXPECTED START", uid: "expectedStartTime", sortable: true },
  { name: "EXPECTED END", uid: "expectedEndTime", sortable: true },
  { name: "START TIME", uid: "startTime", sortable: true },
  { name: "END TIME", uid: "endTime", sortable: true },
  // { name: "DELAYED", uid: "isDelayed", sortable: true },
  // { name: "CREATED", uid: "createdAt", sortable: true },
  // { name: "UPDATED", uid: "updatedAt", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "roomNumber",
  "roomType",
  "status",
  "priority",
  "reservationStatus",
  "assignedTo",
  "notes",
  "actions",
];

export default function HouseKeeping() {
  const hasViewPermission = usePagePermission("House-keeping", "view");
  const hasAddPermission = usePagePermission("House-keeping", "add");
  const hasEditPermission = usePagePermission("House-keeping", "edit");
  const hasDeletePermission = usePagePermission("House-keeping", "delete");

  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(ALL_COLUMNS);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [statusCounts, setStatusCounts] = useState({});
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const keyCounterRef = useRef(0);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
  const [availablePriorities, setAvailablePriorities] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");

  const [sortDescriptor, setSortDescriptor] = React.useState({});
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    taskId: null,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchHousekeepingTasks();
  }, []);

  useEffect(() => {
    if (isMounted) {
      setSortDescriptor({
        column: "roomNumber",
        direction: "ascending",
      });
    }
  }, [isMounted]);

  const fetchHousekeepingTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/houseKeeping`);
      if (response.data.success) {
        setTasks(response.data.tasks);
        // Store status counts if provided by API
        if (response.data.statusCounts) {
          setStatusCounts(response.data.statusCounts);
          // Set available statuses from API response
          setAvailableStatuses(Object.keys(response.data.statusCounts));
        }
        // Extract unique room types and priorities
        const roomTypes = [
          ...new Set(response.data.tasks.map((task) => task.roomType)),
        ];
        const priorities = [
          ...new Set(response.data.tasks.map((task) => task.priority)),
        ];
        setAvailableRoomTypes(roomTypes);
        setAvailablePriorities(priorities);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = React.useCallback(async (taskId) => {
    try {
      const response = await axios.delete(`/api/houseKeeping/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        await fetchHousekeepingTasks();
      } else {
        console.error("Error deleting task:", response.data.message);
        toast.error(response.data.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  }, []);

  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const filteredItems = React.useMemo(() => {
    let filteredTasks = [...tasks];

    // Apply filters
    if (hasSearchFilter) {
      filteredTasks = filteredTasks.filter((task) =>
        task.roomNumber.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all" && Array.from(statusFilter).length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        Array.from(statusFilter).includes(task.status)
      );
    }

    // Apply priority filter
    if (priorityFilter !== "all" && Array.from(priorityFilter).length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        Array.from(priorityFilter).includes(task.priority)
      );
    }

    // Apply room type filter
    if (roomTypeFilter !== "all" && Array.from(roomTypeFilter).length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        Array.from(roomTypeFilter).includes(task.roomType)
      );
    }

    // Sort completed tasks to the end
    filteredTasks.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return 0;
    });

    // Always include _id and required fields when filtering columns
    if (visibleColumns !== "all") {
      filteredTasks = filteredTasks.map((task) => {
        const filteredTask = {
          _id: task._id,
          roomNumber: task.roomNumber,
          status: task.status,
        };
        Array.from(visibleColumns).forEach((columnKey) => {
          if (task[columnKey] !== undefined) {
            filteredTask[columnKey] = task[columnKey];
          }
        });
        return filteredTask;
      });
    }

    return filteredTasks;
  }, [
    tasks,
    filterValue,
    statusFilter,
    priorityFilter,
    roomTypeFilter,
    visibleColumns,
  ]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    if (!items.length) return [];

    return [...items].sort((a, b) => {
      // First, sort completed status to the end
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;

      // Then apply the regular sorting
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];

      if (!first || !second) return 0;

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (task, columnKey) => {
      switch (columnKey) {
        case "roomNumber":
          return <span className="text-bold">{task.roomNumber}</span>;
        case "checkOutDate":
          return formatDateTime(task.checkOutDate);
        case "guests":
          return `Adults: ${task.guests?.adults || 0}, Children: ${
            task.guests?.children || 0
          }`;
        case "status":
          return (
            <Chip
              className={`capitalize ${
                task.status === "completed"
                  ? "bg-hotel-primary-green text-white"
                  : task.status === "in-progress"
                  ? "bg-hotel-primary text-white"
                  : task.status === "maintenance"
                  ? "bg-hotel-secondary-light-grey"
                  : task.status === "pending"
                  ? "bg-hotel-primary-red text-white"
                  : ""
              }`}
              size="md"
              radius="sm"
            >
              {task.status}
            </Chip>
          );
        case "priority":
          return (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  PRIORITY_COLORS[task.priority.toLowerCase()] || "bg-gray-400"
                }`}
              ></div>
              <span>{capitalize(task.priority)}</span>
            </div>
          );
        case "actions":
          return (
            <div className="flex gap-2 justify-center items-center">
              {hasEditPermission && (
                <Link href={`/dashboard/house-keeping/edit-task/${task._id}`}>
                  <FaRegEdit
                    aria-label="Edit task"
                    className="text-default-400 cursor-pointer active:opacity-50"
                  />
                </Link>
              )}
              {hasDeletePermission && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onClick={() =>
                    setDeleteDialog({ isOpen: true, taskId: task._id })
                  }
                >
                  <MdDelete />
                </Button>
              )}
            </div>
          );
        case "expectedStartTime":
        case "startTime":
        case "endTime":
        case "createdAt":
        case "updatedAt":
          return formatDateTime(task[columnKey]);
        case "expectedEndTime":
          return (
            <div className="flex flex-col gap-1">
              <div>{formatDateTime(task[columnKey])}</div>
              {task.status !== "completed" && (
                <CountdownTimer expectedEndTime={task[columnKey]} />
              )}
            </div>
          );
        case "isDelayed":
          return (
            <Chip
              className="capitalize"
              color={task.isDelayed ? "danger" : "success"}
              size="sm"
              variant="flat"
            >
              {task.isDelayed ? "Yes" : "No"}
            </Chip>
          );
        case "reservationStatus":
          return task.reservationStatus;

        case "assignedTo":
          return task.assignedTo || "-";
        case "notes":
          return task.notes || "-";
        default:
          return task[columnKey];
      }
    },
    [hasEditPermission, hasDeletePermission]
  );

  const onRowsPerPageChange = React.useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const statusDropdownContent = (
    <Dropdown>
      <DropdownTrigger className="hidden sm:flex">
        <Button
          className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
          startContent={<CiFilter />}
          variant="flat"
        >
          All Status
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Table Columns"
        closeOnSelect={false}
        selectedKeys={statusFilter}
        selectionMode="multiple"
        onSelectionChange={setStatusFilter}
      >
        {availableStatuses.map((status) => (
          <DropdownItem
            key={status}
            className="capitalize"
            textValue={`${status} (${statusCounts[status] || 0})`}
          >
            {capitalize(status)}
            <span className="ml-2 text-gray-400">
              ({statusCounts[status] || 0})
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );

  const roomTypeDropdownContent = (
    <Dropdown>
      <DropdownTrigger className="hidden sm:flex">
        <Button
          className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
          startContent={<CiFilter />}
          variant="flat"
        >
          All Room
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Room Types"
        closeOnSelect={false}
        selectedKeys={roomTypeFilter}
        selectionMode="multiple"
        onSelectionChange={setRoomTypeFilter}
      >
        {availableRoomTypes.map((type) => (
          <DropdownItem key={type} className="capitalize">
            {capitalize(type)}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );

  const priorityDropdownContent = (
    <Dropdown>
      <DropdownTrigger className="hidden sm:flex">
        <Button
          className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
          startContent={<CiFilter />}
          variant="flat"
        >
          All Priority
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Priorities"
        closeOnSelect={false}
        selectedKeys={priorityFilter}
        selectionMode="multiple"
        onSelectionChange={setPriorityFilter}
      >
        {availablePriorities.map((priority) => (
          <DropdownItem key={priority} className="capitalize">
            {capitalize(priority)}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[20%] "
            classNames={{
              base: "w-full sm:max-w-[44%] date-btn",
              inputWrapper: "bg-hotel-secondary ",
              input: "text-hotel-primary-text",
            }}
            placeholder="Search room, floor, etc"
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            {roomTypeDropdownContent}
            {statusDropdownContent}
            {priorityDropdownContent}

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
                  <DropdownItem
                    key={column.uid}
                    className="capitalize"
                    textValue={column.name}
                  >
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {hasAddPermission && (
              <Link href={`/dashboard/house-keeping/add-task`}>
                <Button
                  className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                  endContent={<PlusIcon />}
                >
                  Add Task
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {tasks.length} Rooms
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
    statusFilter,
    priorityFilter,
    visibleColumns,
    onRowsPerPageChange,
    tasks.length,
    onSearchChange,
    hasSearchFilter,
    statusCounts,
    availableStatuses,
    router,
    hasAddPermission,
  ]);

  const bottomContent = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          Showing {start}-{end} of {filteredItems.length}
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
  }, [selectedKeys, filteredItems.length, page, pages, rowsPerPage]);

  const generateUniqueKey = (item, index) => {
    keyCounterRef.current += 1;
    return `row-${index}-${item?.roomNumber || "unknown"}-${
      item?._id || "none"
    }-${keyCounterRef.current}`;
  };

  useEffect(() => {
    keyCounterRef.current = 0;
  }, [sortedItems]);

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view housekeeping tasks
      </div>
    );
  }

  return (
    <>
      {isMounted ? (
        <>
          {loading ? (
            <TableSkeleton />
          ) : (
            <Table
              aria-label="Housekeeping tasks table"
              isHeaderSticky
              bottomContent={bottomContent}
              bottomContentPlacement="inside"
              classNames={{
                wrapper: "min-h-[400px]",
              }}
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="inside"
              onSortChange={setSortDescriptor}
              hideHeader={!isMounted}
            >
              <TableHeader>
                {headerColumns.map((column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.sortable}
                    className="text-sm capitalize"
                  >
                    {column.name}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody
                items={sortedItems}
                isLoading={loading}
                loadingContent={<div>Loading tasks...</div>}
                emptyContent={!loading ? "No tasks found" : null}
              >
                {(item, index) => {
                  const uniqueKey = generateUniqueKey(item, index);
                  return (
                    <TableRow key={uniqueKey}>
                      {(columnKey) =>
                        headerColumns.some((col) => col.uid === columnKey) && (
                          <TableCell key={`${uniqueKey}-${columnKey}`}>
                            {renderCell(item, columnKey)}
                          </TableCell>
                        )
                      }
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          )}
          <ConfirmationDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, taskId: null })}
            onConfirm={() => {
              handleDelete(deleteDialog.taskId);
              setDeleteDialog({ isOpen: false, taskId: null });
            }}
            title="Delete Task"
            description="Are you sure you want to delete this task? This action cannot be undone."
            confirmText="Delete"
          />
        </>
      ) : null}
    </>
  );
}
