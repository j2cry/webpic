// refresh library
function refreshLibrary() {
    socket.emit('get_library', (files) => {
        let library = document.getElementById('library');
        library.textContent = '';
        files.forEach(fileLink => {
            // create element
            let image = document.createElement('img');
            image.classList.add('pic-item');
            image.setAttribute('alt', 'pic');
            image.setAttribute('src', fileLink);
            // add listeners
            image.addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                image.classList.toggle('pic-selected');
                // enable/disable remove button
                document.getElementById('removeImageBtn')
                    .toggleAttribute('disabled', library.querySelectorAll('.pic-selected').length === 0)
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

    let removeBtn = document.getElementById('removeImageBtn');
    removeBtn.onclick = function () {
        // collect selected
        let selected = [];
        document.querySelectorAll('.pic-selected').forEach((image) => {
            let splitFromIndex = image.src.lastIndexOf('/') + 1
            selected.push(image.src.substring(splitFromIndex));
        });
        // send to the server
        socket.emit('remove_images', selected, () => {
            refreshLibrary();
            removeBtn.disabled = true;
        });
    }

    // update library
    refreshLibrary();

    // TODO: removing items
});


