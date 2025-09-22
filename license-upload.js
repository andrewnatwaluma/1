// Provisional License Upload (Cosmetic - No actual storage)
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const licenseUpload = document.getElementById('licenseUpload');
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const retakeBtn = document.getElementById('retakeBtn');
    const proceedToVoteBtn = document.getElementById('proceedToVoteBtn');
    const voterSummary = document.getElementById('voterSummary');
    
    // Load voter data from previous page
    const voterData = JSON.parse(sessionStorage.getItem('voterData') || '{}');
    displayVoterSummary(voterData);
    
    // Check if voter has already voted
    checkVotingStatus();
    
    uploadBtn.addEventListener('click', function() {
        licenseUpload.click();
    });
    
    licenseUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            previewImage(file);
        }
    });
    
    retakeBtn.addEventListener('click', function() {
        previewSection.style.display = 'none';
        uploadArea.style.display = 'block';
        licenseUpload.value = '';
    });
    
    proceedToVoteBtn.addEventListener('click', function() {
        // Simulate verification process (cosmetic only)
        simulateVerification();
    });
    
    function displayVoterSummary(voter) {
        voterSummary.innerHTML = `
            <div class="detail-item">
                <label>Name:</label>
                <span>${voter.name || 'Not available'}</span>
            </div>
            <div class="detail-item">
                <label>University:</label>
                <span>${voter.university || 'Not available'}</span>
            </div>
            <div class="detail-item">
                <label>Internship Center:</label>
                <span>${voter.internshipCenter || 'Not available'}</span>
            </div>
        `;
    }
    
    function previewImage(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="License preview" style="max-width: 300px; max-height: 200px; border-radius: 8px;">`;
                uploadArea.style.display = 'none';
                previewSection.style.display = 'block';
            };
            
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file.');
        }
    }
    
    function simulateVerification() {
        // Show loading state
        proceedToVoteBtn.textContent = 'Verifying...';
        proceedToVoteBtn.disabled = true;
        
        // Simulate verification delay (2 seconds)
        setTimeout(function() {
            // Redirect to voting page
            window.location.href = 'vote.html';
        }, 2000);
    }
    
    async function checkVotingStatus() {
        const deviceId = getDeviceId();
        const { data: deviceVote } = await supabase
            .from('device_votes')
            .select('*')
            .eq('device_id', deviceId)
            .single();
            
        if (deviceVote) {
            window.location.href = 'already-voted.html';
            return;
        }
        
        // Check if current voter has voted
        if (voterData.name) {
            const { data: voter } = await supabase
                .from('voters')
                .select('has_voted')
                .ilike('name', `%${voterData.name}%`)
                .single();
                
            if (voter && voter.has_voted) {
                window.location.href = 'already-voted.html';
                return;
            }
        }
    }
    
    function getDeviceId() {
        return btoa(navigator.userAgent + navigator.language + screen.width + screen.height);
    }
});
