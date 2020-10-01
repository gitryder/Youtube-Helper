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
var dataset = [];
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

//Get the data from Firebase
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

function numberWithCommas(x) {
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
  var url = getExtractedYoutubeVideoIdFromUrl(videoUrlInput.value);

  if (url === "") {
    alert("Please enter a valid URL");
  } else {
    console.log("The video id is:" + url);

    gapi.client.youtube.videos
      .list({
        part: "snippet,contentDetails,statistics",
        id: url,
      })
      .then((response) => {
        const video = response.result.items[0];
        /*
        const output = `
            <tr>
                <td>${video.snippet.title}</td>
                <td>${getFormattedVideoDuration(video.contentDetails.duration)}</td>
                <td>${numberWithCommas(video.statistics.viewCount)}</td>
                <td>${getFormattedPublishedDate(video.snippet.publishedAt)}</td>
                <td><a href="${videoUrlInput.value}">${videoUrlInput.value}</a></td>
            </tr>
        `;
        */

        const output = [
          getFormattedPublishedDate(video.snippet.publishedAt),
          video.snippet.title,
          numberWithCommas(video.statistics.viewCount),
        ];

        /*document.getElementById('myTable').innerHTML += output;*/
        updateTableWithData(output);
        addDataToFirebase(
          url,
          getFormattedPublishedDate(video.snippet.publishedAt),
          video.snippet.title,
          numberWithCommas(video.statistics.viewCount)
        );

        videoUrlInput.value = "";
      })
      .catch((err) =>
        alert("No video found with that URL. Please check the URL")
      );
  }

  setupButtonSelectedRowDelete();
}

function updateTableWithData(newdata) {
  if (dataset.length == 0) {
    dataset.push(newdata);

    $(document).ready(function () {
      myDataTable = $("#myTable").DataTable({
        data: dataset,
        columns: [
          { title: "Published Date" },
          { title: "Title" },
          { title: "Views" },
        ],
      });
    });

    console.log(dataset);
  } else {
    dataset.push(newdata);

    myDataTable.destroy();

    $(document).ready(function () {
      myDataTable = $("#myTable").DataTable({
        data: dataset,
        columns: [
          { title: "Published Date" },
          { title: "Title" },
          { title: "Views" },
        ],
      });
    });
  }
}

getDataButton.onclick = getVideoDetails;

function setupButtonSelectedRowDelete() {
  // Make the button visible
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
    myDataTable.row(".selected").remove().draw(false);
  });
}

function addDataToFirebase(id, publishedAt, title, viewCount) {
  database.ref("videos/" + id).set({
    publishedAt: publishedAt,
    title: title,
    viewCount: viewCount,
  });
}

function retrieveDataFromFirebase() {
  var videoDataRef = firebase.database().ref("videos/");

  videoDataRef.on("value", function (snapshot) {
    console.log("Firebase data: " + snapshot.val());
  });
}
