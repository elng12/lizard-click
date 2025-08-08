# Audio Setup Instructions

## Required Audio File

To make the lizard click sound work exactly like the reference website, you need to add a `lizard.wav` file to the project root directory.

## How to Get the Audio File

### Option 1: Download from Reference Website
1. Visit the reference website
2. Open browser developer tools (F12)
3. Go to Network tab
4. Click the lizard button
5. Look for `lizard.wav` in the network requests
6. Right-click and save the file
7. Place it in your project root directory

### Option 2: Create Your Own
1. Record or find a "Lizard" sound effect
2. Convert it to WAV format
3. Name it `lizard.wav`
4. Place it in the project root directory

### Option 3: Use Text-to-Speech Tool
1. Use any online TTS tool to generate "Lizard" audio
2. Download as WAV format
3. Name it `lizard.wav`
4. Place it in the project root directory

## File Structure
```
project-root/
├── index.html
├── styles.css
├── script.js
├── lizard.wav  ← Add this file here
└── README.md
```

## Testing
Once you add the `lizard.wav` file:
1. Open the website
2. Click the lizard button
3. You should hear the "Lizard" sound
4. Use the test button to verify audio works
5. Check browser console for audio system status

## Troubleshooting
- Make sure the file is named exactly `lizard.wav`
- Ensure the file is in the project root directory
- Check browser console for error messages
- Try different browsers if audio doesn't work
- Make sure your device volume is turned up