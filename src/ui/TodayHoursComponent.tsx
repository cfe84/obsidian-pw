import * as React from "react";

interface TodayHoursComponentProps {
  startTime: string;
  endTime: string;
  defaultStartHour: string;
  defaultEndHour: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export function TodayHoursComponent({
  startTime,
  endTime,
  defaultStartHour,
  defaultEndHour,
  onStartTimeChange,
  onEndTimeChange
}: TodayHoursComponentProps) {
  return (
    <div className="pw-today-hours-container">
      <h3>Today's Hours</h3>
      <div className="pw-today-hours-inputs">
        <div className="pw-today-hours-input">
          <label>Start:</label>
          <input 
            type="time" 
            value={startTime} 
            onChange={(e) => onStartTimeChange(e.target.value)} 
          />
        </div>
        <div className="pw-today-hours-input">
          <label>End:</label>
          <input 
            type="time" 
            value={endTime} 
            onChange={(e) => onEndTimeChange(e.target.value)} 
          />
        </div>
        <button 
          className="pw-today-hours-reset" 
          onClick={() => {
            onStartTimeChange(defaultStartHour);
            onEndTimeChange(defaultEndHour);
          }}
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
