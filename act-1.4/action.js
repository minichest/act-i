const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('inflation-slider');
const sliderVal = document.getElementById('inflation-val');

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    calculateAndGraph();
}

function addRow() {
    const container = document.getElementById('subs-list');
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="Subscription Name" class="sub-name">
        <input type="number" placeholder="Cost" class="sub-cost" min="0">
        <select class="sub-cycle">
            <option value="12">/ Month</option>
            <option value="1">/ Year</option>
        </select>
        <button class="btn-del" onclick="removeRow(this)">✕</button>
    `;
    container.appendChild(row);
    attachListeners();
    calculateAndGraph();
}

function removeRow(btn) {
    const rows = document.querySelectorAll('.input-row');
    if (rows.length > 1) {
        btn.parentElement.remove();
        calculateAndGraph();
    } else {
        btn.parentElement.querySelector('.sub-name').value = '';
        btn.parentElement.querySelector('.sub-cost').value = '';
        calculateAndGraph();
    }
}

function attachListeners() {
    document.querySelectorAll('.sub-cost, .sub-cycle').forEach(element => {
        element.removeEventListener('input', calculateAndGraph);
        element.addEventListener('input', calculateAndGraph);
    });
}

function calculateAndGraph() {
    const rows = document.querySelectorAll('.input-row');
    const inflationRate = parseFloat(slider.value) / 100;
    sliderVal.textContent = slider.value + '%';

    let baseYearlyTotal = 0;
    let baseMonthlyTotal = 0;

    rows.forEach(row => {
        const cost = parseFloat(row.querySelector('.sub-cost').value) || 0;
        const cycle = parseFloat(row.querySelector('.sub-cycle').value);
        
        if (cycle === 12) {
            baseMonthlyTotal += cost;
            baseYearlyTotal += (cost * 12);
        } else {
            baseMonthlyTotal += (cost / 12);
            baseYearlyTotal += cost;
        }
    });

    let cumulativeCosts = []; 
    let currentYearlyRate = baseYearlyTotal;
    let rollingTotal = 0;

    for (let month = 1; month <= 60; month++) {
        if (month > 1 && (month - 1) % 12 === 0) {
            currentYearlyRate *= (1 + inflationRate);
        }
        rollingTotal += (currentYearlyRate / 12);
        cumulativeCosts.push(rollingTotal);
    }

    document.getElementById('m-month').textContent = '£' + baseMonthlyTotal.toFixed(2);
    document.getElementById('m-year').textContent = '£' + baseYearlyTotal.toFixed(2);
    document.getElementById('m-3year').textContent = '£' + cumulativeCosts[35].toFixed(2);
    document.getElementById('m-5year').textContent = '£' + cumulativeCosts[59].toFixed(2);

    drawGraph(cumulativeCosts);
}

function drawGraph(dataPoints) {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, w, h);

    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const graphWidth = w - paddingLeft - paddingRight;
    const graphHeight = h - paddingTop - paddingBottom;

    const maxVal = Math.max(...dataPoints, 100) * 1.1;

    ctx.strokeStyle = '#2e2e35';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
        const x = paddingLeft + (i / 5) * graphWidth;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, h - paddingBottom);
        ctx.stroke();
        ctx.fillText('Yr ' + i, x, h - paddingBottom + 15);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (i / 4) * graphHeight;
        const val = maxVal - (i / 4) * maxVal;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
        ctx.fillText('£' + Math.round(val), paddingLeft - 8, y + 3);
    }

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    for (let i = 0; i < dataPoints.length; i++) {
        const x = paddingLeft + (i / 60) * graphWidth;
        const y = paddingTop + graphHeight - (dataPoints[i] / maxVal) * graphHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

window.addEventListener('resize', resizeCanvas);
slider.addEventListener('input', calculateAndGraph);

attachListeners();
resizeCanvas();