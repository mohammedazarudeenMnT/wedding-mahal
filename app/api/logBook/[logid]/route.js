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
    const data = await request.json();
    
    const updatedLog = await LogBook.findByIdAndUpdate(
      params.logid,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update log entry' },
      { status: 500 }
    );
  }
}