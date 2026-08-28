// attendFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";


// Device ID로 학생 정보 가져오기
export async function getDeviceInfo(deviceId) {
    const snapshot =
        await get(
            ref(
                db,
                `deviceId/${deviceId}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// 학생 정보 가져오기
export async function getStudentInfo(mobile) {
    const snapshot =
        await get(
            ref(
                db,
                `student/${mobile}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// 학생 출석 기록 가져오기
export async function getAttendRecords(mobile) {
    const snapshot =
        await get(
            ref(
                db,
                `history/${mobile}`
            )
        );

    if (!snapshot.exists()) {
        return {};
    }

    return snapshot.val();
}


// 오늘 출석 여부 확인
export async function checkTodayAttend(
    mobile,
    date
) {
    const snapshot =
        await get(
            ref(
                db,
                `history/${mobile}/${date}`
            )
        );

    return snapshot.exists();
}


// 반의 오늘 수업시간 가져오기
export async function getClassTime(
    className,
    day
) {
    const snapshot =
        await get(
            ref(
                db,
                `class/${className}/${day}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// Wisdom 번호 저장
export async function saveWisdom(
    deviceId,
    wisdom
) {
    await update(
        ref(
            db,
            `deviceId/${deviceId}`
        ),
        {
            wisdom: wisdom
        }
    );
}


// 다음 Wisdom 번호 저장
export async function updateWisdom(
    deviceId,
    wisdom
) {
    let nextWisdom =
        Number(wisdom) + 1;

    if (nextWisdom > 24) {
        nextWisdom = 1;
    }

    await update(
        ref(
            db,
            `deviceId/${deviceId}`
        ),
        {
            wisdom: nextWisdom
        }
    );

    return nextWisdom;
}


// 출석 기록 저장
export async function saveAttendHistory(
    mobile,
    date,
    time,
    attend,
    attendSc,
    getP,
    name
) {
    const historyRef =
        ref(
            db,
            `history/${mobile}/${date}`
        );

    const snapshot =
        await get(historyRef);

    if (snapshot.exists()) {
        return false;
    }

    await update(
        historyRef,
        {
            attend: attend,
            attendSc: attendSc,
            boardE: "",
            boardS: "",
            dice: "",
            getG: "",
            getP: getP,
            homework: "",
            homeworkSc: "",
            name: name,
            time: time,
            useG: "",
            useP: ""
        }
    );

    return true;
}


// 월별 성실도 계산
async function calculateDiligence(
    mobile,
    date
) {
    const month =
        String(date).slice(0, 7);

    const historySnapshot =
        await get(
            ref(
                db,
                `history/${mobile}`
            )
        );

    if (!historySnapshot.exists()) {
        return 100;
    }

    const history =
        historySnapshot.val();

    let score = 100;

    Object.entries(history).forEach(
        ([recordDate, record]) => {
            if (!recordDate.startsWith(month)) {
                return;
            }

            if (!record || typeof record !== "object") {
                return;
            }

            score +=
                Number(record.attendSc) || 0;

            score +=
                Number(record.homeworkSc) || 0;
        }
    );

    return Math.max(
        0,
        score
    );
}


// 성실도 저장
export async function updateDiligence(
    mobile,
    date
) {
    const month =
        String(date).slice(0, 7);

    const diligence =
        await calculateDiligence(
            mobile,
            date
        );

    await update(
        ref(
            db,
            `diligence/${mobile}/${month}`
        ),
        diligence
    );

    return diligence;
}


// 성실도 가져오기
export async function getDiligence(
    mobile,
    date
) {
    const month =
        String(date).slice(0, 7);

    const diligence =
        await calculateDiligence(
            mobile,
            date
        );

    await update(
        ref(
            db,
            `diligence/${mobile}/${month}`
        ),
        diligence
    );

    return diligence;
}


// 학생 Total Point 누적
export async function updateTotalP(
    mobile,
    point
) {
    const totalPRef =
        ref(
            db,
            `student/${mobile}/totalP`
        );

    await runTransaction(
        totalPRef,
        (currentValue) => {
            const currentP =
                Number(currentValue) || 0;

            return currentP + Number(point);
        }
    );
}