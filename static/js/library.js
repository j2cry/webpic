// refresh library
function refreshLibrary() {
    return new Promise((resolve) => {
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
                image.addEventListener('click', async () => {
                    const fromIndex = image.src.lastIndexOf('/') + 1;
                    const toIndex = image.src.lastIndexOf('.');
                    window.location.href += '/' + image.src.substring(fromIndex, toIndex);
                })
                library.insertAdjacentElement('beforeend', image)
            });
            resolve();
        })
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
            const fromIndex = image.src.lastIndexOf('/') + 1;
            const toIndex = image.src.lastIndexOf('.');
            selected.push(image.src.substring(fromIndex, toIndex));
        });
        // send to the server
        socket.emit('remove_images', selected, () => {
            refreshLibrary()
                .then(() => {
                    removeBtn.disabled = true;
                });
        });
    }

    // update library
    refreshLibrary()
        .then(() => {
            loadingIndicator.hidden = true;
        });
});


