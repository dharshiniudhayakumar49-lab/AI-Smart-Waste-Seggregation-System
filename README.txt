EcoSort - AI Smart Waste Segregation System
===========================================

This is a front-end project prototype made with HTML, CSS and JavaScript.

Improvements in this version
- Starts with all four bin levels at 0%, 0 waste records and 0 alerts in a fresh app data version.
- Includes a Reset all demo data button to return bins, records and alerts to zero for presentations.
- Dashboard, bin monitoring, waste classification, reports and admin notifications are connected through page navigation.
- Waste image upload shows a preview and runs MobileNet image recognition in the browser.
- The app checks the model’s top predictions and uses the image prediction first to suggest Wet, Dry, E-Waste or Hazardous. If the model cannot map the visual prediction, common item words in the item name/filename are only a fallback hint.
- Unknown items require manual category selection rather than a fabricated AI result.
- Recording a disposal adds an activity record and increases the matching demo bin level. Bin levels are capped at 100%.
- When a bin first reaches 100%, an alert is added to Admin Notifications. If browser notification permission is granted, a desktop notification is attempted while the page is open.
- Reports can be exported as CSV. Data is stored in the current browser using localStorage.
- AI model loading can be retried after a connection failure.

How to run
1. Extract this ZIP.
2. Open the AI_Smart_Waste_Segregation folder in VS Code.
3. Install the Live Server extension if you do not already have it.
4. Right-click index.html and choose Open with Live Server.
5. Keep an internet connection available for the TensorFlow.js/MobileNet scripts and model download.
6. Open Classify Waste and upload an image. Wait for AI analysis; the category name should appear automatically when the model can recognise/map the object. Verify or correct it, then click Record disposal.
7. Open Bin Monitoring and move a bin slider to 100% to test the alert. Enable browser notifications from Admin Notifications if you want to test a desktop notification.
8. Use Reset all demo data from Admin Notifications when you want to start a clean presentation with all counts and bin levels at zero.

Important limitations
- MobileNet is a general object-recognition model, not a waste-specific trained model. Checking its top predictions improves mapping, but it can still misclassify objects. Always verify the category. For dependable classification of all waste types, train and integrate a waste-specific model with representative images.
- A filename/item-name hint is not visual AI recognition. It is only used if the visual model cannot map its prediction; it cannot guarantee the photo actually contains that item.
- Battery and other hazardous items must be checked carefully and taken to an appropriate collection point. Do not rely on the model for safety decisions.
- The project uses browser storage and simulated bin levels. It is not connected to real sensors or a shared admin server.
- Desktop alerts are local to the browser/device, require browser permission and a supported secure context (Live Server/localhost is recommended), and only work while the app is open. Remote email, SMS or WhatsApp delivery requires a backend and notification provider; these are not included in this ZIP.
