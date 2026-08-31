// studentDiligenceFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// 이전 2개월 성실도 및 출석 기록 가져오기
export async function getPreviousRecords(mobile) {
    const today = new Date();

    const previousMonthDate =
        new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );

    const previousMonth =
        `${previousMonthDate.getFullYear()}-${String(
            previousMonthDate.getMonth() + 1
        ).padStart(2, "0")}`;

    const beforePreviousMonthDate =
        new Date(
            today.getFullYear(),
            today.getMonth() - 2,
            1
        );

    const beforePreviousMonth =
        `${beforePreviousMonthDate.getFullYear()}-${String(
            beforePreviousMonthDate.getMonth() + 1
        ).padStart(2, "0")}`;

    const attendanceSnapshot = await get(
        ref(db, `history/${mobile}/attendance`)
    );

    const diligenceSnapshot = await get(
        ref(db, `diligence/${mobile}`)
    );

    const attendanceData =
        attendanceSnapshot.exists()
            ? attendanceSnapshot.val()
            : {};

    const diligenceData =
        diligenceSnapshot.exists()
            ? diligenceSnapshot.val()
            : {};

    const attendRecords = {};
    const diligenceRecords = {};

    [previousMonth, beforePreviousMonth].forEach(monthKey => {
        if (attendanceData[monthKey]) {
            attendRecords[monthKey] =
                attendanceData[monthKey];
        }

        if (diligenceData[monthKey] !== undefined) {
            diligenceRecords[monthKey] =
                diligenceData[monthKey];
        }
    });

    return {
        attendRecords,
        diligenceRecords
    };
}