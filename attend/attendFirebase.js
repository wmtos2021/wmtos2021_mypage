// attendFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";
import { getWisdomCount } from "./wisdom.js";

// 수업시간 가져오기
export async function getClassTime(subject, className, day) {
    const classTimeRef = ref(db, `class/${subject}/${className}/time/${day}`);
    const snapshot = await get(classTimeRef);
    return snapshot.exists() ? snapshot.val() : null;
}

// 오늘 과목 출석 여부 확인
export async function checkTodayAttend(mobile, date, subject) {
    const snapshot = await get(
        ref(db, `history/${mobile}/attendance/${date}/${subject}`)
    );
    return snapshot.exists();
}

// 출석 기록 저장
export async function saveAttend(mobile, date, subject, attend, attendSc, getP) {
    const deviceData = sessionStorage.getItem("deviceInfo");

    if (!deviceData) {
        return {
            success: false,
            reason: "deviceInfo"
        };
    }

    let deviceInfo;

    try {
        deviceInfo = JSON.parse(deviceData);
    } catch (error) {
        return {
            success: false,
            reason: "deviceInfo"
        };
    }

    const sessionMobile = deviceInfo?.mobile;
    const className = deviceInfo?.class?.[subject];
    const name = deviceInfo?.name || JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
    )?.name;

    if (!sessionMobile || !className || !name) {
        return {
            success: false,
            reason: "studentInfo"
        };
    }

    const historyRef = ref(
        db,
        `history/${sessionMobile}/attendance/${date}/${subject}`
    );

    const result = await runTransaction(
        historyRef,
        currentValue => {
            if (currentValue !== null) {
                return;
            }

            return {
                attend,
                attendP: getP,
                attendSc,
                homework: "",
                homeworkP: "",
                homeworkSc: ""
            };
        }
    );

    if (!result.committed) {
        return {
            success: false,
            reason: "alreadyAttend"
        };
    }

    try {
        await update(
            ref(db),
            {
                [`class/${subject}/${className}/management/${date}/attend/${attend}/${sessionMobile}`]: name
            }
        );

        const diligence = await updateDiligence(
            sessionMobile,
            date,
            attendSc
        );

        await updateTotalP(
            sessionMobile,
            getP
        );

        return {
            success: true,
            diligence
        };
    } catch (error) {
        return {
            success: false,
            reason: "update"
        };
    }
}

// 성실도 저장 및 차감
export async function updateDiligence(mobile, date, attendSc) {
    const month = String(date).slice(0, 7);

    const diligenceRef = ref(
        db,
        `diligence/${mobile}/${month}`
    );

    const result = await runTransaction(
        diligenceRef,
        currentValue => {
            const currentScore =
                currentValue === null
                    ? 100
                    : Number(currentValue);

            const deduction = Number(attendSc) || 0;

            return Math.max(
                0,
                currentScore - deduction
            );
        }
    );

    return Number(result.snapshot.val()) || 0;
}

// 학생 Total Point 누적
export async function updateTotalP(mobile, point) {
    const totalPRef = ref(
        db,
        `student/${mobile}/totalP`
    );

    const result = await runTransaction(
        totalPRef,
        currentValue => {
            const currentP = Number(currentValue) || 0;
            return currentP + (Number(point) || 0);
        }
    );

    return Number(result.snapshot.val()) || 0;
}

// 다음 Wisdom 번호 저장
export async function updateWisdom(deviceId, wisdom) {
    const count = getWisdomCount();
    let nextWisdom = Number(wisdom) + 1;

    if (nextWisdom > count) {
        nextWisdom = 1;
    }

    await update(
        ref(db, `deviceId/student/${deviceId}`),
        {
            wisdom: nextWisdom
        }
    );

    return nextWisdom;
}