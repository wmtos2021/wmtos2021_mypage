// studentPoint.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

const pointBtn = document.getElementById("pointBtn");
const pointContent = document.getElementById("pointContent");

// 최근 3개월
function getRecentMonthKeys() {
    const today = new Date();
    const monthKeys = [];

    for (let i = 0; i < 3; i++) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1
        );

        monthKeys.push(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        );
    }

    return monthKeys;
}


// 숫자 변환
function getPoint(value) {
    const point = Number(value);

    if (!Number.isFinite(point) || point <= 0) {
        return 0;
    }

    return point;
}

// POINT 기록 가져오기
async function getPointHistory() {
    const deviceData = sessionStorage.getItem("deviceInfo");

    if (!deviceData) {
        return {};
    }

    const deviceInfo = JSON.parse(deviceData);
    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return {};
    }

    const monthKeys = getRecentMonthKeys();

    const attendanceSnapshot = await get(
        ref(db, `history/${mobile}/attendance`)
    );

    const boardSnapshot = await get(
        ref(db, `history/${mobile}/board`)
    );

    const attendanceData = attendanceSnapshot.exists()
        ? attendanceSnapshot.val()
        : {};

    const boardData = boardSnapshot.exists()
        ? boardSnapshot.val()
        : {};

    const records = {};

    monthKeys.forEach(monthKey => {
        records[monthKey] = [];
    });

    // 출석 및 숙제 POINT
    Object.entries(attendanceData).forEach(([dateKey, timeData]) => {
        const monthKey = dateKey.slice(0, 7);

        if (!monthKeys.includes(monthKey)) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const attendP = getPoint(data.attendP);
            const homeworkP = getPoint(data.homeworkP);

            if (attendP > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "출석",
                    point: attendP
                });
            }

            if (homeworkP > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "숙제",
                    point: homeworkP
                });
            }
        });
    });

    // 보드게임 POINT
    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        const monthKey = dateKey.slice(0, 7);

        if (!monthKeys.includes(monthKey)) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getP = getPoint(data.getP);
            const useP = getPoint(data.useP);

            if (getP > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "보드게임참여",
                    point: getP
                });
            }

            if (useP > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "보드게임참여",
                    point: useP
                });
            }
        });
    });

    return records;
}

// POINT 내역 표시
async function renderPointHistory() {
    pointContent.innerHTML = "";

    const records = await getPointHistory();
    const monthKeys = getRecentMonthKeys();

    let hasRecord = false;

    monthKeys.forEach(monthKey => {
        const monthRecords = records[monthKey] || [];

        if (monthRecords.length === 0) {
            return;
        }

        hasRecord = true;

        monthRecords.sort((a, b) => {
            const dateA = `${a.date} ${a.time}`;
            const dateB = `${b.date} ${b.time}`;

            return dateB.localeCompare(dateA);
        });

        monthRecords.forEach(record => {
            const row = document.createElement("div");
            row.className = "pointHistoryRow";

            const date = document.createElement("span");
            date.className = "pointHistoryDate";
            date.textContent = record.date;

            const detail = document.createElement("span");
            detail.className = "pointHistoryDetail";
            detail.textContent = record.detail;

            const sign = document.createElement("span");
            sign.className =
                record.type === "받음"
                    ? "pointHistorySign pointHistoryPlus"
                    : "pointHistorySign pointHistoryMinus";
            sign.textContent = record.type === "받음" ? "+" : "-";

            const value = document.createElement("strong");
            value.className =
                record.type === "받음"
                    ? "pointHistoryValue pointHistoryPlus"
                    : "pointHistoryValue pointHistoryMinus";
            value.textContent = record.point.toLocaleString();

            const unit = document.createElement("span");
            unit.className =
                record.type === "받음"
                    ? "pointHistoryUnit pointHistoryPlus"
                    : "pointHistoryUnit pointHistoryMinus";
            unit.textContent = "P";

            row.appendChild(date);
            row.appendChild(detail);
            row.appendChild(sign);
            row.appendChild(value);
            row.appendChild(unit);

            pointContent.appendChild(row);
        });
    });

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "pointHistoryEmpty";
        empty.textContent = "최근 3개월의 POINT 내역이 없습니다.";
        pointContent.appendChild(empty);
    }
}

// POINT 팝업 열 때 내역 갱신
pointBtn.addEventListener("click", () => {
    renderPointHistory();
});