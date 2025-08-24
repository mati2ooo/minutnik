let timers = [];
const alarm = document.getElementById("alarmSound");
const volumeControl = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");

// Suwak głośności
volumeControl.addEventListener("input", () => {
    alarm.volume = volumeControl.value;
    volumeValue.textContent = String(Math.round(volumeControl.value * 100)).padStart(3, '0') + "%";
    saveTimers(); // Zapisuj głośność przy każdej zmianie
});

// Utility
function pad(num) { return num.toString().padStart(2,'0'); }

// Start / Stop / Reset / Add Time
function startTimer(index, fromInput = true) {
    const timer = timers[index];
    const container = document.getElementById(timer.elementId);

    // Jeśli timer już działa, nic nie rób
    if (timer.intervalId) return;

    // Jeśli uruchamiasz z przycisku, ustaw nowy timestamp
    if (fromInput) {
        const h = parseInt(container.querySelector(".hours").value) || 0;
        const m = parseInt(container.querySelector(".minutes").value) || 0;
        const s = parseInt(container.querySelector(".seconds").value) || 0;
        const totalSeconds = h * 3600 + m * 60 + s;
        if (totalSeconds > 0) {
            timer.finishTimestamp = Date.now() + totalSeconds * 1000;
        } else {
            // Jeśli nie ma czasu do ustawienia, a nie ma zapisanego, wyjdź
            if (!timer.finishTimestamp) return;
        }
    }

    timer.intervalId = setInterval(() => {
        const remaining = Math.round((timer.finishTimestamp - Date.now())/1000);
        if (remaining <= 0) {
            clearInterval(timer.intervalId);
            timer.intervalId = null;

            const endDate = new Date(timer.finishTimestamp);
            const container = document.getElementById(timer.elementId);
            container.querySelector(".time-display").textContent =
                `Skończył się o ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;
            timer.finishTimestamp = null;
            
            saveTimers(); // Zapisz po zakończeniu, aby usunąć timestamp

            alarm.pause();
            alarm.currentTime = 0;
            alarm.volume = volumeControl.value;
            alarm.play().catch(e => console.log("Autoplay blocked:", e));
            return;
        }
        updateDisplay(index, remaining);
        saveTimers(); // Zapisuj stan co sekundę
    }, 1000);

    updateDisplay(index);
    saveTimers(); // Zapisz po pierwszym uruchomieniu
}

function stopTimer(index) {
    const timer = timers[index];
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    updateDisplay(index);
    saveTimers(); // Zapisz po zatrzymaniu
}

function resetTimer(index) {
    const timer = timers[index];
    stopTimer(index);
    timer.finishTimestamp = null;
    updateDisplay(index);
    saveTimers(); // Zapisz po resecie
}

function addTime(index, seconds) {
    const timer = timers[index];
    if (!timer.finishTimestamp || timer.finishTimestamp <= Date.now()) {
        timer.finishTimestamp = Date.now();
    }
    timer.finishTimestamp += seconds*1000;
    if (!timer.intervalId) {
        startTimer(index, false); // startujemy bez brania danych z pól
    }
    updateDisplay(index);
    saveTimers(); // Zapisz po dodaniu czasu
}

function updateDisplay(index, remaining=null) {
    const timer = timers[index];
    const container = document.getElementById(timer.elementId);
    const display = container.querySelector(".time-display");

    if (remaining === null) {
        remaining = timer.finishTimestamp ? Math.round((timer.finishTimestamp - Date.now())/1000) : 0;
    }

    if (remaining <= 0) {
        display.textContent = timer.finishTimestamp ? 
            `Skończył się o ${pad(new Date(timer.finishTimestamp).getHours())}:${pad(new Date(timer.finishTimestamp).getMinutes())}:${pad(new Date(timer.finishTimestamp).getSeconds())}` :
            "00:00:00";
        return;
    }

    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    display.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Tytuł karty
function updatePageTitle() {
    let minRemaining = Infinity;
    timers.forEach(timer => {
        if (timer.finishTimestamp && timer.intervalId) { // Sprawdzaj, czy minutnik jest aktywny
            const remaining = Math.round((timer.finishTimestamp - Date.now())/1000);
            if (remaining>0 && remaining<minRemaining) minRemaining = remaining;
        }
    });
    if (minRemaining===Infinity) {
        document.title = "2Minutniki";
        return;
    }
    const h = Math.floor(minRemaining / 3600);
    const m = Math.floor((minRemaining % 3600)/60);
    const s = minRemaining % 60;
    document.title = h>0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
setInterval(updatePageTitle,1000);

function testAlarm() {
    alarm.currentTime=0;
    alarm.volume = volumeControl.value;
    alarm.play();
}

// Edycja nazw
function editName(element) {
    const current = element.textContent;
    const input = document.createElement("input");
    input.type="text";
    input.value=current;
    input.style.width="80%";
    element.replaceWith(input);
    input.focus();
    input.addEventListener("blur", ()=>finishEdit(input,current));
    input.addEventListener("keydown", e=>{if(e.key==="Enter") finishEdit(input,current)});
}
function finishEdit(input,current){
    const span=document.createElement("div");
    span.className="timer-name";
    const newName = input.value || current;
    span.textContent=newName;
    span.onclick=()=>editName(span);
    input.replaceWith(span);
    
    // Zapisz zmienioną nazwę w obiekcie timers
    const timerId = span.closest('.timer').id;
    const timerIndex = timers.findIndex(t => t.elementId === timerId);
    if(timerIndex > -1) {
        timers[timerIndex].name = newName;
    }
    saveTimers(); // Zapisz po zmianie nazwy
}

// Inicjalizacja: Wczytaj stan przy załadowaniu strony
document.addEventListener('DOMContentLoaded', loadTimers);
