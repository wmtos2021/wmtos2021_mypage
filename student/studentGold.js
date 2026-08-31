// studentGold.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

const goldBtn = document.getElementById("goldBtn");
const goldContent = document.getElementById("goldContent");

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
function getGold(value) {
    const gold = Number(value);

    if (!Number.isFinite(gold) || gold <= 0) {
        return 0;
    }

    return gold;
}

// GOLD 기록 가져오기
async function getGoldHistory() {
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

    const boardSnapshot = await get(
        ref(db, `history/${mobile}/board`)
    );

    const shopSnapshot = await get(
        ref(db, `history/${mobile}/shop`)
    );

    const rewardSnapshot = await get(
        ref(db, `history/${mobile}/reward`)
    );

    const boardData = boardSnapshot.exists()
        ? boardSnapshot.val()
        : {};

    const shopData = shopSnapshot.exists()
        ? shopSnapshot.val()
        : {};

    const rewardData = rewardSnapshot.exists()
        ? rewardSnapshot.val()
        : {};

    const records = {};

    monthKeys.forEach(monthKey => {
        records[monthKey] = [];
    });

    // 보드게임 GOLD
    Object.entries(boardData).forEach(([dateKey, timeData]) => {
        const monthKey = dateKey.slice(0, 7);

        if (!monthKeys.includes(monthKey)) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getG = getGold(data.getG);
            const useG = getGold(data.useG);

            if (getG > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "게임보상",
                    gold: getG
                });
            }

            if (useG > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "게임 참여",
                    gold: useG
                });
            }
        });
    });

    // 골드상점 GOLD
    Object.entries(shopData).forEach(([dateKey, timeData]) => {
        const monthKey = dateKey.slice(0, 7);

        if (!monthKeys.includes(monthKey)) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const getG = getGold(data.getG);
            const useG = getGold(data.useG);

            if (getG > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: data.type || "",
                    gold: getG
                });
            }

            if (useG > 0) {
                records[monthKey].push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: data.type || "상점사용",
                    gold: useG
                });
            }
        });
    });

    // 성실도 보상 GOLD
    Object.entries(rewardData).forEach(([monthKey, data]) => {
        if (!monthKeys.includes(monthKey)) {
            return;
        }

        const rewardG = getGold(data.rewardG);

        if (rewardG > 0) {
            records[monthKey].push({
                date: `${monthKey}-01`,
                time: "",
                type: "받음",
                detail: `${data.rewardMonth} 성실도`,
                gold: rewardG
            });
        }
    });

    return records;
}

// GOLD 내역 표시
async function renderGoldHistory() {
    goldContent.innerHTML = "";

    const records = await getGoldHistory();
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

            goldContent.appendChild(row);
        });
    });

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "goldHistoryEmpty";
        empty.textContent = "최근 3개월의 GOLD 내역이 없습니다.";
        goldContent.appendChild(empty);
    }
}

// GOLD 팝업 열 때 내역 갱신
goldBtn.addEventListener("click", () => {
    renderGoldHistory();
});