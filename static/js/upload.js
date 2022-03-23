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
    const saveImageBtn = document.getElementById('saveImageBtn');
    const filterInputs = document.querySelectorAll('input[type=range],input[type=checkbox]');
    const canvas = document.getElementById('preview');

     // wait until CV is REALLY initialized ???
    cv.onRuntimeInitialized = function () {
        // on file input change
        document.getElementById('imagePathInput').onchange = function () {
            loadingIndicator.hidden = false;
            selectedFile = this.files[0];
            // collect and apply filters
            let filters = collectFilters(filterInputs);
            let image = new Image();
            image.onload = async () => {
                await drawPicture(canvas, image, filters)
                loadingIndicator.hidden = true;
            }
            image.src = window.URL.createObjectURL(selectedFile);
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
                let image = new Image();
                image.onload = async () => {
                    await drawPicture(canvas, image, filters);
                    loadingIndicator.hidden = true;
                }
                image.src = window.URL.createObjectURL(selectedFile);
            }
        });
        loadingIndicator.hidden = true;
    }

    // save button click
    saveImageBtn.onclick = async () => {
        loadingIndicator.hidden = false;
        // send files to the server
        const formData = new FormData();
        const filters = collectFilters(filterInputs);
        filters['checkBlankBack'] = true;
        formData.append('source', selectedFile);
        formData.append('filters', JSON.stringify(filters));
        const response = await fetch(window.location.href, {
            method: 'POST',
            body: formData
        });
        if (response.redirected)
            window.location.href = response.url;
        loadingIndicator.hidden = true;
    }
});


