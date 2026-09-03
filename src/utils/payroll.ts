import { Employee, AttendanceRecord, DayPayrollDetails, MonthlyPayrollSummary, AttendanceStatus } from '../types';

// Normalize and format time string safely to "HH:MM" (e.g., "9:30" -> "09:30", "08:15 AM" -> "08:15", "05:26:10 PM" -> "17:26", "17:00:00" -> "17:00")
export function normalizeTime(timeStr: string | undefined | null, defaultFallback = '08:00'): string {
  if (!timeStr) return defaultFallback;
  
  const trimmed = timeStr.trim();
  if (trimmed === '' || trimmed === '-') return defaultFallback;

  // Support 12h and 24h formats, with or without seconds, with optional AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?(?:\s*)?(AM|PM|am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;
    
    if (ampm) {
      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    
    if (!isNaN(hours) && !isNaN(minutes)) {
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      return `${hStr}:${mStr}`;
    }
  }

  // Fallback to simpler split in case of weird characters or trailing labels
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    const isPm = /pm/i.test(trimmed);
    const isAm = /am/i.test(trimmed);

    if (isPm && hours < 12) {
      hours += 12;
    } else if (isAm && hours === 12) {
      hours = 0;
    }

    if (!isNaN(hours) && !isNaN(minutes)) {
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      return `${hStr}:${mStr}`;
    }
  }
  
  return defaultFallback;
}

// Convert "HH:MM" or varied time strings to minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '-') return 0;
  const normalized = normalizeTime(timeStr, '');
  if (!normalized) return 0;
  const parts = normalized.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

// Convert minutes from 00:00 to "HH:MM" string
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Helper to check if employee is Aanchal Goel
export function isAanchalGoel(employeeName: string): boolean {
  if (!employeeName) return false;
  const normalized = employeeName.replace(/\s+/g, '').toUpperCase();
  return normalized.includes('AANCHALGOEL') || normalized.includes('AANCHAL');
}

// Calculate total missed working hours for a Staff employee in a given month
export function getStaffMissedHoursInMonth(
  employee: Employee,
  records: AttendanceRecord[],
  year: number,
  monthIndex: number
): number {
  if (employee.type !== 'Staff') return 0;

  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  const empMonthRecords = records.filter(r => r.employeeId === employee.id && r.date.startsWith(monthPrefix));

  if (empMonthRecords.length === 0) {
    return 0;
  }

  // De-duplicate records by date
  const dateRecordMap = new Map<string, AttendanceRecord>();
  for (const r of empMonthRecords) {
    dateRecordMap.set(r.date, r);
  }

  let totalMissedHours = 0;

  dateRecordMap.forEach((record, dateStr) => {
    // Sundays are weekly off, not missed working hours
    if (isSunday(dateStr)) return;

    // Discontinued dates after exit are not counted as missed working days
    if (employee.discontinuedDate && dateStr > employee.discontinuedDate) {
      return;
    }

    if (record.status === 'Leave' || record.status === 'Absent') {
      totalMissedHours += 8;
    } else if (record.status === 'Present') {
      const hasPunchIn = record.punchIn && record.punchIn.trim() !== '' && record.punchIn !== '-';
      const hasPunchOut = record.punchOut && record.punchOut.trim() !== '' && record.punchOut !== '-';

      if (!hasPunchIn && !hasPunchOut) {
        // Marked present without punches -> treated as absent/no work
        totalMissedHours += 8;
      } else {
        const daily = calculateDailyPayroll(employee, record);
        const credited = daily.actualWorkingHours !== undefined ? daily.actualWorkingHours : 8;
        const missed = Math.max(0, 8 - credited);
        totalMissedHours += missed;
      }
    }
  });

  return Number(totalMissedHours.toFixed(2));
}
export function isSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  // Use UTC or local date safely. 
  // Replacing hyphens with slashes ensures parsing in local timezone rather than UTC
  const date = new Date(dateStr.replace(/-/g, '/'));
  return date.getDay() === 0;
}

// Format date to readable string (e.g., "29 Jun (Mon)")
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(/-/g, '/'));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

// Calculate hours worked between punch in and punch out
export function calculateHoursWorked(punchIn: string, punchOut: string): number {
  const inMins = timeToMinutes(punchIn);
  const outMins = timeToMinutes(punchOut);
  if (outMins <= inMins) {
    // Handling cross-midnight shift if any, but default positive
    return 0;
  }
  return (outMins - inMins) / 60;
}

// Calculate lunch overlap in hours (between 13:00 and 14:00)
export function calculateLunchOverlap(punchIn: string, punchOut: string): number {
  const inMins = timeToMinutes(punchIn);
  const outMins = timeToMinutes(punchOut);
  if (outMins <= inMins) return 0;
  
  const lunchStart = 780; // 13:00 (1 PM)
  const lunchEnd = 840;   // 14:00 (2 PM)
  
  const overlap = Math.max(0, Math.min(outMins, lunchEnd) - Math.max(inMins, lunchStart));
  return overlap / 60;
}

// Calculate payroll details for a single day
export function calculateDailyPayroll(
  employee: Employee,
  record: AttendanceRecord
): DayPayrollDetails {
  const { basicSalary, type, standardShiftStart } = employee;
  const { date, status, punchIn, punchOut } = record;
  const sunday = isSunday(date);

  const [yearStr, monthStr] = date.split('-');
  const yearVal = parseInt(yearStr, 10) || 2026;
  const monthVal = (parseInt(monthStr, 10) - 1) || 0;
  const totalDaysInMonth = new Date(yearVal, monthVal + 1, 0).getDate();

  const oneDayPay = basicSalary / totalDaysInMonth;
  const hourlyWage = oneDayPay / 8;

  let hoursWorked = 0;
  let actualWorkingHours = 0;
  let underworkDeduction = 0;
  let dailyWage = 0;
  let lateMinutes = 0;
  let lateDeduction = 0;
  let overtimePay = 0;
  let flatBonus = 0;
  let overtimeBonus = 0;
  let netPay = 0;
  let explanation = '';

  if (status === 'Absent') {
    // Weekdays: Absent means a day's deduction (handled in monthly summary).
    // Sundays: No attendance needed unless they work. Absent on Sunday is fine, no deduction.
    explanation = sunday ? 'Sunday (Weekly Off)' : 'Absent (No Pay)';
    return {
      date,
      isSunday: sunday,
      status,
      hoursWorked: 0,
      actualWorkingHours: 0,
      dailyWage: 0,
      lateMinutes: 0,
      lateDeduction: 0,
      underworkDeduction: 0,
      overtimePay: 0,
      flatBonus: 0,
      overtimeBonus: 0,
      netPay: sunday ? oneDayPay : 0,
      explanation,
    };
  }

  if (status === 'Leave') {
    explanation = sunday ? 'Sunday (Weekly Off)' : 'Leave Applied';
    return {
      date,
      isSunday: sunday,
      status,
      hoursWorked: 0,
      actualWorkingHours: 0,
      dailyWage: 0,
      lateMinutes: 0,
      lateDeduction: 0,
      underworkDeduction: 0,
      overtimePay: 0,
      flatBonus: 0,
      overtimeBonus: 0,
      netPay: sunday ? oneDayPay : 0,
      explanation,
    };
  }

  // Employee is Present
  if (punchIn && punchIn !== '-' && punchOut && punchOut !== '-') {
    hoursWorked = calculateHoursWorked(punchIn, punchOut);
    actualWorkingHours = hoursWorked;
    
    let lunchOverlap = 0;
    if (type === 'Staff') {
      lunchOverlap = calculateLunchOverlap(punchIn, punchOut);
      actualWorkingHours = Math.max(0, hoursWorked - lunchOverlap);
    }
    
    // 1. Overtime Calculation:
    const startMins = timeToMinutes(standardShiftStart);
    // Standard workday shift end is 17:00 (5:00 PM) for both Staff and Labour on weekdays.
    // On Sunday, Labour shift end is 15:00 (3:00 PM).
    const shiftEndMins = (type === 'Labour' && sunday) ? (startMins + 420) : (startMins + 540);
    const outMins = timeToMinutes(punchOut);
    const inMins = timeToMinutes(punchIn);
    const extraMins = Math.max(0, outMins - shiftEndMins);

    if (type === 'Staff') {
      const isAanchal = isAanchalGoel(employee.name);
      // Staff: Standard gets ₹100 bonus for staying till 8:00 PM (155 mins past 17:00 shift end).
      // Aanchal Goel gets ₹100 bonus for staying till 7:00 PM (95 mins past 17:00 shift end) on weekdays.
      const requiredExtraMins = isAanchal ? 95 : 155;
      if (extraMins >= requiredExtraMins) {
        flatBonus = 100;
      }
    } else {
      // Labour:
      if (!sunday) {
        // Weekdays: Any work before standardShiftStart (08:00) or after shiftEndMins (17:00) is paid extra hourly.
        // 35 minutes or more rounds up to a full hour.
        const extraMinsBefore = Math.max(0, startMins - inMins);
        const extraMinsAfter = Math.max(0, outMins - shiftEndMins);

        let extraHoursBefore = 0;
        if (extraMinsBefore > 0) {
          const fullHoursBefore = Math.floor(extraMinsBefore / 60);
          const remainingMinsBefore = extraMinsBefore % 60;
          extraHoursBefore = fullHoursBefore;
          if (remainingMinsBefore >= 35) {
            extraHoursBefore += 1;
          }
        }

        let extraHoursAfter = 0;
        if (extraMinsAfter > 0) {
          const fullHoursAfter = Math.floor(extraMinsAfter / 60);
          const remainingMinsAfter = extraMinsAfter % 60;
          extraHoursAfter = fullHoursAfter;
          if (remainingMinsAfter >= 35) {
            extraHoursAfter += 1;
          }
        }

        const totalExtraHours = extraHoursBefore + extraHoursAfter;
        if (totalExtraHours > 0) {
          overtimePay = Number((totalExtraHours * hourlyWage).toFixed(2));
        }

        // Plus, ₹100 flat bonus for staying till 7:00 PM (19:00 / outMins >= 1140 or extraMinsAfter >= 90 mins) on regular days (08:00 - 17:00 shift).
        if (extraMinsAfter >= 90 || outMins >= 1140) {
          flatBonus = 100;
        }
      } else {
        // Sunday: Labour shift end is 15:00 (3:00 PM). Working past 15:00 is paid hourly.
        // Plus if stayed till 5:00 PM (17:00 / outMins >= 1020 or extraMinsPast15 >= 90 mins), add ₹100 flat bonus.
        const extraMinsPast15 = Math.max(0, outMins - (startMins + 420));
        let extraHoursSunday = Math.floor(extraMinsPast15 / 60);
        if (extraMinsPast15 % 60 >= 35) {
          extraHoursSunday += 1;
        }
        if (extraHoursSunday > 0) {
          overtimePay = Number((extraHoursSunday * hourlyWage).toFixed(2));
        }
        if (outMins >= 1020 || extraMinsPast15 >= 90) {
          flatBonus = 100;
        }
      }
    }

    overtimeBonus = Number((overtimePay + flatBonus).toFixed(2));

    // 2. Late Entry Calculation:
    // Grace period: Staff = 35 mins, Labour = 30 mins
    const gracePeriod = type === 'Staff' ? 35 : 30;
    const actualInMins = timeToMinutes(punchIn);
    let staffLateHours = 0;

    if (actualInMins > startMins) {
      lateMinutes = actualInMins - startMins;
      if (lateMinutes > gracePeriod) {
        if (type === 'Staff') {
          const fullHoursLate = Math.floor(lateMinutes / 60);
          const remainderMins = lateMinutes % 60;
          staffLateHours = remainderMins <= 25 ? fullHoursLate : (fullHoursLate + 1);
          lateDeduction = staffLateHours * hourlyWage;
        } else {
          // Labour: Exceeded grace period, deduct standard hourly rate for the complete time missed
          lateDeduction = (lateMinutes / 60) * hourlyWage;
        }
      }
    }

    // Underwork deduction for both Staff and Labour on Weekdays
    let underworkWorkedHours = type === 'Staff' ? actualWorkingHours : hoursWorked;
    let underworkMissedHours = 0;
    
    if (type === 'Staff') {
      const actualInMins = timeToMinutes(punchIn);
      const actualOutMins = timeToMinutes(punchOut);
      const startMins = timeToMinutes(standardShiftStart);
      const endMins = startMins + 540; // Standard 9h shift (e.g. 08:00 - 17:00 or 08:30 - 17:30)

      const grossMins = Math.max(0, actualOutMins - actualInMins);
      const lunchMins = calculateLunchOverlap(punchIn, punchOut) * 60;
      const netWorkedMins = Math.max(0, grossMins - lunchMins);
      const netWorkedHours = netWorkedMins / 60;

      // Early departure calculation (35 mins grace before shift end)
      let earlyDepartureHours = 0;
      if (actualOutMins < (endMins - 35)) {
        const earlyMins = endMins - actualOutMins;
        const fullHoursEarly = Math.floor(earlyMins / 60);
        const remainderEarly = earlyMins % 60;
        earlyDepartureHours = remainderEarly <= 25 ? fullHoursEarly : (fullHoursEarly + 1);
      }

      if (netWorkedHours >= 7.25 || (actualInMins <= (startMins + 35) && actualOutMins >= (endMins - 35))) {
        // Full regular day on time (with 35m morning grace & departure grace, on normal days & Sundays)
        actualWorkingHours = 8;
        underworkMissedHours = 0;
        underworkDeduction = 0;
      } else if (netWorkedHours < 3.0) {
        // Short day / missed full day (less than 3 hours)
        actualWorkingHours = 0;
        underworkMissedHours = sunday ? 0 : 8;
        underworkDeduction = sunday ? 0 : oneDayPay;
      } else if (netWorkedHours >= 3.0 && netWorkedHours < 4.5) {
        // Half day (around 4 hours, e.g. leaving at 12:00 PM)
        actualWorkingHours = 4;
        underworkMissedHours = sunday ? 0 : 4;
        lateDeduction = 0;
        underworkDeduction = sunday ? 0 : oneDayPay / 2;
      } else if (netWorkedHours >= 4.5 && netWorkedHours < 5.5) {
        // 5 hours worked (e.g. leaving around 1:00 PM / 13:00, 12pm half day + 1hr extra before 1-2pm lunch)
        actualWorkingHours = 5;
        underworkMissedHours = sunday ? 0 : 3;
        lateDeduction = 0;
        underworkDeduction = sunday ? 0 : 3 * hourlyWage;
      } else if (netWorkedHours >= 5.5 && netWorkedHours < 6.5) {
        // 6 hours worked
        actualWorkingHours = 6;
        underworkMissedHours = sunday ? 0 : 2;
        lateDeduction = 0;
        underworkDeduction = sunday ? 0 : 2 * hourlyWage;
      } else {
        // Worked between 6.5 and 7.25 hours (7 hours worked)
        actualWorkingHours = 7;
        underworkMissedHours = sunday ? 0 : 1;
        lateDeduction = 0;
        underworkDeduction = sunday ? 0 : 1 * hourlyWage;
      }
      
      underworkWorkedHours = actualWorkingHours;
    } else {
      // Labour weekday underwork logic:
      if (!sunday) {
        const lunchStartMins = startMins + 240;
        const endMins = startMins + 540; // 5:00 PM (17:00)

        let effectiveInMinsForUnderwork = actualInMins;
        if (actualInMins > startMins && (actualInMins - startMins) <= gracePeriod) {
          effectiveInMinsForUnderwork = startMins;
        }

        let effectiveOutMinsForUnderwork = outMins;
        if (outMins >= (lunchStartMins - 10) && outMins < lunchStartMins) {
          effectiveOutMinsForUnderwork = lunchStartMins;
        } else if (outMins >= (endMins - gracePeriod) && outMins < endMins) {
          effectiveOutMinsForUnderwork = endMins;
        }

        if (outMins <= lunchStartMins) {
          const effectiveWorkedMins = Math.max(0, effectiveOutMinsForUnderwork - effectiveInMinsForUnderwork);
          underworkWorkedHours = effectiveWorkedMins / 60;
          const missedMinutes = Math.max(0, 480 - effectiveWorkedMins);
          underworkMissedHours = Math.ceil(missedMinutes / 60);
          underworkDeduction = Math.min(oneDayPay, underworkMissedHours * hourlyWage);
        } else {
          const earlyMinutes = Math.max(0, endMins - effectiveOutMinsForUnderwork);
          if (earlyMinutes > gracePeriod) {
            const lunchOverlapMins = Math.max(0, Math.min(endMins, 840) - Math.max(effectiveOutMinsForUnderwork, 780));
            const adjustedEarlyMinutes = Math.max(0, earlyMinutes - lunchOverlapMins);
            underworkMissedHours = Math.ceil(adjustedEarlyMinutes / 60);
            underworkDeduction = underworkMissedHours * hourlyWage;
          } else {
            underworkDeduction = 0;
          }
        }
      }
    }

    // Check if employee worked around 4 hours net (half-day work: around 4 hours net)
    const currentLunchOverlap = calculateLunchOverlap(punchIn, punchOut);
    const netWorkedHours = hoursWorked - currentLunchOverlap;
    const isHalfDay = !sunday && (actualWorkingHours === 4 || (type === 'Labour' && netWorkedHours >= 3.5 && netWorkedHours < 4.5));

    if (isHalfDay) {
      lateDeduction = 0;
      underworkDeduction = oneDayPay / 2;
    }

    // 3. Sunday Pay Calculation:
    if (sunday) {
      if (type === 'Labour') {
        if (hoursWorked > 0) {
          const outMins = timeToMinutes(punchOut);
          const workedFullShift = outMins >= 890 || hoursWorked >= 6; // 14:50 / 15:00
          if (workedFullShift) {
            dailyWage = oneDayPay;
            netPay = Math.round(oneDayPay) * 2 + overtimeBonus;
          } else {
            dailyWage = Math.min(oneDayPay, (hoursWorked / 6) * oneDayPay);
            netPay = oneDayPay + dailyWage + overtimeBonus;
          }
          
          if (workedFullShift) {
            explanation = `Sunday Work: Weekly Off (₹${Math.round(oneDayPay)}) + Extra Work Pay (Full day ₹${Math.round(dailyWage)}) = ₹${Math.round(netPay)}.`;
          } else {
            explanation = `Sunday Work: Weekly Off (₹${oneDayPay.toFixed(0)}) + Extra Work Pay (${hoursWorked.toFixed(1)}h @ ₹${(oneDayPay / 6).toFixed(0)}/h = ₹${dailyWage.toFixed(0)}) = ₹${netPay.toFixed(0)}.`;
          }
          
          if (overtimeBonus > 0) {
            explanation += ` Plus Overtime Bonus (+₹${overtimeBonus.toFixed(0)}).`;
          }
        } else {
          dailyWage = 0;
          netPay = 0;
          explanation = `Sunday: Absent.`;
        }
      } else {
        // Staff on Sunday
        // Staff shift end is 17:00 (5:00 PM), 8 net working hours for full day.
        // Payout is calculated based on credited working hours (8h = full 1-day pay).
        const creditedHours = actualWorkingHours; // calculated above via Staff credited hours logic
        if (creditedHours >= 8) {
          dailyWage = oneDayPay;
          netPay = Math.round(oneDayPay) * 2 + overtimeBonus;
        } else {
          dailyWage = Math.min(oneDayPay, creditedHours * hourlyWage);
          netPay = oneDayPay + dailyWage + overtimeBonus;
        }
        lateDeduction = 0;
        
        if (creditedHours >= 8) {
          explanation = `Sunday Work: Weekly Off (₹${Math.round(oneDayPay)}) + Extra Work Pay (Full day ₹${Math.round(dailyWage)}) = ₹${Math.round(netPay)}.`;
        } else if (creditedHours > 0) {
          explanation = `Sunday Work: Weekly Off (₹${oneDayPay.toFixed(0)}) + Extra Work Pay (${creditedHours}h @ ₹${hourlyWage.toFixed(0)}/h = ₹${dailyWage.toFixed(0)}) = ₹${netPay.toFixed(0)}.`;
        } else {
          explanation = `Sunday Work: Weekly Off (₹${oneDayPay.toFixed(0)}) + Extra Work Pay (0h = ₹0) = ₹${netPay.toFixed(0)}.`;
        }
        if (overtimeBonus > 0) {
          explanation += ` Plus Overtime Bonus (+₹${overtimeBonus.toFixed(0)}).`;
        }
      }
    } else {
      // Weekday / Regular Working Day
      dailyWage = oneDayPay;
      netPay = dailyWage + overtimeBonus - lateDeduction - underworkDeduction;
      
      if (isHalfDay) {
        explanation = `Present. Worked ${formatHoursAndMinutes(hoursWorked)}${currentLunchOverlap > 0 ? ` (Excl. ${formatHoursAndMinutes(currentLunchOverlap)} lunch)` : ''}. Half-day worked (around 4 hours net): deducted half-day salary (-₹${underworkDeduction.toFixed(0)}).`;
      } else {
        if (type === 'Staff') {
          const netActualMins = Math.max(0, hoursWorked - lunchOverlap);
          if (Math.abs(netActualMins - actualWorkingHours) > 0.01) {
            explanation = `Present. Worked ${formatHoursAndMinutes(netActualMins)} (${formatHoursAndMinutes(actualWorkingHours)} credited${lunchOverlap > 0 ? `, Excl. ${formatHoursAndMinutes(lunchOverlap)} lunch` : ''}).`;
          } else {
            explanation = `Present. Worked ${formatHoursAndMinutes(actualWorkingHours)}${lunchOverlap > 0 ? ` (Excl. ${formatHoursAndMinutes(lunchOverlap)} lunch)` : ''}.`;
          }
        } else {
          explanation = `Present. Worked ${formatHoursAndMinutes(hoursWorked)}.`;
        }

        if (underworkDeduction > 0) {
          const outMins = timeToMinutes(punchOut);
          const lunchStartMins = startMins + 240;
          if (outMins <= lunchStartMins) {
            if (underworkMissedHours === 4) {
              explanation += ` Half-day penalty applied (-₹${underworkDeduction.toFixed(0)}).`;
            } else {
              explanation += ` Underwork penalty applied (-₹${underworkDeduction.toFixed(0)}: ${underworkMissedHours}h missed).`;
            }
          } else {
            explanation += ` Early exit penalty applied (-₹${underworkDeduction.toFixed(0)}: ${underworkMissedHours}h early).`;
          }
        } else {
          const outMins = timeToMinutes(punchOut);
          const lunchStartMins = startMins + 240;
          const shiftEndMinsForExp = (type === 'Labour' && sunday) ? (startMins + 420) : (startMins + 540);
          if (outMins > lunchStartMins && outMins < shiftEndMinsForExp) {
            const earlyMinutes = shiftEndMinsForExp - outMins;
            explanation += ` Early exit by ${earlyMinutes}m (Within ${gracePeriod}m grace: No deduction).`;
          }
        }
        
        if (lateMinutes > 0) {
          if (lateMinutes > gracePeriod) {
            if (type === 'Staff') {
              const fullHoursLate = Math.floor(lateMinutes / 60);
              const remainderMins = lateMinutes % 60;
              const lateHours = remainderMins <= 25 ? fullHoursLate : (fullHoursLate + 1);
              explanation += ` Late by ${lateMinutes}m (Grace ${gracePeriod}m exceeded: -₹${lateDeduction.toFixed(2)} [${lateHours}h penalty]).`;
            } else {
              explanation += ` Late by ${lateMinutes}m (Grace ${gracePeriod}m exceeded: -₹${lateDeduction.toFixed(2)}).`;
            }
          } else {
            explanation += ` Late by ${lateMinutes}m (Within Grace ${gracePeriod}m: No deduction).`;
          }
        }
      }
      if (overtimeBonus > 0) {
        if (type === 'Labour' && !sunday) {
          const inMins = timeToMinutes(punchIn);
          const outMins = timeToMinutes(punchOut);
          const startMins = timeToMinutes(standardShiftStart);
          const shiftEndMins = startMins + 540; // 17:00
          
          const extraMinsBefore = Math.max(0, startMins - inMins);
          const extraMinsAfter = Math.max(0, outMins - shiftEndMins);
          
          let extraHoursBefore = Math.floor(extraMinsBefore / 60);
          if (extraMinsBefore % 60 >= 35) {
            extraHoursBefore += 1;
          }
          
          let extraHoursAfter = Math.floor(extraMinsAfter / 60);
          if (extraMinsAfter % 60 >= 35) {
            extraHoursAfter += 1;
          }
          
          const otParts = [];
          if (extraHoursBefore > 0) {
            otParts.push(`Before ${minutesToTime(startMins)}: worked ${formatHoursAndMinutes(extraMinsBefore / 60)} extra (${extraHoursBefore}h credited)`);
          }
          if (extraHoursAfter > 0) {
            otParts.push(`After 5:00 PM: worked ${formatHoursAndMinutes(extraMinsAfter / 60)} extra (${extraHoursAfter}h credited)`);
          }
          
          const totalOTPay = (extraHoursBefore + extraHoursAfter) * hourlyWage;
          const has100Bonus = flatBonus > 0;
          
          explanation += ` Overtime: ${otParts.length > 0 ? otParts.join(', ') : 'Past 5:00 PM'} (+₹${totalOTPay.toFixed(0)}${has100Bonus ? ' + ₹100 OT Bonus' : ''}).`;
        } else {
          const isAanchal = isAanchalGoel(employee.name);
          explanation += ` Overtime Bonus (+₹${overtimeBonus.toFixed(0)}${isAanchal ? ' for 7 PM stay' : ''}).`;
        }
      }

      // Append daily net payable amount
      explanation += ` Net Payable: ₹${netPay.toFixed(0)}.`;
    }
  } else {
    explanation = 'Missing Punch In/Out (Unpaid)';
  }

  return {
    date,
    isSunday: sunday,
    status,
    punchIn,
    punchOut,
    hoursWorked,
    actualWorkingHours,
    dailyWage,
    lateMinutes,
    lateDeduction,
    underworkDeduction,
    overtimePay,
    flatBonus,
    overtimeBonus,
    netPay,
    explanation,
  };
}

// Helper to check if a Sunday qualifies as a Paid Weekly Off
function isSundayPaidWeeklyOff(
  dayNumber: number,
  lastPresentDayNumber: number,
  records: AttendanceRecord[],
  employeeId: string,
  year: number,
  month: number,
  totalDaysInMonth: number,
  discontinuedDate?: string,
  employeeType?: 'Labour' | 'Staff'
): boolean {
  if (lastPresentDayNumber === 0) return false;
  if (dayNumber > lastPresentDayNumber) return false;

  const sundayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  if (discontinuedDate && sundayDateStr > discontinuedDate) return false;

  // Rule for Labour: If absent on Saturday (dayNumber - 1) AND absent on Monday (dayNumber + 1), Sunday is UNPAID.
  if (employeeType === 'Labour') {
    const satDay = dayNumber - 1;
    const monDay = dayNumber + 1;

    let isSatPresent = false;
    let isMonPresent = false;

    if (satDay >= 1) {
      const satDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(satDay).padStart(2, '0')}`;
      const satRec = records.find((r) => r.employeeId === employeeId && r.date === satDateStr);
      if (satRec && satRec.status === 'Present') {
        const hasPunches = satRec.punchIn && satRec.punchIn !== '-' && satRec.punchOut && satRec.punchOut !== '-';
        if (hasPunches) isSatPresent = true;
      }
    }

    if (monDay <= totalDaysInMonth) {
      const monDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(monDay).padStart(2, '0')}`;
      const monRec = records.find((r) => r.employeeId === employeeId && r.date === monDateStr);
      if (monRec && monRec.status === 'Present') {
        const hasPunches = monRec.punchIn && monRec.punchIn !== '-' && monRec.punchOut && monRec.punchOut !== '-';
        if (hasPunches) isMonPresent = true;
      }
    }

    if (!isSatPresent && !isMonPresent) {
      return false;
    }
  }

  const endCheckDay = dayNumber - 1;

  // If Sunday is Day 1 of the month, there are no preceding days in this month to check
  if (endCheckDay < 1) {
    const startCheckDay = dayNumber + 1;
    const maxFollowCheck = Math.min(totalDaysInMonth, dayNumber + 6);
    for (let d = startCheckDay; d <= maxFollowCheck; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (discontinuedDate && dStr > discontinuedDate) continue;

      const rec = records.find((r) => r.employeeId === employeeId && r.date === dStr);
      if (rec) {
        if (rec.status === 'Present') {
          const hasPunches = rec.punchIn && rec.punchIn !== '-' && rec.punchOut && rec.punchOut !== '-';
          if (hasPunches) return true;
        } else if (rec.status === 'Leave') {
          return true;
        }
      }
    }
    return false;
  }

  // If there ARE preceding days in the month before Sunday:
  // Check preceding working days in the week leading up to this Sunday (e.g., max(1, dayNumber - 6) to dayNumber - 1)
  const startCheckDay = Math.max(1, dayNumber - 6);
  for (let d = startCheckDay; d <= endCheckDay; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (discontinuedDate && dStr > discontinuedDate) continue;

    const rec = records.find((r) => r.employeeId === employeeId && r.date === dStr);
    if (rec) {
      if (rec.status === 'Present') {
        const hasPunches = rec.punchIn && rec.punchIn !== '-' && rec.punchOut && rec.punchOut !== '-';
        if (hasPunches) return true;
      } else if (rec.status === 'Leave') {
        return true;
      }
    }
  }

  return false;
}

// Generate monthly payroll summary for an employee
export function calculateMonthlySummary(
  employee: Employee,
  records: AttendanceRecord[],
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  overrideLeaveDeduction?: number,
  overrideAdjustedHours?: number,
  advanceAmount: number = 0
): MonthlyPayrollSummary {
  const { basicSalary, type } = employee;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const oneDayPay = basicSalary / totalDaysInMonth;
  const hourlyWage = oneDayPay / 8;
  const dailyDetails: DayPayrollDetails[] = [];

  // Step 1: Find the last day number in the month where the employee was Present
  let lastPresentDayNumber = 0;
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = records.find((r) => r.employeeId === employee.id && r.date === dateStr);
    if (record && record.status === 'Present') {
      const hasPunches = record.punchIn && record.punchIn !== '-' && record.punchOut && record.punchOut !== '-';
      if (hasPunches) {
        lastPresentDayNumber = day;
      }
    }
  }

  const isZeroDaysPresent = (lastPresentDayNumber === 0);

  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let unpaidSundays = 0;
  let daysDiscontinuedAfterLastWorking = 0;

  let totalHoursWorked = 0;
  let totalLateMinutes = 0;
  let totalLateDeductions = 0;
  let totalUnderworkDeductions = 0;
  let totalOvertimePay = 0;
  let totalFlatBonuses = 0;
  let totalOvertimeBonuses = 0;
  let totalSundayPay = 0;
  let daysDiscontinued = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sunday = isSunday(dateStr);

    if (employee.discontinuedDate && dateStr > employee.discontinuedDate) {
      daysDiscontinued++;
      dailyDetails.push({
        date: dateStr,
        isSunday: sunday,
        status: 'Absent',
        hoursWorked: 0,
        dailyWage: 0,
        lateMinutes: 0,
        lateDeduction: 0,
        overtimeBonus: 0,
        netPay: 0,
        explanation: 'Discontinued (No Pay)',
      });
      continue;
    }

    // If 0 days present in month or day is after last present day
    const isAfterLastWorkingDay = (day > lastPresentDayNumber);

    if (isZeroDaysPresent || isAfterLastWorkingDay) {
      if (sunday) {
        unpaidSundays++;
      } else {
        daysAbsent++;
      }
      daysDiscontinuedAfterLastWorking++;

      dailyDetails.push({
        date: dateStr,
        isSunday: sunday,
        status: 'Absent',
        hoursWorked: 0,
        dailyWage: 0,
        lateMinutes: 0,
        lateDeduction: 0,
        overtimeBonus: 0,
        netPay: 0,
        explanation: isZeroDaysPresent
          ? (sunday ? 'Unpaid Sunday (0 Days Present in Month)' : 'Absent (No Attendance Recorded)')
          : (sunday ? `Unpaid Sunday (Stopped coming after Day ${lastPresentDayNumber})` : `Absent (Stopped coming after Day ${lastPresentDayNumber})`),
      });
      continue;
    }

    // Days on or before lastPresentDayNumber:
    const record = records.find((r) => r.employeeId === employee.id && r.date === dateStr);

    if (record) {
      const details = calculateDailyPayroll(employee, record);

      if (sunday) {
        if (record.status === 'Present' && details.hoursWorked > 0) {
          daysPresent++;
          totalHoursWorked += details.hoursWorked;
          totalOvertimePay += details.overtimePay || 0;
          totalFlatBonuses += details.flatBonus || 0;
          totalOvertimeBonuses += details.overtimeBonus;
          totalSundayPay += details.dailyWage;
          dailyDetails.push(details);
        } else {
          const paidSunday = isSundayPaidWeeklyOff(day, lastPresentDayNumber, records, employee.id, year, month, totalDaysInMonth, employee.discontinuedDate, type);
          if (paidSunday) {
            dailyDetails.push({
              date: dateStr,
              isSunday: true,
              status: record.status || 'Absent',
              hoursWorked: 0,
              dailyWage: 0,
              lateMinutes: 0,
              lateDeduction: 0,
              overtimeBonus: 0,
              netPay: oneDayPay,
              explanation: 'Sunday (Weekly Off)',
            });
          } else {
            unpaidSundays++;
            dailyDetails.push({
              date: dateStr,
              isSunday: true,
              status: 'Absent',
              hoursWorked: 0,
              dailyWage: 0,
              lateMinutes: 0,
              lateDeduction: 0,
              overtimeBonus: 0,
              netPay: 0,
              explanation: type === 'Labour' ? 'Unpaid Sunday (Absent on Saturday & Monday / Continuous Absence)' : 'Unpaid Sunday (No working days present in this week)',
            });
          }
        }
      } else {
        dailyDetails.push(details);

        if (record.status === 'Present') {
          const hasPunches = record.punchIn && record.punchIn !== '-' && record.punchOut && record.punchOut !== '-';
          if (hasPunches) {
            daysPresent++;
            totalHoursWorked += details.hoursWorked;
            totalLateMinutes += details.lateMinutes;
            totalLateDeductions += details.lateDeduction;
            totalUnderworkDeductions += details.underworkDeduction || 0;
            totalOvertimePay += details.overtimePay || 0;
            totalFlatBonuses += details.flatBonus || 0;
            totalOvertimeBonuses += details.overtimeBonus;
          } else {
            daysAbsent++;
          }
        } else if (record.status === 'Absent') {
          daysAbsent++;
        } else if (record.status === 'Leave') {
          daysLeave++;
        }
      }
    } else {
      // Unrecorded day on or before lastPresentDayNumber
      if (sunday) {
        const paidSunday = isSundayPaidWeeklyOff(day, lastPresentDayNumber, records, employee.id, year, month, totalDaysInMonth, employee.discontinuedDate, type);
        if (paidSunday) {
          dailyDetails.push({
            date: dateStr,
            isSunday: true,
            status: 'Absent',
            hoursWorked: 0,
            dailyWage: 0,
            lateMinutes: 0,
            lateDeduction: 0,
            overtimeBonus: 0,
            netPay: oneDayPay,
            explanation: 'Sunday (Weekly Off)',
          });
        } else {
          unpaidSundays++;
          dailyDetails.push({
            date: dateStr,
            isSunday: true,
            status: 'Absent',
            hoursWorked: 0,
            dailyWage: 0,
            lateMinutes: 0,
            lateDeduction: 0,
            overtimeBonus: 0,
            netPay: 0,
            explanation: type === 'Labour' ? 'Unpaid Sunday (Absent on Saturday & Monday / Continuous Absence)' : 'Unpaid Sunday (No working days present in this week)',
          });
        }
      } else {
        daysAbsent++;
        dailyDetails.push({
          date: dateStr,
          isSunday: false,
          status: 'Absent',
          hoursWorked: 0,
          dailyWage: 0,
          lateMinutes: 0,
          lateDeduction: 0,
          overtimeBonus: 0,
          netPay: 0,
          explanation: 'No Attendance Recorded (Unpaid)',
        });
      }
    }
  }

  // Monthly Leave & Absent Deductions Calculation:
  let juneAugMissedHours: number | undefined = undefined;
  let juneAugRemainingQuotaHours: number | undefined = undefined;
  let juneAugUnusedLeaveBonus = 0;
  let quarterName: string | undefined = undefined;
  let quarterBreakdown: { monthIndex: number; monthName: string; missedHours: number; }[] | undefined = undefined;

  let calculatedLeaveDeductions = 0;
  let calculatedAbsentDeductions = 0;

  if (type === 'Labour') {
    if (isZeroDaysPresent) {
      calculatedAbsentDeductions = basicSalary;
    } else {
      const allowedLeaves = 0;
      const unpaidLeaves = Math.max(0, daysLeave - allowedLeaves);
      calculatedLeaveDeductions = unpaidLeaves * oneDayPay;
      calculatedAbsentDeductions = (daysAbsent + unpaidSundays) * oneDayPay;
    }
  } else {
    // Staff Employee Logic (36-hour Quarterly Leave Quota)
    const blockStartMonth = Math.floor(month / 3) * 3;
    const quarterNamesMap: Record<number, string> = {
      0: 'January–March',
      3: 'April–June',
      6: 'July–September',
      9: 'October–December',
    };
    quarterName = quarterNamesMap[blockStartMonth] || 'Quarterly';

    const m0 = blockStartMonth;
    const m1 = blockStartMonth + 1;
    const m2 = blockStartMonth + 2;

    const monthNamesList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const missed0 = getStaffMissedHoursInMonth(employee, records, year, m0);
    const missed1 = (month >= m1) ? getStaffMissedHoursInMonth(employee, records, year, m1) : 0;
    const missed2 = (month >= m2) ? getStaffMissedHoursInMonth(employee, records, year, m2) : 0;

    quarterBreakdown = [
      { monthIndex: m0, monthName: monthNamesList[m0] || `Month ${m0 + 1}`, missedHours: missed0 }
    ];
    if (month >= m1) {
      quarterBreakdown.push({ monthIndex: m1, monthName: monthNamesList[m1] || `Month ${m1 + 1}`, missedHours: missed1 });
    }
    if (month >= m2) {
      quarterBreakdown.push({ monthIndex: m2, monthName: monthNamesList[m2] || `Month ${m2 + 1}`, missedHours: missed2 });
    }

    if (isZeroDaysPresent) {
      calculatedAbsentDeductions = basicSalary;
      juneAugMissedHours = getStaffMissedHoursInMonth(employee, records, year, month);
      juneAugRemainingQuotaHours = 0;
      juneAugUnusedLeaveBonus = 0;
    } else {
      const totalQuotaHours = 36.0;

      if (month === m0) {
        const cumulativeMissed = missed0;
        const excess = Math.max(0, cumulativeMissed - totalQuotaHours);
        calculatedLeaveDeductions = excess * hourlyWage;
        juneAugMissedHours = cumulativeMissed;
        juneAugRemainingQuotaHours = Math.max(0, totalQuotaHours - cumulativeMissed);
      } else if (month === m1) {
        const cumulativeMissed = missed0 + missed1;
        const excess0 = Math.max(0, missed0 - totalQuotaHours);
        const cumulativeExcess = Math.max(0, cumulativeMissed - totalQuotaHours);
        const excess1 = Math.max(0, cumulativeExcess - excess0);
        calculatedLeaveDeductions = excess1 * hourlyWage;
        juneAugMissedHours = cumulativeMissed;
        juneAugRemainingQuotaHours = Math.max(0, totalQuotaHours - cumulativeMissed);
      } else if (month === m2) {
        const cumulativeMissed = missed0 + missed1 + missed2;
        const excess01 = Math.max(0, (missed0 + missed1) - totalQuotaHours);
        const cumulativeExcess = Math.max(0, cumulativeMissed - totalQuotaHours);
        const excess2 = Math.max(0, cumulativeExcess - excess01);
        calculatedLeaveDeductions = excess2 * hourlyWage;

        juneAugMissedHours = cumulativeMissed;
        juneAugRemainingQuotaHours = Math.max(0, totalQuotaHours - cumulativeMissed);

        if (cumulativeMissed < totalQuotaHours) {
          const unusedHours = totalQuotaHours - cumulativeMissed;
          juneAugUnusedLeaveBonus = Number((unusedHours * hourlyWage).toFixed(2));
        }
      }

      calculatedAbsentDeductions = 0;
      totalLateDeductions = 0;
      totalUnderworkDeductions = 0;
    }
  }

  const calculatedDiscontinuedDeductions = daysDiscontinued * oneDayPay;
  const defaultLeaveDeductions = calculatedLeaveDeductions + calculatedAbsentDeductions + calculatedDiscontinuedDeductions;

  // Apply manual override if provided
  const isOverridden = overrideLeaveDeduction !== undefined;
  const finalLeaveDeductions = isOverridden ? overrideLeaveDeduction : defaultLeaveDeductions;

  // Apply custom hours adjustment (add or deduct hours) - Only applicable for Staff
  const adjustedHours = type === 'Staff' ? (overrideAdjustedHours || 0) : 0;
  const adjustedHoursPay = type === 'Staff' ? Number((adjustedHours * hourlyWage).toFixed(2)) : 0;

  // Final Payable Salary Formula:
  // Final = Basic Salary - Leave Deductions - Late Deductions - Underwork Deductions + Overtime Bonuses + Sunday Overtime Pay + Adjusted Hours Pay + juneAugUnusedLeaveBonus
  const finalPayableSalary = Math.max(
    0,
    basicSalary - finalLeaveDeductions - totalLateDeductions - totalUnderworkDeductions + totalOvertimeBonuses + totalSundayPay + adjustedHoursPay + juneAugUnusedLeaveBonus
  );

  const esiDeduction = employee.esiDeducted ? Number((finalPayableSalary * 0.0075).toFixed(2)) : 0;
  const pfDeduction = employee.pfDeducted ? Number((finalPayableSalary * 0.12).toFixed(2)) : 0;
  const lwfDeduction = employee.lwfDeducted ? Math.min(35, Number((finalPayableSalary * 0.002).toFixed(2))) : 0;
  const netTakeHomeBeforeAdvance = Math.max(0, Number((finalPayableSalary - esiDeduction - pfDeduction - lwfDeduction).toFixed(2)));
  const netTakeHome = Math.max(0, Number((netTakeHomeBeforeAdvance - advanceAmount).toFixed(2)));

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employeeType: type,
    basicSalary,
    oneDayPay,
    hourlyWage,
    
    daysPresent,
    daysAbsent,
    daysLeave,
    daysDiscontinued,
    
    totalHoursWorked,
    totalLateMinutes,
    totalLateDeductions,
    totalUnderworkDeductions,
    totalOvertimePay,
    totalFlatBonuses,
    totalOvertimeBonuses,
    
    leaveDeductions: finalLeaveDeductions,
    originalLeaveDeductions: defaultLeaveDeductions,
    isLeaveDeductionOverridden: isOverridden,
    adjustedHours,
    adjustedHoursPay,
    finalPayableSalary,
    
    juneAugMissedHours,
    juneAugRemainingQuotaHours,
    juneAugUnusedLeaveBonus,
    quarterName,
    quarterBreakdown,
    
    esiDeduction,
    pfDeduction,
    lwfDeduction,
    advanceAmount,
    netTakeHome,
    
    dailyDetails,
  };
}

// Convert decimal hours into a friendly readable string: "Xh Ym"
export function formatHoursAndMinutes(hours: number): string {
  if (isNaN(hours) || hours <= 0) return '—';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m > 0) {
    return `${m}m`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
