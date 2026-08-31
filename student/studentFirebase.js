// studentFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// 이전 2개월 출석 및 성실도 기록 가져오기
export async function getPreviousRecords(mobile) {
    const today = new Date();
    const attendRecords = {};
    const diligenceRecords = {};
    const monthKeys = [];

    for (let i = 1; i <= 2; i++) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1
        );

        monthKeys.push(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        );
    }

    const historySnapshot = await get(
        ref(db, `history/${mobile}/attendance`)
    );

    if (historySnapshot.exists()) {
        const historyData = historySnapshot.val();

        Object.entries(historyData).forEach(([dateKey, timeData]) => {
            const monthKey = dateKey.slice(0, 7);

            if (monthKeys.includes(monthKey)) {
                if (!attendRecords[monthKey]) {
                    attendRecords[monthKey] = {};
                }

                attendRecords[monthKey][dateKey] = timeData;
            }
        });
    }

    const diligenceSnapshot = await get(
        ref(db, `diligence/${mobile}`)
    );

    if (diligenceSnapshot.exists()) {
        const diligenceData = diligenceSnapshot.val();

        monthKeys.forEach(monthKey => {
            if (diligenceData[monthKey] !== undefined) {
                diligenceRecords[monthKey] = Number(diligenceData[monthKey]);
            }
        });
    }

    return {
        attendRecords,
        diligenceRecords
    };
}

// 전월 성실도 가져오기
export async function getPreviousDiligence(mobile, monthKey) {
    const snapshot = await get(
        ref(db, `diligence/${mobile}/${monthKey}`)
    );

    if (!snapshot.exists()) {
        return 100;
    }

    return Number(snapshot.val()) || 0;
}

// 전월 성실도 보상 지급 여부 확인
export async function getRewardStatus(mobile, currentMonth) {
    const snapshot = await get(
        ref(db, `history/${mobile}/reward/${currentMonth}`)
    );

    return snapshot.exists();
}

// 전월 성실도 보상 지급
export async function saveDiligenceReward(
    mobile,
    currentMonth,
    previousMonth,
    score,
    gold,
    point
) {
    const rewardRef = ref(
        db,
        `history/${mobile}/reward/${currentMonth}`
    );

    const rewardSnapshot = await get(rewardRef);

    if (rewardSnapshot.exists()) {
        return false;
    }

    const rewardG = Number(gold) || 0;
    const rewardP = Number(point) || 0;

    if (rewardG > 0) {
        await runTransaction(
            ref(db, `student/${mobile}/totalG`),
            currentValue => {
                const currentG = Number(currentValue) || 0;
                return currentG + rewardG;
            }
        );
    }

    if (rewardP > 0) {
        await runTransaction(
            ref(db, `student/${mobile}/totalP`),
            currentValue => {
                const currentP = Number(currentValue) || 0;
                return currentP + rewardP;
            }
        );
    }

    await update(rewardRef, {
        rewardMonth: previousMonth,
        rewardSc: Number(score) || 0,
        rewardG: rewardG,
        rewardP: rewardP
    });

    return true;
}

// 최근 3개월 포인트 기록 가져오기
export async function getPointHistory(mobile) {
    const snapshot = await get(
        ref(db, `history/${mobile}`)
    );

    if (!snapshot.exists()) {
        return [];
    }

    const historyData = snapshot.val();
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

    const records = [];

    // 출석 POINT
    const attendance = historyData.attendance || {};

    Object.entries(attendance).forEach(([dateKey, timeData]) => {
        if (!monthKeys.includes(dateKey.slice(0, 7))) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const point = Number(data.attendP) || 0;

            if (point > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "받음",
                    detail: "출석",
                    point: point
                });
            }
        });
    });

    // 보드게임 POINT 사용
    const board = historyData.board || {};

    Object.entries(board).forEach(([dateKey, timeData]) => {
        if (!monthKeys.includes(dateKey.slice(0, 7))) {
            return;
        }

        Object.entries(timeData || {}).forEach(([timeKey, data]) => {
            const point = Number(data.useP) || 0;

            if (point > 0) {
                records.push({
                    date: dateKey,
                    time: timeKey,
                    type: "사용",
                    detail: "게임참여",
                    point: point
                });
            }
        });
    });

    // 성실도 보상 POINT
    const reward = historyData.reward || {};

    Object.entries(reward).forEach(([monthKey, data]) => {
        if (!monthKeys.includes(monthKey)) {
            return;
        }

        const point = Number(data.rewardP) || 0;

        if (point > 0) {
            records.push({
                date: `${monthKey}-01`,
                time: "",
                type: "받음",
                detail: "성실도 보상",
                point: point
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