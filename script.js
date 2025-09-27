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
        
        // Add WhatsApp share button for all contacts
        const whatsappShareBtn = document.createElement('li');
        whatsappShareBtn.className = 'contact-item';
        whatsappShareBtn.innerHTML = `
            <button class="whatsapp-share-btn" id="whatsappShareAllBtn">
                <i class="fab fa-whatsapp"></i>
                Share Emergency Alert with All Contacts via WhatsApp
            </button>
        `;
        familyContactList.appendChild(whatsappShareBtn);
        
        // Add event listener to WhatsApp share button
        document.getElementById('whatsappShareAllBtn').addEventListener('click', shareEmergencyAlertWithAll);
        
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
                    <button class="call-button" data-action="call" data-number="${contact}">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="whatsapp-button" data-action="whatsapp" data-number="${contact}">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="call-button" data-action="delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            familyContactList.appendChild(contactItem);
        });
        
        // Add event listeners to the dynamically created buttons
        addContactButtonEventListeners();
    }
    
    // Function to add event listeners to contact buttons
    function addContactButtonEventListeners() {
        // Remove existing event listeners to avoid duplicates
        document.querySelectorAll('.call-button, .whatsapp-button').forEach(button => {
            button.removeEventListener('click', handleContactButtonClick);
        });
        
        // Add new event listeners
        document.querySelectorAll('.call-button, .whatsapp-button').forEach(button => {
            button.addEventListener('click', handleContactButtonClick);
        });
    }
    
    // Function to handle contact button clicks
    function handleContactButtonClick(event) {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop event from bubbling up
        
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');
        
        if (action === 'call') {
            const number = button.getAttribute('data-number');
            makeCall(number);
        } else if (action === 'whatsapp') {
            const number = button.getAttribute('data-number');
            shareWithContact(number);
        } else if (action === 'delete') {
            const index = parseInt(button.getAttribute('data-index'));
            removeFamilyContact(index);
        }
    }
    
    // Function to share emergency alert with a specific contact via WhatsApp
    function shareWithContact(number) {
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
        
        // Format number for WhatsApp
        const formattedNumber = formatPhoneNumberForWhatsApp(number);
        
        // Create WhatsApp URL with properly encoded message
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        showStatusMessage('WhatsApp opened with emergency alert', 'success');
    }
    
    // Function to share emergency alert with all contacts via WhatsApp
    function shareEmergencyAlertWithAll() {
        if (familyContacts.length === 0) {
            showStatusMessage('No emergency contacts available', 'error');
            return;
        }
        
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
        
        // Open WhatsApp with the first contact
        const firstContact = familyContacts[0];
        const formattedNumber = formatPhoneNumberForWhatsApp(firstContact);
        
        // Create WhatsApp URL with properly encoded message
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        showStatusMessage(`WhatsApp opened with emergency alert for ${familyContacts.length} contacts. Please forward to other contacts if needed.`, 'success');
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
        if (confirm('Are you sure you want to remove this emergency contact?')) {
            familyContacts.splice(index, 1);
            localStorage.setItem('familyContacts', JSON.stringify(familyContacts));
            loadFamilyContacts();
            showStatusMessage('Emergency contact removed', 'success');
        }
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
                prepareAndSendAlert();
            }, 2000);
        } else {
            prepareAndSendAlert();
        }
    }
    
    // Function to prepare and send alert
    function prepareAndSendAlert() {
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
        
        // Show sharing options
        showSharingOptions(message);
    }
    
    // Function to show sharing options
    function showSharingOptions(message) {
        // Create a modal or dialog for sharing options
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            width: 300px;
            text-align: center;
        `;
        
        modalContent.innerHTML = `
            <h3 style="margin-bottom: 15px;">Send Emergency Alert</h3>
            <p style="margin-bottom: 20px;">Choose how to send your emergency alert:</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="sendSMSBtn" class="update-location-btn" style="margin: 5px 0;">
                    <i class="fas fa-sms"></i> Send via SMS
                </button>
                <button id="sendWhatsAppBtn" class="update-location-btn" style="margin: 5px 0; background-color: #25D366; color: white;">
                    <i class="fab fa-whatsapp"></i> Send via WhatsApp
                </button>
                <button id="cancelBtn" class="update-location-btn" style="margin: 5px 0; background-color: #f44336; color: white;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('sendSMSBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            sendViaSMS(message);
        });
        
        document.getElementById('sendWhatsAppBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            sendViaWhatsApp(message);
        });
        
        document.getElementById('cancelBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            statusMessage.classList.remove('active');
        });
    }
    
    // Function to send via SMS
    function sendViaSMS(message) {
        if (familyContacts.length === 0) {
            showStatusMessage('No emergency contacts available', 'error');
            return;
        }
        
        // Send SMS to the first contact
        const contact = familyContacts[0];
        const formattedNumber = formatPhoneNumberForSMS(contact);
        
        // Create SMS URL with properly encoded message
        const smsUrl = `sms:${formattedNumber}?body=${encodeURIComponent(message)}`;
        
        // Open SMS
    window.open(smsUrl, '_self');
        
        showStatusMessage('SMS app opened with emergency alert', 'success');
    }
    
    // Function to send via WhatsApp
    function sendViaWhatsApp(message) {
        if (familyContacts.length === 0) {
            showStatusMessage('No emergency contacts available', 'error');
            return;
        }
        
        // Send WhatsApp message to the first contact
        const contact = familyContacts[0];
        const formattedNumber = formatPhoneNumberForWhatsApp(contact);
        
        // Create WhatsApp URL with properly encoded message
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        showStatusMessage('WhatsApp opened with emergency alert', 'success');
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
    
    // Function to format phone number for WhatsApp
    function formatPhoneNumberForWhatsApp(number) {
        // For WhatsApp, we need the number in international format without the +
        if (number.length === 10) {
            return `91${number}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return number;
            } else if (number.length > 10 && number.startsWith('0')) {
            return `91${number.substring(1)}`;
        }
        return number;
    }
        // Function to make a call
    function makeCall(number) {
        // Format the number for tel: protocol
        let formattedNumber = number;
        
        // For emergency services, use the number as is
        if (['112', '100', '108', '102', '101', '1091', '1098'].includes(number)) {
            formattedNumber = number;
        } 
        // For regular numbers, add country code if needed
        else if (number.length === 10) {
            formattedNumber = `+91${number}`;
        } else if (number.length > 10 && !number.startsWith('+')) {
            if (number.startsWith('91')) {
                formattedNumber = `+${number}`;
            } else if (number.startsWith('0')) {
                formattedNumber = `+91${number.substring(1)}`;
            }
        }
        
        // Open dialer
        window.open(`tel:${formattedNumber}`, '_self');
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
    
    // Global function for emergency service calls (to handle inline onclick)
    window.makeCall = makeCall;
});
