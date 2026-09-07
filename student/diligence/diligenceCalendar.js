// diligenceCalendar.js

// 월 이동
export function shiftMonth(
    monthKey,
    offset
) {
    let [year, month] = monthKey.split("-").map(Number);

    month += offset;

    while (month < 1) {
        year--;
        month += 12;
    }

    while (month > 12) {
        year++;
        month -= 12;
    }

    return `${year}-${String(month).padStart(2, "0")}`;
}

// 이전 달 이동 가능 여부
export function canMovePreviousMonth(
    currentMonth,
    todayMonth
) {
    return currentMonth !== shiftMonth(todayMonth, -2);
}

// 다음 달 이동 가능 여부
export function canMoveNextMonth(
    currentMonth,
    todayMonth
) {
    return currentMonth !== todayMonth;
}

// 이전 달
export function getPreviousMonth(currentMonth) {
    return shiftMonth(currentMonth, -1);
}

// 다음 달
export function getNextMonth(currentMonth) {
    return shiftMonth(currentMonth, 1);
}

// 월 표시 정보
export function getCalendarMonthInfo(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);

    return {
        year,
        month,
        text: `${year}년 ${month}월`
    };
}

// 날짜 상태 계산
export function getCalendarDayData(
    year,
    month,
    date,
    todayString,
    studentInfo,
    attendRecords,
    selectedSubject
) {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthRecords = attendRecords?.[monthKey] || {};

    const enrollment = studentInfo?.enrollment
        ? String(studentInfo.enrollment).slice(0, 10)
        : "";

    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    const dateData = monthRecords[dateString] || {};
    const record = dateData[selectedSubject] || null;

    const dayOfWeek = new Date(year, month, date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateString === todayString;

    const isBeforeEnrollment = Boolean(
        enrollment &&
        dateString < enrollment
    );

    const isFuture = dateString > todayString;

    return {
        dateString,
        date,
        dayOfWeek,
        isWeekend,
        isToday,
        isBeforeEnrollment,
        isFuture,
        record
    };
}