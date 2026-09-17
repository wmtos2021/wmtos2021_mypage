// shop.js

import {VERSION} from "../utils.js";
import {checkSession} from "../end/session.js";
import {products} from "./product.js";

import {
    getStudentInfo,
    requestExchange
} from "./shopFirebase.js";

// 뒤로가기 방지
history.pushState(null, "", location.href);

window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
});

window.addEventListener("pageshow", () => {
    history.pushState(null, "", location.href);
});

// 요소 가져오기
const studentName = document.getElementById("studentName");
const studentGold = document.getElementById("studentGold");
const version = document.getElementById("version");
const backBtn = document.getElementById("backBtn");
const shopProductList = document.getElementById("shopProductList");

const exchangeModal = document.getElementById("exchangeModal");
const exchangeProductImage = document.getElementById("exchangeProductImage");
const exchangeItem = document.getElementById("exchangeItem");
const exchangeDeductMessage = document.getElementById("exchangeDeductMessage");
const exchangeCancelBtn = document.getElementById("exchangeCancelBtn");
const exchangeConfirmBtn = document.getElementById("exchangeConfirmBtn");

const alertModal = document.getElementById("alertModal");
const alertMessage = document.getElementById("alertMessage");

version.textContent = `Ver ${VERSION}`;

// 현재 선택된 상품
let selectedProduct = null;

// 교환 처리 중
let exchangeProcessing = false;

// 안내 팝업 타이머
let alertTimer = null;

// 돌아가기
backBtn.addEventListener("click", () => {
    location.href = "../student/student.html";
});

// 교환 취소
exchangeCancelBtn.addEventListener("click", () => {
    closeExchangeModal();
});

// 교환 신청 확인
exchangeConfirmBtn.addEventListener(
    "click",
    handleExchangeConfirm
);

// 초기 실행
init();

async function init() {
    const sessionValid = await checkSession();

    if (!sessionValid) return;

    loadPlayer();
    renderProducts();
}

// 학생 정보 불러오기
function loadPlayer() {
    const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
    );

    if (!studentInfo.name) return;

    studentName.textContent =
        `${studentInfo.name.replace(/\d+$/g, "")}님`;

    studentGold.textContent =
        Number(studentInfo.totalG || 0).toLocaleString();
}

// 상품 목록 불러오기
function renderProducts() {
    shopProductList.innerHTML = "";

    products.forEach((product) => {
        const row = document.createElement("div");

        row.className = "shopProductRow";

        row.innerHTML = `
            <div class="shopProductImage">

                <img
                    src="${product.image}"
                    alt="${product.item}">

            </div>

            <div class="shopProductName">
                ${product.item}
            </div>

            <div class="shopProductPrice">

                <strong>
                    ${Number(product.gold).toLocaleString()}
                </strong>

            </div>

            <button
                type="button"
                class="exchangeBtn"
                data-item="${product.item}"
                data-gold="${product.gold}">

                교환<br>
                신청

            </button>
        `;

        const exchangeBtn =
            row.querySelector(".exchangeBtn");

        exchangeBtn.addEventListener("click", () => {
            handleExchangeClick(product);
        });

        shopProductList.appendChild(row);
    });
}

// 교환 신청 버튼
function handleExchangeClick(product) {
    const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
    );

    const deviceInfo = JSON.parse(
        sessionStorage.getItem("deviceInfo") || "{}"
    );

    const mobile = deviceInfo.mobile;

    if (!mobile || !studentInfo.name) {
        showAlert("학생 정보를 불러올 수 없습니다.");
        return;
    }

    // sessionStorage에 저장된 현재 골드 사용
    const currentGold =
        Number(studentInfo.totalG || 0);

    const requiredGold =
        Number(product.gold || 0);

    // 골드 부족
    if (
        !Number.isFinite(currentGold) ||
        currentGold < requiredGold
    ) {
        showAlert("골드가 부족합니다.");
        return;
    }

    // 선택 상품 저장
    selectedProduct = product;

    // 상품 이미지
    exchangeProductImage.src = product.image;
    exchangeProductImage.alt = product.item;

    // 상품명
    exchangeItem.textContent = product.item;

    // 골드 차감 안내
    exchangeDeductMessage.textContent =
        `${requiredGold.toLocaleString()}G가 차감됩니다.`;

    // 확인 팝업 표시
    exchangeModal.classList.remove("hidden");
}

// 교환 신청 확인
async function handleExchangeConfirm() {
    if (!selectedProduct) return;

    if (exchangeProcessing) return;

    exchangeProcessing = true;

    // 버튼 잠금
    exchangeConfirmBtn.disabled = true;
    exchangeCancelBtn.disabled = true;

    const studentInfo = JSON.parse(
        sessionStorage.getItem("studentInfo") || "{}"
    );

    const deviceInfo = JSON.parse(
        sessionStorage.getItem("deviceInfo") || "{}"
    );

    const mobile = deviceInfo.mobile;
    const name = studentInfo.name;
    const product = selectedProduct;

    // 현재 sessionStorage의 골드 사용
    const currentGold =
        Number(studentInfo.totalG || 0);

    if (!mobile || !name) {
        closeExchangeModal();

        showAlert(
            "학생 정보를 불러올 수 없습니다."
        );

        exchangeProcessing = false;
        exchangeConfirmBtn.disabled = false;
        exchangeCancelBtn.disabled = false;

        return;
    }

    if (
        !Number.isFinite(currentGold) ||
        currentGold < Number(product.gold)
    ) {
        closeExchangeModal();

        showAlert(
            "골드가 부족합니다."
        );

        exchangeProcessing = false;
        exchangeConfirmBtn.disabled = false;
        exchangeCancelBtn.disabled = false;

        return;
    }

    try {
        // Firebase 교환 처리
        const result = await requestExchange(
            mobile,
            name,
            product.item,
            product.gold,
            currentGold
        );

        // 교환 실패
        if (!result.success) {
            closeExchangeModal();

            if (
                result.reason ===
                "INSUFFICIENT_GOLD"
            ) {
                showAlert(
                    "골드가 부족합니다."
                );
            } else {
                showAlert(
                    "교환 신청에 실패했습니다."
                );
            }

            return;
        }

        // 교환 팝업 닫기
        closeExchangeModal();

        // 차감 후 최신 학생 정보 다시 조회
        const latestStudentInfo =
            await getStudentInfo(mobile);

        if (!latestStudentInfo) {
            showAlert(
                "교환 신청은 완료되었지만\n학생 정보 갱신에 실패했습니다."
            );

            return;
        }

        // 최신 학생 정보 저장
        sessionStorage.setItem(
            "studentInfo",
            JSON.stringify(latestStudentInfo)
        );

        // 현재 화면 GOLD 갱신
        studentGold.textContent =
            Number(
                latestStudentInfo.totalG || 0
            ).toLocaleString();

        // 완료 안내
        showAlert(
            "교환 신청이 완료되었습니다."
        );

    } catch (error) {
        console.error(
            "교환 신청 처리 실패:",
            error
        );

        closeExchangeModal();

        showAlert(
            "교환 신청에 실패했습니다."
        );

    } finally {
        exchangeProcessing = false;

        exchangeConfirmBtn.disabled = false;
        exchangeCancelBtn.disabled = false;
    }
}

// 교환 확인 팝업 닫기
function closeExchangeModal() {
    exchangeModal.classList.add("hidden");
    selectedProduct = null;
}

// 안내 팝업 표시
function showAlert(message) {
    if (alertTimer) {
        clearTimeout(alertTimer);
        alertTimer = null;
    }

    alertMessage.textContent = message;

    alertModal.classList.remove("hidden");

    alertTimer = setTimeout(() => {
        alertModal.classList.add("hidden");
        alertTimer = null;
    }, 2000);
}