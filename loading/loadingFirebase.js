// loadingFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";
import { getDeviceId } from "../utils.js";

// 학생 기본 정보 및 이번 달 데이터 가져오기
export async function loadStudentData() {
    const deviceId = getDeviceId();

    if (!deviceId) {
        return false;
    }

    const deviceSnapshot =
        await get(
            ref(
                db,
                `deviceId/${deviceId}`
            )
        );

    if (!deviceSnapshot.exists()) {
        return false;
    }

    const deviceInfo =
        deviceSnapshot.val();

    const mobile =
        deviceInfo.mobile;

    if (!mobile) {
        return false;
    }

    const studentSnapshot =
        await get(
            ref(
                db,
                `student/${mobile}`
            )
        );

    if (!studentSnapshot.exists()) {
        return false;
    }

    const studentInfo =
        studentSnapshot.val();

    const today =
        new Date().toLocaleDateString(
            "sv-SE",
            {
                timeZone: "Asia/Seoul"
            }
        );

    const monthKey =
        today.slice(0, 7);

    const attendSnapshot =
        await get(
            ref(
                db,
                `history/${mobile}/${monthKey}`
            )
        );

    const diligenceSnapshot =
        await get(
            ref(
                db,
                `diligence/${mobile}/${monthKey}`
            )
        );

    const attendRecords =
        attendSnapshot.exists()
            ? attendSnapshot.val()
            : {};

    const diligenceRecords =
        diligenceSnapshot.exists()
            ? diligenceSnapshot.val()
            : {};

    sessionStorage.setItem(
        "studentInfo",
        JSON.stringify(studentInfo)
    );

    sessionStorage.setItem(
        "deviceInfo",
        JSON.stringify(deviceInfo)
    );

    sessionStorage.setItem(
        "attendRecords",
        JSON.stringify(attendRecords)
    );

    sessionStorage.setItem(
        "diligenceRecords",
        JSON.stringify(diligenceRecords)
    );

    return true;
}