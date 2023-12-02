# CarGame
This is an attepmt to create a car game, displayed on your desktop, but controlled by the gyro of your phone

<hr>
Idea:
A car rendered in the dekstop browser, controlled by controller (phone gyro).
The connection between the phone and desktop application can be accieved with a websocket connection.

The pair should be easely connected if the desktop application at
startup displays a qr-code containing the link to the phone-site, aswell as a token for the connection.
<hr>
Components:

desktop webpage:

- qr-generator
- treejs rendering
- some nice vehicle dynamics function
- socket communication

backend:

- An api for new sessions 
  newSession() -> token
- A system to stream inputs from the phone to the desktop
  createNewControllInputStream(token) -> soket
  createControllOutputStream(token) -> soket

phone webpage:
- Gyro data
  socket communication

<hr>
Use example:

- User opens the desktop application.
- Application contacts the backend and receives a new token and the link for phone controll page.
- Desktop creates a connection to its controllInputStream from the backend using the token
- Desktop creates a qr code with the link to the phone-page and the token embedded

- User scans the qr-code on the phone, opening the webpage.
  From the url, the webpage should be able to fetch the token
- Phone application opens the controllerOutputStream using the token
- Phone streams the gyro angle to the socket connection.

- Desktop starts to update the vehicle state using the data reveiced from the soket connection
  
