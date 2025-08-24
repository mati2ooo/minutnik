// Obsługa localStorage: zapisywanie i wczytywanie stanu minutników oraz głośności

function saveTimers() {
    const state = timers.map(timer => {
        const container = document.getElementById(timer.elementId);
        const name = container.querySelector(".timer-name").textContent;
        return {
            finishTimestamp: timer.finishTimestamp,
            name: name
        };
    });
    localStorage.setItem('timersState', JSON.stringify(state));
    localStorage.setItem('alarmVolume', volumeControl.value);
}

function loadTimers() {
    const savedState = localStorage.getItem('timersState');
    const savedVolume = localStorage.getItem('alarmVolume');

    // Inicjalizacja tablicy timers
    timers = [
        {intervalId: null, elementId: "timer1", finishTimestamp: null, name: "Minutnik 1"},
        {intervalId: null, elementId: "timer2", finishTimestamp: null, name: "Minutnik 2"},
        {intervalId: null, elementId: "timer3", finishTimestamp: null, name: "Minutnik 3"}
    ];
    
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        parsedState.forEach((t, i) => {
            if (timers[i]) {
                timers[i].finishTimestamp = t.finishTimestamp;
                timers[i].name = t.name;

                if (t.finishTimestamp > Date.now()) {
                    startTimer(i, false); // Wznów odliczanie z pamięci
                }
            }
        });
    }

    if (savedVolume !== null) {
        volumeControl.value = savedVolume;
        alarm.volume = volumeControl.value;
        volumeValue.textContent = String(Math.round(volumeControl.value * 100)).padStart(3, '0') + "%";
    }

    // Początkowe wyświetlenie dla wszystkich timerów
    timers.forEach((timer, index) => {
        const container = document.getElementById(timer.elementId);
        container.querySelector(".timer-name").textContent = timer.name;
        updateDisplay(index);
    });
}
