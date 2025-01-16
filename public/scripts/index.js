const thead = document.getElementById('thead');
const tbody = document.getElementById('tbody');
const input_submit = document.getElementById('input-submit');
const submit_btn = document.getElementById('submit-btn');
const filtered_list = document.getElementsByClassName('filtered-player-list')[0];
const input_area = document.getElementsByClassName('input-area')[0];
const victory_area = document.getElementsByClassName('victory-area')[0];
const error_message = document.getElementsByClassName('error-message')[0];
let pseudo_list = [];
let pseudo_list_filtered = [];
let tries = [];
let global_attr = [];
let has_win = false;
let found;

document.addEventListener('DOMContentLoaded', () => {

    fetch('/user/get_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            if (data) {
                pseudo_list = data.players.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                global_attr = Object.keys(data.attr);
                found = data.found;
                const tr = document.createElement('tr');
                for (let attr of global_attr) {
                    const th = document.createElement('th');
                    th.textContent = attr[0].toUpperCase() + attr.slice(1);
                    tr.appendChild(th);
                }
                thead.appendChild(tr);
                const local_storage_tries = JSON.parse(localStorage.getItem('local_tries'));
                const local_tries_expiration = localStorage.getItem('local_tries_expiration');
                if (local_storage_tries && local_tries_expiration && before_midnight(local_tries_expiration)) {
                    for (let t of local_storage_tries) {
                        create_table_answer(t);
                    }
                    tries = local_storage_tries;
                } else {
                    localStorage.setItem('local_tries', JSON.stringify([]));
                    localStorage.setItem('local_tries_expiration', get_midnight());
                }
            } else {
                error_message.textContent = 'Error, please reload this page';
                setTimeout(() => { error_message.textContent = ''; }, 2000);
            }
        })
        .catch(err => {
            console.error(err);
            error_message.textContent = 'Error, please reload this page';
            setTimeout(() => { error_message.textContent = ''; }, 2000);
        });

    input_submit.addEventListener('input', () => {
        filtered_list.innerHTML = '';
        pseudo_list_filtered = [];
        if (input_submit.value.trim() !== '') {
            pseudo_list_filtered = pseudo_list.filter(p => p.toLowerCase().startsWith(input_submit.value.toLowerCase().trim()));
            pseudo_list_filtered.forEach(p => {
                const player_div = document.createElement('div');
                player_div.classList.add('filtered-player');
                const pseudo_div = document.createElement('div');
                pseudo_div.classList.add('pseudo-filtered-player');
                pseudo_div.textContent = p;
                const player_img = document.createElement('img');
                player_img.src = `./assets/images/player/${p}.png`;
                player_img.alt = p;
                player_img.title = p;
                player_img.classList.add('filtered-player-image');
                player_div.appendChild(player_img);
                player_div.appendChild(pseudo_div);
                player_div.addEventListener('click', () => { try_guess(p); });
                filtered_list.appendChild(player_div);
            });
        }
    });

    input_submit.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && pseudo_list_filtered.length > 0) {
            filtered_list.innerHTML = '';
            input_area.value = '';
            try_guess(pseudo_list_filtered[0]);
            pseudo_list_filtered = [];
        }
    });

    submit_btn.addEventListener('click', () => {
        if (pseudo_list_filtered.length > 0) {
            filtered_list.innerHTML = '';
            input_area.value = '';
            try_guess(pseudo_list_filtered[0]);
            pseudo_list_filtered = [];
        }
    });

});

function try_guess(guess) {
    if (guess) {
        if (has_win || tries.some(p => p[p.length - 1].data === guess) || !(pseudo_list.includes(guess))) { return; }
        input_submit.value = '';
        filtered_list.innerHTML = '';
        pseudo_list_filtered = [];
        fetch('/user/try_guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess: String(guess), nb_tries: tries.length + 1 })
        })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    tries.push(data);
                    localStorage.setItem('local_tries', JSON.stringify(tries));
                    create_table_answer(data);
                } else {
                    error_message.textContent = 'Please enter a valid player';
                    setTimeout(() => { error_message.textContent = ''; }, 3000);
                }
            })
            .catch(err => {
                console.error(err);
                error_message.textContent = 'Server error';
                setTimeout(() => { error_message.textContent = ''; }, 3000);
            });
    } else {
        error_message.textContent = 'Please enter a valid player';
        setTimeout(() => { error_message.textContent = ''; }, 3000);
    }
}

function create_table_answer(data) {
    if (data) {
        const player_index = pseudo_list.findIndex(pseudo => pseudo === data[data.length - 1].data);
        if (player_index !== -1) { pseudo_list.splice(player_index, 1); }
        if (data[data.length - 1].is_valid) {
            has_win = true;
            setTimeout(() => {
                input_area.classList.add('fade-out-animation');
                setTimeout(() => {
                    input_area.remove();
                    const div = document.createElement('div');
                    div.classList.add('victory-square');
                    const text = document.createElement('div');
                    text.innerHTML = `Congratulations on finding the player of the day !<br><br>Number of tries : ${tries.length}<br>${found} others players found<br><br>`;
                    const timer = document.createElement('div');
                    timer.id = 'victory-timer';
                    const share_title = document.createElement('div');
                    share_title.innerHTML = '<br>Share your tries !';
                    const table_tries = document.createElement('div');
                    table_tries.innerHTML = get_table_tries('<br>');
                    table_tries.classList.add('table-tries');
                    const share = document.createElement('div');
                    share.classList.add('share-btn');
                    share.innerHTML = `<br><a href="https://x.com/intent/post?text=${encodeURIComponent('Found the player of the day on fnaticdle with those tries :\n\n' + get_table_tries('\n') + '\nTry it by yourself on fnaticdle.com')}" target="_blank" title="Share it on X !"><img alt="X Logo" src="./assets/images/x.png"></a>`;
                    div.appendChild(text);
                    div.appendChild(timer);
                    div.appendChild(share_title);
                    div.appendChild(table_tries);
                    div.appendChild(share);
                    victory_area.appendChild(div);
                    timer_to_midnight();
                    setInterval(timer_to_midnight, 1000);
                }, 500);
            }, 3200);
        }
        const new_tr = document.createElement('tr');
        for (let i = 0; i < data.length; i++) {
            const new_td = create_new_td(data[i], global_attr[i]);
            new_tr.appendChild(new_td);
        }
        tbody.insertBefore(new_tr, tbody.firstChild);
    }
}

function create_new_td(data, type) {
    const new_td = document.createElement('td');
    new_td.classList.add(`${data.is_valid}-guess`);
    if (typeof data.data === 'number') {
        if (!data.is_valid) {
            const rotation = data.less ? 90 : -90;
            const img = document.createElement('img');
            img.src = `./assets/images/arrow.png`;
            img.alt = 'arrow';
            img.style.transform = `rotate(${rotation}deg)`;
            img.classList.add('arrow');
            new_td.appendChild(img);
        }
        const div = document.createElement('div');
        div.textContent = data.data;
        new_td.appendChild(div);
    }
    if (typeof data.data === 'string') {
        const img = document.createElement('img');
        img.src = `./assets/images/${type}/${data.data}.png`;
        img.alt = data.data;
        img.title = data.data;
        if (type === 'player') { img.classList.add('player-picture'); }
        new_td.appendChild(img);
    }
    return new_td;
}

function get_midnight() {
    const midnight = new Date();
    midnight.setUTCHours(0, 0, 0, 0);
    midnight.setUTCDate(midnight.getUTCDate() + 1);
    return midnight.toUTCString();
}

function before_midnight(midnight) {
    const currentUTCDate = new Date().toUTCString();
    return new Date(currentUTCDate) < new Date(midnight);
}

function timer_to_midnight() {
    const now = new Date();
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const totalSeconds = Math.floor((utcMidnight - now) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const remaining_time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('victory-timer').textContent = `New player in : ${remaining_time}`;
}

function get_table_tries(type) {
    let res = '';
    for (let line of tries) {
        for (let attr of line) {
            res += attr.is_valid ? '🟩' : '🟥';
        }
        res += type;
    }
    return res;
}