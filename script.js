document.addEventListener('DOMContentLoaded', function() {
    const sosButton = document.getElementById('sosButton');
    const statusMessage = document.getElementById('statusMessage');
    const locationText = document.getElementById('locationText');
    const updateLocationBtn = document.getElementById('updateLocationBtn');
    const soundToggle = document.getElementById('soundToggle');
    const familyContactInput = document.getElementById('familyContactInput');
    const addContactBtn = document.getElementById('addContactBtn');
    const familyContactList = document.getElementById('familyContactList');
    const ipText = document.getElementById('ipText');
    const batteryText = document.getElementById('batteryText');
    const timeText = document.getElementById('timeText');
    
    let soundEnabled = true;
    let userLocation = null;
    let userIP = null;
    let userBattery = null;
    let familyContacts = JSON.parse(localStorage.getItem('familyContacts')) || [];
    
    // Load saved family contacts
    loadFamilyContacts();
    
    // Get user's location, IP, battery info and time on page load
    getLocation();
    getIP();
    getBatteryInfo();
    updateTime();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // SOS button click event
    sosButton.addEventListener('click', function() {
        sendSOSAlert();
        if (soundEnabled) {
            playSOSSound();
        }
    });
    
    // Sound toggle click event
    soundToggle.addEventListener('click', function() {
        toggleSound();
    });
    
    // Add contact button click event
    addContactBtn.addEventListener('click', function() {
        addFamilyContact();
    });
    
    // Enter key in contact input
    familyContactInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addFamilyContact();
        }
    });
    
    // Update location button click event
    updateLocationBtn.addEventListener('click', function() {
        getLocation();
        getIP();
        getBatteryInfo();
    });
    
    // Function to load family contacts from localStorage
    function loadFamilyContacts() {
        familyContactList.innerHTML = '';
        
        if (familyContacts.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'contact-item';
            emptyMessage.innerHTML = `
                <div class="contact-info">
                    <div class="contact-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div>
                        <div class="contact-name">No emergency contacts added</div>
                        <div class="contact-number">Add a contact above</div>
                    </div>
                </div>
            `;
            familyContactList.appendChild(emptyMessage);
            return;
        }
        
        familyContacts.forEach((contact, index) => {
            const contactItem = document.createElement('li');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <div class="contact-info">
                    <div class="contact-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="contact-name">Emergency Contact ${index + 1}</div>
                        <div class="contact-number">${formatPhoneNumber(contact)}</div>
                    </div>
                </div>
                <div>
                    <button class="call-button" onclick="makeCall('${contact}')" style="margin-right: 5px;">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="call-button" onclick="removeFamilyContact(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            familyContactList.appendChild(contactItem);
        });
    }
    
    // Function to add family contact
    function addFamilyContact() {
        const contactNumber = familyContactInput.value.trim();
        
        if (!contactNumber) {
            showStatusMessage('Please enter a contact number', 'error');
            return;
        }
        
        // Clean the phone number (remove non-digit characters)
        const cleanNumber = contactNumber.replace(/\D/g, '');
        
        // Validate phone number (simple validation for Indian numbers)
        if (cleanNumber.length < 10) {
            showStatusMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Check if contact already exists
        if (familyContacts.includes(cleanNumber)) {
            showStatusMessage('This contact already exists', 'error');
            return;
        }
        
        // Add to contacts array
        familyContacts.push(cleanNumber);
        
        // Save to localStorage
        localStorage.setItem('familyContacts', JSON.stringify(familyContacts));
        
        // Clear input
        familyContactInput.value = '';
        
        // Reload contacts
        loadFamilyContacts();
        
        showStatusMessage('Emergency contact added successfully', 'success');
    }
    
    // Function to remove family contact
    function removeFamilyContact(index) {
        familyContacts.splice(index, 1);
        localStorage.setItem('familyContacts', JSON.stringify(familyContacts));
        loadFamilyContacts();
        showStatusMessage('Emergency contact removed', 'success');
    }
    
    // Function to format phone number for display
    function formatPhoneNumber(number) {
        if (number.length === 10) {
            return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return `+${number.substring(0, 2)} ${number.substring(2, 7)} ${number.substring(7)}`;
        } else if (number.length > 10 && number.startsWith('0')) {
            return `+91 ${number.substring(1, 6)} ${number.substring(6)}`;
        }
        return number;
    }
    
    // Function to get user's location
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            locationText.textContent = "Geolocation is not supported by this browser.";
        }
    }
    
    // Function to show position
    function showPosition(position) {
        userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
        };
        locationText.textContent = `Lat: ${userLocation.lat.toFixed(6)}, Lon: ${userLocation.lon.toFixed(6)} (Accuracy: ${Math.round(userLocation.accuracy)}m)`;
    }
    
    // Function to handle geolocation errors
    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                locationText.textContent = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                locationText.textContent = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                locationText.textContent = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                locationText.textContent = "An unknown error occurred.";
                break;
        }
    }
    
    // Function to get IP address
    async function getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            userIP = data.ip;
            ipText.textContent = `IP Address: ${userIP}`;
        } catch (error) {
            userIP = "Unable to fetch";
            ipText.textContent = "IP Address: Unable to fetch";
        }
    }
    
    // Function to get battery information
    function getBatteryInfo() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function(battery) {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? 'Charging' : 'Not charging';
                userBattery = `${level}% (${charging})`;
                batteryText.textContent = `Battery: ${userBattery}`;
            });
        } else {
            // Fallback for browsers that don't support the Battery API
            userBattery = "Status not available";
            batteryText.textContent = "Battery: Status not available";
        }
    }
    
    // Function to update current time
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        timeText.textContent = timeString;
    }
    
    // Function to send SOS alert
    function sendSOSAlert() {
        // Show status message
        statusMessage.textContent = "Preparing emergency alert...";
        statusMessage.classList.remove('success', 'error');
        statusMessage.classList.add('active');
        
        // Check if we have emergency contacts
        if (familyContacts.length === 0) {
            statusMessage.textContent = "No emergency contacts added. Please add contacts first.";
            statusMessage.classList.add('error');
            return;
        }
        
        // Check if we have location data
        if (!userLocation) {
            statusMessage.textContent = "Getting your location for the alert...";
            getLocation();
            
            // Wait a bit for location, then proceed even if we don't get it
            setTimeout(() => {
                prepareAndSendSMS();
            }, 2000);
        } else {
            prepareAndSendSMS();
        }
    }
    
    // Function to prepare and send SMS
    function prepareAndSendSMS() {
        // Get current time for the message
        const now = new Date();
        const currentTimeString = now.toLocaleString('en-IN');
        
        // Prepare location information
        let locationInfo = "Location: Unable to determine";
        let mapLink = "";
        
        if (userLocation) {
            locationInfo = `Latitude: ${userLocation.lat}\nLongitude: ${userLocation.lon}\nAccuracy: ${Math.round(userLocation.accuracy)}m`;
            mapLink = `\n\nMap: https://maps.google.com/?q=${userLocation.lat},${userLocation.lon}`;
        }
        
        // Create message with all available information
        const message = `EMERGENCY SOS ALERT!\n\nI need help! This is an emergency alert.\n\nMy Location:\n${locationInfo}${mapLink}\n\nTime: ${currentTimeString}\nBattery: ${userBattery || "Status not available"}\nIP: ${userIP || "Unable to fetch"}`;
        
        // Send SMS to all family contacts (one at a time)
        if (familyContacts.length > 0) {
            // Start with the first contact
            sendSMSToContact(0, message);
        }
    }
    
    // Function to send SMS to a specific contact
    function sendSMSToContact(index, message) {
        if (index >= familyContacts.length) {
            // All messages have been prepared
            statusMessage.textContent = "Emergency alert prepared! Please send the SMS messages.";
            statusMessage.classList.add('success');
            return;
        }
        
        const contact = familyContacts[index];
        const formattedNumber = formatPhoneNumberForSMS(contact);
        
        // Create SMS URL with properly encoded message
        const smsUrl = `sms:${formattedNumber}?body=${encodeURIComponent(message)}`;
        
        // Open SMS app
        window.open(smsUrl, '_self');
        
        // Show status message for this contact
        statusMessage.textContent = `Preparing SMS for contact ${index + 1} of ${familyContacts.length}...`;
        
        // Note: In a real application, we would wait for confirmation that the SMS was sent
        // before moving to the next contact. However, due to browser limitations,
        // we can't automatically detect when an SMS is sent.
        // For this demo, we'll just prepare one SMS at a time.
    }
    
    // Function to format phone number for SMS
    function formatPhoneNumberForSMS(number) {
        if (number.length === 10) {
            return `+91${number}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return `+${number}`;
        } else if (number.length > 10 && number.startsWith('0')) {
            return `+91${number.substring(1)}`;
        }
        return number;
    }
    
    // Function to make a call
    function makeCall(number) {
        window.open(`tel:${number}`, '_self');
    }
    
    // Function to toggle sound on/off
    function toggleSound() {
        soundEnabled = !soundEnabled;
        
        if (soundEnabled) {
            soundToggle.classList.add('active');
            soundToggle.innerHTML = '<i class="fas fa-volume-up"></i> Sound ON';
        } else {
            soundToggle.classList.remove('active');
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i> Sound OFF';
        }
    }
    
    // Function to play SOS sound
    function playSOSSound() {
        // Create an audio context for generating SOS beep pattern
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800; // Frequency in Hz
        
        gainNode.gain.value = 0.3; // Volume
        
        // SOS pattern: ... --- ... (three short, three long, three short)
        const shortBeepDuration = 0.2; // seconds
        const longBeepDuration = 0.6; // seconds
        const beepInterval = 0.3; // seconds between beeps
        
        let currentTime = audioContext.currentTime;
        
        // Three short beeps
        for (let i = 0; i < 3; i++) {
            oscillator.start(currentTime);
            oscillator.stop(currentTime + shortBeepDuration);
            currentTime += shortBeepDuration + beepInterval;
        }
        
        // Three long beeps
        currentTime += beepInterval; // Extra pause between groups
        for (let i = 0; i < 3; i++) {
            oscillator.start(currentTime);
            oscillator.stop(currentTime + longBeepDuration);
            currentTime += longBeepDuration + beepInterval;
        }
        
        // Three short beeps
        currentTime += beepInterval; // Extra pause between groups
        for (let i = 0; i < 3; i++) {
            oscillator.start(currentTime);
            oscillator.stop(currentTime + shortBeepDuration);
            currentTime += shortBeepDuration + beepInterval;
        }
    }
    
    // Function to show status message
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('success', 'error');
        statusMessage.classList.add('active');
        
        if (type === 'success') {
            statusMessage.classList.add('success');
        } else if (type === 'error') {
            statusMessage.classList.add('error');
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusMessage.classList.remove('active');
        }, 3000);
    }
});
