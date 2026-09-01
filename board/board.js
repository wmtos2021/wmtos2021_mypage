// board.js

import "../dice/dice.js";
import { updateMarker } from "./move.js";
import { getDeviceId } from "../utils.js";
import {
    getDeviceInfo,
    getStudentInfo
} from "../attend/attendFirebase.js";

// 요소 가져오기
const studentName = document.getElementById("studentName");
const studentPoint = document.getElementById("studentPoint");
const studentGold = document.getElementById("studentGold");

// 초기 실행
init();

async function init() {
    await loadPlayer();
}

// 학생 정보 불러오기
async function loadPlayer() {
    const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
    );

    if (!studentInfo.name) {
        return;
    }

    studentName.textContent =
        `${studentInfo.name.replace(/\d+$/g, "")}님`;

    const playerPosition =
        studentInfo.lastPosition !== undefined
            ? Number(studentInfo.lastPosition)
            : 40;

    sessionStorage.setItem(
        "position",
        playerPosition
    );

    updateMarker(playerPosition);

    studentPoint.textContent =
        Number(studentInfo.totalP || 0).toLocaleString();

    studentGold.textContent =
        Number(studentInfo.totalG || 0).toLocaleString();
}

// 최신 POINT / GOLD / 위치 조회
window.refreshGameStatus = async function () {
    const deviceId = getDeviceId();
    const deviceInfo = await getDeviceInfo(deviceId);
    const mobile = deviceInfo.mobile;
    const studentInfo = await getStudentInfo(mobile);

    sessionStorage.setItem(
        "studentInfo",
        JSON.stringify(studentInfo)
    );

    studentPoint.textContent =
        Number(studentInfo.totalP || 0).toLocaleString();

    studentGold.textContent =
        Number(studentInfo.totalG || 0).toLocaleString();

    const position =
        studentInfo.lastPosition !== undefined
            ? Number(studentInfo.lastPosition)
            : 40;

    sessionStorage.setItem(
        "position",
        position
    );

    updateMarker(position);
};