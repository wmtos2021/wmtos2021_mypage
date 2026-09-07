// diligence.js

import {
    canMovePreviousMonth,
    canMoveNextMonth,
    getPreviousMonth,
    getNextMonth
} from "./diligenceCalendar.js";

import {
    renderCalendarHeader,
    renderSubjectTabs,
    renderCalendarDays
} from "./diligenceUi.js";

import {bindAttendButton} from "./diligenceAttend.js";
import {setDiligenceDetailData} from "./diligenceDetail.js";
import {getMonthRecords} from "./diligenceFirebase.js";
import {getReward} from "../reward/reward.js";
import {getClassTime} from "../../attend/attendFirebase.js";

import {
    getTimestampParts,
    getDayFromTimestamp
} from "../../utils.js";

// 이번 달 오늘
let currentMonth = null;
let todayMonth = null;
let todayDate = null;

// 학생 정보
let studentInfo = null;
let attendRecords = {};
let diligenceRecords = {};
let selectedSubject = null;
let classTime = null;
let eventsBound = false;

// 과목 이름
const subjectNames = {
    korean: "국어",
    english: "영어",
    math: "수학",
    social: "사회",
    science: "과학",
    history: "역사"
};

// 과목 순서
const subjectOrder = [
    "math",
    "english",
    "science",
    "korean",
    "social",
    "history"
];

// QR 출석 정보 가져오기
function getAttendanceCheck() {
    const data = sessionStorage.getItem("attendanceCheck");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// 날짜 기준 설정
function setDateInfo() {
    const attendanceCheck = getAttendanceCheck();
    const timestamp = attendanceCheck?.attendTimestamp;
    const parts = getTimestampParts(timestamp);

    if (!parts) {
        return false;
    }

    todayDate = parts.date;
    todayMonth = parts.month;
    currentMonth = todayMonth;

    return true;
}

// 성실도 등급
function getDiligenceGrade(score) {
    if (
        score === null ||
        score === undefined ||
        score === ""
    ) {
        return "";
    }

    const value = Number(score);

    if (!Number.isFinite(value)) {
        return "";
    }

    return getReward(value).grade;
}

// 성실도 등급 표시
function renderDiligenceGrade(grade) {
    if (!grade) {
        return "";
    }
    if (grade.endsWith("+")) {
        return `<span class="gradeBase">${grade.slice(0, -1)}</span><sup>+</sup>`;
    }

    return `<span class="gradeBase">${grade}</span>`;
}

// 성실도 등급 워터마크 표시
function renderDiligenceGradeWatermark() {
    const watermark = document.getElementById(
        "diligenceGradeWatermark"
    );

    if (!watermark) {
        return;
    }

    if (
        !currentMonth ||
        currentMonth === todayMonth
    ) {
        watermark.innerHTML = "";
        return;
    }

    const score = diligenceRecords[currentMonth];

    if (
        score === null ||
        score === undefined ||
        score === ""
    ) {
        watermark.innerHTML = "";
        return;
    }

    const grade = getDiligenceGrade(score);

    watermark.innerHTML =
        renderDiligenceGrade(grade);
}

// 성실도 데이터 저장
export function setDiligenceData(
    info,
    records,
    diligence
) {
    studentInfo = info;
    attendRecords = records || {};
    diligenceRecords = {};

    setDiligenceDetailData(attendRecords);

    const subjects = Object.keys(
        studentInfo?.class || {}
    );

    const attendanceCheck = getAttendanceCheck();
    const checkSubject = attendanceCheck?.subject;

    if (
        checkSubject &&
        subjects.includes(checkSubject)
    ) {
        selectedSubject = checkSubject;
    } else if (
        !selectedSubject ||
        !subjects.includes(selectedSubject)
    ) {
        selectedSubject = subjects[0] || null;
    }

    setDateInfo();

    if (
        todayMonth &&
        diligence !== null &&
        diligence !== undefined &&
        diligence !== ""
    ) {
        diligenceRecords[todayMonth] = Number(diligence);
    }
}

// 오늘 수업시간 가져오기
async function loadTodayClassTime() {
    classTime = null;

    if (!selectedSubject) {
        return;
    }

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (!deviceData) {
        return;
    }

    try {
        const deviceInfo = JSON.parse(deviceData);
        const className = deviceInfo?.class?.[selectedSubject];

        if (!className) {
            return;
        }

        const attendanceCheck = getAttendanceCheck();

        const day = getDayFromTimestamp(
            attendanceCheck?.attendTimestamp
        );

        if (!day) {
            return;
        }

        classTime = await getClassTime(
            selectedSubject,
            className,
            day
        );
    } catch (error) {
        classTime = null;
    }
}

// 화면 전체 갱신
function updateDiligenceView() {
    renderCalendarHeader(
        currentMonth,
        todayMonth
    );

    renderSubjectTabs(
        studentInfo,
        selectedSubject,
        subjectNames,
        subjectOrder
    );

    renderCalendarDays(
        currentMonth,
        todayDate,
        studentInfo,
        attendRecords,
        selectedSubject,
        getAttendanceCheck(),
        classTime
    );

    renderDiligenceGradeWatermark();

    bindAttendButton();
}

// 월 데이터 가져오기
async function loadMonth(
    monthKey,
    force = false
) {
    const deviceData = sessionStorage.getItem(
        "deviceInfo"
    );

    if (!deviceData) {
        return false;
    }

    try {
        const deviceInfo = JSON.parse(deviceData);
        const mobile = deviceInfo.mobile;

        if (!mobile) {
            return false;
        }

        const hasAttendRecords =
            attendRecords[monthKey] !== undefined;

        const hasDiligence =
            diligenceRecords[monthKey] !== undefined;

        if (
            !force &&
            hasAttendRecords &&
            hasDiligence
        ) {
            return true;
        }

        const {
            attendRecords: monthAttendRecords,
            diligenceScore
        } = await getMonthRecords(
            mobile,
            monthKey
        );

        attendRecords[monthKey] =
            monthAttendRecords;

        diligenceRecords[monthKey] =
            diligenceScore;

        return true;
    } catch (error) {
        return false;
    }
}

// 이벤트 연결
function bindEvents() {
    if (eventsBound) {
        return;
    }

    const subjectTabs =
        document.getElementById("subjectTabs");

    const prevMonthBtn =
        document.getElementById("prevMonthBtn");

    const nextMonthBtn =
        document.getElementById("nextMonthBtn");

    if (
        !subjectTabs ||
        !prevMonthBtn ||
        !nextMonthBtn
    ) {
        return;
    }

    eventsBound = true;

    // 과목 탭 클릭
    subjectTabs.addEventListener(
        "click",
        async event => {
            const tab =
                event.target.closest(".subjectTab");

            if (!tab) {
                return;
            }

            const subject =
                tab.dataset.subject;

            if (
                !subject ||
                subject === selectedSubject
            ) {
                return;
            }

            selectedSubject = subject;
            currentMonth = todayMonth;

            await loadMonth(currentMonth);
            await loadTodayClassTime();

            updateDiligenceView();
        }
    );

    // 이전 달 클릭
    prevMonthBtn.addEventListener(
        "click",
        async () => {
            if (
                !canMovePreviousMonth(
                    currentMonth,
                    todayMonth
                )
            ) {
                return;
            }

            currentMonth =
                getPreviousMonth(currentMonth);

            await loadMonth(currentMonth);

            updateDiligenceView();
        }
    );

    // 다음 달 클릭
    nextMonthBtn.addEventListener(
        "click",
        async () => {
            if (
                !canMoveNextMonth(
                    currentMonth,
                    todayMonth
                )
            ) {
                return;
            }

            currentMonth =
                getNextMonth(currentMonth);

            await loadMonth(currentMonth);

            updateDiligenceView();
        }
    );
}

// 성실도 달력 표시
export async function renderDiligenceCalendar() {
    if (!studentInfo) {
        return;
    }

    if (!todayMonth || !todayDate) {
        if (!setDateInfo()) {
            return;
        }
    }

    const subjectTabs =
        document.getElementById("subjectTabs");

    const calendarDays =
        document.getElementById("calendarDays");

    if (
        !subjectTabs ||
        !calendarDays
    ) {
        return;
    }

    await loadMonth(currentMonth);
    await loadTodayClassTime();

    updateDiligenceView();
    bindEvents();
}

// 출석 완료 후 갱신
document.addEventListener("attendanceCompleted", async event => {
    const subject = event.detail?.subject;
    if (!subject || currentMonth !== todayMonth) return;

    sessionStorage.setItem(
        `attendanceCompleted_${todayDate}_${subject}`,
        "true"
    );

    await loadMonth(currentMonth, true);
    await loadTodayClassTime();

    renderCalendarDays(
        currentMonth,
        todayDate,
        studentInfo,
        attendRecords,
        selectedSubject,
        getAttendanceCheck(),
        classTime
    );

    renderDiligenceGradeWatermark();
    bindAttendButton();
});