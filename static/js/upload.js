function collectFilters(filterInputs) {
    let filters = {}
    filterInputs.forEach(function (inputElement) {
        filters[inputElement.id] = parseInt(inputElement.value);
    });
    return filters
}

// add on document load listener
window.addEventListener('load', function () {
    let selectedFile = null;
    let saveImageBtn = document.getElementById('saveImageBtn');
    let filterInputs = document.querySelectorAll('input[type=range]');
    let canvas = document.getElementById('preview');
    let context = canvas.getContext('2d');

    // on file input change
    document.getElementById('imagePathInput').onchange = function () {
        selectedFile = this.files[0];
        // collect and apply filters
        let filters = collectFilters(filterInputs);
        drawPicture(context, window.URL.createObjectURL(selectedFile), filters);
        // enable filter controls
        saveImageBtn.classList.remove('disabled');
        filterInputs.forEach(function (inputElement) {
            inputElement.removeAttribute('disabled');
        });
    }

    // image filtering
    filterInputs.forEach(function (inputElement) {
        inputElement.onchange = function () {
            console.log(this.id, 'was set to', this.value);
            let filters = collectFilters(filterInputs);
            drawPicture(context, window.URL.createObjectURL(selectedFile), filters);
        }
    });

    // save button click
    saveImageBtn.onclick = function () {
        // TODO: saving contours (picture+data), hierarchy
        console.log('saving image');
        // send source file to the server
        const formData = new FormData();
        formData.append('file', selectedFile);
        fetch(window.location.href, {
            method: 'POST',
            body: formData
        }).then(response => {
            console.log(response)
        }).catch(err => {
            console.error(err);
        });
    }
});


