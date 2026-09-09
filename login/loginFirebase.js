// loginFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    db,
    auth
} from "../firebase.js";

import { getWisdomCount } from "../attend/wisdom.js";

// Firebase Auth용 이메일 생성
function getAuthEmail(phone) {
    return `${phone}@wmtos2026.firebaseapp.com`;
}

// Wisdom 번호 생성
function createWisdomNumber() {
    const count = getWisdomCount();

    return Math.floor(Math.random() * count) + 1;
}

// 학생 정보 가져오기
export async function getStudent(phone) {
    const snapshot = await get(
        ref(db, `student/${phone}`)
    );

    return snapshot.exists()
        ? snapshot.val()
        : null;
}

// 로그인 정보 저장
async function saveLoginData(
    phone,
    student,
    uid,
    deviceId,
    wisdom = null,
    oldDeviceId = null
) {
    const updates = {
        [`student/${phone}/uid`]: uid,
        [`student/${phone}/deviceId`]: deviceId,

        [`deviceId/student/${deviceId}/uid`]: uid,
        [`deviceId/student/${deviceId}/mobile`]: phone,
        [`deviceId/student/${deviceId}/name`]: student.name || "",
        [`deviceId/student/${deviceId}/class`]: student.class || {},

        [`authUser/student/${uid}/name`]: student.name || "",
        [`authUser/student/${uid}/mobile`]: phone
    };

    if (wisdom !== null) {
        updates[`deviceId/student/${deviceId}/wisdom`] = wisdom;
    }

    if (
        oldDeviceId &&
        oldDeviceId !== deviceId
    ) {
        updates[`deviceId/student/${oldDeviceId}`] = null;
    }

    await update(
        ref(db),
        updates
    );
}

// 신규회원 계정 생성
export async function createStudentAccount(
    phone,
    password
) {
    let user = null;

    try {
        const student = await getStudent(phone);

        if (!student) {
            return {
                success: false
            };
        }

        const deviceId =
            localStorage.getItem("deviceId");

        if (!deviceId) {
            return {
                success: false
            };
        }

        const email = getAuthEmail(phone);

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        user = userCredential.user;

        await updateProfile(user, {
            displayName: student.name || ""
        });

        const wisdom = createWisdomNumber();

        await saveLoginData(
            phone,
            student,
            user.uid,
            deviceId,
            wisdom
        );

        return {
            success: true
        };
    } catch (error) {
        if (user) {
            try {
                await deleteUser(user);
            } catch (deleteError) {
                // Auth 계정 삭제 실패
            }
        }

        return {
            success: false
        };
    }
}

// 기존회원 로그인
export async function loginStudent(
    phone,
    password
) {
    try {
        const student = await getStudent(phone);

        if (!student) {
            return {
                success: false,
                reason: "student"
            };
        }

        const deviceId =
            localStorage.getItem("deviceId");

        if (!deviceId) {
            return {
                success: false,
                reason: "device"
            };
        }

        const email = getAuthEmail(phone);

        let userCredential;

        try {
            userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
        } catch (error) {
            return {
                success: false,
                reason: "password"
            };
        }

        const user = userCredential.user;

        // 기존 uid가 있는 회원은 uid 일치 여부 확인
        if (
            student.uid &&
            user.uid !== student.uid
        ) {
            await signOut(auth).catch(() => {});

            return {
                success: false,
                reason: "uid"
            };
        }

        const oldDeviceId = student.deviceId;

        // 현재 deviceId와 다르면 새 디바이스
        const isNewDevice =
            oldDeviceId !== deviceId;

        // 새 디바이스일 때만 Wisdom 신규 배정
        const wisdom = isNewDevice
            ? createWisdomNumber()
            : null;

        // DB 저장
        try {
            await saveLoginData(
                phone,
                student,
                user.uid,
                deviceId,
                wisdom,
                oldDeviceId
            );
        } catch (error) {
            // Auth 인증은 성공했으므로
            // 이번 세션은 로그인 성공으로 처리
            return {
                success: true
            };
        }

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            reason: "error"
        };
    }
}