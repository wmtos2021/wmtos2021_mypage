// student.js

import {
    setDiligenceData,
    renderDiligenceCalendar
} from "./diligence/diligence.js";
import {getReward} from "./reward/reward.js";
import {checkSession} from "../end/session.js";
import {
    VERSION,
    ACADEMY_NAME,
    ACADEMY_ADDRESS,
    getMonthFromTimestamp
} from "../utils.js";

// 뒤로가기 방지
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
});
window.addEventListener("pageshow", () => {
    history.pushState(null, "", location.href);
});

// HTML 요소
const studentName = document.getElementById("studentName");
const studentPoint = document.getElementById("studentPoint");
const studentGold = document.getElementById("studentGold");
const academyName = document.querySelector(".footerLine1");
const academyAddress = document.querySelector(".footerLine2");
const version = document.getElementById("version");
const diligenceBtn = document.getElementById("diligenceBtn");
const diligenceModal = document.getElementById("diligenceModal");
const diligenceCount = document.getElementById("diligenceCount");
const diligenceTotal = document.getElementById("diligenceTotal");
const diligenceGrade = document.getElementById("diligenceGrade");
const pointBtn = document.getElementById("pointBtn");
const pointModal = document.getElementById("pointModal");
const pointCloseBtn = document.getElementById("pointCloseBtn");
const goldBtn = document.getElementById("goldBtn");
const goldModal = document.getElementById("goldModal");
const goldCloseBtn = document.getElementById("goldCloseBtn");
const boardGameMainBtn = document.getElementById("boardGameMainBtn");
const boardGameBtn = document.getElementById("boardGameBtn");
const goldShopMainBtn = document.getElementById("goldShopMainBtn");
const goldShopBtn = document.getElementById("goldShopBtn");

academyName.textContent = ACADEMY_NAME;
academyAddress.textContent = ACADEMY_ADDRESS;
version.textContent = `Ver ${VERSION}`;

// 학생 정보
let studentInfo = null;
let attendRecords = {};

// QR 확인 정보 가져오기
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

// 학생 정보 가져오기
function loadStudentInfo() {
    const studentData = sessionStorage.getItem("studentInfo");
    const attendData = sessionStorage.getItem("attendRecords");
    const diligenceData = sessionStorage.getItem("diligence");
    if (!studentData) {
        return false;
    }
    studentInfo = JSON.parse(studentData);
    attendRecords = attendData ? JSON.parse(attendData) : {};
    const attendanceCheck = getAttendanceCheck();
    const todayMonth = getMonthFromTimestamp(
        attendanceCheck?.attendTimestamp
    );
    if (!todayMonth) {
        return false;
    }
    const todayDiligence =
        diligenceData !== null
            ? Number(diligenceData)
            : 100;
    studentName.textContent =
        `${(studentInfo.name || "학생").replace(/\d+$/g, "")}님`;
    studentPoint.textContent =
        `${(Number(studentInfo.totalP) || 0).toLocaleString()}`;
    studentGold.textContent =
        `${(Number(studentInfo.totalG) || 0).toLocaleString()}`;
    diligenceCount.textContent = todayDiligence;
    diligenceTotal.textContent = 100;
    const grade = getReward(todayDiligence).grade;
    diligenceGrade.innerHTML =
        grade === "A+"
            ? "A<sup>+</sup>"
            : grade;
    setDiligenceData(
        studentInfo,
        attendRecords,
        todayDiligence
    );
    return true;
}

let diligenceHtml = null;

// 성실도 팝업
diligenceBtn.addEventListener("click", async () => {
    try {
        if (!diligenceHtml) {
            const response = await fetch(
                "./diligence/diligence.html"
            );
            if (!response.ok) {
                throw new Error(
                    `diligence.html: ${response.status}`
                );
            }
            diligenceHtml = await response.text();
            diligenceModal.innerHTML = diligenceHtml;
            const diligenceCloseBtn =
                document.getElementById("diligenceCloseBtn");
            diligenceCloseBtn.addEventListener("click", () => {
                diligenceModal.classList.add("hidden");
            });
        }
        diligenceModal.classList.remove("hidden");
        await renderDiligenceCalendar();
    } catch (error) {}
});

// POINT 팝업
pointBtn.addEventListener("click", () => {
    pointModal.classList.remove("hidden");
});
pointCloseBtn.addEventListener("click", () => {
    pointModal.classList.add("hidden");
});

// GOLD 팝업
goldBtn.addEventListener("click", () => {
    goldModal.classList.remove("hidden");
});
goldCloseBtn.addEventListener("click", () => {
    goldModal.classList.add("hidden");
});

// 보드게임
boardGameMainBtn.addEventListener("click", event => {
    event.stopPropagation();
    location.href = "../board/board.html";
});
boardGameBtn.addEventListener("click", event => {
    event.stopPropagation();
    location.href = "../board/board.html";
});

// 골드상점
goldShopMainBtn.addEventListener("click", event => {
    event.stopPropagation();
    location.href = "../shop/shop.html";
});
goldShopBtn.addEventListener("click", event => {
    event.stopPropagation();
    location.href = "../shop/shop.html";
});

// 출석 완료
document.addEventListener("attendanceCompleted", async event => {
    const point = Number(event.detail?.point || 0);
    const diligence = event.detail?.diligence;
    const attendanceClass = event.detail?.class;
    const attend = event.detail?.attend || "";
    const attendSc = Number(event.detail?.attendSc || 0);
    const attendanceCheck = getAttendanceCheck();
    const attendanceDate =
        attendanceCheck?.attendTimestamp
            ? attendanceCheck.attendTimestamp.slice(0, 10)
            : null;
    const todayMonth =
        attendanceCheck?.attendTimestamp
            ? getMonthFromTimestamp(
                attendanceCheck.attendTimestamp
            )
            : null;

    // 출석 완료 기록 저장
    if (
        todayMonth &&
        attendanceDate &&
        attendanceClass
    ) {
        if (!attendRecords[todayMonth]) {
            attendRecords[todayMonth] = {};
        }
        if (!attendRecords[todayMonth][attendanceDate]) {
            attendRecords[todayMonth][attendanceDate] = {};
        }
        attendRecords[todayMonth][attendanceDate][attendanceClass] = {
            attend,
            attendP: point,
            attendSc,
            homework: "",
            homeworkP: "",
            homeworkSc: ""
        };
        sessionStorage.setItem(
            "attendRecords",
            JSON.stringify(attendRecords)
        );
        sessionStorage.setItem(
            `attendanceCompleted_${attendanceDate}_${attendanceClass}`,
            "true"
        );
    }

    // POINT 갱신
    if (point > 0) {
        const currentPoint =
            Number(
                studentPoint.textContent.replace(/,/g, "")
            ) || 0;
        const newPoint = currentPoint + point;
        studentPoint.textContent = newPoint.toLocaleString();
        if (studentInfo) {
            studentInfo.totalP = newPoint;
            sessionStorage.setItem(
                "studentInfo",
                JSON.stringify(studentInfo)
            );
        }
    }

    // 성실도 갱신
    if (
        diligence !== null &&
        diligence !== undefined &&
        diligence !== ""
    ) {
        const newDiligence = Number(diligence);
        diligenceCount.textContent = newDiligence;
        const grade = getReward(newDiligence).grade;
        diligenceGrade.innerHTML =
            grade === "A+"
                ? "A<sup>+</sup>"
                : grade;
        sessionStorage.setItem(
            "diligence",
            String(newDiligence)
        );
    }

    // 성실도 데이터 갱신
    setDiligenceData(
        studentInfo,
        attendRecords,
        diligence
    );

    // 성실도 화면이 열려 있으면 즉시 갱신
    if (
        diligenceModal &&
        !diligenceModal.classList.contains("hidden")
    ) {
        await renderDiligenceCalendar();
    }
});

// 초기 학생 정보
async function initializeStudent() {
    const loaded = loadStudentInfo();
    if (!loaded) {
        location.href = "../check/check.html";
        return;
    }
    const sessionValid = await checkSession();
    if (!sessionValid) {
        return;
    }
}

initializeStudent();