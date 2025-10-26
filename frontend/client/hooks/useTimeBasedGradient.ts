import { useState, useEffect } from 'react';

interface GradientColors {
  gradient: string;
  name: string;
  textColor: string;
}

/**
 * Custom hook that returns a beautiful gradient based on Pacific Time
 * Smoothly transitions between different times of day
 */
export function useTimeBasedGradient(): GradientColors {
  const [gradient, setGradient] = useState<GradientColors>({
    gradient: '',
    name: 'Dawn',
    textColor: 'text-gray-900',
  });

  useEffect(() => {
    const updateGradient = () => {
      // Get current time in Pacific timezone
      const now = new Date();
      const pacificTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
      );
      const hour = pacificTime.getHours();
      const minute = pacificTime.getMinutes();
      const totalMinutes = hour * 60 + minute;

      let newGradient: GradientColors;

      // Late Night (12am-4am) - Deep cosmic blues with purple
      if (totalMinutes >= 0 && totalMinutes < 240) {
        newGradient = {
          name: 'Late Night',
          gradient: `linear-gradient(135deg, 
            #0f0c29 0%, 
            #1a1640 20%,
            #302b63 40%, 
            #24243e 60%,
            #1a1a2e 80%,
            #0f0c29 100%)`,
          textColor: 'text-gray-100',
        };
      }
      // Pre-Dawn (4am-6am) - Deep blue to purple, hint of pink
      else if (totalMinutes >= 240 && totalMinutes < 360) {
        newGradient = {
          name: 'Pre-Dawn',
          gradient: `linear-gradient(135deg, 
            #1e3c72 0%, 
            #2a5298 20%,
            #3d2f6f 40%, 
            #5a3d7f 60%,
            #7b4b94 80%,
            #9d5c9e 100%)`,
          textColor: 'text-gray-100',
        };
      }
      // Dawn (6am-8am) - Orange, pink, and gold - magical sunrise
      else if (totalMinutes >= 360 && totalMinutes < 480) {
        newGradient = {
          name: 'Dawn',
          gradient: `linear-gradient(135deg, 
            #8B3A3A 0%, 
            #b84644 15%,
            #C85A54 30%, 
            #e67350 45%,
            #FF8C5A 60%, 
            #FFB347 80%, 
            #FF9E64 100%)`,
          textColor: 'text-gray-900',
        };
      }
      // Morning (8am-11am) - Bright and warm, energetic yellows
      else if (totalMinutes >= 480 && totalMinutes < 660) {
        newGradient = {
          name: 'Morning',
          gradient: `linear-gradient(135deg, 
            #f39c12 0%, 
            #f8b739 20%,
            #ffd662 40%, 
            #ffe88a 60%,
            #fff5b8 80%,
            #fffbe8 100%)`,
          textColor: 'text-gray-900',
        };
      }
      // Midday (11am-3pm) - Peak brightness, golden sunshine with sky blue
      else if (totalMinutes >= 660 && totalMinutes < 900) {
        newGradient = {
          name: 'Midday',
          gradient: `linear-gradient(135deg, 
            #56ccf2 0%, 
            #7dd3f7 20%,
            #a8e0fa 40%, 
            #ffd89b 60%,
            #ffcc70 80%,
            #ffb347 100%)`,
          textColor: 'text-gray-900',
        };
      }
      // Afternoon (3pm-5pm) - Warm golden, soft and pleasant
      else if (totalMinutes >= 900 && totalMinutes < 1020) {
        newGradient = {
          name: 'Afternoon',
          gradient: `linear-gradient(135deg, 
            #ffc371 0%, 
            #ffce7f 20%,
            #ffd98e 40%, 
            #ffe49d 60%,
            #ffbc6b 80%,
            #ff9a56 100%)`,
          textColor: 'text-gray-900',
        };
      }
      // Sunset (5pm-7pm) - Dramatic oranges, pinks, and purples
      else if (totalMinutes >= 1020 && totalMinutes < 1140) {
        newGradient = {
          name: 'Sunset',
          gradient: `linear-gradient(135deg, 
            #ff6b6b 0%, 
            #ff7e67 15%,
            #ff9163 30%, 
            #ffa45f 45%,
            #ee7752 60%, 
            #e73c7e 75%,
            #d946a0 90%,
            #c356b3 100%)`,
          textColor: 'text-gray-900',
        };
      }
      // Dusk (7pm-9pm) - Purple, deep blue, romantic twilight
      else if (totalMinutes >= 1140 && totalMinutes < 1260) {
        newGradient = {
          name: 'Dusk',
          gradient: `linear-gradient(135deg, 
            #667eea 0%, 
            #7c5dbc 20%,
            #8e44ad 40%, 
            #9b59b6 60%,
            #6c3483 80%,
            #4a235a 100%)`,
          textColor: 'text-gray-100',
        };
      }
      // Night (9pm-12am) - Deep blues, navy, peaceful evening
      else {
        newGradient = {
          name: 'Night',
          gradient: `linear-gradient(135deg, 
            #141e30 0%, 
            #1f2f4a 20%,
            #243b55 40%, 
            #2c5364 60%,
            #203a43 80%,
            #0f2027 100%)`,
          textColor: 'text-gray-100',
        };
      }

      setGradient(newGradient);
    };

    // Update immediately
    updateGradient();

    // Update every minute to catch time changes
    const interval = setInterval(updateGradient, 60000);

    return () => clearInterval(interval);
  }, []);

  return gradient;
}

