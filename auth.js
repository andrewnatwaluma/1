// Voter Authentication Logic
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const voterNameInput = document.getElementById('voterName');
    const loginBtn = document.getElementById('loginBtn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('errorMessage');
    const voterDetailsDiv = document.getElementById('voterDetails');
    const proceedToLicenseBtn = document.getElementById('proceedToLicense');
    
    // Check if device has already voted
    checkVotingStatus();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await verifyVoter();
    });
    
    proceedToLicenseBtn.addEventListener('click', function() {
        // Store voter data in session storage for next page
        sessionStorage.setItem('voterData', JSON.stringify({
            name: document.getElementById('detailName').textContent,
            university: document.getElementById('detailUniversity').textContent,
            qualification: document.getElementById('detailQualification').textContent,
            nationality: document.getElementById('detailNationality').textContent,
            completionYear: document.getElementById('detailCompletionYear').textContent,
            internshipCenter: document.getElementById('detailInternshipCenter').textContent
        }));
        
        // Redirect to license upload page
        window.location.href = 'license-upload.html';
    });
    
    async function checkVotingStatus() {
        // Check device voting status
        if (hasDeviceVoted()) {
            window.location.href = 'already-voted.html';
            return;
        }
    }
    
    async function verifyVoter() {
        const voterName = voterNameInput.value.trim();
        
        if (!voterName) {
            showError('Please enter your full name');
            return;
        }
        
        showLoading(true);
        hideError();
        
        try {
            // Search for voter in database (case-insensitive, partial match)
            const { data: voters, error } = await supabase
                .from('voters')
                .select('*')
                .ilike('name', `%${voterName}%`);
            
            if (error) {
                throw error;
            }
            
            if (!voters || voters.length === 0) {
                showError('Voter not found. Please check your name and try again.');
                return;
            }
            
            if (voters.length > 1) {
                showError('Multiple voters found. Please enter your full name exactly as registered.');
                return;
            }
            
            const voter = voters[0];
            
            // Check if voter has already voted
            if (voter.has_voted) {
                window.location.href = 'already-voted.html';
                return;
            }
            
            // Display voter details
            displayVoterDetails(voter);
            
        } catch (error) {
            console.error('Authentication error:', error);
            showError('System error. Please try again later.');
        } finally {
            showLoading(false);
        }
    }
    
    function displayVoterDetails(voter) {
        document.getElementById('detailName').textContent = voter.name;
        document.getElementById('detailUniversity').textContent = voter.university || 'Not specified';
        document.getElementById('detailQualification').textContent = voter.qualification || 'Not specified';
        document.getElementById('detailNationality').textContent = voter.nationality || 'Not specified';
        document.getElementById('detailCompletionYear').textContent = voter.completion_year || 'Not specified';
        document.getElementById('detailInternshipCenter').textContent = voter.internship_center || 'Not specified';
        
        voterDetailsDiv.style.display = 'block';
        loginForm.style.display = 'none';
    }
    
    function showLoading(show) {
        loadingDiv.style.display = show ? 'block' : 'none';
        loginBtn.disabled = show;
    }
    
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    function hideError() {
        errorDiv.style.display = 'none';
    }
    
    // Device Tracking Functions
    function getDeviceId() {
        // Simple device fingerprint
        return btoa(navigator.userAgent + navigator.language + screen.width + screen.height);
    }
    
    function hasDeviceVoted() {
        const deviceId = getDeviceId();
        const votedDevices = JSON.parse(localStorage.getItem('fumi_voted_devices') || '{}');
        return !!votedDevices[deviceId];
    }
    
    function markDeviceAsVoted() {
        const deviceId = getDeviceId();
        const votedDevices = JSON.parse(localStorage.getItem('fumi_voted_devices') || '{}');
        votedDevices[deviceId] = new Date().toISOString();
        localStorage.setItem('fumi_voted_devices', JSON.stringify(votedDevices));
    }
});
