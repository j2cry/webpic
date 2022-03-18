window.addEventListener('load', function () {
    let submitBtn = document.getElementById('submitBtn');

    document.getElementById('password').onkeydown = function (ev) {
        if (ev.key === 'Enter')
            submitBtn.click();
    }

    document.getElementById('submitBtn').onclick = function () {
        fetch(window.location.href, {
            method: 'POST',
            body: new FormData(document.querySelector('form'))
        }).then(response => {
            response.json().then(data => {
                let failText = data['fail'];
                let redirectURL = String(data['success']);
                if (failText) {
                    let authResponse = document.getElementById('auth-response');
                    authResponse.innerText = failText;
                    authResponse.hidden = false;
                } else if (redirectURL) {
                    window.location.href = redirectURL;
                }
            });
        });
    }
})