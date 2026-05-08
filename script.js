// Inicializácia Supabase (Nahraď svojimi údajmi zo Supabase projektu)
const SUPABASE_URL = "https://vjvdpkreqgvrpcgycccm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqdmRwa3JlcWd2cnBjZ3ljY2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjc1MzQsImV4cCI6MjA5MzgwMzUzNH0.18Xl6ihYBND3-YH_4YraJXuYkZpcLYCWZFbxMaITR0g";
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Databáza 10 unikátnych cvikov pre každú partiu
const defaultExercises = {
    "Hrudník": [
        "Benchpress s veľkou činkou", "Benchpress s jednoručkami", "Incline Benchpress s j.č.",
        "Dips (Kľuky na bradlách)", "Rozpažovanie s jednoručkami", "Protismerné kladky (Cable Flyes)",
        "Tlaky na stroji (Chest Press)", "Kľuky na zemi", "Pec Deck", "Pullover s jednoručkou"
    ],
    "Chrbát": [
        "Mŕtvy ťah (Deadlift)", "Zhyby (Pull-ups)", "Priťahovanie veľkej činky",
        "Sťahovanie hornej kladky", "Priťahovanie spodnej kladky", "Jednoručka v predklone",
        "Hyperextenzia", "T-Bar Row", "Pullover na hornej kladke", "Face Pulls"
    ],
    "Nohy": [
        "Drepy s veľkou činkou", "Legpress", "Bulharské drepy s j.č.", "Rumunský mŕtvy ťah",
        "Predkopávanie na stroji", "Zakopávanie na stroji", "Hacken drep",
        "Hip Thrust s veľkou činkou", "Výpony na lýtka v stoji", "Výpady s činkami"
    ],
    "Ramená": [
        "Military Press (tlak v stoji)", "Tlaky s jednoručkami v sede", "Upažovanie s jednoručkami",
        "Predpažovanie s kotúčom", "Upažovanie v predklone (zadné delty)", "Arnoldove tlaky",
        "Upažovanie na spodnej kladke", "Tlaky na ramená na stroji", "Upright Rows (priťahovanie k brade)", "Šrugy"
    ],
    "Ruky": [
        "Bicepsový zdvih s veľkou činkou", "Bicepsový zdvih s jednoručkami", "Kladivové zdvihy",
        "Tricepsové sťahovanie kladky", "Francúzsky tlak s EZ činkou", "Dips na lavičke",
        "Bicepsový zdvih na Scottovej lavičke", "Tricepsová extenzia za hlavou", "Concentration Curl", "Úzky Benchpress"
    ]
};

let user = null;
let currentChart = null;
const studies = [
    { id: 1, cat: "suplementy", title: "Kreatín a resyntéza ATP", full: "Kreatín monohydrát zvyšuje zásoby fosfokreatínu vo svaloch, čo umožňuje rýchlejšiu obnovu energie počas šprintov a ťažkých sérií. Meta-analýzy potvrdzujú nárast sily o 10-15%.", source: "https://pubmed.ncbi.nlm.nih.gov/14636102/" },
    { id: 2, cat: "trening", title: "Mechanické napätie a rast", full: "Základným faktorom hypertrofie je mechanické napätie pôsobiace na svalové vlákna. Tréning v plnom rozsahu pohybu (ROM) vykazuje lepšie výsledky než čiastočné opakovania.", source: "https://www.sciencedirect.com/" },
    { id: 3, cat: "strava", title: "Leucínový prah v strave", full: "Pre spustenie svalovej proteosyntézy (MPS) je potrebná dávka cca 3g leucínu. To zodpovedá približne 25-30g srvátkového proteínu v jednej dávke.", source: "https://ncbi.nlm.nih.gov/" },
    { id: 4, cat: "regeneracia", title: "Vplyv spánku na testosterón", full: "Obmedzenie spánku na 5 hodín denne po dobu jedného týždňa znižuje hladinu testosterónu u mužov o 10-15%, čo je ekvivalent 10 rokov starnutia.", source: "https://jamanetwork.com/" },
    { id: 5, cat: "suplementy", title: "Cofeín a silový výkon", full: "Kofeín blokuje adenozínové receptory, čím znižuje pocit únavy. Dávka 3-6mg/kg zvyšuje anaeróbny výkon a silovú vytrvalosť.", source: "https://sportsmedicine-open.springeropen.com/" },
    { id: 6, cat: "trening", title: "Efekt pauzy medzi sériami", full: "Štúdie ukazujú, že dlhšie pauzy (2-3 minúty) sú pre budovanie svalov lepšie než krátke (60s), pretože dovoľujú vyšší objem práce pri zachovaní intenzity.", source: "https://pubmed.ncbi.nlm.nih.gov/" }
];

// --- NAVIGÁCIA (Prepínanie Tabov) ---
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

// --- AUTHENTIFIKÁCIA & MODAL ---
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authToggle = document.getElementById('authToggle');
let isSignUp = false;

window.openAuthModal = () => authModal.style.display = 'flex';
document.getElementById('closeAuth').onclick = () => authModal.style.display = 'none';
document.getElementById('authBtn').onclick = () => {
    if(user) {
        supabase.auth.signOut();
    } else {
        openAuthModal();
    }
};

authToggle.onclick = () => {
    isSignUp = !isSignUp;
    document.getElementById('authModalTitle').innerText = isSignUp ? "Registrácia" : "Prihlásenie";
    document.getElementById('authSubmit').innerText = isSignUp ? "Zaregistrovať sa" : "Prihlásiť sa";
    document.getElementById('authToggleText').innerHTML = isSignUp ? "Máš účet? <span id='authToggle' class='link'>Prihlás sa</span>" : "Nemáš účet? <span id='authToggle' class='link'>Zaregistruj sa</span>";
};

// Supabase Auth State Change
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        user = session?.user ?? null;
        if(user) {
            document.getElementById('authBtn').innerText = "Odhlásiť sa";
            document.getElementById('lockScreen').style.display = 'none';
            authModal.style.display = 'none';
            loadExercises();
            updateChartDropdown();
        } else {
            document.getElementById('authBtn').innerText = "Prihlásiť sa";
            document.getElementById('lockScreen').style.display = 'flex';
        }
    });
}

authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    if (!supabase) return alert("Supabase nie je nakonfigurovaný!");

    if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert(error.message);
        else alert("Registrácia úspešná! Over si email.");
    } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    }
};

// --- TRÉNINGOVÝ DEŇNÍK LOGIKA ---
const partSelect = document.getElementById('partSelect');
const exerciseSelect = document.getElementById('exerciseSelect');

partSelect.onchange = () => loadExercises();

async function loadExercises() {
    const part = partSelect.value;
    exerciseSelect.innerHTML = "";
    
    // Načítaj predvolené cviky
    defaultExercises[part].forEach(ex => {
        let opt = document.createElement('option');
        opt.value = ex;
        opt.innerText = ex;
        exerciseSelect.appendChild(opt);
    });

    // Načítaj vlastné cviky zo Supabase
    if(supabase && user) {
        let { data, error } = await supabase.from('custom_exercises').select('name').eq('category', part).eq('user_id', user.id);
        if(!error && data) {
            data.forEach(ex => {
                let opt = document.createElement('option');
                opt.value = ex.name;
                opt.innerText = ex.name + " (Vlastný)";
                exerciseSelect.appendChild(opt);
            });
        }
    }
}

// Pridanie vlastného cviku
document.getElementById('addCustomExBtn').onclick = async () => {
    const name = document.getElementById('customExName').value.trim();
    const category = partSelect.value;
    if(!name) return;

    if(supabase && user) {
        const { error } = await supabase.from('custom_exercises').insert([{ user_id: user.id, name, category }]);
        if(!error) {
            document.getElementById('customExName').value = "";
            loadExercises();
            updateChartDropdown();
        } else {
            alert(error.message);
        }
    }
};

// Uloženie tréningovej série
document.getElementById('saveSetBtn').onclick = async () => {
    const exercise_name = exerciseSelect.value;
    const weight = parseFloat(document.getElementById('weightInput').value);
    const reps = parseInt(document.getElementById('repsInput').value);
    const rpe = parseFloat(document.getElementById('rpeInput').value);

    if(!exercise_name || isNaN(weight) || isNaN(reps) || isNaN(rpe)) {
        alert("Vyplň všetky hodnoty správne.");
        return;
    }

    // Teoretické 1RM s korekciou na RPE
    const repsEffective = reps + (10 - rpe);
    const e1rm = parseFloat((weight * (1 + repsEffective / 30)).toFixed(1));

    if(supabase && user) {
        const { error } = await supabase.from('workout_logs').insert([{
            user_id: user.id,
            exercise_name,
            weight,
            reps,
            rpe,
            e1rm
        }]);

        if(!error) {
            alert(`Séria uložená! Odhadované 1RM: ${e1rm} kg`);
            document.getElementById('weightInput').value = "";
            document.getElementById('repsInput').value = "";
            document.getElementById('rpeInput').value = "";
            loadChartData(exercise_name);
        } else {
            alert(error.message);
        }
    }
};

// --- GRAFY & ANALYTIKA (Chart.js) ---
const chartExerciseSelect = document.getElementById('chartExerciseSelect');
chartExerciseSelect.onchange = () => loadChartData(chartExerciseSelect.value);

async function updateChartDropdown() {
    chartExerciseSelect.innerHTML = "";
    if(!supabase || !user) return;

    // Načítaj len tie cviky, ktoré používateľ aspoň raz odvičil
    let { data } = await supabase.from('workout_logs').select('exercise_name').eq('user_id', user.id);
    if(data) {
        const uniqueExercises = [...new Set(data.map(item => item.exercise_name))];
        uniqueExercises.forEach(ex => {
            let opt = document.createElement('option');
            opt.value = ex;
            opt.innerText = ex;
            chartExerciseSelect.appendChild(opt);
        });
        if(uniqueExercises.length > 0) {
            loadChartData(uniqueExercises[0]);
        }
    }
}

async function loadChartData(exercise) {
    if(!supabase || !user || !exercise) return;

    let { data, error } = await supabase.from('workout_logs')
        .select('date, e1rm')
        .eq('user_id', user.id)
        .eq('exercise_name', exercise)
        .order('date', { ascending: true });

    if(error || !data) return;

    const labels = data.map(log => new Date(log.date).toLocaleDateString('sk-SK'));
    const dataset = data.map(log => log.e1rm);

    renderChart(labels, dataset, exercise);
}

function renderChart(labels, data, exerciseName) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Odhadované 1RM pre ${exerciseName} (kg)`,
                data: data,
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#86868b' } },
                x: { grid: { display: false }, ticks: { color: '#86868b' } }
            }
        }
    });
}

// --- LOGIKA ŠTÚDIÍ (Z predchádzajúcej verzie) ---
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');

function renderStudies(data) {
    grid.innerHTML = data.map(s => `
        <article class="card" onclick="openStudy(${s.id})">
            <span style="color:var(--accent); font-size:12px; font-weight:700; text-transform:uppercase;">${s.cat}</span>
            <h3>${s.title}</h3>
            <p>${s.full.substring(0, 85)}...</p>
        </article>
    `).join('');
}

window.openStudy = (id) => {
    const s = studies.find(x => x.id === id);
    document.getElementById('modalBody').innerHTML = `
        <span style="color:var(--accent); font-weight:bold; font-size:14px; text-transform:uppercase;">${s.cat}</span>
        <h2 style="margin: 15px 0; font-size:28px;">${s.title}</h2>
        <p style="margin: 20px 0; color:#e5e5e7; line-height:1.7; font-size:18px;">${s.full}</p>
        <a href="${s.source}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:600; display:inline-block; margin-top:10px;">Pôvodný zdroj (PubMed / Scholar) ➔</a>
    `;
    modal.style.display = 'flex';
};

document.getElementById('close').onclick = () => modal.style.display = 'none';

searchInput.oninput = (e) => {
    const v = e.target.value.toLowerCase();
    renderStudies(studies.filter(s => s.title.toLowerCase().includes(v) || s.full.toLowerCase().includes(v)));
};

document.getElementById('filterContainer').onclick = (e) => {
    if (!e.target.classList.contains('f-btn')) return;
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const cat = e.target.dataset.cat;
    renderStudies(cat === 'all' ? studies : studies.filter(s => s.cat === cat));
};

renderStudies(studies);
