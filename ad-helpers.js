// Enhanced Ad System with comprehensive logging and failsafes
// Add this after saveAdCounts() function around line 2399

// Failsafe timeout tracker
let adBreakStartTime = null;
const AD_BREAK_TIMEOUT_MS = 120000; // 2 minutes max
let adFailsafeTimeout = null;

function resetAdCounts() {
    state.ads.videoPlayCounts = {};
    localStorage.removeItem('vhs_ad_counts');
    console.log("🔄 Ad counts reset");
}

// Add comprehensive state logging
function logPlayerState(event) {
    const states = { '-1': 'UNSTARTED', '0': 'ENDED', '1': 'PLAYING', '2': 'PAUSED', '3': 'BUFFERING', '5': 'CUED' };
    console.log(`📺 ${states[event.data] || event.data} | AdMode: ${state.ads.isPlayingAd} | Count: ${state.ads.playCountInBreak}/${state.ads.adsPerBreak}`);
}

// Force resume helper
function forceResumeContent() {
    console.warn("🔧 FORCE RESUME");
    state.ads.isPlayingAd = false;
    state.ads.seekingAd = false;

    if (adFailsafeTimeout) {
        clearTimeout(adFailsafeTimeout);
        adFailsafeTimeout = null;
    }

    const resume = state.ads.resumeState;
    if (resume && resume.listId) {
        state.ytPlayer.loadPlaylist({
            list: resume.listId,
            listType: 'playlist',
            index: resume.index || 0,
            startSeconds: 0
        });
    }
}

// Debug helpers (call from browser console)
window.debugAds = () => console.log({
    enabled: state.ads.enabled,
    adsPerBreak: state.ads.adsPerBreak,
    isPlayingAd: state.ads.isPlayingAd,
    playCountInBreak: state.ads.playCountInBreak,
    resumeState: state.ads.resumeState,
    trackedCount: Object.keys(state.ads.videoPlayCounts).length
});
window.resetAds = resetAdCounts;
window.forceResume = forceResumeContent;
