// Voting Logic for 12 Positions
document.addEventListener('DOMContentLoaded', function() {
    const positionsContainer = document.getElementById('positionsContainer');
    const submitVoteBtn = document.getElementById('submitVote');
    const progressText = document.getElementById('progressText');
    const currentVoterName = document.getElementById('currentVoterName');
    const loadingDiv = document.getElementById('loading');
    
    const positionsOrder = [
        'PRESIDENT',
        'VICE PRESIDENT', 
        'SECRETARY GENERAL',
        'TREASURER GENERAL',
        'CHAIRPERSON WELFARE',
        'CHAIRPERSON ETHICS AND PROFESSIONALISM',
        'DIRECTOR OF PUBLICATIONS',
        'INTERN DOCTORS\' REPRESENTATIVE',
        'INTERN PHARMACISTS\' REPRESENTATIVE',
        'INTERN MIDWIVES\' REPRESENTATIVE',
        'INTERN NURSE REPRESENTATIVE',
        'INTERN DENTAL SURGEON REPRESENTATIVE'
    ];
    
    let selectedCandidates = {};
    let voterData = {};
    
    // Initialize voting page
    initVotingPage();
    
    async function initVotingPage() {
        // Check voting status
        await checkVotingStatus();
        
        // Load voter data
        voterData = JSON.parse(sessionStorage.getItem('voterData') || '{}');
        currentVoterName.textContent = voterData.name || 'Unknown Voter';
        
        // Load candidates
        await loadCandidates();
        
        // Update progress
        updateProgress();
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
    
    async function loadCandidates() {
        loadingDiv.style.display = 'block';
        
        try {
            const { data: candidates, error } = await supabase
                .from('candidates')
                .select('*')
                .order('position');
            
            if (error) throw error;
            
            displayCandidatesByPosition(candidates);
            
        } catch (error) {
            console.error('Error loading candidates:', error);
            positionsContainer.innerHTML = '<p class="error">Error loading ballot. Please refresh the page.</p>';
        } finally {
            loadingDiv.style.display = 'none';
        }
    }
    
    function displayCandidatesByPosition(candidates) {
        positionsContainer.innerHTML = '';
        
        positionsOrder.forEach((positionTitle, index) => {
            const positionCandidates = candidates.filter(candidate => 
                candidate.position === `Candidate for ${positionTitle}`
            );
            
            if (positionCandidates.length > 0) {
                const positionElement = createPositionElement(positionTitle, positionCandidates, index + 1);
                positionsContainer.appendChild(positionElement);
            }
        });
    }
    
    function createPositionElement(positionTitle, candidates, positionNumber) {
        const positionDiv = document.createElement('div');
        positionDiv.className = 'position-section';
        positionDiv.innerHTML = `
            <h3>${positionNumber}. ${positionTitle}</h3>
            <div class="candidates-list" id="position-${positionTitle.replace(/\s+/g, '-')}">
                ${candidates.map(candidate => `
                    <div class="candidate-option">
                        <label>
                            <input type="radio" name="${positionTitle}" value="${candidate.id}" 
                                   data-position="${positionTitle}">
                            <span class="candidate-name">${candidate.name}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners to radio buttons
        const radioButtons = positionDiv.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                selectedCandidates[this.dataset.position] = this.value;
                updateProgress();
            });
        });
        
        return positionDiv;
    }
    
    function updateProgress() {
        const completed = Object.keys(selectedCandidates).length;
        const total = positionsOrder.length;
        progressText.textContent = `${completed}/${total} positions completed`;
        
        submitVoteBtn.disabled = completed !== total;
    }
    
    submitVoteBtn.addEventListener('click', async function() {
        await submitVote();
    });
    
    async function submitVote() {
        const deviceId = getDeviceId();
        
        // Validate all positions are voted
        if (Object.keys(selectedCandidates).length !== positionsOrder.length) {
            alert('Please vote for all positions before submitting.');
            return;
        }
        
        submitVoteBtn.textContent = 'Submitting Vote...';
        submitVoteBtn.disabled = true;
        
        try {
            // Record device vote first
            const { error: deviceError } = await supabase
                .from('device_votes')
                .insert([{ device_id: deviceId }]);
                
            if (deviceError) throw deviceError;
            
            // Get voter ID
            const { data: voter } = await supabase
                .from('voters')
                .select('id')
                .ilike('name', `%${voterData.name}%`)
                .single();
                
            if (!voter) throw new Error('Voter not found');
            
            // Prepare votes for all positions
            const votePromises = positionsOrder.map(async (positionTitle) => {
                const candidateId = selectedCandidates[positionTitle];
                
                // Get position ID
                const { data: position } = await supabase
                    .from('positions')
                    .select('id')
                    .ilike('title', `%${positionTitle}%`)
                    .single();
                    
                return supabase
                    .from('votes')
                    .insert([{
                        voter_id: voter.id,
                        candidate_id: candidateId,
                        position_id: position.id,
                        position: positionTitle,
                        device_id: deviceId
                    }]);
            });
            
            // Submit all votes
            await Promise.all(votePromises);
            
            // Mark voter as voted
            await supabase
                .from('voters')
                .update({ has_voted: true })
                .eq('id', voter.id);
            
            // Redirect to thank you page
            window.location.href = 'thank-you.html';
            
        } catch (error) {
            console.error('Vote submission error:', error);
            alert('Error submitting vote. Please try again.');
            submitVoteBtn.textContent = 'Submit Your Vote';
            submitVoteBtn.disabled = false;
        }
    }
    
    function getDeviceId() {
        return btoa(navigator.userAgent + navigator.language + screen.width + screen.height);
    }
});
