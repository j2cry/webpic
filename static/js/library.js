// refresh library
function refreshLibrary() {
    socket.emit('get_library', (files) => {
        console.log(files);
        let library = document.getElementById('library');
        library.textContent = '';
        files.forEach(fileLink => {
            // create element
            let image = document.createElement('img');
            image.classList.add('pic-item');
            image.setAttribute('alt', 'pic');
            image.setAttribute('src', fileLink);
            // add listeners
            image.addEventListener('contextmenu', () => {
                console.log('context')
            })
            library.insertAdjacentElement('beforeend', image)
        });
    })
}

// add on document load listener
window.addEventListener('load', function () {
    document.getElementById('addNewImageBtn').onclick = function () {
        window.location.href = window.location.pathname + '/upload';
    }

    // update library
    refreshLibrary();

    // TODO: removing items
});


