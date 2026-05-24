import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface PowerOutage {
  id: string;
  district_name: string;
  outage_duration_minutes: number;
  date: string;
  created_at: string;
  outage_type: 'Planned' | 'Fault';
}

// Fallback to local CSV for development without Vercel Postgres
export async function getOutageData(): Promise<PowerOutage[]> {
  try {
    // In a real Vercel environment, we would use @vercel/postgres here.
    // For local development, we fallback to our historical CSV.
    const csvPath = path.join(process.cwd(), 'src/data/historical_outages.csv');
    const file = fs.readFileSync(csvPath, 'utf8');
    
    const parsed = Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Parse duration to number
    return parsed.data.map((row: any) => ({
      ...row,
      outage_duration_minutes: Number(row.outage_duration_minutes)
    }));
  } catch (error) {
    console.error("Error reading data:", error);
    return [];
  }
}
