// add on document load listener
window.addEventListener('load', function () {
    // enable upload button on file input change
    document.getElementById('imagePathInput').onchange = function () {
        let uploadBtn = document.getElementById('uploadBtn');
        if (this.value)
            uploadBtn.classList.remove('disabled')
        else
            uploadBtn.classList.add('disabled')
    }

    // upload button click
    document.getElementById('uploadBtn').onclick = function () {
        // TODO: image uploading
        console.log('uploading image');
    }

    // save button click
    document.getElementById('saveImageBtn').onclick = function () {
        // TODO: image saving
        console.log('saving image');
    }

    // image filtering
    document.querySelectorAll('input[type=range]').forEach(function (control) {
        control.onchange = function () {
            console.log(this.id, 'is set to', this.value);
        }
    });
});


