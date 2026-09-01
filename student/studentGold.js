// studentGold.js

import { getGoldHistory } from "./studentGoldFirebase.js";

const goldBtn = document.getElementById("goldBtn");
const goldContent = document.getElementById("goldContent");

const MAX_MONTHS = 3;

let loadedMonths = [];
let loadingMore = false;

// 숫자 변환
function getGold(value) {
    const gold = Number(value);

    if (!Number.isFinite(gold) || gold <= 0) {
        return 0;
    }

    return gold;
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
        return JSON.parse(data);
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

    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getG = getGold(data.getG);
            const useG = getGold(data.useG);

            if (getG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "게임보상",
                    gold: getG
                });
            }

            if (useG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "게임 참여",
                    gold: useG
                });
            }
        });
    });

    Object.entries(shopData).forEach(([dateKey, timeData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getG = getGold(data.getG);
            const useG = getGold(data.useG);

            if (getG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: data.type || "",
                    gold: getG
                });
            }

            if (useG > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: data.type || "상점사용",
                    gold: useG
                });
            }
        });
    });

    Object.entries(rewardData).forEach(([rewardMonth, data]) => {
        if (rewardMonth !== monthKey) {
            return;
        }

        const rewardG = getGold(data.rewardG);

        if (rewardG > 0) {
            records.push({
                date: `${rewardMonth}-01`,
                time: "",
                type: "받음",
                detail: `${data.rewardMonth} 성실도`,
                gold: rewardG
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

// GOLD 내역 표시
function renderRecords(records) {
    records.forEach(record => {
        const row = document.createElement("div");
        row.className = "goldHistoryRow";

        const date = document.createElement("span");
        date.className = "goldHistoryDate";
        date.textContent = record.date;

        const detail = document.createElement("span");
        detail.className = "goldHistoryDetail";
        detail.textContent = record.detail;

        const sign = document.createElement("span");
        sign.className =
            record.type === "받음"
                ? "goldHistorySign goldHistoryPlus"
                : "goldHistorySign goldHistoryMinus";
        sign.textContent = record.type === "받음" ? "+" : "-";

        const value = document.createElement("strong");
        value.className =
            record.type === "받음"
                ? "goldHistoryValue goldHistoryPlus"
                : "goldHistoryValue goldHistoryMinus";
        value.textContent = record.gold.toLocaleString();

        const unit = document.createElement("span");
        unit.className =
            record.type === "받음"
                ? "goldHistoryUnit goldHistoryPlus"
                : "goldHistoryUnit goldHistoryMinus";
        unit.textContent = "G";

        row.appendChild(date);
        row.appendChild(detail);
        row.appendChild(sign);
        row.appendChild(value);
        row.appendChild(unit);

        const moreBtn = document.getElementById("goldMoreBtn");

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

// 현재 월 표시
async function renderInitialHistory() {
    const historyData = getInitialGoldHistory();
    const monthKey = getMonthKey(new Date());

    loadedMonths = [monthKey];

    const records = createMonthRecords(
        monthKey,
        historyData
    );

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

        const lastMonth =
            loadedMonths[loadedMonths.length - 1];

        const previousMonth =
            getPreviousMonth(lastMonth);

        const historyData =
            await getGoldHistory(
                mobile,
                previousMonth
            );

        const records =
            createMonthRecords(
                previousMonth,
                historyData
            );

        loadedMonths.push(previousMonth);

        if (records.length > 0) {
            renderRecords(records);
        } else {
            const currentMoreBtn =
                document.getElementById("goldMoreBtn");

            if (currentMoreBtn) {
                currentMoreBtn.textContent =
                    "더 이상 조회할 내용이 없습니다.";
                currentMoreBtn.disabled = true;
            }

            return;
        }

        const currentMoreBtn =
            document.getElementById("goldMoreBtn");

        if (!currentMoreBtn) {
            return;
        }

        if (loadedMonths.length >= MAX_MONTHS) {
            currentMoreBtn.textContent =
                "과거 내역은 최대 2개월 조회 가능합니다.";
            currentMoreBtn.disabled = true;
        } else {
            currentMoreBtn.textContent = "더보기";
            currentMoreBtn.disabled = false;
        }

    } catch (error) {
        console.error(
            "GOLD 이전 내역 조회 오류:",
            error
        );

        const currentMoreBtn =
            document.getElementById("goldMoreBtn");

        if (currentMoreBtn) {
            currentMoreBtn.textContent = "더보기";
            currentMoreBtn.disabled = false;
        }

    } finally {
        loadingMore = false;
    }
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

    goldContent.appendChild(
        createMoreButton()
    );
}

// GOLD 팝업 열기
goldBtn.addEventListener("click", async () => {
    goldContent.innerHTML = "";

    const hasRecord =
        await renderInitialHistory();

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "goldHistoryEmpty";
        empty.textContent = "GOLD 내역이 없습니다.";
        goldContent.appendChild(empty);
    }

    showMoreButton();
});