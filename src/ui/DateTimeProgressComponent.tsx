import * as React from "react";
import { DateTime } from "luxon";

interface DateTimeProgressComponentProps {
  currentDateTime: DateTime;
  startTime: string;
  endTime: string;
}

export function DateTimeProgressComponent({
  currentDateTime,
  startTime,
  endTime
}: DateTimeProgressComponentProps) {

  // Separate static date from dynamic time
  const dateStr = currentDateTime.toFormat('EEEE, MMMM d, yyyy');
  const timeStr = currentDateTime.toFormat('h:mm:ss a');

  // Calculate progress percentage based on current time vs start/end time
  const calculateProgress = (): number => {
    const now = currentDateTime;
    const today = currentDateTime.startOf('day');
    
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    
    const startDateTime = today.set({ 
      hour: parseInt(startParts[0], 10), 
      minute: parseInt(startParts[1], 10) 
    });
    
    const endDateTime = today.set({ 
      hour: parseInt(endParts[0], 10), 
      minute: parseInt(endParts[1], 10) 
    });
    
    // If outside working hours
    if (now < startDateTime || now > endDateTime) {
      return now < startDateTime ? 0 : 100;
    }
    
    // Calculate percentage
    const totalMinutes = endDateTime.diff(startDateTime, 'minutes').minutes;
    const elapsedMinutes = now.diff(startDateTime, 'minutes').minutes;
    
    return Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100));
  };

  return (
    <div className="pw-date-time-header">
      <h2 className="pw-current-date-time">
        <span className="pw-current-date-time-icon">🕒</span>
        <span className="pw-date-static">{dateStr}</span>
        <span className="pw-time-separator"> - </span>
        <span className="pw-time-dynamic">{timeStr}</span>
      </h2>
      <div className="pw-progress-container">
        <div 
          className="pw-progress-bar" 
          style={{ width: `${calculateProgress()}%` }}
        />
      </div>
    </div>
  );
}
