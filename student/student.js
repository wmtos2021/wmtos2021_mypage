// student.js

import { getDeviceId } from "../utils.js";
import {
    getDeviceInfo,
    getStudentInfo,
    getAttendRecords,
    getDiligence
} from "../attend/attendFirebase.js";
import {
    setDiligenceData,
    renderDiligenceCalendar
} from "./studentDiligence.js";

// HTML 요소
const studentName = document.getElementById("studentName");
const studentPoint = document.getElementById("studentPoint");
const studentGold = document.getElementById("studentGold");
const diligenceBtn = document.getElementById("diligenceBtn");
const diligenceModal = document.getElementById("diligenceModal");
const diligenceCloseBtn = document.getElementById("diligenceCloseBtn");
const pointBtn = document.getElementById("pointBtn");
const pointModal = document.getElementById("pointModal");
const pointCloseBtn = document.getElementById("pointCloseBtn");
const goldBtn = document.getElementById("goldBtn");
const goldModal = document.getElementById("goldModal");
const goldCloseBtn = document.getElementById("goldCloseBtn");
const diligenceCount = document.getElementById("diligenceCount");
const diligenceTotal = document.getElementById("diligenceTotal");
const diligenceGrade = document.getElementById("diligenceGrade");

// 학생 정보
let deviceInfo = null;
let studentInfo = null;
let attendRecords = {};

// 학생 정보 가져오기
async function loadStudentInfo() {
    const deviceId = getDeviceId();

    if (!deviceId) {
        return false;
    }

    deviceInfo = await getDeviceInfo(deviceId);

    if (!deviceInfo) {
        return false;
    }

    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return false;
    }

    studentInfo = await getStudentInfo(mobile);

    if (!studentInfo) {
        return false;
    }

    attendRecords = await getAttendRecords(mobile);

    const today =
        new Date().toLocaleDateString(
            "sv-SE",
            { timeZone: "Asia/Seoul" }
        );

    const diligence =
        await getDiligence(
            mobile,
            today
        );

    studentName.textContent =
        `${(studentInfo.name || "학생").replace(/\d+$/g, "")}님`;

    studentPoint.textContent =
        `${studentInfo.totalP || 0} P`;

    studentGold.textContent =
        `${studentInfo.totalG || 0} G`;

    diligenceCount.textContent =
        diligence;

    diligenceTotal.textContent =
        100;

    diligenceGrade.innerHTML =
        getDiligenceGrade(diligence) === "A+"
            ? "A<sup>+</sup>"
            : getDiligenceGrade(diligence);

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
diligenceBtn.addEventListener(
    "click",
    async () => {
        const loaded = await loadStudentInfo();

        if (!loaded) {
            return;
        }

        setDiligenceData(
            studentInfo,
            attendRecords
        );

        renderDiligenceCalendar();

        diligenceModal.classList.remove("hidden");
    }
);

// 성실도 팝업 닫기
diligenceCloseBtn.addEventListener(
    "click",
    () => {
        diligenceModal.classList.add("hidden");
    }
);

// POINT 팝업
pointBtn.addEventListener(
    "click",
    () => {
        pointModal.classList.remove("hidden");
    }
);

pointCloseBtn.addEventListener(
    "click",
    () => {
        pointModal.classList.add("hidden");
    }
);

// GOLD 팝업
goldBtn.addEventListener(
    "click",
    () => {
        goldModal.classList.remove("hidden");
    }
);

goldCloseBtn.addEventListener(
    "click",
    () => {
        goldModal.classList.add("hidden");
    }
);

// 초기 학생 정보
loadStudentInfo();