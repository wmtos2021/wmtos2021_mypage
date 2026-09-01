// shop.js

import { checkSession } from "../end/session.js";

// 뒤로가기 방지
history.pushState(null, "", location.href);

window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
});

window.addEventListener("pageshow", () => {
    history.pushState(null, "", location.href);
});

// 요소 가져오기
const backBtn = document.getElementById("backBtn");

// 돌아가기
backBtn.addEventListener("click", () => {
    location.href = "../student/student.html";
});

// 초기 실행
init();

async function init() {
    const sessionValid = await checkSession();

    if (!sessionValid) {
        return;
    }
}