function collectFilters(filterInputs) {
    let filters = {}
    filterInputs.forEach(function (inputElement) {
        filters[inputElement.id] = inputElement.type === 'checkbox' ? inputElement.checked : parseInt(inputElement.value);
    });
    return filters
}

// add on document load listener
window.addEventListener('load', function () {
    let selectedFile = null;
    let saveImageBtn = document.getElementById('saveImageBtn');
    let filterInputs = document.querySelectorAll('input[type=range],input[type=checkbox]');
    let canvas = document.getElementById('preview');
    let context = canvas.getContext('2d');
    let filteredImageData = null;

    // on file input change
    document.getElementById('imagePathInput').onchange = function () {
        loadingIndicator.hidden = false;
        selectedFile = this.files[0];
        // collect and apply filters
        let filters = collectFilters(filterInputs);
        drawPicture(context, window.URL.createObjectURL(selectedFile), filters)
        .then(function (value) {
            filteredImageData = value;
            loadingIndicator.hidden = true;
        });
        // enable filter controls
        saveImageBtn.classList.remove('disabled');
        filterInputs.forEach(function (inputElement) {
            inputElement.removeAttribute('disabled');
        });
    }

    // on filters change
    filterInputs.forEach(function (inputElement) {
        inputElement.onchange = function () {
            loadingIndicator.hidden = false;
            console.log(this.id, 'was set to', this.type !== 'checkbox' ? this.value : this.checked);
            let filters = collectFilters(filterInputs);
            drawPicture(context, window.URL.createObjectURL(selectedFile), filters)
            .then(function (value) {
                filteredImageData = value;
                loadingIndicator.hidden = true;
            });
        }
    });

    // save button click
    saveImageBtn.onclick = function () {
        loadingIndicator.hidden = false;
        // console.log('saving image');
        // send files to the server
        const formData = new FormData();
        formData.append('source_file', selectedFile);
        formData.append('filtered_image_data', filteredImageData);
        fetch(window.location.href, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.redirected)
                window.location.href = response.url;
            loadingIndicator.hidden = true;
        }).catch(err => {
            console.error(err);
        });
    }
});


