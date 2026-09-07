// checkFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db,
    auth
} from "../firebase.js";

// Device ID로 Firebase 확인
export function getDeviceInfo(deviceId) {
    return get(
        ref(db, `deviceId/${deviceId}`)
    );
}

// Firebase Authentication 확인
export function getAuthUser() {
    return auth.currentUser;
}