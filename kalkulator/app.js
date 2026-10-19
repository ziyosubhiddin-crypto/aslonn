/**
 * Zamonaviy Aqlli Kalkulyator - Logika va Interaktivlik
 */

// DOM Elementlari
const wrapper = document.querySelector('.calculator-wrapper');
const currentDisplay = document.getElementById('currentDisplay');
const expressionDisplay = document.getElementById('expressionDisplay');
const displayArea = document.getElementById('displayArea');
const copyTooltip = document.getElementById('copyTooltip');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const modeToggleBtn = document.getElementById('modeToggleBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyDrawer = document.getElementById('historyDrawer');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');

// Ichki holat (State)
let currentInput = '0';
let expression = '';
let isEvaluated = false;
let historyData = JSON.parse(localStorage.getItem('calc_history') || '[]');

// Web Audio API orqali nozik tugma chertish ovozi (Click Feedback)
let audioCtx = null;
function playSoftClick() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Brauzer ovoz cheklovlari bo'lsa xatosiz o'tib ketadi
  }
}

// Displeyni yangilash
function updateDisplay() {
  currentDisplay.textContent = formatNumber(currentInput);
  expressionDisplay.textContent = expression;

  // Matn uzunligiga qarab shriftni avtomatik kichraytirish
  const len = currentDisplay.textContent.length;
  if (len > 14) {
    currentDisplay.style.fontSize = '1.6rem';
  } else if (len > 9) {
    currentDisplay.style.fontSize = '2.1rem';
  } else {
    currentDisplay.style.fontSize = '2.6rem';
  }
}

// Raqamlarni chiroyli formatlash (masalan 1,000,000)
function formatNumber(str) {
  if (str === 'Xatolik' || str === 'Cheksizlik' || str === 'Nolga bo\'lib bo\'lmaydi') {
    return str;
  }
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// Raqam kiritish
function appendNumber(num) {
  if (isEvaluated) {
    currentInput = num;
    expression = '';
    isEvaluated = false;
  } else {
    if (currentInput === '0') {
      currentInput = num;
    } else {
      if (currentInput.replace(/[^0-9]/g, '').length < 16) {
        currentInput += num;
      }
    }
  }
  updateDisplay();
}

// Kasr nuqtasi kiritish
function appendDecimal() {
  if (isEvaluated) {
    currentInput = '0.';
    expression = '';
    isEvaluated = false;
  } else if (!currentInput.includes('.')) {
    currentInput += '.';
  }
  updateDisplay();
}

// Arifmetik operator kiritish (+, -, *, /, %, ^)
function appendOperator(op) {
  isEvaluated = false;
  let opSymbol = op;
  if (op === '*') opSymbol = '×';
  if (op === '/') opSymbol = '÷';

  if (expression !== '' && isOperator(expression.trim().slice(-1)) && currentInput === '0') {
    expression = expression.trim().slice(0, -1) + ' ' + opSymbol + ' ';
  } else {
    expression += currentInput + ' ' + opSymbol + ' ';
    currentInput = '0';
  }
  updateDisplay();
}

function isOperator(char) {
  return ['+', '-', '×', '÷', '*', '/', '%', '^'].includes(char);
}

// Qavslarni kiritish
function appendParen(paren) {
  if (paren === '(') {
    if (currentInput !== '0' && !isEvaluated) {
      expression += currentInput + ' × ( ';
    } else {
      expression += '( ';
    }
    currentInput = '0';
  } else {
    expression += currentInput + ' ) ';
    currentInput = '0';
  }
  updateDisplay();
}

// Bitta belgini o'chirish (Backspace)
function deleteLast() {
  if (isEvaluated) {
    currentInput = '0';
    expression = '';
    isEvaluated = false;
  } else {
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-') currentInput = '0';
    } else {
      currentInput = '0';
    }
  }
  updateDisplay();
}

// To'liq tozalash (AC)
function clearAll() {
  currentInput = '0';
  expression = '';
  isEvaluated = false;
  updateDisplay();
}

// Ishorani almashtirish (±)
function toggleSign() {
  if (currentInput !== '0') {
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }
}

// Doimiylar (π, e)
function appendConstant(name) {
  if (name === 'pi') {
    currentInput = Math.PI.toString();
  } else if (name === 'e') {
    currentInput = Math.E.toString();
  }
  isEvaluated = false;
  updateDisplay();
}

// Faktorial hisoblash
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Cheklov
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Ilmiy funksiyalarni bajarish
function applyScientific(func) {
  const num = parseFloat(currentInput);
  if (isNaN(num)) return;

  let result;
  let label = '';

  switch (func) {
    case 'sin':
      // Radian orqali
      result = Math.sin(num * Math.PI / 180);
      label = `sin(${num}°)`;
      break;
    case 'cos':
      result = Math.cos(num * Math.PI / 180);
      label = `cos(${num}°)`;
      break;
    case 'tan':
      if ((Math.abs(num) - 90) % 180 === 0) {
        result = NaN;
      } else {
        result = Math.tan(num * Math.PI / 180);
      }
      label = `tan(${num}°)`;
      break;
    case 'log':
      result = Math.log10(num);
      label = `log(${num})`;
      break;
    case 'ln':
      result = Math.log(num);
      label = `ln(${num})`;
      break;
    case 'sqrt':
      result = Math.sqrt(num);
      label = `√(${num})`;
      break;
    case 'square':
      result = Math.pow(num, 2);
      label = `sqr(${num})`;
      break;
    case 'fact':
      result = factorial(Math.floor(num));
      label = `${num}!`;
      break;
    case 'abs':
      result = Math.abs(num);
      label = `|${num}|`;
      break;
    case 'inv':
      result = num === 0 ? NaN : 1 / num;
      label = `1/(${num})`;
      break;
    default:
      return;
  }

  if (isNaN(result) || !isFinite(result)) {
    currentInput = 'Xatolik';
  } else {
    // 10 xonagacha aniqlikda yaxlitlash
    result = parseFloat(result.toFixed(10));
    saveHistory(`${label}`, result.toString());
    currentInput = result.toString();
  }
  expression = label + ' =';
  isEvaluated = true;
  updateDisplay();
}

// Ifodani xavfsiz va to'g'ri hisoblash
function calculate() {
  if (isEvaluated) return;

  let fullExpression = expression + currentInput;
  if (!fullExpression.trim()) return;

  // Formatni matematik hisoblash uchun tayyorlash
  let evalExpr = fullExpression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**');

  // Foiz hisoblash (% operatori)
  evalExpr = evalExpr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

  try {
    // Xavfsiz matematik tekshiruv: faqat raqamlar va ruxsat berilgan belgilar
    if (!/^[0-9+\-*/(). eE*^%]+$/.test(evalExpr)) {
      throw new Error('Noto\'g\'ri ifoda');
    }

    // Function constructor orqali hisoblash
    const calcFn = new Function(`return ${evalExpr};`);
    let result = calcFn();

    if (result === Infinity || result === -Infinity) {
      currentInput = 'Cheksizlik';
      expression = fullExpression + ' =';
    } else if (isNaN(result)) {
      currentInput = 'Xatolik';
      expression = fullExpression + ' =';
    } else {
      // 10 ta kasr raqamiga qadar yaxlitlash
      result = Math.round(result * 1e10) / 1e10;
      saveHistory(fullExpression, result.toString());
      expression = fullExpression + ' =';
      currentInput = result.toString();
    }
  } catch (err) {
    currentInput = 'Xatolik';
    expression = '';
  }

  isEvaluated = true;
  updateDisplay();
}

// Tarixni boshqarish
function saveHistory(expr, res) {
  const item = { expr, res, time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) };
  historyData.unshift(item);
  if (historyData.length > 30) historyData.pop();
  localStorage.setItem('calc_history', JSON.stringify(historyData));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  if (historyData.length === 0) {
    historyList.innerHTML = '<p class="history-empty">Hozircha tarix mavjud emas</p>';
    return;
  }

  historyData.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <span class="history-item-exp">${item.expr} =</span>
      <span class="history-item-res">${formatNumber(item.res)}</span>
    `;
    el.addEventListener('click', () => {
      currentInput = item.res;
      expression = '';
      isEvaluated = true;
      updateDisplay();
      historyDrawer.classList.remove('open');
      playSoftClick();
    });
    historyList.appendChild(el);
  });
}

// Nusxalash (Copy)
displayArea.addEventListener('click', () => {
  navigator.clipboard.writeText(currentInput).then(() => {
    copyTooltip.classList.add('show');
    setTimeout(() => copyTooltip.classList.remove('show'), 1500);
  }).catch(() => {});
});

// Tugmalarga hodisalarni ulash
document.querySelectorAll('.key').forEach(button => {
  button.addEventListener('click', () => {
    playSoftClick();
    const action = button.dataset.action;
    const val = button.dataset.val;

    switch (action) {
      case 'number':
        appendNumber(val);
        break;
      case 'decimal':
        appendDecimal();
        break;
      case 'operator':
        appendOperator(val);
        break;
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteLast();
        break;
      case 'calculate':
        calculate();
        break;
      case 'negate':
        toggleSign();
        break;
      case 'sci':
        applyScientific(val);
        break;
      case 'const':
        appendConstant(val);
        break;
      case 'paren':
        appendParen(val);
        break;
    }
  });
});

// Rejimni almashtirish (Standart / Ilmiy)
modeToggleBtn.addEventListener('click', () => {
  playSoftClick();
  wrapper.classList.toggle('scientific-active');
  const isSci = wrapper.classList.contains('scientific-active');
  modeToggleBtn.querySelector('.mode-text').textContent = isSci ? 'Standart' : 'Ilmiy';
});

// Mavzuni almashtirish (Dark / Light)
themeToggleBtn.addEventListener('click', () => {
  playSoftClick();
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('calc_theme', newTheme);
});

// Tarix tortmasi
historyToggleBtn.addEventListener('click', () => {
  playSoftClick();
  historyDrawer.classList.add('open');
  renderHistory();
});

closeHistoryBtn.addEventListener('click', () => {
  playSoftClick();
  historyDrawer.classList.remove('open');
});

clearHistoryBtn.addEventListener('click', () => {
  playSoftClick();
  historyData = [];
  localStorage.removeItem('calc_history');
  renderHistory();
});

// Klaviatura orqali boshqarish
window.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key >= '0' && key <= '9') {
    playSoftClick();
    appendNumber(key);
  } else if (key === '.') {
    playSoftClick();
    appendDecimal();
  } else if (['+', '-', '*', '/'].includes(key)) {
    playSoftClick();
    appendOperator(key);
  } else if (key === '%') {
    playSoftClick();
    appendOperator('%');
  } else if (key === '^') {
    playSoftClick();
    appendOperator('^');
  } else if (key === '(' || key === ')') {
    playSoftClick();
    appendParen(key);
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    playSoftClick();
    calculate();
  } else if (key === 'Backspace') {
    playSoftClick();
    deleteLast();
  } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    playSoftClick();
    clearAll();
  }
});

// Dasturni ishga tushirishda mavzuni yuklash
const savedTheme = localStorage.getItem('calc_theme');
if (savedTheme) {
  document.body.setAttribute('data-theme', savedTheme);
}
renderHistory();
updateDisplay();
