# Retro Room Simulator

A web-based retro environment simulator. Load your own background, place a virtual TV screen, and mix ambient audio.

## Features

- **Custom Backgrounds**: Upload any video or image to serve as the room background.
- **Virtual TV**: 
  - **File Playback**: Upload local video files (MP4, WebM).
  - **YouTube**: Paste URLs to play videos or playlists.
  - **Channels**: Create custom curated channels JSON playlists.
- **Chroma Key / Manual Placement**: Place the TV content onto a green screen area in your background, or manually draw the position.
- **Audio Mixer**: Mix 4 tracks of ambient noise (Birds, Traffic, Lawnmower, Talking) + TV Volume. Supports custom MP3 uploads for each track.
- **Visual Effects**: 
  - **CRT Overlay**: Dynamic scanlines with intensity and scope control (Screen vs TV Only).
  - **TV Post-Process**: Adjust Brightness, Contrast, Saturation, Blur, Sepia, and Hue.
- **Save/Load**: Automatically saves your setup (files, positions, mixer, effects) to `config/default.json`.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Server**:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

3. **First Run**:
   - The screen will say "NO SIGNAL".
   - Click "UPLOAD ROOM SOURCE" or use the sidebar to upload a background image/video.
   - Click "START AUDIO" in the Audio Mixer to enable sound.

## Controls

### Remote Control (Right Panel)
- **Tabs**: Switch between `FILE`, `URL` (YouTube), and `CHANNELS`.
- **Playback**: Play/Pause, Next/Prev (YouTube), Eject.
- **Power**: Toggles the TV screen visibility.
- **Volume**: Controls TV volume independent of ambient noise.

### Sidebar (Left Panel)
- **Placement Method**: 
  - **Chroma Key**: Automatically replaces green/blue areas with the TV video. Adjust Threshold/Softness.
  - **Manual**: Check "MANUAL SELECTION" to drag/resize the TV screen box.
- **Visual Effects**: Toggle CRT effects and adjust TV image filters.
- **Audio Mixer**: Adjust levels for ambient sounds. Click the icons to toggle specific tracks on/off.

## Custom Channels
Create folders in `channels/` with a `channel.json` file:
```json
{
  "title": "My Channel",
  "url": "https://youtube.com/playlist?list=...",
  "img": "icon.png",  // place icon.png in the same folder
  "channel": 1        // Sort order
}
```

## Troubleshooting
- **Audio not working?** Modern browsers block auto-playing audio. You MUST click the "START AUDIO" button in the mixer panel once after loading the page.
- **Video low res?** The canvas automatically adapts to the resolution of your uploaded background media.
