// point.js

import {
    getPointHistory,
    getTodayPointHistory
} from "./pointFirebase.js";

const pointBtn = document.getElementById("pointBtn");
const pointContent = document.getElementById("pointContent");

const MAX_MONTHS = 3;

let loadedMonths = [];
let loadingMore = false;

// 숫자 변환
function getPoint(value) {
    const point = Number(value);
    return Number.isFinite(point) && point > 0 ? point : 0;
}

// 월 키
function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// 날짜 키
function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// 이전 월
function getPreviousMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 2, 1);

    return getMonthKey(date);
}

// 현재 POINT 데이터 가져오기
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
        const historyData = JSON.parse(data);

        return {
            attendance: historyData.attendance || {},
            board: historyData.board || {},
            reward: historyData.reward || {}
        };
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

    // 출석
    Object.entries(attendanceData).forEach(([dateKey, subjectData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(subjectData || {}).forEach(([subject, data]) => {
            const attendP = getPoint(data?.attendP);
            const homeworkP = getPoint(data?.homeworkP);

            if (attendP > 0) {
                records.push({
                    date: dateKey,
                    time: "",
                    type: "받음",
                    detail: "출석",
                    point: attendP
                });
            }

            if (homeworkP > 0) {
                records.push({
                    date: dateKey,
                    time: "",
                    type: "받음",
                    detail: "숙제",
                    point: homeworkP
                });
            }
        });
    });

    // 보드게임
    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getP = getPoint(data?.getP);
            const useP = getPoint(data?.useP);

            if (getP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "게임참여보상",
                    point: getP
                });
            }

            if (useP > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "게임참여",
                    point: useP
                });
            }
        });
    });

    // 성실도 리워드
    Object.entries(rewardData).forEach(([rewardMonth, data]) => {
        if (rewardMonth !== monthKey) {
            return;
        }

        const rewardP = getPoint(data?.rewardP);

        if (rewardP > 0) {
            records.push({
                date: `${rewardMonth}-01`,
                time: "",
                type: "받음",
                detail: `${data.rewardMonth || ""} 성실도`,
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

// POINT 기록 한 줄 생성
function createRecordRow(record) {
    const row = document.createElement("div");
    row.className = "pointHistoryRow";

    const date = document.createElement("span");
    date.className = "pointHistoryDate";
    date.textContent = record.date;

    const detail = document.createElement("span");
    detail.className = "pointHistoryDetail";
    detail.textContent = record.detail;

    const isGet = record.type === "받음";
    const colorClass = isGet ? "pointHistoryPlus" : "pointHistoryMinus";

    const sign = document.createElement("span");
    sign.className = `pointHistorySign ${colorClass}`;
    sign.textContent = isGet ? "+" : "-";

    const value = document.createElement("strong");
    value.className = `pointHistoryValue ${colorClass}`;
    value.textContent = record.point.toLocaleString();

    const unit = document.createElement("span");
    unit.className = `pointHistoryUnit ${colorClass}`;
    unit.textContent = "P";

    row.append(date, detail, sign, value, unit);

    return row;
}

// POINT 내역 표시
function renderRecords(records) {
    const moreBtn = document.getElementById("pointMoreBtn");

    records.forEach(record => {
        const row = createRecordRow(record);

        if (moreBtn) {
            pointContent.insertBefore(row, moreBtn);
        } else {
            pointContent.appendChild(row);
        }
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

// 현재 월 표시
async function renderInitialHistory() {
    const historyData = getInitialPointHistory();
    const today = new Date();
    const monthKey = getMonthKey(today);
    const dateKey = getDateKey(today);

    loadedMonths = [monthKey];

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (deviceData) {
        try {
            const deviceInfo = JSON.parse(deviceData);
            const mobile = deviceInfo.mobile;

            if (mobile) {
                const todayData = await getTodayPointHistory(
                    mobile,
                    dateKey,
                    monthKey
                );

                historyData.attendance[dateKey] = todayData.attendance || {};
                historyData.board[dateKey] = todayData.board || {};

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

        const historyData = await getPointHistory(
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
            const currentMoreBtn = document.getElementById("pointMoreBtn");

            if (currentMoreBtn) {
                currentMoreBtn.textContent = "더 이상 조회할 내용이 없습니다.";
                currentMoreBtn.disabled = true;
            }

            return;
        }

        const currentMoreBtn = document.getElementById("pointMoreBtn");

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
        const currentMoreBtn = document.getElementById("pointMoreBtn");

        if (currentMoreBtn) {
            currentMoreBtn.textContent = "더보기";
            currentMoreBtn.disabled = false;
        }
    } finally {
        loadingMore = false;
    }
}

// POINT 팝업 열기
pointBtn.addEventListener("click", async () => {
    pointContent.innerHTML = "";

    const hasRecord = await renderInitialHistory();

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "pointHistoryEmpty";
        empty.textContent = "POINT 내역이 없습니다.";
        pointContent.appendChild(empty);
    }

    showMoreButton();
});