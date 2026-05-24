"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, MapPin, Clock, Filter } from 'lucide-react';
import { PowerOutage } from '../lib/db';
import { districtCoordinates } from '../lib/districts';

// Dynamically import Leaflet map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-electric)' }}>Initializing Power Grid Map...</div>
});

export default function Dashboard({ data }: { data: PowerOutage[] }) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Extract unique districts for the dropdown
  const districts = useMemo(() => {
    const unique = new Set(data.map(d => d.district_name));
    return Array.from(unique).sort();
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter(d => {
      let matchesDistrict = selectedDistrict === 'All' || d.district_name === selectedDistrict;
      let matchesStart = !startDate || new Date(d.date) >= new Date(startDate);
      let matchesEnd = !endDate || new Date(d.date) <= new Date(endDate);
      return matchesDistrict && matchesStart && matchesEnd;
    });
  }, [data, selectedDistrict, startDate, endDate]);

  // Aggregate data for the Chart and fill missing days with 0
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    // Extract all dates in the filtered data to find the range boundaries
    const dates = filteredData.map(d => d.date);
    const minDateStr = startDate || dates.reduce((min, d) => d < min ? d : min, dates[0]);
    const maxDateStr = endDate || dates.reduce((max, d) => d > max ? d : max, dates[0]);

    // Parse YYYY-MM-DD in UTC to avoid local timezone shifts
    const [sYear, sMonth, sDay] = minDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = maxDateStr.split('-').map(Number);

    const start = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const end = new Date(Date.UTC(eYear, eMonth - 1, eDay));

    // Aggregate outage duration by date
    const durationByDate: Record<string, number> = {};
    filteredData.forEach(d => {
      durationByDate[d.date] = (durationByDate[d.date] || 0) + d.outage_duration_minutes;
    });

    // Populate every consecutive date in the range
    const result = [];
    let current = new Date(start);
    let index = 0;

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        index,
        date: dateStr,
        duration: durationByDate[dateStr] || 0,
      });
      current.setUTCDate(current.getUTCDate() + 1);
      index++;
    }

    return result;
  }, [filteredData, startDate, endDate]);

  const latestUpdate = data.length > 0 ? [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : "N/A";

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 className="header-title"><Zap style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}}/> TN PowerGrid Telemetry</h1>
          <p className="header-status">
            <span className="live-indicator"></span> 
            HIGH-VOLTAGE NETWORK ACTIVE
          </p>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <Clock size={16} /> 
            Last Sync: {latestUpdate}
          </div>
          <div className="filters-panel">
            <div className="filter-field">
              <span className="filter-label">District Selection</span>
              <div className="filter-input-wrapper">
                <Filter size={14} color="var(--accent-electric)" />
                <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
                  <option value="All">All Districts (Statewide)</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Starting Date</span>
              <div className="filter-input-wrapper">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>

            <span className="filter-separator">to</span>

            <div className="filter-field">
              <span className="filter-label">Ending Date</span>
              <div className="filter-input-wrapper">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid-layout">
        {/* Left Panel: Map */}
        <div className="panel">
          <h2 className="panel-title"><MapPin size={20} color="var(--accent-electric)" /> Network Node Map</h2>
          <div className="map-container">
            <MapComponent data={filteredData} coordinates={districtCoordinates} />
          </div>
        </div>

        {/* Right Panel: Chart */}
        <div className="panel">
          <h2 className="panel-title"><Zap size={20} color="var(--electric-yellow)" /> Outage Fluctuation</h2>
          <div className="chart-container" style={{ position: 'relative' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                 <XAxis 
                   dataKey="date" 
                   stroke="var(--text-muted)" 
                   tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                   minTickGap={30}
                 />
                 <YAxis 
                   stroke="var(--text-muted)" 
                   domain={[0, 'dataMax + 50']} 
                   hide 
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--accent-electric)', borderRadius: '8px' }}
                   labelStyle={{ color: 'var(--text-main)' }}
                   itemStyle={{ color: 'var(--electric-yellow)' }}
                 />
                 <Line 
                   type="stepAfter" 
                   dataKey="duration" 
                   stroke="var(--electric-yellow)" 
                   strokeWidth={3}
                   dot={{ r: 3, fill: 'var(--electric-yellow)' }}
                   activeDot={{ r: 8, fill: 'var(--electric-yellow)', stroke: 'var(--bg-dark)', strokeWidth: 2 }}
                   className="power-line"
                 />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
