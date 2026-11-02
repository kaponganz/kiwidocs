(function () {
    var inline = document.querySelector('.buy-online');
    var sticky = document.querySelector('.buy-online-sticky');
    if (!inline || !sticky) return;

    var observer = new IntersectionObserver(function (entries) {
        sticky.classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 });

    observer.observe(inline);
})();
