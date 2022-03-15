let socket = io();    // init socket connection

// on document is ready
window.addEventListener('load',function () {
    // on library click
    document.getElementById('libraryLink').onclick = function () {
        // here can be code for save coloring
    }

    // on logout click
    // document.getElementById('logoutBtn').onclick = function () {
    //     console.log('logout clicked');
    // }

    // on debug click
    document.getElementById('debugLink').onclick = function () {
        console.log('debug clicked');
    }
});
