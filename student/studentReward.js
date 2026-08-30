// studentReward.js

import {
    getPreviousDiligence,
    getRewardStatus,
    saveDiligenceReward
} from "./studentFirebase.js";

const rewardModal = document.getElementById("rewardModal");
const rewardMonth = document.getElementById("rewardMonth");
const rewardGrade = document.getElementById("rewardGrade");
const rewardScore = document.getElementById("rewardScore");
const rewardPoint = document.getElementById("rewardPoint");
const rewardReceiveBtn = document.getElementById("rewardReceiveBtn");

let rewardMobile = null;
let rewardCurrentMonth = "";
let rewardPreviousMonth = "";
let rewardScoreValue = 0;
let rewardGold = 0;
let rewardPointValue = 0;
let rewardShown = false;

// 성실도 보상 계산
function getReward(score) {
    if (score >= 95) {
        return { grade: "A+", gold: 1000, point: 0 };
    }
    if (score >= 90) {
        return { grade: "A", gold: 800, point: 0 };
    }
    if (score >= 85) {
        return { grade: "B+", gold: 0, point: 1000 };
    }
    if (score >= 80) {
        return { grade: "B", gold: 0, point: 800 };
    }
    if (score >= 75) {
        return { grade: "C+", gold: 0, point: 600 };
    }
    if (score >= 70) {
        return { grade: "C", gold: 0, point: 500 };
    }
    if (score >= 65) {
        return { grade: "D+", gold: 0, point: 400 };
    }
    if (score >= 60) {
        return { grade: "D", gold: 0, point: 300 };
    }
    if (score >= 55) {
        return { grade: "E+", gold: 0, point: 200 };
    }
    if (score >= 50) {
        return { grade: "E", gold: 0, point: 100 };
    }
    return { grade: "F", gold: 0, point: 0 };
}

// 현재 월 및 전월 확인
function getMonthKeys() {
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    return {
        currentMonth: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
        previousMonth: `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`
    };
}

// 보상 팝업 표시
function showRewardPopup(monthKey, score, reward) {
    const [year, month] = monthKey.split("-");
    rewardMonth.textContent = `${year}년 ${month}월`;

    rewardGrade.innerHTML =
        reward.grade === "A+"
            ? "A<sup>+</sup>"
            : reward.grade;

    rewardScore.textContent = `${score}/100`;

    if (reward.gold > 0) {
        rewardPoint.textContent = `${reward.gold}G`;
    } else {
        rewardPoint.textContent = `${reward.point}P`;
    }

    rewardModal.classList.remove("hidden");
}

// 출석 완료 후 전월 보상 확인
async function checkPreviousMonthReward() {
    if (rewardShown) {
        return;
    }

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (!deviceData) {
        return;
    }

    const deviceInfo = JSON.parse(deviceData);
    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return;
    }

    const monthKeys = getMonthKeys();
    const rewarded = await getRewardStatus(mobile, monthKeys.currentMonth);

    if (rewarded) {
        rewardShown = true;
        return;
    }

    const score = await getPreviousDiligence(mobile, monthKeys.previousMonth);
    const reward = getReward(score);

    rewardMobile = mobile;
    rewardCurrentMonth = monthKeys.currentMonth;
    rewardPreviousMonth = monthKeys.previousMonth;
    rewardScoreValue = score;
    rewardGold = reward.gold;
    rewardPointValue = reward.point;
    rewardShown = true;

    showRewardPopup(
        rewardPreviousMonth,
        rewardScoreValue,
        reward
    );
}

// 보상 받기
rewardReceiveBtn.addEventListener("click", async () => {
    if (!rewardMobile || !rewardCurrentMonth || !rewardPreviousMonth) {
        return;
    }

    rewardReceiveBtn.disabled = true;

    try {
        const success = await saveDiligenceReward(
            rewardMobile,
            rewardCurrentMonth,
            rewardPreviousMonth,
            rewardScoreValue,
            rewardGold,
            rewardPointValue
        );

        if (success) {
            rewardModal.classList.add("hidden");
            rewardMobile = null;
            rewardCurrentMonth = "";
            rewardPreviousMonth = "";
            rewardScoreValue = 0;
            rewardGold = 0;
            rewardPointValue = 0;
        }
    } finally {
        rewardReceiveBtn.disabled = false;
    }
});

// 출석 완료 감지
document.addEventListener("attendanceCompleted", () => {
    checkPreviousMonthReward();
});