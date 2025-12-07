import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Play, Pause, RotateCcw, Plus, Trash2, Timer, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimerItem {
  id: string;
  name: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  isRunning: boolean;
}

const CookingTimer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [newTimerName, setNewTimerName] = useState("");
  const [newTimerMinutes, setNewTimerMinutes] = useState("");
  const [newTimerSeconds, setNewTimerSeconds] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio context for alarm
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVJJZ6LR0LVrJgs6hrXU48FxQzZtqtfjxnY4L2+z3OfEcTE4cbTg6cdtMDZwsNzpyGsxN2+w2+nIazE3b7Db6chrMTdvsNvpyGsxN2+w2+nIazE3b7Db6chrMTdvsNvpyGsxN2+w2+nIaw==");
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Timer tick logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((timer) => {
          if (timer.isRunning && timer.remaining > 0) {
            const newRemaining = timer.remaining - 1;
            if (newRemaining === 0) {
              playAlarm();
              toast({
                title: "Timer Complete!",
                description: `${timer.name} is done!`,
              });
              return { ...timer, remaining: 0, isRunning: false };
            }
            return { ...timer, remaining: newRemaining };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [playAlarm, toast]);

  const addTimer = () => {
    const minutes = parseInt(newTimerMinutes) || 0;
    const seconds = parseInt(newTimerSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid time.",
        variant: "destructive",
      });
      return;
    }

    const newTimer: TimerItem = {
      id: crypto.randomUUID(),
      name: newTimerName.trim() || `Timer ${timers.length + 1}`,
      duration: totalSeconds,
      remaining: totalSeconds,
      isRunning: false,
    };

    setTimers((prev) => [...prev, newTimer]);
    setNewTimerName("");
    setNewTimerMinutes("");
    setNewTimerSeconds("");
  };

  const toggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
      )
    );
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id
          ? { ...timer, remaining: timer.duration, isRunning: false }
          : timer
      )
    );
  };

  const deleteTimer = (id: string) => {
    setTimers((prev) => prev.filter((timer) => timer.id !== id));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = (timer: TimerItem): number => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  };

  const presetTimers = [
    { name: "Boil Eggs", minutes: 10 },
    { name: "Pasta", minutes: 12 },
    { name: "Rice", minutes: 20 },
    { name: "Quick Rest", minutes: 5 },
  ];

  const addPresetTimer = (name: string, minutes: number) => {
    const newTimer: TimerItem = {
      id: crypto.randomUUID(),
      name,
      duration: minutes * 60,
      remaining: minutes * 60,
      isRunning: false,
    };
    setTimers((prev) => [...prev, newTimer]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Timer className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cooking Timer</h1>
        </div>

        {/* Add New Timer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Create New Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="timer-name">Timer Name</Label>
                <Input
                  id="timer-name"
                  placeholder="e.g., Boil pasta"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                />
              </div>
              <div className="w-24">
                <Label htmlFor="timer-minutes">Minutes</Label>
                <Input
                  id="timer-minutes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newTimerMinutes}
                  onChange={(e) => setNewTimerMinutes(e.target.value)}
                />
              </div>
              <div className="w-24">
                <Label htmlFor="timer-seconds">Seconds</Label>
                <Input
                  id="timer-seconds"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={newTimerSeconds}
                  onChange={(e) => setNewTimerSeconds(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addTimer} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Timer
                </Button>
              </div>
            </div>

            {/* Preset Timers */}
            <div className="mt-4">
              <Label className="text-muted-foreground">Quick Add:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {presetTimers.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addPresetTimer(preset.name, preset.minutes)}
                  >
                    {preset.name} ({preset.minutes}m)
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Timers */}
        {timers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No timers yet</h3>
              <p className="text-muted-foreground">
                Create a timer above or use a quick preset to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timers.map((timer) => (
              <Card
                key={timer.id}
                className={`relative overflow-hidden transition-all ${
                  timer.remaining === 0 ? "ring-2 ring-primary animate-pulse" : ""
                }`}
              >
                {/* Progress bar background */}
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-1000"
                  style={{ width: `${getProgressPercent(timer)}%` }}
                />
                
                <CardContent className="relative pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold truncate pr-2">{timer.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTimer(timer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div
                    className={`text-4xl font-mono font-bold text-center mb-4 ${
                      timer.remaining === 0 ? "text-primary" : ""
                    } ${timer.remaining <= 10 && timer.remaining > 0 ? "text-destructive" : ""}`}
                  >
                    {formatTime(timer.remaining)}
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      variant={timer.isRunning ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleTimer(timer.id)}
                      disabled={timer.remaining === 0}
                    >
                      {timer.isRunning ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetTimer(timer.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CookingTimer;
