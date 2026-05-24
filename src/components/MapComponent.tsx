"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PowerOutage } from '../lib/db';

interface MapProps {
  data: PowerOutage[];
  coordinates: Record<string, [number, number]>;
}

export default function MapComponent({ data, coordinates }: MapProps) {
  // Group all outages by district
  const grouped = data.reduce((acc, curr) => {
    if (!acc[curr.district_name]) {
      acc[curr.district_name] = {
        totalDuration: 0,
        outages: []
      };
    }
    acc[curr.district_name].totalDuration += curr.outage_duration_minutes;
    acc[curr.district_name].outages.push(curr);
    return acc;
  }, {} as Record<string, { totalDuration: number; outages: PowerOutage[] }>);

  // Tamil Nadu center
  const center: [number, number] = [11.1271, 78.6569];

  return (
    <MapContainer 
      center={center} 
      zoom={7} 
      style={{ height: '100%', width: '100%', backgroundColor: '#09090b' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {Object.entries(grouped).map(([district, info]) => {
        const coords = coordinates[district];
        if (!coords) return null;
        
        // Calculate dynamic radius and opacity based on total duration
        const radius = Math.min(Math.max(info.totalDuration / 30, 8), 30);
        const opacity = Math.min(info.totalDuration / 1500, 1);

        return (
          <CircleMarker
            key={district}
            center={coords}
            radius={radius}
            pathOptions={{ 
              color: 'var(--accent-electric)', 
              fillColor: 'var(--electric-yellow)', 
              fillOpacity: 0.4 + (opacity * 0.4),
              weight: 2
            }}
          >
            <Popup className="custom-popup">
              <div className="custom-popup-content">
                <div className="custom-popup-title">{district}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {info.outages.slice(0, 5).map((outage) => (
                    <div 
                      key={outage.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span 
                        style={{ 
                          color: outage.outage_type === 'Planned' ? 'var(--accent-electric)' : '#f43f5e',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: outage.outage_type === 'Planned' ? 'var(--accent-electric)' : '#f43f5e',
                          boxShadow: `0 0 6px ${outage.outage_type === 'Planned' ? 'var(--accent-electric)' : '#f43f5e'}`
                        }} />
                        {outage.outage_type}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {outage.outage_duration_minutes}m ({outage.date})
                      </span>
                    </div>
                  ))}
                  {info.outages.length > 5 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                      + {info.outages.length - 5} more records
                    </div>
                  )}
                  <div style={{ 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '6px', 
                    marginTop: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}>
                    <span>Total Duration:</span>
                    <span style={{ color: 'var(--electric-yellow)' }}>{info.totalDuration} mins</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
