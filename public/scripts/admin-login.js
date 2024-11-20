const username = document.getElementById('username');
const password = document.getElementById('password');
const error_message = document.getElementsByClassName('error-message')[0];

document.addEventListener('DOMContentLoaded', () => {

    const token = get_cookie();
    if (token) {
        window.location.replace('/admin-panel');
    }

});

function connexion(event) {
    event.preventDefault();
    const u = String(username.value);
    const p = String(password.value);
    password.value = '';
    if (u && p && u.length > 0 && u.length < 65 && p.length > 0 && p.length < 65) {
        fetch('/login_admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u, p })
        })
            .then(res => res.json())
            .then(data => {
                if (data) { 
                    set_cookie(data);
                    window.location.replace('/admin-panel');
                } else {
                    error(); 
                }
            })
            .catch(err => console.error(err));
    } else {
        error();
    }
}

function set_cookie(token) {
    const date = new Date();
    date.setTime(date.getTime() + (30 * 7 * 24 * 60 * 60 * 1000));
    document.cookie = `admin_token=${token}; expires=${date.toUTCString()}`;
}

function get_cookie() {
    return document.cookie
        .split(";")
        .find((row) => row.startsWith("admin_token="))
        ?.split("=")[1];
}

function error() {
    error_message.style.display = 'flex';
    setTimeout(() => {
        error_message.style.display = 'none';
    }, 3000);
}