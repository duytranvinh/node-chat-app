const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    // console.log($newMessage.offsetHeight);
    // console.log(newMessageHeight);

    // Visible height, what can user see in the chat window
    const visibleHeight = $messages.offsetHeight;
    //console.log(visibleHeight);

    // Height of messages container, total height including visible and invisible
    const containerHeight = $messages.scrollHeight;
    // console.log(containerHeight);

    // How far have I scrolled?
    // scrollTop = invisible part
    const scrollOffset = $messages.scrollTop + visibleHeight;
    // console.log($messages.scrollTop);
    // console.log(visibleHeight);
    // console.log(scrollOffset);

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};


socket.on("message", (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm:ss a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm:ss a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();

});

socket.on("roomData", ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    $sidebar.innerHTML = html;
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});

$messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = event.target.elements.message.value;

    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log("Message delivered successfully!");
    });
});

$sendLocationButton.addEventListener("click", (event) => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported on this browser");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position.coords.latitude);
        // console.log(position.coords.longitude);

        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            (message) => {
                $sendLocationButton.removeAttribute("disabled");
                console.log("Location sent to server!", message);
            }
        );
    });
});

