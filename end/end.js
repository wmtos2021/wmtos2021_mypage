// end.js

history.replaceState(null, "", location.href);
history.pushState(null, "", location.href);

window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
});

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        location.replace(location.href);
    }
});



