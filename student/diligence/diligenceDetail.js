// diligenceDetail.js

import {
    getTodayRecords
} from "./diligenceFirebase.js";

import {
    getTimestampParts
} from "../../utils.js";

// 과목 이름
const subjectNames = {
    korean: "국어",
    english: "영어",
    math: "수학",
    social: "사회",
    science: "과학",
    history: "역사"
};

// 출석 상태
const attendStatusNames = {
    ontime: "정상출석",
    late10: "10분지각",
    late: "지각",
    absent: "결석"
};

// 숙제 상태
const homeworkStatusNames = {
    done: "숙제완료",
    notdone: "숙제안함"
};

let attendRecords = {};

// QR 출석 정보 가져오기
function getAttendanceCheck() {
    const data = sessionStorage.getItem("attendanceCheck");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// 상세내역 데이터 저장
export function setDiligenceDetailData(records) {
    attendRecords = records || {};
}

// 월별 상세내역 생성
function createMonthRecords(monthKey, historyData) {
    const records = [];

    Object.entries(historyData || {}).forEach(([dateKey, subjectData]) => {
        if (dateKey.slice(0, 7) !== monthKey) {
            return;
        }

        Object.entries(subjectData || {}).forEach(([subject, data]) => {
            const subjectName = subjectNames[subject] || subject;
            const attendStatus = attendStatusNames[data?.attend];
            const homeworkStatus = homeworkStatusNames[data?.homework];
            const attendSc = Number(data?.attendSc) || 0;
            const homeworkSc = Number(data?.homeworkSc) || 0;

            if (attendStatus && attendSc !== 0) {
                records.push({
                    date: dateKey,
                    detail: `${subjectName} ${attendStatus}`,
                    score: attendSc
                });
            }

            if (homeworkStatus && homeworkSc !== 0) {
                records.push({
                    date: dateKey,
                    detail: `${subjectName} ${homeworkStatus}`,
                    score: homeworkSc
                });
            }
        });
    });

    records.sort((a, b) => {
        const dateA = `${a.date} ${a.detail}`;
        const dateB = `${b.date} ${b.detail}`;

        return dateB.localeCompare(dateA);
    });

    return records;
}

// 상세내역 한 줄 생성
function createRecordRow(record) {
    const row = document.createElement("div");
    row.className = "diligenceDetailRow";

    const date = document.createElement("span");
    date.className = "diligenceDetailDate";
    date.textContent = record.date;

    const detail = document.createElement("span");
    detail.className = "diligenceDetailDetail";
    detail.textContent = record.detail;

    const sign = document.createElement("span");
    sign.className = "diligenceDetailSign";
    sign.textContent = "-";

    const score = document.createElement("strong");
    score.className = "diligenceDetailScore";
    score.textContent = Math.abs(record.score);

    row.append(date, detail, sign, score);

    return row;
}

// 상세내역 표시
function renderRecords(records, detailContent) {
    records.forEach(record => {
        detailContent.appendChild(
            createRecordRow(record)
        );
    });
}

// 현재 월 표시
async function renderInitialHistory() {
    const detailContent = document.getElementById("diligenceDetailContent");

    if (!detailContent) {
        return false;
    }

    const attendanceCheck = getAttendanceCheck();
    const parts = getTimestampParts(
        attendanceCheck?.attendTimestamp
    );

    if (!parts) {
        return false;
    }

    const monthKey = parts.month;
    const dateKey = parts.date;

    const titleText = document.getElementById(
        "diligenceDetailModalTitleText"
    );

    if (titleText) {
        const month = Number(monthKey.split("-")[1]);
        titleText.textContent = `${month}월 성실도 상세내역`;
    }

    const deviceData = sessionStorage.getItem("deviceInfo");

    if (deviceData) {
        try {
            const deviceInfo = JSON.parse(deviceData);
            const mobile = deviceInfo.mobile;

            if (mobile) {
                const todayData = await getTodayRecords(
                    mobile,
                    dateKey
                );

                attendRecords[monthKey] = {
                    ...(attendRecords[monthKey] || {}),
                    [dateKey]: todayData || {}
                };
            }
        } catch (error) {}
    }

    const records = createMonthRecords(
        monthKey,
        attendRecords[monthKey]
    );

    if (records.length > 0) {
        renderRecords(
            records,
            detailContent
        );

        return true;
    }

    return false;
}

// 상세내역 팝업 열기
document.addEventListener("click", async event => {
    const detailBtn = event.target.closest("#diligenceDetailBtn");

    if (!detailBtn) {
        return;
    }

    const detailModal = document.getElementById("diligenceDetailModal");
    const detailContent = document.getElementById("diligenceDetailContent");

    if (!detailModal || !detailContent) {
        return;
    }

    detailContent.innerHTML = "";
    detailModal.classList.remove("hidden");

    const hasRecord = await renderInitialHistory();

    if (!hasRecord) {
        const empty = document.createElement("div");
        empty.className = "diligenceDetailEmpty";
        empty.textContent = "성실도 상세내역이 없습니다.";

        detailContent.appendChild(empty);
    }
});

// 상세내역 팝업 닫기
document.addEventListener("click", event => {
    const closeBtn = event.target.closest(
        "#diligenceDetailCloseBtn"
    );

    if (!closeBtn) {
        return;
    }

    const detailModal = document.getElementById(
        "diligenceDetailModal"
    );

    if (!detailModal) {
        return;
    }

    detailModal.classList.add("hidden");
});