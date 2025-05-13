// "use client";
// import React from "react";
// import { X } from "lucide-react";
// import { format } from "date-fns";
// import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";

// export default function ViewLogBookDetails({ isOpen, onClose, logData }) {
//   if (!isOpen || !logData) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//       <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 relative animate-fade-in">
//         <button
//           className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
//           onClick={onClose}
//           aria-label="Close"
//         >
//           <X className="h-7 w-7" />
//         </button>
//         <h2 className="text-xl font-bold mb-6">Customer & Booking Details:</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
//           <div><b>Booking ID.</b> <span className="ml-2">{logData.bookingId}</span></div>
//           <div><b>Property Type</b> <span className="ml-2">{logData.propertyType}</span></div>
//           <div><b>Customer Name.</b> <span className="ml-2">{logData.customerName}</span></div>
//           <div><b>Event Type</b> <span className="ml-2">{logData.eventType}</span></div>
//           <div><b>Phone Number</b> <span className="ml-2">{logData.mobileNo}</span></div>
//           <div><b>Check-in Time</b> <span className="ml-2">{logData.checkInTime}</span></div>
//           <div><b>Date</b> <span className="ml-2">{format(new Date(logData.dateRange.from), 'dd/MM/yyyy')}</span></div>
//           <div><b>Notes</b> <span className="ml-2">{logData.notes || '-'}</span></div>
//           <div><b>Status</b> <span className="ml-2">{logData.status}</span></div>
//         </div>
//         <h3 className="font-bold text-lg mt-4 mb-2">Items Issued</h3>
//         <div className="overflow-x-auto mb-4">
//           <Table aria-label="Items issued table">
//             <TableHeader>
//               <TableColumn>Category</TableColumn>
//               <TableColumn>Sub Category</TableColumn>
//               <TableColumn>Brand</TableColumn>
//               <TableColumn>Model</TableColumn>
//               <TableColumn>Quantity</TableColumn>
//               <TableColumn>Condition</TableColumn>
//               <TableColumn>Remarks</TableColumn>
//             </TableHeader>
//             <TableBody>
//               {logData.itemsIssued.map((item, idx) => (
//                 <TableRow key={idx}>
//                   <TableCell>{item.category}</TableCell>
//                   <TableCell>{item.subCategory}</TableCell>
//                   <TableCell>{item.brand}</TableCell>
//                   <TableCell>{item.model}</TableCell>
//                   <TableCell>{item.quantity}</TableCell>
//                   <TableCell>{item.condition}</TableCell>
//                   <TableCell>{item.remarks}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//           <div className="flex justify-end gap-8 mt-2">
//             <div className="bg-gray-50 border rounded-lg px-4 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
//               <span className="text-xs text-gray-500 font-medium">Total Items</span>
//               <span className="text-lg font-bold text-hotel-primary-text">{logData.itemsIssued.length}</span>
//             </div>
//             <div className="bg-gray-50 border rounded-lg px-4 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
//               <span className="text-xs text-gray-500 font-medium">Total Amount</span>
//               <span className="text-lg font-bold text-hotel-primary-text">₹{logData.totalAmount?.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//         <h3 className="font-bold text-lg mt-4 mb-2">Electricity / Generator</h3>
//         <div className="overflow-x-auto mb-4">
//           <Table aria-label="Electricity readings table">
//             <TableHeader>
//               <TableColumn>Type</TableColumn>
//               <TableColumn>Start Reading</TableColumn>
//             {/*   <TableColumn>Units Consumed</TableColumn> */}
//               <TableColumn>Unit Type</TableColumn>
//               <TableColumn>Remarks</TableColumn>
//             </TableHeader>
//             <TableBody>
//               {logData.electricityReadings.map((reading, idx) => (
//                 <TableRow key={idx}>
//                   <TableCell>{reading.type}</TableCell>
//                   <TableCell>{reading.startReading}</TableCell>
//               {/*     <TableCell>{reading.unitsConsumed || '-'}</TableCell> */}
//                   <TableCell>{reading.unitType}</TableCell>
//                   <TableCell>{reading.remarks}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import React from "react";
import { X } from 'lucide-react';
import { format } from "date-fns";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";

export default function ViewLogBookDetails({ isOpen, onClose, logData }) {
  if (!isOpen || !logData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-hotel-primary border-b pb-2">Customer & Booking Details</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Booking ID</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.bookingId}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Property Type</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.propertyType}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Customer Name</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.customerName}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Event Type</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.eventType}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Phone Number</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.mobileNo}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Check-in Time</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.checkInTime}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Date</span>
            <span className="text-sm font-semibold text-hotel-primary-text">
              {format(new Date(logData.dateRange.from), 'dd/MM/yyyy')}
            </span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Status</span>
            <span className={`text-sm font-semibold ${
              logData.status === 'Completed' ? 'text-green-600' : 
              logData.status === 'Pending' ? 'text-amber-600' : 'text-hotel-primary-text'
            }`}>{logData.status}</span>
          </div>
          
          <div className="flex flex-col bg-gray-50 p-2 rounded-lg md:col-span-3">
            <span className="text-xs font-medium text-gray-500">Notes</span>
            <span className="text-sm font-semibold text-hotel-primary-text">{logData.notes || '-'}</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-base font-bold mb-3 text-hotel-primary-text flex items-center">
            <span className="inline-block w-1 h-4 bg-hotel-primary rounded-full mr-2"></span>
            Items Issued
          </h3>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
            <Table aria-label="Items issued table" className="w-full">
              <TableHeader>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Category</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Sub Category</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Brand</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Model</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Quantity</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Condition</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Remarks</TableColumn>
              </TableHeader>
              <TableBody>
                {logData.itemsIssued.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.category}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.subCategory}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.brand}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.model}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.quantity}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.condition === 'Good' ? 'bg-green-100 text-green-800' : 
                        item.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.condition}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-3 mt-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Total Items</span>
              <span className="text-base font-bold text-hotel-primary-text">{logData.itemsIssued.length}</span>
            </div>
            <div className="bg-hotel-primary/10 border border-hotel-primary/20 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
              <span className="text-xs text-hotel-primary font-medium">Total Amount</span>
              <span className="text-base font-bold text-hotel-primary">₹{logData.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-base font-bold mb-3 text-hotel-primary-text flex items-center">
            <span className="inline-block w-1 h-4 bg-hotel-primary rounded-full mr-2"></span>
            Electricity / Generator
          </h3>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table aria-label="Electricity readings table" className="w-full">
              <TableHeader>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Type</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Start Reading</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Unit Type</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Remarks</TableColumn>
              </TableHeader>
              <TableBody>
                {logData.electricityReadings.map((reading, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reading.type === 'Electricity' ? 'bg-purple-100 text-purple-800' : 
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {reading.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{reading.startReading}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{reading.unitType}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{reading.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}