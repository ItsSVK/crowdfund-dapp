'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as Portal from '@radix-ui/react-portal';

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  minDate,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );
  const [selectedTime, setSelectedTime] = useState(
    value ? value.toTimeString().slice(0, 5) : '12:00'
  );
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>(
    'bottom'
  );
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isClickingInsideRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If we're clicking inside the calendar, don't close
      if (isClickingInsideRef.current) {
        isClickingInsideRef.current = false;
        return;
      }

      const target = event.target as Element;
      const isClickInsideContainer = containerRef.current?.contains(target);

      if (!isClickInsideContainer && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplayValue = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = new Date(currentYear, currentMonth, day, hours, minutes);
    onChange(newDate);
    // Don't close the calendar - let user adjust time and click "Set"
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (value) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSelectedTime('12:00');
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return (
      date <
      new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    );
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
          'hover:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500',
          'transition-all duration-200',
          className
        )}
        onClick={() => {
          if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Calculate absolute position for portal
            const left = rect.left;
            const top = rect.bottom + 4; // 4px gap
            const topPosition = rect.top - 320 - 4; // Calendar height + gap

            // Check if there's enough space below (320px for calendar), otherwise position above
            if (spaceBelow < 320 && spaceAbove > 320) {
              setDropdownPosition('top');
              setDropdownStyles({
                position: 'fixed',
                left: `${left}px`,
                top: `${topPosition}px`,
                width: '280px',
                zIndex: 999999,
              });
            } else {
              setDropdownPosition('bottom');
              setDropdownStyles({
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
                width: '280px',
                zIndex: 999999,
              });
            }
          }
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-purple-500" />
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              handleClear();
            }}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
        <Clock className="h-4 w-4 text-purple-500 ml-2" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <Portal.Root container={document.body}>
            <motion.div
              ref={dropdownRef}
              initial={{
                opacity: 0,
                y: dropdownPosition === 'bottom' ? -10 : 10,
                scale: 0.95,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: dropdownPosition === 'bottom' ? -10 : 10,
                scale: 0.95,
              }}
              transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-lg shadow-xl overflow-hidden"
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
                isClickingInsideRef.current = true;
              }}
              onPointerDown={e => {
                e.preventDefault();
                e.stopPropagation();
                isClickingInsideRef.current = true;
              }}
              style={{
                ...dropdownStyles,
                pointerEvents: 'auto',
              }}
            >
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="text-white hover:bg-white/20 h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="text-center">
                    <div className="text-sm font-semibold">
                      {MONTHS[currentMonth]} {currentYear}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="text-white hover:bg-white/20 h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-3">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="text-xs font-medium text-muted-foreground text-center p-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => (
                    <div key={index} className="h-8 w-8">
                      {day && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDateSelect(day)}
                          disabled={isDateDisabled(day)}
                          className={cn(
                            'h-8 w-8 p-0 text-xs hover:bg-purple-50 hover:text-purple-600 cursor-pointer',
                            value &&
                              value.getDate() === day &&
                              value.getMonth() === currentMonth &&
                              value.getFullYear() === currentYear
                              ? 'bg-purple-500 text-white hover:bg-purple-600 hover:text-white'
                              : '',
                            isDateDisabled(day)
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          )}
                        >
                          {day}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time Selection */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-medium">Time</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={e => handleTimeChange(e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (value) {
                          const [hours, minutes] = selectedTime
                            .split(':')
                            .map(Number);
                          const newDate = new Date(value);
                          newDate.setHours(hours, minutes);
                          onChange(newDate);
                        }
                        setIsOpen(false);
                      }}
                      disabled={!value}
                      className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 cursor-pointer"
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Portal.Root>
        )}
      </AnimatePresence>
    </div>
  );
}
