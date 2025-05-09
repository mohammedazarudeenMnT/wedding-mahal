import { NextResponse } from 'next/server';
import connectDb from '@/utils/config/connectDB';
import LogBook from '@/utils/model/logBook/logBookSchema';

// export const dynamic = 'force-dynamic';

// GET handler to fetch a specific log entry by ID
export async function GET(request, { params }) {
  try {
    await connectDb();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log entry ID is required' },
        { status: 400 }
      );
    }
    
    const logEntry = await LogBook.findById(id).lean();
    
    if (!logEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: logEntry
    });
  } catch (error) {
    console.error('Error fetching log entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log entry' },
      { status: 500 }
    );
  }
}

// PATCH handler to update a specific log entry by ID
export async function PATCH(request, { params }) {
  try {
    await connectDb();
    
    const { id } = params;
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log entry ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the log entry
    const updatedLogEntry = await LogBook.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updatedLogEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Log entry updated successfully',
      data: updatedLogEntry
    });
  } catch (error) {
    console.error('Error updating log entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update log entry' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a specific log entry by ID
export async function DELETE(request, { params }) {
  try {
    await connectDb();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log entry ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete the log entry
    const deletedLogEntry = await LogBook.findByIdAndDelete(id);
    
    if (!deletedLogEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Log entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting log entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete log entry' },
      { status: 500 }
    );
  }
} 