# Joota Fit

A lightweight web application that recommends the correct shoe size and width (Normal or Wide) using image analysis and user feedback.

## Features

- **Simple Flow**: Select gender → Enter UK size → Upload/take photo → Tap comfort zones → Get recommendation
- **Image Analysis**: Automatically extracts foot shape ratios from photos (no measurement card needed)
- **Comfort Mapping**: Interactive foot map to indicate tight/loose areas
- **Smart Recommendations**: Size and width recommendations based on foot shape DNA and comfort feedback
- **Mobile & Desktop**: Fully responsive design with camera support for mobile devices

## How It Works

1. **Gender Selection**: User selects their gender
2. **Size Input**: User enters their usual UK shoe size (including half sizes)
3. **Photo Upload**: User uploads or takes a top-down photo of their foot
4. **Image Analysis**: The app automatically calculates four key "foot shape DNA" ratios:
   - Forefoot width ratio (forefoot width ÷ foot length)
   - Toe taper index (little toe length ÷ big toe length)
   - Midfoot width ratio (midfoot width ÷ forefoot width)
   - Heel width ratio (heel width ÷ forefoot width)
5. **Comfort Mapping**: User taps zones on a foot illustration to indicate where shoes feel tight or loose
6. **Recommendation**: The system provides a recommended UK size and width (Normal/Wide) with an explanation

## Size Recommendation Logic

The app uses deterministic rules to adjust the user's usual size:

- **Width**: Based on forefoot width ratio and side tightness
- **Size Adjustments**: ±0.5 UK size based on toe tightness, foot shape, and heel feedback
- **Never exceeds ±0.5** total shift unless explicitly required
- **Heel slippage**: Interpreted with heel ratio and other comfort indicators

## Technical Details

- Pure HTML, CSS, and JavaScript (no external dependencies)
- Canvas API for image processing
- Relative geometry analysis (no measurement card needed)
- Responsive design for mobile and desktop
- Camera capture support for iOS and Android

## Usage

Simply open `index.html` in a modern web browser. The app works offline and requires no server setup.

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Future Enhancements

The current implementation uses deterministic rules. The system is designed to be easily enhanced with machine learning once real-world data is collected.

