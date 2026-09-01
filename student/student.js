// student.js

import {
    setDiligenceData,
    renderDiligenceCalendar
} from "./studentDiligence.js";

import { checkSession } from "../end/session.js";

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
const diligenceBtn = document.getElementById("diligenceBtn");
const diligenceModal = document.getElementById("diligenceModal");
const diligenceCloseBtn = document.getElementById("diligenceCloseBtn");
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

// 학생 정보
let studentInfo = null;
let attendRecords = {};
let diligenceRecords = {};

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

    const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Seoul"
    });
    const todayMonth = today.slice(0, 7);

    const todayDiligence = diligenceData !== null
        ? Number(diligenceData)
        : 100;

    diligenceRecords = {
        [todayMonth]: todayDiligence
    };

    studentName.textContent =
        `${(studentInfo.name || "학생").replace(/\d+$/g, "")}님`;

    studentPoint.textContent =
        `${(studentInfo.totalP || 0).toLocaleString()}`;

    studentGold.textContent =
        `${(studentInfo.totalG || 0).toLocaleString()}`;

    diligenceCount.textContent = todayDiligence;
    diligenceTotal.textContent = 100;

    const grade = getDiligenceGrade(todayDiligence);

    diligenceGrade.innerHTML =
        grade === "A+"
            ? "A<sup>+</sup>"
            : grade;

    setDiligenceData(
        studentInfo,
        attendRecords,
        diligenceRecords
    );

    return true;
}

// 성실도 등급
function getDiligenceGrade(score) {
    if (score >= 95) {
        return "A+";
    }

    if (score >= 90) {
        return "A";
    }

    return "";
}

// 성실도 팝업
diligenceBtn.addEventListener("click", () => {
    diligenceModal.classList.remove("hidden");
    renderDiligenceCalendar();
});

// 성실도 팝업 닫기
diligenceCloseBtn.addEventListener("click", () => {
    diligenceModal.classList.add("hidden");
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
boardGameMainBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    location.href = "../board/board.html";
});

boardGameBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    location.href = "../board/board.html";
});

// 골드상점
goldShopMainBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    location.href = "../shop/shop.html";
});

goldShopBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    location.href = "../shop/shop.html";
});

// 출석 완료
document.addEventListener("attendanceCompleted", (event) => {
    const point = Number(event.detail?.point || 0);

    if (point <= 0) {
        return;
    }

    const currentPoint =
        Number(studentPoint.textContent.replace(/,/g, "")) || 0;

    studentPoint.textContent =
        `${(currentPoint + point).toLocaleString()}`;
});

// 초기 학생 정보
async function initializeStudent() {
    const sessionValid = await checkSession();

    if (!sessionValid) {
        return;
    }

    const loaded = loadStudentInfo();

    if (!loaded) {
        location.href = "../check/check.html";
        return;
    }
}

initializeStudent();