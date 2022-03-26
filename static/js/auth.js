window.addEventListener('load', function () {
    let submitBtn = document.getElementById('submitBtn');

    document.getElementById('password').onkeydown = function (ev) {
        if (ev.key === 'Enter')
            submitBtn.click();
    }

    document.getElementById('submitBtn').onclick = async () => {
        let authFormData = new FormData(document.querySelector('form'));
        await postAuthForm(authFormData);
    }

    document.getElementById('registerBtn').onclick = async () => {
        let authFormData = new FormData(document.querySelector('form'));
        authFormData.set('register', 'true');
        await postAuthForm(authFormData);
    }
    loadingIndicator.hidden = true;
})

async function postAuthForm(formData) {
    const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();

    let failText = data['fail'];
    let redirectURL = String(data['success']);
    if (failText) {
        let authResponse = document.getElementById('auth-response');
        authResponse.innerText = failText;
        authResponse.hidden = false;
    } else if (redirectURL) {
        window.location.href = redirectURL;
    }
}