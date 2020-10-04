const CLIENT_ID =
    "969229269832-vlkvofru6toec73ovt57t9vqqbcrh5n2.apps.googleusercontent.com";
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest",
];
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";

const loginButton = document.getElementById("btn-login");
const logoutButton = document.getElementById("btn-logout");
const loggedOutContent = document.getElementById("logged-out-content");
const loggedInContent = document.getElementById("logged-in-content");
const videoUrlInput = document.getElementById("input-video-url");
const getDataButton = document.getElementById("btn-search");

const defaultChannelId = "UCl3HSwd9i67Mjs4DfldgZmg";
var dataset = new Array();
var myDataTable;

function handleClientLoad() {
    gapi.load("client:auth2", initClient);
}

function initClient() {
    gapi.client
        .init({
            discoveryDocs: DISCOVERY_DOCS,
            clientId: CLIENT_ID,
            scope: SCOPES,
        })
        .then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            loginButton.onclick = handleLogin;
            logoutButton.onclick = handleLogout;
        });
}

var config = {
    apiKey: " AIzaSyBq8LrNSf4C_c2fHsu9g-vQi7RfgG4lrOk",
    authDomain: "views-exporter.firebaseapp.com",
    databaseURL: "https://views-exporter.firebaseio.com/",
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        loggedOutContent.style.display = "none";
        loggedInContent.style.display = "block";

        populateAccountDetails();
    } else {
        loggedOutContent.style.display = "block";
        loggedInContent.style.display = "none";
    }
}

initDataTable();
retrieveDataFromFirebase();

function handleLogin() {
    gapi.auth2.getAuthInstance().signIn();
}

function handleLogout() {
    gapi.auth2.getAuthInstance().signOut();
}

function populateAccountDetails() {
    var profile = gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getBasicProfile();

    document.getElementById("username").innerHTML = profile.getName();
    document.getElementById("email").innerHTML = profile.getEmail();
}

function getFormattedViewCount(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getFormattedVideoDuration(string) {
    if (string.includes("H")) {
        var mIndex = string.indexOf("M") + 1;
        var hIndex = string.indexOf("H") + 1;
        return (
            string.slice(2, hIndex) +
            " " +
            string.slice(hIndex, mIndex) +
            " " +
            string.slice(mIndex)
        );
    } else {
        var reqIndex = string.indexOf("M") + 1;
        return string.slice(2, reqIndex) + " " + string.slice(reqIndex);
    }
}

function getFormattedPublishedDate(string) {
    return string.substring(0, string.indexOf("T"));
}

function getExtractedYoutubeVideoIdFromUrl(url) {
    url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return url[2] !== undefined ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
}

function getVideoDetails() {
    var videoId = getExtractedYoutubeVideoIdFromUrl(videoUrlInput.value);

    if (videoId === "") {
        alert("Please enter a valid URL");
    } else {
        console.log("The video id is:" + videoId);

        gapi.client.youtube.videos
            .list({
                part: "snippet,contentDetails,statistics",
                id: videoId,
            })
            .then((response) => {
                const video = response.result.items[0];

                var payload = {
                    publishedAt: getFormattedPublishedDate(
                        video.snippet.publishedAt
                    ),
                    title: video.snippet.title,
                    viewCount: getFormattedViewCount(
                        video.statistics.viewCount
                    ),
                };

                addDataToFirebase(
                    videoId,
                    payload.publishedAt,
                    payload.title,
                    payload.viewCount
                );

                //addDataToDataTable(videoId, payload);

                videoUrlInput.value = "";
            })
            .catch((err) =>
                alert("No video found with that URL. Please check the URL")
            );
    }
}

function initDataTable() {
    myDataTable = $("#myTable").DataTable({
        columns: [
            { title: "id", visible: false, searchable: false},
            { title: "Published Date" },
            { title: "Title" },
            { title: "Views" },
        ],
    });
}

getDataButton.onclick = getVideoDetails;

function setupButtonSelectedRowDelete() {
    document.getElementById("btn-table-row-delete").style.display = "block";

    $("#myTable tbody").on("click", "tr", function () {
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
        } else {
            myDataTable.$("tr.selected").removeClass("selected");
            $(this).addClass("selected");
        }
    });

    $("#btn-table-row-delete").click(function () {
        var deletedRowData = myDataTable.row(".selected").data();
        var deletedRowVideoId = deletedRowData[0];

        myDataTable.row(".selected").remove().draw(false);
        deleteDataFromFirebase(deletedRowVideoId);
    });
}

function addDataToFirebase(id, publishedAt, title, viewCount) {
    database.ref("videos/" + id).set({
        publishedAt: publishedAt,
        title: title,   
        viewCount: viewCount,
    });
}

function addDataToDataTable(id, data) {
    myDataTable.row.add([id, data.publishedAt, data.title, data.viewCount]).draw();
}

function deleteDataFromFirebase(deletedRowVideoId) {
    clearDataTable();
    firebase.database().ref("videos/" + deletedRowVideoId).remove();
}

function clearDataTable() {
    myDataTable.clear();
}

function retrieveDataFromFirebase() {
    var fbDataArray = [];
    var videoDataRef = firebase.database().ref("videos/");

    videoDataRef.on("value", function (snapshot) {

        clearDataTable();
        snapshot.forEach(function (childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();

            addDataToDataTable(childKey, childData);
        });
    });

    setupButtonSelectedRowDelete();
    return fbDataArray;
}
