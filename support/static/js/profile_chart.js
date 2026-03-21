// ── Open/Close Modal ──
document.getElementById('openAnalytics').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('analyticsBackdrop').classList.add('open');
    renderPieChart();
});

document.getElementById('closeAnalytics').addEventListener('click', function() {
    document.getElementById('analyticsBackdrop').classList.remove('open');
});

document.getElementById('analyticsBackdrop').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('open');
    }
});

// ── Pie Chart ──
let chartRendered = false;

function renderPieChart() {
    if (chartRendered) return; // only render once
    chartRendered = true;

    const ctx = document.getElementById('yearlyPieChart').getContext('2d');
    
    // ── ADDED: if no tasks yet show friendly empty state ──
    if (yearlyCompleted === 0 && yearlyIncomplete === 0) {
        ctx.canvas.style.display = 'none';                              // hide empty canvas
        document.getElementById('no-tasks-msg').style.display = 'block'; // show 🌱 message
        document.getElementById('chart-legend').style.display = 'none';  // hide legend too
        return; // stop here, don't render chart
    }
    // ── END ADDED ──

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Incomplete'],
            datasets: [{
                data: [yearlyCompleted, yearlyIncomplete], // ← from HTML
                backgroundColor: ['#b8f0c8', '#ffb7d5'],
                borderColor: ['#6ddb8f', '#ff8fb1'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}