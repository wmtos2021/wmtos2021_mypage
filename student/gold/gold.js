// gold.js

import {
    getGoldHistory,
    getTodayGoldHistory
} from "./goldFirebase.js";

import {
    getTimestampParts
} from "../../utils.js";

const goldBtn = document.getElementById("goldBtn");
const goldContent = document.getElementById("goldContent");

const MAX_MONTHS = 3;

let loadedMonths = [];
let loadingMore = false;

// 숫자 변환
function getGold(value) {
    const gold = Number(value);
    return Number.isFinite(gold) && gold > 0 ? gold : 0;
}

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

// 이전 월
function getPreviousMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 2, 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// 현재 GOLD 데이터 가져오기
function getInitialGoldHistory() {
    const data = sessionStorage.getItem("goldHistory");

    if (!data) {
        return {
            board: {},
            shop: {},
            reward: {}
        };
    }

    try {
        const historyData = JSON.parse(data);

        return {
            board: historyData.board || {},
            shop: historyData.shop || {},
            reward: historyData.reward || {}
        };
    } catch (error) {
        return {
            board: {},
            shop: {},
            reward: {}
        };
    }
}

// 월별 GOLD 기록 생성
function createMonthRecords(monthKey, historyData) {
    const records = [];
    const boardData = historyData.board || {};
    const shopData = historyData.shop || {};
    const rewardData = historyData.reward || {};

    // 보드게임 - GOLD 받음
    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getG = getGold(data?.getG);

            if (getG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "게임보상",
                    gold: getG
                });
            }
        });
    });

    // 상점 - GOLD 사용
    Object.entries(shopData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const useG = getGold(data?.useG);

            if (useG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: data?.type || "상점사용",
                    gold: useG
                });
            }
        });
    });

    // 성실도 보상 - GOLD 받음
    Object.entries(rewardData).forEach(([dateKey, data]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        const rewardG = getGold(data?.rewardG);

        if (rewardG > 0) {
            records.push({
                date: dateKey,
                time: "",
                type: "받음",
                detail: "성실도보상",
                gold: rewardG
            });
        }
    });

    return records;
}

// GOLD 기록 한 줄 생성
function createRecordRow(record) {
    const row = document.createElement("div");
    row.className = "goldHistoryRow";

    const date = document.createElement("span");
    date.className = "goldHistoryDate";
    date.textContent = record.date;

    const detail = document.createElement("span");
    detail.className = "goldHistoryDetail";
    detail.textContent = record.detail;

    const isGet = record.type === "받음";
    const colorClass = isGet ? "goldHistoryPlus" : "goldHistoryMinus";

    const sign = document.createElement("span");
    sign.className = `goldHistorySign ${colorClass}`;
    sign.textContent = isGet ? "+" : "-";

    const value = document.createElement("strong");
    value.className = `goldHistoryValue ${colorClass}`;
    value.textContent = record.gold.toLocaleString();

    const unit = document.createElement("span");
    unit.className = `goldHistoryUnit ${colorClass}`;
    unit.textContent = "G";

    row.append(date, detail, sign, value, unit);

    return row;
}

// GOLD 내역 표시
function renderRecords(records) {
    const moreBtn = document.getElementById("goldMoreBtn");

    records.forEach(record => {
        const row = createRecordRow(record);

        if (moreBtn) {
            goldContent.insertBefore(row, moreBtn);
        } else {
            goldContent.appendChild(row);
        }
    });
}

// 더보기 버튼
function createMoreButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "goldMoreBtn";
    button.className = "goldMoreBtn";
    button.textContent = "더보기";
    button.addEventListener("click", loadPreviousMonth);

    return button;
}

// 더보기 버튼 제거
function removeMoreButton() {
    const moreBtn = document.getElementById("goldMoreBtn");

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

    goldContent.appendChild(createMoreButton());
}

// 현재 월 표시
async function renderInitialHistory() {
    const historyData = getInitialGoldHistory();
    const attendanceCheck = getAttendanceCheck();
    const parts = getTimestampParts(
        attendanceCheck?.attendTimestamp
    );

    if (!parts) {
        return false;
    }

    const monthKey = parts.month;
    const dateKey = parts.date;

    loadedMonths = [monthKey];

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (deviceData) {
        try {
            const deviceInfo = JSON.parse(deviceData);
            const mobile = deviceInfo.mobile;

            if (mobile) {
                const todayData = await getTodayGoldHistory(
                    mobile,
                    dateKey,
                    monthKey
                );

                historyData.board[dateKey] = todayData.board || {};
                historyData.shop[dateKey] = todayData.shop || {};

                if (
                    todayData.reward &&
                    Object.keys(todayData.reward).length > 0
                ) {
                    historyData.reward[monthKey] = todayData.reward;
                } else {
                    delete historyData.reward[monthKey];
                }
            }
        } catch (error) {}
    }

    const records = createMonthRecords(monthKey, historyData);

    if (records.length > 0) {
        renderRecords(records);
        return true;
    }

    return false;
}

// 이전 월 조회
async function loadPreviousMonth() {
    if (
        loadingMore ||
        loadedMonths.length >= MAX_MONTHS
    ) {
        return;
    }

    loadingMore = true;

    const moreBtn = document.getElementById("goldMoreBtn");

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

        const historyData = await getGoldHistory(
            mobile,
            previousMonth
        );

        const records = createMonthRecords(
            previousMonth,
            historyData
        );

        loadedMonths.push(previousMonth);

        if (records.length > 0) {
            renderRecords(records);
        } else {
            const currentMoreBtn = document.getElementById("goldMoreBtn");

            if (currentMoreBtn) {
                currentMoreBtn.textContent = "더 이상 조회할 내용이 없습니다.";
                currentMoreBtn.disabled = true;
            }

            return;
        }

        const currentMoreBtn = document.getElementById("goldMoreBtn");

        if (!currentMoreBtn) {
            return;
        }

        if (loadedMonths.length >= MAX_MONTHS) {
            currentMoreBtn.textContent = "과거 내역은 최대 2개월 조회 가능합니다.";
            currentMoreBtn.disabled = true;
        } else {
            currentMoreBtn.textContent = "더보기";
            currentMoreBtn.disabled = false;
        }
    } catch (error) {
        const currentMoreBtn = document.getElementById("goldMoreBtn");

        if (currentMoreBtn) {
            currentMoreBtn.textContent = "더보기";
            currentMoreBtn.disabled = false;
        }
    } finally {
        loadingMore = false;
    }
}

// GOLD 팝업 열기
goldBtn.addEventListener("click", async () => {
    goldContent.innerHTML = "";

    const hasRecord = await renderInitialHistory();

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "goldHistoryEmpty";
        empty.textContent = "GOLD 내역이 없습니다.";
        goldContent.appendChild(empty);
    }

    showMoreButton();
});