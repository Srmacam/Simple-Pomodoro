// Variables
let bTimerPlaying = false;  // Track state of pause/play button
let bWorkSession  = true;

let activeFrame = "StartFrame";
let activeTime  = 0;
let breakTime   = 0;
let ogBreakTime = 0;
let ogWorkTime  = 0;
let numSessions = 0;
var timerID     = undefined;;
let workTime    = 0;
let enableVisual = false;
let enableAudio = false;

const audioContext = new AudioContext();

// TODO: Encapusule audio creation to its own function and execute onLoad
const jingleElem1 = document.getElementById("Jingle1");
const jingleElem2 = document.getElementById("Jingle2");

const jingle1 = audioContext.createMediaElementSource(jingleElem1);
const jingle2 = audioContext.createMediaElementSource(jingleElem2);

const gainJingle1 = audioContext.createGain();
const gainJingle2 = audioContext.createGain();

jingle1.connect(gainJingle1).connect(audioContext.destination);
jingle2.connect(gainJingle2).connect(audioContext.destination);

gainJingle1.gain.value = 0.075;
gainJingle2.gain.value = 0.075;

// Start a timer 
function StartTimer() {
    // If a timer is active, force stop it
    if(timerID != undefined) {
        StopTimer();
    }
    
    bTimerPlaying = true;
    if(bWorkSession) {
        activeTime = ogWorkTime;
    }
    else { 
        activeTime = ogBreakTime;
    }
    
    // Set the timed callback
    timerID = window.setInterval(UpdateTimer, 1000);
    
    // Update UI elements
    UpdateTimerDisplay();
    UpdateTimerStyle();
    UpdatePausePlayButton();
}

// Stop the current timer 
function StopTimer() {
    bTimerPlaying = false;
    window.clearInterval(timerID);
    
    // Clear the ID
    timerID = undefined;
}

// Helper function to transition between states
function TransitionFrame(frame)
{
    let prevFrame = document.getElementById(activeFrame);
    prevFrame.style.visibility = "collapse";
    
    let nextFrame = document.getElementById(frame);
    nextFrame.style.visibility = "visible";
    
    activeFrame = frame;
}

// Toggle pause/play for the timer
function UpdatePausePlayButton() {
    let btn = document.getElementById("PausePlayButton");
    
    if(bTimerPlaying) {
        // Display pause button
        btn.innerHTML = "<img class=\"playback-button\" src=\"assets/icons/pause_icon.png\">"
        btn.style.backgroundColor = "#e9c46a";
    }
    else {
        // Display play button
        btn.innerHTML = "<img class=\"playback-button\" src=\"assets/icons/play_icon.png\">"
        btn.style.backgroundColor = "#00a896";
    }
}

// Update the pomodoro timer
function UpdateTimer() {
    if(bTimerPlaying) {
        // XXX: Decrementing time
        // Set this to a higher value (ex. 30) when debugging.
        // Set this to 1 in final version.
        activeTime  -= 30;
        let notifTitle = "Pomodoro Timer"
        
        // Timer ran to completion
        if(activeTime <= 0) {
            StopTimer();
            
            if(bWorkSession)
                numSessions -= 1;
            
            if(numSessions <= 0) {
                // Move to the alarm frame
                TransitionFrame("AlarmFrame");
                // Play the appropriate jingle
                if (enableAudio) jingleElem2.play();
            }
            else {
                // Toggle between work session and break session
                bWorkSession = !bWorkSession;
                
                // Move to the break frame
                TransitionFrame("BreakFrame");
                // Play the appropriate jingle
                if (enableAudio) jingleElem1.play();
                // Display desktop notification
                if (Notification.permission == 'granted') {
                    let notifBody = bWorkSession ? "break" : "work";
                    var notification = new Notification(notifTitle, { body: "Your " + notifBody + " session has finished." });
                }
            }
        }
    }
    
    // update the display
    UpdateTimerDisplay();
}

// Helper to update the display of the timer
function UpdateTimerDisplay() {
    let seconds = `${activeTime % 60}`;
    document.getElementById("TimeClock").innerHTML = 
        Math.floor(activeTime/60) + ":" + seconds.padStart(2, '0');
}

function UpdateTimerStyle() {
    let mainElem  = document.getElementById("MainContainer");
    let timerLabelElem = document.getElementById("TimeLabel");
    
    if(bWorkSession) {
        mainElem.style.background = "#e76f51";
        timerLabelElem.innerText = "Work";
    }
    else {
        mainElem.style.background = "#eae2b7";
        timerLabelElem.innerText = "Break";
    }
}

function checkPromiseSupport() {
    try {
      Notification.requestPermission().then();
      return true;
    } catch(e) { 
        return false; 
    }
}

function askPermission() {
    if (!('Notification' in window)) {
        console.log("Notifications are not supported for this browser.");
    }
    else {
        if (checkPromiseSupport()) {
            Notification.requestPermission()
            .then((permission) => {
                Notification.permission = permission;
            })
        }
        else {
            Notification.requestPermission(function(permission) {
                Notification.permission = permission;
            });
        }
    }
}

// Changes color and text of visual notification setting button
function changeNotifButton() {
    let notifButton = document.getElementById("EnableNotifButton");
    notifButton.innerHTML = "Notifications enabled";
    notifButton.style.backgroundColor = "rgb(16, 175, 2)"; 
}

// Callback function return to settings menu from timer frame
BackToSettingsButton.addEventListener('click', (e) => {
    StopTimer();
    TransitionFrame("SettingsFrame");
});

// Callback function to start the timer
BeginButton.addEventListener('click', (e) => {
    workTime    = document.getElementById("WorkTime").value  * 60;
    breakTime   = document.getElementById("BreakTime").value * 60;
    numSessions = document.getElementById("NumSessions").value;
    
    // Copy the work & break times to another variable
    ogWorkTime  = workTime;
    ogBreakTime = breakTime;
    
    // Validate form input
    if (isNaN(workTime) || isNaN(breakTime) || isNaN(numSessions) || 
    workTime < 1 || breakTime < 1 || numSessions < 1) {
        alert("Please use only positive integers.");
    }
    else {
        // Transition the frame
        TransitionFrame("TimerFrame");
        
        // Signal to start the timer
        StartTimer();
    }
});

// Callback function to stop the timer
PausePlayButton.addEventListener('click', (e) => {
    // Toggle the pause/play button
    bTimerPlaying = !bTimerPlaying;
    
    UpdatePausePlayButton();
});

// Callback function to reset the timer
ResetTimerButton.addEventListener('click', (e) => {
    // Reset the timer
    if(bWorkSession) {
        activeTime = ogWorkTime;
    }
    else {
        activeTime = ogBreakTime;
    }
    
    // Update the display immediately
    UpdateTimerDisplay();
});

// Callback function to start the app
StartButton.addEventListener('click', (e) => {
    TransitionFrame("SettingsFrame");
    if (Notification.permission == 'granted') {
        changeNotifButton();
    }
});

// Callback function to stop the break alarm
StopBreakAlarmButton.addEventListener('click', (e) => {
    TransitionFrame("TimerFrame");
    StartTimer();
});

// Callback function to stop the alarm
StopAlarmButton.addEventListener('click', (e) => {
    TransitionFrame("StartFrame");
});

// Callback function to enable push notifications
EnableNotifButton.addEventListener('click', (e) => {
    if (Notification.permission != 'granted') {
        askPermission();
        if (Notification.permission == 'granted') {
            changeNotifButton();
        }
    }
});

EnableAudioButton.addEventListener('click', (e) => {
    console.log("test");
    enableAudio = !(enableAudio);
    let audioButton = document.getElementById("EnableAudioButton");
    if (enableAudio) {
        audioButton.innerHTML = "Disable Audio";
    }
    else {
        audioButton.innerHTML = "Enable Audio";
    }
});