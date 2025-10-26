import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserSessionsTimeResponse, SessionTimeDuration } from "shared/api";

interface StudyContributionGraphProps {
  textColor: string;
}

interface DayData {
  duration: number;
  lastInputTime: Date;
  sessions: Array<{
    duration: number;
    inputTime: Date;
  }>;
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
        
        // Process the sessions data into a map of date -> {duration, lastInputTime, sessions}
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
              
              // Add session to the sessions array
              const sessions = currentData?.sessions || [];
              sessions.push({
                duration: session.duration,
                inputTime: utcDate
              });
              
              if (shouldUpdate) {
                dateMap.set(date, {
                  duration: newDuration,
                  lastInputTime: newInputTime,
                  sessions: sessions
                });
              } else {
                // Just update duration and sessions, keep old inputtime
                dateMap.set(date, {
                  duration: newDuration,
                  lastInputTime: currentData.lastInputTime,
                  sessions: sessions
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

  // Get color based on simplified time periods
  const getTimeBasedColor = (dateTime: Date): string => {
    // Convert to Pacific timezone
    const pacificTime = new Date(dateTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const hour = pacificTime.getHours();

    // Morning (6am-12pm)
    if (hour >= 6 && hour < 12) {
      return "#ffd662"; // Bright yellow
    }
    // Afternoon (12pm-6pm)
    else if (hour >= 12 && hour < 18) {
      return "#ffa45f"; // Orange
    }
    // Evening (6pm-12am)
    else if (hour >= 18 && hour < 24) {
      return "#8e44ad"; // Purple
    }
    // Night (12am-6am)
    else {
      return "#243b55"; // Deep blue
    }
  };

  // Generate gradient background for multicolored boxes
  const generateGradientBackground = (sessions: Array<{ duration: number; inputTime: Date }>): string => {
    if (sessions.length === 1) {
      return getTimeBasedColor(sessions[0].inputTime);
    }
    
    // Group sessions by time period
    const timePeriods = {
      morning: sessions.filter(s => {
        const hour = new Date(s.inputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
        return hour >= 6 && hour < 12;
      }),
      afternoon: sessions.filter(s => {
        const hour = new Date(s.inputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
        return hour >= 12 && hour < 18;
      }),
      evening: sessions.filter(s => {
        const hour = new Date(s.inputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
        return hour >= 18 && hour < 24;
      }),
      night: sessions.filter(s => {
        const hour = new Date(s.inputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
        return hour >= 0 && hour < 6;
      })
    };
    
    const activePeriods = Object.entries(timePeriods).filter(([_, sessions]) => sessions.length > 0);
    
    if (activePeriods.length === 1) {
      return getTimeBasedColor(activePeriods[0][1][0].inputTime);
    }
    
    // Create smooth gradient for multiple periods
    const colors = activePeriods.map(([period, _]) => {
      switch (period) {
        case 'morning': return '#ffd662';
        case 'afternoon': return '#ffa45f';
        case 'evening': return '#8e44ad';
        case 'night': return '#243b55';
        default: return '#ffd662';
      }
    });
    
    const totalDayDuration = activePeriods.reduce((sum, [_, sessions]) => 
      sum + sessions.reduce((sessionSum, s) => sessionSum + s.duration, 0), 0
    );
    
    const percentages = activePeriods.map(([_, sessions]) => {
      const periodDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
      return (periodDuration / totalDayDuration) * 100;
    });
    
    // Create smoother gradient with better transitions
    let gradient = 'linear-gradient(135deg, ';
    const gradientStops = [];
    
    let currentPercent = 0;
    for (let i = 0; i < colors.length; i++) {
      const startPercent = currentPercent;
      const endPercent = currentPercent + percentages[i];
      
      // Add smooth transitions between colors
      if (i === 0) {
        gradientStops.push(`${colors[i]} ${startPercent}%`);
      } else {
        // Add a small transition zone for smoother blending
        const transitionStart = Math.max(0, startPercent - 2);
        gradientStops.push(`${colors[i]} ${transitionStart}%`);
      }
      
      if (i === colors.length - 1) {
        gradientStops.push(`${colors[i]} ${endPercent}%`);
      } else {
        // Add a small transition zone for smoother blending
        const transitionEnd = Math.min(100, endPercent + 2);
        gradientStops.push(`${colors[i]} ${transitionEnd}%`);
      }
      
      currentPercent = endPercent;
    }
    
    gradient += gradientStops.join(', ') + ')';
    
    return gradient;
  };

  // Get the color and check if date has data
  const getDayColor = (date: Date): { color: string; hasData: boolean; isGradient: boolean } => {
    const dateStr = formatDateKey(date);
    const dayData = studyData.get(dateStr);
    
    if (!dayData) {
      return { color: "bg-white/5", hasData: false, isGradient: false };
    }
    
    const background = generateGradientBackground(dayData.sessions);
    const isGradient = dayData.sessions.length > 1 && background.includes('linear-gradient');
    
    return { color: background, hasData: true, isGradient };
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
        <div className={`text-sm font-bold ${textColor} mb-2`}>Study Contributions</div>
        <div className={`text-xs ${textColor} opacity-80 text-center py-8`}>
          Loading study data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`text-base font-bold ${textColor}`}>Study Contributions</div>
        <div className={`text-sm ${textColor} opacity-80`}>
          {totalHours > 0 ? (
            `${totalHours} hours • ${studyData.size} sessions`
          ) : (
            "No study sessions yet"
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto" ref={(el) => {
        if (el) {
          // Scroll to the right on mount
          el.scrollLeft = el.scrollWidth;
        }
      }}>
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-10 mr-10">
            {weeks.map((week, weekIdx) => {
              const firstDay = week[0];
              const isFirstWeekOfMonth = firstDay.getDate() <= 7;
              return (
                <div key={weekIdx} className="flex-shrink-0" style={{ width: '12px', marginRight: '3px' }}>
                  {isFirstWeekOfMonth && (
                    <span className={`text-[10px] ${textColor} opacity-60`}>
                      {monthLabels[firstDay.getMonth()]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex">
            {/* Contribution grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((date, dayIdx) => {
                    const dateStr = formatDateKey(date);
                    const dayData = studyData.get(dateStr);
                    const { color, hasData, isGradient } = getDayColor(date);
                    const duration = dayData?.duration || 0;
                    const hours = Math.round(duration / 60);
                    
                    // Get time periods for tooltip
                    let timePeriods = "No data";
                    if (dayData) {
                      const periods = new Set();
                      dayData.sessions.forEach(session => {
                        const hour = new Date(session.inputTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
                        if (hour >= 6 && hour < 12) periods.add("Morning");
                        else if (hour >= 12 && hour < 18) periods.add("Afternoon");
                        else if (hour >= 18 && hour < 24) periods.add("Evening");
                        else periods.add("Night");
                      });
                      timePeriods = Array.from(periods).join(", ");
                    }
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`w-[12px] h-[12px] rounded-[3px] border border-white/10 transition-all hover:scale-125 hover:border-white/30 cursor-pointer ${!hasData ? 'bg-white/5' : ''}`}
                        style={{ 
                          backgroundColor: hasData && !isGradient ? color : undefined,
                          background: hasData && isGradient ? color : undefined
                        }}
                        title={hasData ? `${dateStr}: ${hours}h study time\nTime periods: ${timePeriods}` : `${dateStr}: No sessions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Day labels - moved to the right */}
            <div className="flex flex-col ml-3">
              {dayLabels.map((label, idx) => (
                <div key={idx} className="h-[12px] mb-[3px] flex items-center justify-start">
                  {idx % 2 === 1 && (
                    <span className={`text-[10px] ${textColor} opacity-60 w-7 text-left`}>{label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend - Time of Day Colors (outside scrollable area) */}
      <div className="mt-4">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {[
            { name: "Morning", color: "#ffd662" },
            { name: "Afternoon", color: "#ffa45f" },
            { name: "Evening", color: "#8e44ad" },
            { name: "Night", color: "#243b55" },
          ].map(({ name, color }) => (
            <div key={name} className="flex items-center gap-1.5">
              <div
                className="w-[10px] h-[10px] rounded-[2px] border border-white/10 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className={`text-[9px] ${textColor} opacity-60 whitespace-nowrap`}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

