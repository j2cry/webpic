// add on document load listener
window.addEventListener('load', function () {
    let imagePathInput = document.getElementById('imagePathInput');
    let uploadBtn = document.getElementById('uploadBtn');
    let saveImageBtn = document.getElementById('saveImageBtn');
    let canvas = document.getElementById('preview');
    let context = canvas.getContext('2d');

    // enable buttons on file input change
    imagePathInput.onchange = function () {
        if (this.value)
            uploadBtn.classList.remove('disabled');
        else
            uploadBtn.classList.add('disabled');
    }

    // upload button click
    uploadBtn.onclick = function () {
        // console.log('uploading image');
        const selectedFile = imagePathInput.files[0];
        drawPicture(context, window.URL.createObjectURL(selectedFile));
        saveImageBtn.classList.remove('disabled');
    }

    // save button click
    saveImageBtn.onclick = function () {
        // TODO: image saving
        console.log('saving image');
        const selectedFile = imagePathInput.files[0];

        // upload source image
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

    // image filtering
    document.querySelectorAll('input[type=range]').forEach(function (control) {
        control.onchange = function () {
            console.log(this.id, 'is set to', this.value);
            // refresh preview
        }
    });
});


