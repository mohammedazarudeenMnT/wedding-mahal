// import React from 'react';

// export default function TableSkeleton() {
//   return (
//     <div className="w-full space-y-4">
//       {/* Header Controls */}
//       <div className="flex items-center justify-between mb-4">
//         <div className="w-64 h-10 bg-gray-200 rounded animate-pulse" /> {/* Search bar */}
//         <div className="flex gap-2">
//           {/* Filter buttons */}
//           <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
//           <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
//           <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
//           <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
//           <div className="w-32 h-10 bg-blue-500 rounded animate-pulse" /> {/* Add Item button */}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="w-full border rounded-lg overflow-hidden">
//         {/* Table Header */}
//         <div className="bg-[#00529C] text-white grid grid-cols-8 gap-4 p-4">
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//           <div className="h-4 w-24 bg-blue-400 rounded animate-pulse" />
//         </div>

//         {/* Table Body */}
//         {[...Array(10)].map((_, index) => (
//           <div
//             key={index}
//             className="grid grid-cols-8 gap-4 p-4 border-b hover:bg-gray-50"
//           >
//             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//             <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//             <div className="flex gap-2">
//               <div className="h-8 w-20 bg-blue-100 rounded animate-pulse" />
//               <div className="h-8 w-20 bg-green-100 rounded animate-pulse" />
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between p-4">
//         <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
//         <div className="flex gap-2">
//           {[1, 2, 3, 4, 5].map((num) => (
//             <div
//               key={num}
//               className={`h-8 w-8 rounded animate-pulse ${
//                 num === 1 ? 'bg-blue-500' : 'bg-gray-200'
//               }`}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Button,
  Input,
} from "@nextui-org/react";

export default function TableSkeleton() {
  // Create dummy array for skeleton rows
  const skeletonRows = Array(9).fill(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Content Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <h2 className="text-hotel-primary-text font-[500]">Title</h2>
          <div className="flex gap-3">
            {/* Search Input Skeleton */}
            <Skeleton className="rounded-lg">
              <Input className="w-[200px]" disabled />
            </Skeleton>

            {/* Date Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="w-[280px]" disabled>
                {/* Pick a date */}
              </Button>
            </Skeleton>

            {/* Filter Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[120px]" disabled>
                {/* All Status */}
              </Button>
            </Skeleton>

            {/* Column Filter Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[48px]" disabled />
            </Skeleton>

            {/* New Booking Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[176px]" disabled>
                {/* New Booking */}
              </Button>
            </Skeleton>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <Table aria-label="Loading skeleton table" className="min-h-[400px]">
        <TableHeader>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-16 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-32 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bottom Pagination Skeleton */}
      <div className="py-2 px-2 flex justify-between items-center">
        <Skeleton className="h-4 w-[200px] rounded-lg" />
        <Skeleton className="h-8 w-[200px] rounded-lg" />
      </div>
    </div>
  );
}
