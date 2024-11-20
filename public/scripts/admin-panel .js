const edit_select = document.getElementById('edit-select');
const current_player_data = document.getElementById('current-player-data');
const edit_table = document.getElementsByClassName('edit-table')[0];
const add_message = document.getElementsByClassName('add-message')[0];
const edit_message = document.getElementsByClassName('edit-message')[0];
const attr_list = ['game', 'nationnality', 'role', 'age', 'arrived', 'current', 'player'];
let player_list;

document.addEventListener('DOMContentLoaded', () => {

    fetch('/get_data_admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            if (data) {
                player_list = data;
                player_list.forEach(p => {
                    const new_option = document.createElement('option');
                    new_option.value = p.player;
                    new_option.textContent = p.player
                    edit_select.appendChild(new_option);
                });
            } else {
                console.log('Error to receive data');
            }
        })
        .catch(err => console.error(err));

    edit_select.addEventListener('change', () => {
        if (edit_select.value !== '') {
            current_player_data.innerHTML = '';
            const player = player_list.find(p => p.player === edit_select.value);
            if (player) {
                for (let attr in player) {
                    const new_td = document.createElement('td');
                    new_td.textContent = player[attr];
                    document.getElementById(`edit-${attr}`).value = player[attr];
                    current_player_data.appendChild(new_td);
                }
            }
        } else {
            current_player_data.innerHTML = '';
        }
    });

});

function submit_add(event) {
    event.preventDefault();
    const new_player = [];
    for (let attr of attr_list) {
        const new_attr = document.getElementById(`add-${attr}`);
        if (new_attr.value) {
            new_player.push(new_attr.value);
        } else {
            add_message.textContent = 'Please fill all fields'
            add_message.style.color = 'red';
            setTimeout(() => { add_message.textContent = '' }, 3000);
            return;
        }
    }
    if (new_player.length > 0) {
        fetch('/add_player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_player })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status) {
                    add_message.textContent = 'Success'
                    add_message.style.color = 'green';
                    setTimeout(() => { add_message.textContent = '' }, 3000);
                    return;
                } else {
                    add_message.textContent = data.message;
                    add_message.style.color = 'red';
                    setTimeout(() => { add_message.textContent = '' }, 3000);
                    return;
                }
            })
            .catch(err => {
                console.error(err);
                add_message.textContent = 'Server error';
                add_message.style.color = 'red';
                setTimeout(() => { add_message.textContent = '' }, 3000);
                return;
            });
    } else {
        add_message.textContent = 'Please fill all fields'
        add_message.style.color = 'red';
        setTimeout(() => { add_message.textContent = '' }, 3000);
        return;
    }
}

function submit_edit(event) {
    event.preventDefault();
    const player_to_edit = edit_select.value;
    const edit_attr = [];
    for (let attr of attr_list) {
        const new_attr = document.getElementById(`edit-${attr}`);
        if (new_attr.value) {
            edit_attr.push(new_attr.value);
            new_attr.value = '';
        } else {
            edit_message.textContent = 'Please fill all fields'
            edit_message.style.color = 'red';
            setTimeout(() => { edit_message.textContent = '' }, 3000);
            return;
        }
    }
    if (player_to_edit && edit_attr.length > 0) {
        edit_attr.push(player_to_edit);
        fetch('/edit_player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ edit_attr })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status) {
                    edit_message.textContent = 'Success'
                    edit_message.style.color = 'green';
                    setTimeout(() => { edit_message.textContent = '' }, 2000);
                    return;
                } else {
                    edit_message.textContent = data.message;
                    edit_message.style.color = 'red';
                    setTimeout(() => { edit_message.textContent = '' }, 2000);
                    return;
                }
            })
            .catch(err => {
                console.error(err);
                edit_message.textContent = 'Server error';
                edit_message.style.color = 'red';
                setTimeout(() => { edit_message.textContent = '' }, 3000);
                return;
            });
    } else {
        edit_message.textContent = 'Please fill all fields and select a player to edit'
        edit_message.style.color = 'red';
        setTimeout(() => { edit_message.textContent = '' }, 3000);
        return;
    }
}