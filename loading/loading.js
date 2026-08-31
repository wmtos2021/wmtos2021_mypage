// loading.js

import {
    loadStudentData
} from "./loadingFirebase.js";

import { checkSession } from "../end/session.js";

const dot1 = document.querySelector(".loadingDots i:nth-child(1)");
const dot2 = document.querySelector(".loadingDots i:nth-child(2)");
const dot3 = document.querySelector(".loadingDots i:nth-child(3)");

// 애니메이션
function dotAnimation() {
    if (!dot1 || !dot2 || !dot3) {
        return;
    }

    dot1.classList.remove("show");
    dot2.classList.remove("show");
    dot3.classList.remove("show");

    setTimeout(() => {
        dot1.classList.add("show");

        setTimeout(() => {
            dot2.classList.add("show");

            setTimeout(() => {
                dot3.classList.add("show");

                setTimeout(() => {
                    dotAnimation();
                }, 700);
            }, 700);
        }, 700);
    }, 700);
}

dotAnimation();

// 학생 기본 정보 준비
async function startLoading() {
    try {
        const sessionValid = await checkSession();

        if (!sessionValid) {
            return;
        }

        const loaded = await loadStudentData();

        if (!loaded) {
            return;
        }

        location.href = "../student/student.html";
    } catch (error) {
        return;
    }
}

startLoading();