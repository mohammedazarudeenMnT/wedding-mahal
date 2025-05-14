// import { NextResponse } from 'next/server';
// import connectDb from '@/utils/config/connectDB';
// import LogBook from '@/utils/model/logBook/logBookSchema';

// export async function GET(request, { params }) {
//   try {
//     await connectDb();
//     const { logId } = params;
//     console.log("Fetching log entry with ID:", logId); // Debug log
    
//     if (!logId) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry ID is required' },
//         { status: 400 }
//       );
//     }
    
//     const logEntry = await LogBook.findById(logId);
//     console.log("Found log entry:", logEntry); // Debug log
    
//     if (!logEntry) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       data: logEntry
//     });
//   } catch (error) {
//     console.error('Error fetching log entry:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to fetch log entry' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(request, { params }) {
//   try {
//     await connectDb();
//     const { logId } = params;
//     const data = await request.json();
    
//     if (!logId) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry ID is required' },
//         { status: 400 }
//       );
//     }
    
//     const updatedLog = await LogBook.findByIdAndUpdate(
//       logId,
//       data,
//       { new: true, runValidators: true }
//     );

//     if (!updatedLog) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true, data: updatedLog });
//   } catch (error) {
//     console.error('Error updating log entry:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to update log entry' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import connectDb from '@/utils/config/connectDB';
import LogBook from '@/utils/model/logBook/logBookSchema';

export async function GET(request, { params }) {
  try {
    await connectDb();
    const logEntry = await LogBook.findById(params.logid);
    
    if (!logEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: logEntry });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDb();
    const { logid } = params;
    const data = await request.json();

    // Calculate grand total
    const grandTotal = (
      (parseFloat(data.totalAmount) || 0) +
      (data.electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)) +
      (parseFloat(data.totalRecoveryAmount) || 0)
    );

    // Add grand total to data
    const updatedData = {
      ...data,
      grandTotal,
      status: 'Verified'
    };

    const updatedLog = await LogBook.findByIdAndUpdate(
      logid,
      updatedData,
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}