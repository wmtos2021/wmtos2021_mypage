// studentPoint.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

const pointBtn = document.getElementById("pointBtn");
const pointContent = document.getElementById("pointContent");

const MAX_MONTHS = 3;

let loadedMonths = [];
let loadingMore = false;

// 숫자 변환
function getPoint(value) {
    const point = Number(value);

    if (!Number.isFinite(point) || point <= 0) {
        return 0;
    }

    return point;
}

// 월 키
function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// 이전 월
function getPreviousMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return getMonthKey(new Date(year, month - 2, 1));
}

// 현재 월 데이터 가져오기
function getInitialPointHistory() {
    const data = sessionStorage.getItem("pointHistory");

    if (!data) {
        return {
            attendance: {},
            board: {},
            reward: {}
        };
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return {
            attendance: {},
            board: {},
            reward: {}
        };
    }
}

// 월별 POINT 기록 생성
function createMonthRecords(monthKey, historyData) {
    const records = [];
    const attendanceData = historyData.attendance || {};
    const boardData = historyData.board || {};
    const rewardData = historyData.reward || {};

    Object.entries(attendanceData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const attendP = getPoint(data.attendP);
            const homeworkP = getPoint(data.homeworkP);

            if (attendP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "출석",
                    point: attendP
                });
            }

            if (homeworkP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "숙제",
                    point: homeworkP
                });
            }
        });
    });

    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getP = getPoint(data.getP);
            const useP = getPoint(data.useP);

            if (getP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "보드게임참여",
                    point: getP
                });
            }

            if (useP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "보드게임참여",
                    point: useP
                });
            }
        });
    });

    Object.entries(rewardData).forEach(([rewardMonth, data]) => {
        if (rewardMonth !== monthKey) {
            return;
        }

        const rewardP = getPoint(data.rewardP);

        if (rewardP > 0) {
            records.push({
                date: `${rewardMonth}-01`,
                time: "",
                type: "받음",
                detail: `${data.rewardMonth} 성실도`,
                point: rewardP
            });
        }
    });

    records.sort((a, b) => {
        const dateA = `${a.date} ${a.time}`;
        const dateB = `${b.date} ${b.time}`;
        return dateB.localeCompare(dateA);
    });

    return records;
}

// POINT 내역 표시
function renderRecords(records) {
    records.forEach(record => {
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
}

// 더보기 버튼
function createMoreButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "pointMoreBtn";
    button.className = "pointMoreBtn";
    button.textContent = "더보기";
    button.addEventListener("click", loadPreviousMonth);
    return button;
}

// 현재 월 표시
function renderInitialHistory() {
    const historyData = getInitialPointHistory();
    const monthKey = getMonthKey(new Date());

    loadedMonths = [monthKey];

    const records = createMonthRecords(monthKey, historyData);

    if (records.length > 0) {
        renderRecords(records);
        return true;
    }

    return false;
}

// 이전 1개월 조회
async function loadPreviousMonth() {
    if (loadingMore || loadedMonths.length >= MAX_MONTHS) {
        return;
    }

    loadingMore = true;

    const moreBtn = document.getElementById("pointMoreBtn");

    if (moreBtn) {
        moreBtn.disabled = true;
        moreBtn.textContent = "불러오는 중...";
    }

    try {
        const deviceData = sessionStorage.getItem("deviceInfo");

        if (!deviceData) {
            return;
        }

        const deviceInfo = JSON.parse(deviceData);
        const mobile = deviceInfo.mobile;

        if (!mobile) {
            return;
        }

        const lastMonth = loadedMonths[loadedMonths.length - 1];
        const previousMonth = getPreviousMonth(lastMonth);
        const monthStart = `${previousMonth}-01`;

        const [year, month] = previousMonth.split("-").map(Number);
        const lastDate = new Date(year, month, 0).getDate();
        const monthEnd = `${previousMonth}-${String(lastDate).padStart(2, "0")}`;

        const attendanceSnapshot = await get(
            query(
                ref(db, `history/${mobile}/attendance`),
                orderByKey(),
                startAt(monthStart),
                endAt(monthEnd)
            )
        );

        const boardSnapshot = await get(
            query(
                ref(db, `history/${mobile}/board`),
                orderByKey(),
                startAt(monthStart),
                endAt(monthEnd)
            )
        );

        const rewardSnapshot = await get(
            query(
                ref(db, `history/${mobile}/reward`),
                orderByKey(),
                startAt(previousMonth),
                endAt(previousMonth)
            )
        );

        const historyData = {
            attendance: attendanceSnapshot.exists() ? attendanceSnapshot.val() : {},
            board: boardSnapshot.exists() ? boardSnapshot.val() : {},
            reward: rewardSnapshot.exists() ? rewardSnapshot.val() : {}
        };

        loadedMonths.push(previousMonth);

        const records = createMonthRecords(previousMonth, historyData);

        if (records.length > 0) {
            renderRecords(records);
        }

        if (loadedMonths.length >= MAX_MONTHS) {
            removeMoreButton();
        }
    } catch (error) {
        if (moreBtn) {
            moreBtn.disabled = false;
            moreBtn.textContent = "더보기";
        }
    } finally {
        loadingMore = false;
    }
}

// 더보기 버튼 제거
function removeMoreButton() {
    const moreBtn = document.getElementById("pointMoreBtn");

    if (moreBtn) {
        moreBtn.remove();
    }
}

// 더보기 버튼 표시
function showMoreButton() {
    removeMoreButton();

    if (loadedMonths.length >= MAX_MONTHS) {
        return;
    }

    pointContent.appendChild(createMoreButton());
}

// POINT 팝업 열기
pointBtn.addEventListener("click", () => {
    pointContent.innerHTML = "";

    const hasRecord = renderInitialHistory();

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "pointHistoryEmpty";
        empty.textContent = "POINT 내역이 없습니다.";
        pointContent.appendChild(empty);
    }

    showMoreButton();
});