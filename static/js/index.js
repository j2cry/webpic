let socket = io({path: common['home_url'] + '/socket.io'});    // init socket connection
let loadingIndicator = document.getElementById('loading-indicator');

// on document is ready
window.addEventListener('load',function () {
    // on library click
    document.getElementById('libraryLink').onclick = function () {
        // here can be code for save coloring
    }

    // on logout click
    document.getElementById('logoutBtn').onclick = function () {
        window.location.href = common['home_url'] + '/auth';
    }

    // on debug click
    // document.getElementById('debugLink').onclick = function () {
    //     console.log('debug clicked');
    // }
    // TODO: check canvas compatibility

    socket.on('disconnect', () => {
        loadingIndicator.innerText = 'Connection lost. Reload the page'
        loadingIndicator.hidden = false;
    })

});
