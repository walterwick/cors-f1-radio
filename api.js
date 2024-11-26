import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Radyo verilerini getiren fonksiyon
async function fetchRadioData() {
    const sessionResponse = await fetch('https://f1-apii.vercel.app/static/SessionInfo.json');
    const sessionData = await sessionResponse.json();
    const path = sessionData.Path;

    const teamRadioUrl = `https://f1-apii.vercel.app/static/${path}TeamRadio.json`;
    const radioResponse = await fetch(teamRadioUrl);
    const radioData = await radioResponse.json();

    const formattedData = radioData.Captures.map(capture => ({
        path: capture.Path,
        racingNumber: capture.RacingNumber,
        utc: capture.Utc,
        audioUrl: `https://f1-apii.vercel.app/static/${path}${capture.Path}`
    }));

    return formattedData.sort((a, b) => new Date(b.utc) - new Date(a.utc));
}

// HTML şablonu
const htmlTemplate = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F1 Radyo Oynatıcı</title>
    <style>
        :root {
            --primary-color: #e10600;
            --secondary-color: #1E1E1E;
            --bg-dark: #000000;
            --bg-card: #1a1a1a;
            --bg-item: #242424;
            --text-primary: #ffffff;
            --text-secondary: #b3b3b3;
            --shadow-color: rgba(0, 0, 0, 0.3);
            --accent-color: #ff1801;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Titillium Web', 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
            padding-bottom: 2rem;
        }

        header {
            background: linear-gradient(135deg, var(--primary-color), #b30500);
            padding: 2rem 1rem;
            text-align: center;
            margin-bottom: 2rem;
            box-shadow: 0 4px 12px var(--shadow-color);
            position: relative;
            overflow: hidden;
        }

        header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.1) 52%, transparent 55%);
            animation: shine 3s infinite;
        }

        @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.5px;
            position: relative;
        }

        #result {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 1rem;
        }

        .radio-item {
            background: var(--bg-item);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.05);
            position: relative;
        }

        .radio-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .radio-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(225, 6, 0, 0.15);
        }

        .radio-item:hover::before {
            opacity: 1;
        }

        .radio-item p {
            margin: 0.5rem 0;
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        .radio-item p strong {
            color: var(--text-primary);
            font-weight: 600;
            margin-right: 0.5rem;
        }

        .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }

        button {
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
        }

        button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 0;
            border-radius: 100%;
            transform: scale(1, 1) translate(-50%);
            transform-origin: 50% 50%;
        }

        button:focus:not(:active)::after {
            animation: ripple 1s ease-out;
        }

        @keyframes ripple {
            0% {
                transform: scale(0, 0);
                opacity: 0.5;
            }
            100% {
                transform: scale(100, 100);
                opacity: 0;
            }
        }

        .play-btn {
            background: var(--primary-color);
            color: white;
        }

        .play-btn:hover {
            background: #ff0700;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(225, 6, 0, 0.3);
        }

        .stop-btn {
            background: var(--secondary-color);
            color: white;
            display: none;
        }

        .stop-btn:hover {
            background: #2a2a2a;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        audio {
            width: 100%;
            margin-top: 1rem;
            border-radius: 8px;
            background: var(--bg-card);
        }

        audio::-webkit-media-controls-panel {
            background: var(--bg-card);
        }

        audio::-webkit-media-controls-current-time-display,
        audio::-webkit-media-controls-time-remaining-display {
            color: var(--text-primary);
        }

        .loading {
            text-align: center;
            padding: 2rem;
            font-size: 1.2rem;
            color: var(--text-secondary);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }

        @media (max-width: 768px) {
            header h1 {
                font-size: 2rem;
            }

            .radio-item {
                padding: 1rem;
            }

            button {
                padding: 0.6rem 1.2rem;
            }
        }

        @media (max-width: 480px) {
            header h1 {
                font-size: 1.75rem;
            }

            .radio-item p {
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>F1 Radyo Oynatıcı</h1>
    </header>
    <div id="result">
        <div class="loading">Yükleniyor...</div>
    </div>
    <script>
        window.addEventListener('load', async () => {
            try {
                const response = await fetch('/api/radio-data');
                const radioData = await response.json();
                
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '';

                radioData.forEach(item => {
                    const radioItem = document.createElement('div');
                    radioItem.className = 'radio-item';
                    radioItem.innerHTML = \`
                        <p><strong>Yarış Numarası:</strong> \${item.path}</p>
                        <p><strong>Pilot Numarası:</strong> \${item.racingNumber}</p>
                        <p><strong>Zaman:</strong> \${new Date(item.utc).toLocaleString('tr-TR')}</p>
                        <div class="button-group">
                            <button class="play-btn">Oynat</button>
                            <button class="stop-btn">Durdur</button>
                        </div>
                        <audio src="\${item.audioUrl}" preload="none"></audio>
                    \`;
                    resultDiv.appendChild(radioItem);
                });

                resultDiv.addEventListener('click', (event) => {
                    if (event.target.classList.contains('play-btn')) {
                        const button = event.target;
                        const audio = button.closest('.radio-item').querySelector('audio');
                        const stopButton = button.closest('.radio-item').querySelector('.stop-btn');

                        // Diğer tüm ses oynatıcıları durdur
                        document.querySelectorAll('audio').forEach(a => {
                            if (a !== audio) {
                                a.pause();
                                const parentItem = a.closest('.radio-item');
                                parentItem.querySelector('.play-btn').style.display = 'block';
                                parentItem.querySelector('.stop-btn').style.display = 'none';
                            }
                        });

                        if (audio.paused) {
                            audio.play();
                            button.style.display = 'none';
                            stopButton.style.display = 'block';
                        }
                    } else if (event.target.classList.contains('stop-btn')) {
                        const button = event.target;
                        const audio = button.closest('.radio-item').querySelector('audio');
                        const playButton = button.closest('.radio-item').querySelector('.play-btn');

                        audio.pause();
                        playButton.style.display = 'block';
                        button.style.display = 'none';
                    }
                });
            } catch (error) {
                console.error('Hata:', error);
                document.getElementById('result').innerHTML = '<div class="loading">Bir hata oluştu.</div>';
            }
        });
    </script>
</body>
</html>`;

// Route'lar
app.get('/', (req, res) => {
    res.send(htmlTemplate);
});

app.get('/api/radio-data', async (req, res) => {
    try {
        const formattedData = await fetchRadioData();
        res.json(formattedData);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Veriler alınırken bir hata oluştu' });
    }
});

app.listen(port, () => {
    console.log(`Server http://localhost:${port} adresinde çalışıyor`);
});