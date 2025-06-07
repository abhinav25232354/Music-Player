const playlistsEl = document.getElementById('playlists');
const songsEl = document.getElementById('songs');
const playerEl = document.getElementById('player');
const audio = document.getElementById('audio');
const progress = document.getElementById('progress');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentSongTitle = document.getElementById('current-song-title');
const chooseFolderBtn = document.getElementById('choose-folder-btn');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

let data = { playlists: [], songs: [] };
let currentPlaylist = null;
let currentSongIndex = -1;
let currentSongList = [];

chooseFolderBtn.onclick = async () => {
    // Prompt user to pick a directory
    const dirHandle = await window.showDirectoryPicker();
    data = { playlists: [], songs: [] };
    await scanDirectory(dirHandle);
    renderPlaylists();
    renderSongs();
};

async function scanDirectory(dirHandle, parent = null) {
    let playlist = null;
    let songFiles = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav|ogg)$/i)) {
            const file = await entry.getFile();
            songFiles.push({ title: file.name.replace(/\.[^/.]+$/, ""), src: URL.createObjectURL(file) });
        } else if (entry.kind === 'directory') {
            // Recursively scan subfolders as playlists
            let subSongs = [];
            for await (const subEntry of entry.values()) {
                if (subEntry.kind === 'file' && subEntry.name.match(/\.(mp3|wav|ogg)$/i)) {
                    const file = await subEntry.getFile();
                    subSongs.push({ title: file.name.replace(/\.[^/.]+$/, ""), src: URL.createObjectURL(file) });
                }
            }
            if (subSongs.length > 0) {
                data.playlists.push({ name: entry.name, songs: subSongs });
            }
        }
    }
    // Songs in the root folder are individual songs
    data.songs = songFiles;
}

function renderPlaylists() {
    playlistsEl.innerHTML = '<h2>Playlists</h2>';
    data.playlists.forEach((playlist, idx) => {
        const div = document.createElement('div');
        div.className = 'playlist';
        div.innerHTML = `<span class="playlist-title">${playlist.name}</span> <span>▶️</span>`;
        div.onclick = () => showPlaylistSongs(idx);
        playlistsEl.appendChild(div);
    });
}

function renderSongs() {
    songsEl.innerHTML = '<h2>Individual Songs</h2>';
    data.songs.forEach((song, idx) => {
        const div = document.createElement('div');
        div.className = 'song';
        div.innerHTML = `<span class="song-title">${song.title}</span>`;
        div.onclick = () => playSong(data.songs, idx);
        songsEl.appendChild(div);
    });
}

function showPlaylistSongs(playlistIdx) {
    const playlist = data.playlists[playlistIdx];
    songsEl.innerHTML = `<h2>${playlist.name}</h2>`;
    playlist.songs.forEach((song, idx) => {
        const div = document.createElement('div');
        div.className = 'song';
        div.innerHTML = `<span class="song-title">${song.title}</span>`;
        div.onclick = () => playSong(playlist.songs, idx, playlistIdx);
        songsEl.appendChild(div);
    });
    // Add a back button
    const backBtn = document.createElement('button');
    backBtn.textContent = "← Back to Playlists";
    backBtn.style.marginTop = "16px";
    backBtn.onclick = () => {
        renderSongs();
    };
    songsEl.appendChild(backBtn);
}

// SVG icons for modern, minimal look
const ICONS = {
    play: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.08)" stroke="#bfcfff" stroke-width="1.5"/><polygon points="11,9 20,14 11,19" fill="#fff"/></svg>`,
    pause: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.08)" stroke="#bfcfff" stroke-width="1.5"/><rect x="10" y="9" width="2.8" height="10" rx="1.2" fill="#fff"/><rect x="15.2" y="9" width="2.8" height="10" rx="1.2" fill="#fff"/></svg>`,
    prev: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.08)" stroke="#bfcfff" stroke-width="1.5"/><polygon points="17,9 11,14 17,19" fill="#fff"/><rect x="8.5" y="9" width="2" height="10" rx="1" fill="#fff"/></svg>`,
    next: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.08)" stroke="#bfcfff" stroke-width="1.5"/><polygon points="11,9 17,14 11,19" fill="#fff"/><rect x="17.5" y="9" width="2" height="10" rx="1" fill="#fff"/></svg>`
};

// Set SVG icons for prev/next on load
prevBtn.innerHTML = ICONS.prev;
nextBtn.innerHTML = ICONS.next;

// Update playSong and playPauseBtn logic to use SVGs
function playSong(songList, idx, playlistIdx = null) {
    currentSongList = songList;
    currentSongIndex = idx;
    currentPlaylist = playlistIdx;
    const song = songList[idx];
    audio.src = song.src;
    audio.play();
    playerEl.classList.remove('hidden');
    currentSongTitle.textContent = song.title;
    playPauseBtn.classList.remove('paused');
    playPauseBtn.classList.add('playing');
    playPauseBtn.innerHTML = `<span class="icon">${ICONS.pause}</span>`;
}

playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.classList.remove('paused');
        playPauseBtn.classList.add('playing');
        playPauseBtn.innerHTML = `<span class="icon">${ICONS.pause}</span>`;
    } else {
        audio.pause();
        playPauseBtn.classList.remove('playing');
        playPauseBtn.classList.add('paused');
        playPauseBtn.innerHTML = `<span class="icon">${ICONS.play}</span>`;
    }
};

audio.addEventListener('play', () => {
    playPauseBtn.classList.remove('paused');
    playPauseBtn.classList.add('playing');
    playPauseBtn.innerHTML = `<span class="icon">${ICONS.pause}</span>`;
});
audio.addEventListener('pause', () => {
    playPauseBtn.classList.remove('playing');
    playPauseBtn.classList.add('paused');
    playPauseBtn.innerHTML = `<span class="icon">${ICONS.play}</span>`;
});

function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progress.value = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress.value}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    } else {
        currentTimeEl.textContent = "0:00";
        durationEl.textContent = "0:00";
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

// Create the animated fill for the progress bar
const progressBar = document.querySelector('.progress-bar');
let progressFill = document.createElement('div');
progressFill.className = 'progress-fill';
progressBar.insertBefore(progressFill, progressBar.firstChild);

// Also update fill on manual input
progress.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progress.value / 100) * audio.duration;
        progressFill.style.width = `${progress.value}%`;
    }
});

// On load, set fill to 0
progressFill.style.width = '0%';

progress.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progress.value / 100) * audio.duration;
    }
});

audio.addEventListener('ended', () => {
    nextSong();
});

prevBtn.onclick = () => {
    if (currentSongIndex > 0) {
        playSong(currentSongList, currentSongIndex - 1, currentPlaylist);
    }
};

nextBtn.onclick = () => {
    nextSong();
};

function nextSong() {
    if (currentSongIndex < currentSongList.length - 1) {
        playSong(currentSongList, currentSongIndex + 1, currentPlaylist);
    }
}

// On initial load, set play button icon
playPauseBtn.innerHTML = `<span class="icon">${ICONS.play}</span>`;