import { NextResponse } from 'next/server';
import { getOutageData } from '../../../lib/db';

export async function GET() {
  try {
    const data = await getOutageData();
    return NextResponse.json({ 
      success: true, 
      message: "Network telemetry loaded from local dataset.",
      data: data
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to read power telemetry data." }, { status: 500 });
  }
}
