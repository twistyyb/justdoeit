import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserSessionsTimeResponse, SessionTimeDuration } from "shared/api";

interface StudyContributionGraphProps {
  textColor: string;
}

interface DayData {
  duration: number;
  lastInputTime: Date;
}

export function StudyContributionGraph({ textColor }: StudyContributionGraphProps) {
  const { user } = useAuth();
  const [studyData, setStudyData] = useState<Map<string, DayData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [maxDuration, setMaxDuration] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchStudyData = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5002/user_sessions_time/${user.id}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch study data: ${response.status}`);
        }
        
        const data: UserSessionsTimeResponse = await response.json();
        
        // Process the sessions data into a map of date -> {duration, lastInputTime}
        const dateMap = new Map<string, DayData>();
        let max = 0;
        
        if (data.sessions && Array.isArray(data.sessions)) {
          data.sessions.forEach((session: SessionTimeDuration) => {
            if (session.inputtime && session.duration) {
              // Convert UTC time to Pacific timezone date
              const utcDate = new Date(session.inputtime);
              const pdtDateStr = utcDate.toLocaleString('en-US', { 
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
              
              // Parse the MM/DD/YYYY format to YYYY-MM-DD
              const [month, day, year] = pdtDateStr.split('/');
              const date = `${year}-${month}-${day}`;
              
              const currentData = dateMap.get(date);
              const currentDuration = currentData?.duration || 0;
              const newDuration = currentDuration + session.duration;
              
              // Keep the latest inputtime for this date
              const newInputTime = utcDate;
              const shouldUpdate = !currentData || newInputTime >= currentData.lastInputTime;
              
              if (shouldUpdate) {
                dateMap.set(date, {
                  duration: newDuration,
                  lastInputTime: newInputTime
                });
              } else {
                // Just update duration, keep old inputtime
                dateMap.set(date, {
                  duration: newDuration,
                  lastInputTime: currentData.lastInputTime
                });
              }
              
              max = Math.max(max, newDuration);
            }
          });
        }
        
        setStudyData(dateMap);
        setMaxDuration(max);
      } catch (error) {
        console.error("Error fetching study data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyData();
  }, [user?.id]);

  // Helper function to format date consistently
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate last 52 weeks of dates (365 days) in Pacific timezone
  const generateCalendarData = () => {
    const weeks: Date[][] = [];
    
    // Get current date/time
    const now = new Date();
    
    // Get today in Pacific timezone as YYYY-MM-DD string
    const todayPDTStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [todayMonth, todayDay, todayYear] = todayPDTStr.split('/');
    
    // Create a proper date object for today in local timezone (but representing PDT date)
    const todayPDT = new Date(parseInt(todayYear), parseInt(todayMonth) - 1, parseInt(todayDay));
    
    // Start from 52 weeks ago (364 days)
    const startDate = new Date(todayPDT);
    startDate.setDate(startDate.getDate() - 364);
    
    // Adjust to start from Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 53; week++) {
      const weekDays: Date[] = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  // Get color based on time of day (matching the gradient colors)
  const getTimeBasedColor = (dateTime: Date): string => {
    // Convert to Pacific timezone
    const pacificTime = new Date(dateTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const hour = pacificTime.getHours();
    const minute = pacificTime.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Late Night (12am-4am) - Deep cosmic blues
    if (totalMinutes >= 0 && totalMinutes < 240) {
      return "#302b63"; // Mid-tone from late night gradient
    }
    // Pre-Dawn (4am-6am) - Deep blue to purple
    else if (totalMinutes >= 240 && totalMinutes < 360) {
      return "#5a3d7f"; // Mid-tone from pre-dawn gradient
    }
    // Dawn (6am-8am) - Orange, pink, gold
    else if (totalMinutes >= 360 && totalMinutes < 480) {
      return "#e67350"; // Mid-tone from dawn gradient
    }
    // Morning (8am-11am) - Bright yellows
    else if (totalMinutes >= 480 && totalMinutes < 660) {
      return "#ffd662"; // Mid-tone from morning gradient
    }
    // Midday (11am-3pm) - Sky blue to golden
    else if (totalMinutes >= 660 && totalMinutes < 900) {
      return "#a8e0fa"; // Mid-tone from midday gradient
    }
    // Afternoon (3pm-5pm) - Warm golden
    else if (totalMinutes >= 900 && totalMinutes < 1020) {
      return "#ffd98e"; // Mid-tone from afternoon gradient
    }
    // Sunset (5pm-7pm) - Dramatic oranges and pinks
    else if (totalMinutes >= 1020 && totalMinutes < 1140) {
      return "#ffa45f"; // Mid-tone from sunset gradient
    }
    // Dusk (7pm-9pm) - Purple, deep blue
    else if (totalMinutes >= 1140 && totalMinutes < 1260) {
      return "#8e44ad"; // Mid-tone from dusk gradient
    }
    // Night (9pm-12am) - Deep blues, navy
    else {
      return "#243b55"; // Mid-tone from night gradient
    }
  };

  // Get the color and check if date has data
  const getDayColor = (date: Date): { color: string; hasData: boolean } => {
    const dateStr = formatDateKey(date);
    const dayData = studyData.get(dateStr);
    
    if (!dayData) {
      return { color: "bg-white/5", hasData: false };
    }
    
    const timeColor = getTimeBasedColor(dayData.lastInputTime);
    return { color: timeColor, hasData: true };
  };

  const weeks = generateCalendarData();
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calculate total study time and date range
  const totalMinutes = Array.from(studyData.values()).reduce((sum, dayData) => sum + dayData.duration, 0);
  const totalHours = Math.round(totalMinutes / 60);
  
  // Get the date range for display
  const firstDate = weeks.length > 0 && weeks[0].length > 0 ? formatDateKey(weeks[0][0]) : '';
  const lastDate = weeks.length > 0 ? formatDateKey(weeks[weeks.length - 1][6]) : '';

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
        <div className={`text-sm font-bold ${textColor} mb-2`}>Study Time Density</div>
        <div className={`text-xs ${textColor} opacity-80 text-center py-8`}>
          Loading study data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
      <div className={`text-sm font-bold ${textColor} mb-2`}>Study Time Density</div>
      <div className={`text-xs ${textColor} opacity-80 mb-3`}>
        {totalHours > 0 ? (
          <>
            {totalHours} hours • {studyData.size} days active
            <div className="text-[10px] opacity-70 mt-1">
              {firstDate} to {lastDate}
            </div>
          </>
        ) : (
          "No study sessions yet"
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((week, weekIdx) => {
              const firstDay = week[0];
              const isFirstWeekOfMonth = firstDay.getDate() <= 7;
              return (
                <div key={weekIdx} className="flex-shrink-0" style={{ width: '10px', marginRight: '2px' }}>
                  {isFirstWeekOfMonth && (
                    <span className={`text-[8px] ${textColor} opacity-60`}>
                      {monthLabels[firstDay.getMonth()]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-2">
              {dayLabels.map((label, idx) => (
                <div key={idx} className="h-[10px] mb-[2px] flex items-center">
                  {idx % 2 === 1 && (
                    <span className={`text-[8px] ${textColor} opacity-60 w-6`}>{label}</span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Contribution grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2px]">
                  {week.map((date, dayIdx) => {
                    const dateStr = formatDateKey(date);
                    const dayData = studyData.get(dateStr);
                    const { color, hasData } = getDayColor(date);
                    const duration = dayData?.duration || 0;
                    const hours = Math.round(duration / 60);
                    
                    // Get time of day name for tooltip
                    let timeOfDay = "No data";
                    if (dayData) {
                      const pacificTime = new Date(dayData.lastInputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
                      const hour = pacificTime.getHours();
                      const totalMinutes = hour * 60 + pacificTime.getMinutes();
                      
                      if (totalMinutes >= 0 && totalMinutes < 240) timeOfDay = "Late Night";
                      else if (totalMinutes >= 240 && totalMinutes < 360) timeOfDay = "Pre-Dawn";
                      else if (totalMinutes >= 360 && totalMinutes < 480) timeOfDay = "Dawn";
                      else if (totalMinutes >= 480 && totalMinutes < 660) timeOfDay = "Morning";
                      else if (totalMinutes >= 660 && totalMinutes < 900) timeOfDay = "Midday";
                      else if (totalMinutes >= 900 && totalMinutes < 1020) timeOfDay = "Afternoon";
                      else if (totalMinutes >= 1020 && totalMinutes < 1140) timeOfDay = "Sunset";
                      else if (totalMinutes >= 1140 && totalMinutes < 1260) timeOfDay = "Dusk";
                      else timeOfDay = "Night";
                    }
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`w-[10px] h-[10px] rounded-[2px] border border-white/10 transition-all hover:scale-125 hover:border-white/30 cursor-pointer ${!hasData ? 'bg-white/5' : ''}`}
                        style={{ backgroundColor: hasData ? color : undefined }}
                        title={hasData ? `${dateStr}: ${hours}h study time\nLast session: ${timeOfDay}` : `${dateStr}: No sessions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend - Time of Day Colors */}
          <div className="mt-3">
            <div className={`text-[9px] ${textColor} opacity-60 mb-1.5 text-center`}>Study Time Colors</div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {[
                { name: "Night", color: "#302b63" },
                { name: "Dawn", color: "#e67350" },
                { name: "Morning", color: "#ffd662" },
                { name: "Midday", color: "#a8e0fa" },
                { name: "Afternoon", color: "#ffd98e" },
                { name: "Sunset", color: "#ffa45f" },
                { name: "Dusk", color: "#8e44ad" },
                { name: "Late Night", color: "#243b55" },
              ].map(({ name, color }) => (
                <div key={name} className="flex items-center gap-1">
                  <div
                    className="w-[10px] h-[10px] rounded-[2px] border border-white/10 flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={`text-[8px] ${textColor} opacity-60 whitespace-nowrap`}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

