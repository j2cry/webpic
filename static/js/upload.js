function collectFilters(filterInputs) {
    let filters = {}
    filterInputs.forEach(function (inputElement) {
        filters[inputElement.id] = inputElement.type === 'checkbox' ? inputElement.checked : parseInt(inputElement.value);
    });
    return filters
}

// add on document load listener
window.addEventListener('load', function () {
    let errorText = document.getElementById('upload-err-text');
    let selectedFile = null;
    const saveImageBtn = document.getElementById('saveImageBtn');
    const filterInputs = document.querySelectorAll('input[type=range],input[type=checkbox]');
    const canvas = document.getElementById('preview');
    let image = null;
    let filters = {}

     // wait until CV is REALLY initialized ???
    cv.onRuntimeInitialized = function () {
        // on file input change
        document.getElementById('imagePathInput').onchange = function () {
            loadingIndicator.hidden = false;
            errorText.hidden = true;
            if (selectedFile !== null) {
                window.URL.revokeObjectURL(image.src);
            }
            image = new Image();
            selectedFile = this.files[0];
            // collect and apply filters
            filters = collectFilters(filterInputs);
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
            inputElement.onchange = async function() {
                loadingIndicator.hidden = false;
                console.log(this.id, 'was set to', this.type !== 'checkbox' ? this.value : this.checked);
                filters = collectFilters(filterInputs);
                await drawPicture(canvas, image, filters);
                loadingIndicator.hidden = true;
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
        // TODO upload through socket?
        const response = await fetch(window.location.href, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data['fail']) {
            errorText.innerText = data['fail'];
            errorText.hidden = false;
        } else if (data['success'])
            window.location.href = String(data['success']);
        loadingIndicator.hidden = true;
    }
});


