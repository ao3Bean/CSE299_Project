// ── State ──────────────────────────────────────────────
const today = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDate = null;

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Build Calendar ─────────────────────────────────────
function buildCalendar(year, month) {
    document.getElementById('month-title').textContent = `${MONTHS[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        const mm = String(month + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateStr = `${year}-${mm}-${dd}`;
        cell.dataset.date = dateStr;

        // today highlight
        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            d === today.getDate()) {
            cell.classList.add('today');
        }

        // ── CHANGED: task color logic ──────────────────
        // All complete → pastel green (accomplished!)
        // Mix or all incomplete → pastel blue (still work to do)
        if (tasksByDate[dateStr]) {
            const tasks = tasksByDate[dateStr];
            const allDone = tasks.every(t => t.is_complete);

            if (allDone) {
                cell.classList.add('all-done');  // green — all tasks complete!
            } else {
                cell.classList.add('has-tasks'); // blue — still has incomplete tasks
            }

            // badge shows total task count regardless of completion
            const badge = document.createElement('span');
            badge.className = 'task-badge';
            badge.textContent = tasks.length;
            cell.appendChild(badge);
        }
        // ── END CHANGED ────────────────────────────────

        // ── CHANGED: day number aligned bottom-left ────
        const num = document.createElement('span');
        num.textContent = d;
        num.style.position = 'absolute';
        num.style.bottom = '6px';
        num.style.left = '8px';
        cell.appendChild(num);
        // ── END CHANGED ────────────────────────────────

        cell.addEventListener('click', () => openModal(dateStr, d, month, year));
        grid.appendChild(cell);
    }
}

// ── Open Modal ─────────────────────────────────────────
function openModal(dateStr, d, month, year) {
    selectedDate = dateStr;
    document.getElementById('selected-date-input').value = dateStr;
    document.getElementById('modal-date-title').textContent =
        `${MONTHS[month]} ${d}, ${year}`;

    const list  = document.getElementById('task-list');
    list.innerHTML = '';
    const tasks = tasksByDate[dateStr] || [];

    if (tasks.length === 0) {
        list.innerHTML = '<li class="task-empty">No tasks yet! Add one below ✨</li>';
    } else {
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.is_complete ? ' completed' : '');
            li.innerHTML = `
                <form method="POST" action="/tasks/toggle/${task.id}/"
                      style="display:flex;align-items:center;gap:10px;width:100%">
                    <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                    <input type="checkbox" class="task-checkbox"
                           ${task.is_complete ? 'checked' : ''}
                           onchange="this.form.submit()">
                    <span>${task.title}</span>
                </form>
            `;
            list.appendChild(li);
        });
    }

    // highlight selected day
    document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
    const selectedCell = document.querySelector(`[data-date="${dateStr}"]`);
    if (selectedCell) selectedCell.classList.add('selected');

    document.getElementById('task-modal-backdrop').classList.add('open');
}

// ── Close Modal ────────────────────────────────────────
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('task-modal-backdrop').classList.remove('open');
});

document.getElementById('task-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('task-modal-backdrop')) {
        document.getElementById('task-modal-backdrop').classList.remove('open');
    }
});

// ── Month Navigation ───────────────────────────────────
document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    buildCalendar(currentYear, currentMonth);
});

document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    buildCalendar(currentYear, currentMonth);
});

// ── CSRF Cookie Helper ─────────────────────────────────
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}

// ── Init ───────────────────────────────────────────────
buildCalendar(currentYear, currentMonth);
```

Two changes clearly marked with comments:
```
// ── CHANGED: task color logic ── → green/blue logic
// ── CHANGED: day number aligned bottom-left ── → number position