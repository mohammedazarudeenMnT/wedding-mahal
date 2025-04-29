"use client";

import React, { useState, useEffect } from "react";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
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
  User,
  Pagination,
} from "@nextui-org/react";
import { PlusIcon } from "../../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../../ui/Table/SearchIcon.jsx";
import { PiFadersHorizontal } from "react-icons/pi";
import { columns } from "./data";
import { capitalize } from "../../ui/Table/utils";
import EmployeeProfileModal from "./EmployeeDetails";
import TableSkeleton from "../../ui/TableSkeleton.jsx";
import Link from "next/link";
import { usePagePermission } from "../../../hooks/usePagePermission";

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "department",
  "role",
  "schedule",
  "contact",
  "email",
  "actions",
];

export default function Employees() {
  const hasViewPermission = usePagePermission("Employees", "view");
  const hasAddPermission = usePagePermission("Employees", "add");
  const hasEditPermission = usePagePermission("Employees", "edit");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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
  const [employees, setEmployees] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState(new Set([]));
  const [roleFilter, setRoleFilter] = useState(new Set([]));
  const [scheduleFilter, setScheduleFilter] = useState(new Set([]));

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/employeeManagement`);
        const result = await response.json();
        if (response.ok) {
          setEmployees(result.employees);
          setDepartmentOptions(
            getUniqueOptions(result.employees, "department.name")
          );
          setRoleOptions(getUniqueOptions(result.employees, "role.role"));
          setScheduleOptions(
            getUniqueOptions(result.employees, "shiftTime.name")
          );
        } else {
          console.error("Failed to fetch employees:", result.message);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  const getUniqueOptions = (data, key) => {
    const options = data.map((item) => {
      const keys = key.split(".");
      let value = item;
      keys.forEach((k) => {
        value = value ? value[k] : undefined;
      });
      return value;
    });
    return [...new Set(options.filter(Boolean))].map((option) => ({
      uid: option.toLowerCase().replace(/\s+/g, "_"),
      name: option,
    }));
  };

  const openModal = (employee) => {
    const simplifiedEmployee = {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      avatar: employee.avatar,
      role: employee.role,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      email: employee.email,
      mobileNo: employee.mobileNo,
      dateOfHiring: employee.dateOfHiring,
      department: employee.department,
      shiftTime: employee.shiftTime,
      weekOff: employee.weekOff,
      documents: employee.documents,
    };
    setSelectedEmployee(simplifiedEmployee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredEmployees = [...employees];

    if (filterValue) {
      const searchTerm = filterValue.toLowerCase().trim();
      filteredEmployees = filteredEmployees.filter((employee) => {
        return (
          employee.firstName?.toLowerCase().includes(searchTerm) ||
          employee.lastName?.toLowerCase().includes(searchTerm) ||
          employee.employeeId?.toLowerCase().includes(searchTerm) ||
          employee.email?.toLowerCase().includes(searchTerm) ||
          employee.department?.name?.toLowerCase().includes(searchTerm) ||
          employee.role?.role?.toLowerCase().includes(searchTerm) ||
          employee.mobileNo?.includes(searchTerm) ||
          `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(searchTerm)
        );
      });
    }

    if (departmentFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(departmentFilter).includes(
          employee.department?.name?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    if (roleFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(roleFilter).includes(
          employee.role?.role?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    if (scheduleFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(scheduleFilter).includes(
          employee.shiftTime?.name?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    return filteredEmployees;
  }, [employees, filterValue, departmentFilter, roleFilter, scheduleFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (employee, columnKey) => {
      const cellValue = employee[columnKey];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{ radius: "lg", src: employee.avatar }}
              description={employee.employeeId}
              name={`${employee.firstName} ${employee.lastName}`}
            >
              {employee.email}
            </User>
          );
        case "department":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.department?.name || "N/A"}
              </p>
            </div>
          );
        case "role":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.role?.role || "N/A"}
              </p>
            </div>
          );
        case "schedule":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.shiftTime.name}
              </p>
              <p className="text-bold text-tiny capitalize">
                {employee.shiftTime.startTime} - {employee.shiftTime.endTime}
              </p>
            </div>
          );
        case "contact":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.mobileNo}
              </p>
            </div>
          );
        case "email":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.email}
              </p>
            </div>
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                {hasViewPermission && (
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => openModal(employee)}
                    className="text-default-500"
                  >
                    <FaEye size={18} />
                  </Button>
                )}
                {hasEditPermission && (
                  <Link href={`/dashboard/employees/${employee.employeeId}`}>
                    <Button
                      isIconOnly
                      variant="light"
                      className="text-default-500"
                    >
                      <FaRegEdit size={18} />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [hasViewPermission, hasEditPermission]
  );

  const onRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const onSearchChange = (value) => {
    setFilterValue(value);
    setPage(1);
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  const topContent = (
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
          placeholder="Search name, role, etc"
          startContent={<SearchIcon />}
          value={filterValue}
          onClear={onClear}
          onValueChange={onSearchChange}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                className=" min-w-28 bg-hotel-secondary "
                startContent={<CiFilter />}
                variant="flat"
              >
                {departmentFilter.size
                  ? `${departmentFilter.size} Selected`
                  : "All Department"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Department Filter"
              closeOnSelect={false}
              selectedKeys={departmentFilter}
              selectionMode="multiple"
              onSelectionChange={setDepartmentFilter}
            >
              {departmentOptions.map((department) => (
                <DropdownItem key={department.uid} className="capitalize">
                  {capitalize(department.name)}
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
                {roleFilter.size ? `${roleFilter.size} Selected` : "All Role"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Role Filter"
              closeOnSelect={false}
              selectedKeys={roleFilter}
              selectionMode="multiple"
              onSelectionChange={setRoleFilter}
            >
              {roleOptions.map((role) => (
                <DropdownItem key={role.uid} className="capitalize">
                  {capitalize(role.name)}
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
                {scheduleFilter.size
                  ? `${scheduleFilter.size} Selected`
                  : "All Schedule"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Schedule Filter"
              closeOnSelect={false}
              selectedKeys={scheduleFilter}
              selectionMode="multiple"
              onSelectionChange={setScheduleFilter}
            >
              {scheduleOptions.map((schedule) => (
                <DropdownItem key={schedule.uid} className="capitalize">
                  {capitalize(schedule.name)}
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
            <Link href={`/dashboard/employees/add-employee`}>
              <Button
                className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                endContent={<PlusIcon />}
              >
                Add Employee
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {employees.length} employees
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

  const bottomContent = (
    <div className="py-2 px-2 flex justify-between items-center">
      <span className="w-[30%] text-small text-default-400">
        Showing {Math.min((page - 1) * rowsPerPage + 1, filteredItems.length)}-
        {Math.min(page * rowsPerPage, filteredItems.length)} of{" "}
        {filteredItems.length}
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

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view employees
      </div>
    );
  }

  return (
    <>
      {isClient ? (
        isLoading ? (
          <TableSkeleton />
        ) : (
          <Table
            aria-label="Employee table"
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
            <TableHeader columns={headerColumns} className="table-header">
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
                  className="table-header"
                  suppressHydrationWarning={true}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={"No employees found"} items={sortedItems}>
              {(item) => (
                <TableRow key={item._id}>
                  {(columnKey) => (
                    <TableCell style={{ color: "#0D0E0D" }}>
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      ) : null}

      {isModalOpen && selectedEmployee && (
        <EmployeeProfileModal
          isModalOpen={isModalOpen}
          onCloseModal={closeModal}
          employee={selectedEmployee}
        />
      )}
    </>
  );
}
