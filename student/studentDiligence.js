// studentDiligence.js

import {
    handleAttend,
    waitTodayInfo
} from "../attend/attend.js";
import { renderCalendarDays } from "./diligenceCalendar.js";
import { getPreviousRecords } from "./studentDiligenceFirebase.js";

let currentDate = new Date();
let studentInfo = null;
let attendRecords = {};
let diligenceRecords = {};
let previousRecordsLoaded = false;

// 성실도 데이터 설정
export function setDiligenceData(info, records, diligence) {
    studentInfo = info;
    attendRecords = records || {};
    diligenceRecords = diligence || {};
}

// 성실도 점수 가져오기
function getMonthDiligence(year, month) {
    const monthKey =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    if (diligenceRecords[monthKey] === undefined) {
        return 100;
    }

    return Number(diligenceRecords[monthKey]) || 0;
}

// 이전 2개월 데이터 가져오기
async function loadPreviousRecords() {
    if (previousRecordsLoaded) {
        return;
    }

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (!deviceData) {
        return;
    }

    const deviceInfo = JSON.parse(deviceData);
    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return;
    }

    const previousRecords = await getPreviousRecords(mobile);

    attendRecords = {
        ...attendRecords,
        ...previousRecords.attendRecords
    };

    diligenceRecords = {
        ...diligenceRecords,
        ...previousRecords.diligenceRecords
    };

    previousRecordsLoaded = true;

    setDiligenceData(
        studentInfo,
        attendRecords,
        diligenceRecords
    );
}

// 성실도 팝업 점수 변경
function updateDiligenceScore() {
    const score = getMonthDiligence(
        currentDate.getFullYear(),
        currentDate.getMonth()
    );

    const diligenceModalScore =
        document.getElementById("diligenceModalScore");

    if (diligenceModalScore) {
        diligenceModalScore.textContent =
            `${score}/100`;
    }
}

// 성실도 달력 표시
export async function renderDiligenceCalendar() {
    const diligenceContent =
        document.getElementById("diligenceContent");

    if (!diligenceContent) {
        return;
    }

    await waitTodayInfo();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const minDate = new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
    );

    const isCurrentMonth =
        year === today.getFullYear() &&
        month === today.getMonth();

    const isMinMonth =
        year === minDate.getFullYear() &&
        month === minDate.getMonth();

    updateDiligenceScore();

    const lastDate = new Date(
        year,
        month + 1,
        0
    ).getDate();

    diligenceContent.innerHTML = `
        <div class="calendarHeader">
            <button
                type="button"
                class="monthBtn"
                id="prevMonthBtn"
                ${isMinMonth ? "disabled" : ""}>
                ‹
            </button>

            <strong>
                ${year}년 ${month + 1}월
            </strong>

            <button
                type="button"
                class="monthBtn"
                id="nextMonthBtn"
                ${isCurrentMonth ? "disabled" : ""}>
                ›
            </button>
        </div>

        <div class="calendar">
            <div class="dayName">월</div>
            <div class="dayName">화</div>
            <div class="dayName">수</div>
            <div class="dayName">목</div>
            <div class="dayName">금</div>

            ${renderCalendarDays(
                year,
                month,
                lastDate,
                isCurrentMonth,
                today,
                studentInfo,
                attendRecords
            )}
        </div>
    `;

    document
        .getElementById("prevMonthBtn")
        .addEventListener("click", async () => {
            if (isMinMonth) {
                return;
            }

            await loadPreviousRecords();

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            renderDiligenceCalendar();
        });

    document
        .getElementById("nextMonthBtn")
        .addEventListener("click", () => {
            if (isCurrentMonth) {
                return;
            }

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );

            renderDiligenceCalendar();
        });

    const attendBtn =
        document.getElementById("todayAttendBtn");

    if (attendBtn) {
        attendBtn.addEventListener(
            "click",
            handleAttend
        );
    }
}

// 출석 완료 후 출석 버튼 제거
document.addEventListener(
    "attendanceCompleted",
    () => {
        const attendBtn =
            document.getElementById("todayAttendBtn");

        if (attendBtn) {
            attendBtn.remove();
        }
    }
);