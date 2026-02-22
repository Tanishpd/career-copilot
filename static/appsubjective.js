var data = {};

function mySnackBar() {
  var x = document.getElementById("snackbar");
  x.className = "show";
  setTimeout(function () { x.className = x.className.replace("show", ""); }, 10000);
}

var anyFieldReceivedFocus = false;

function fieldReceivedFocus() {
  anyFieldReceivedFocus = true;
}

if (!anyFieldReceivedFocus) {
  // Do jQuery focus stuff
}

window.onfocus = function (event) {
  if (!anyFieldReceivedFocus) {
    mySnackBar();

    $.ajax({
      data: { 'testid': tid },
      type: "POST",
      url: "/window_event"
    });
  }
};

// --- DRAGGABLE WINDOW LOGIC ---
if (document.getElementById("proctoring-feed-container")) {
  dragElement(document.getElementById("proctoring-feed-container"));
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var header = document.getElementById("proctor-header");
  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.bottom = "auto";
    elmnt.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function toggleProctorWindow() {
  var feed = document.getElementById("proctoring-feed-container");
  var btn = document.getElementById("btn-toggle-proctor");
  if (feed && btn) {
    feed.classList.toggle("collapsed");
    if (feed.classList.contains("collapsed")) {
      btn.innerText = "▢";
    } else {
      btn.innerText = "_";
    }
  }
}

// --- VIDEO RECORDING LOGIC ---
var mediaRecorder;
var recordedChunks = [];

function startRecording(stream) {
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
  mediaRecorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  mediaRecorder.onstop = uploadVideo;
  mediaRecorder.start(1000);
  console.log("Video recording started");
}

function uploadVideo() {
  return new Promise((resolve, reject) => {
    var blob = new Blob(recordedChunks, { type: 'video/webm' });
    var formData = new FormData();
    formData.append('video', blob, 'exam_record.webm');
    formData.append('test_id', tid);

    fetch('/upload_exam_video', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        console.log("Video uploaded:", data);
        resolve(data);
      })
      .catch(err => {
        console.error("Video upload failed:", err);
        resolve(); // Resolve anyway to allow submission
      });
  });
}



var stream = document.getElementById("stream");
var capture = document.getElementById("capture");
var cameraStream = null;
var array = null;
var values = 0;
var length = null;

function startStreaming() {

  var mediaSupport = 'mediaDevices' in navigator;
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  if (mediaSupport && null == cameraStream) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function (mediaStream) {
        cameraStream = mediaStream;
        stream.srcObject = mediaStream;
        stream.play();

        // Start Recording
        startRecording(mediaStream);

        audioContext = new AudioContext();

        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function () {
          array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          values = 0;

          length = array.length;
          for (var i = 0; i < length; i++) {
            values += (array[i]);
          }
        }
      })
      .catch(function (err) {
        console.log("Unable to access camera: " + err);
      });
  }
  else {
    alert('Your browser does not support media devices.');
    return;
  }
}

function stopStreaming() {

  if (null != cameraStream) {
    var track = cameraStream.getTracks()[0];
    track.stop();
    stream.load();
    cameraStream = null;
  }
}

function captureSnapshot() {

  if (null != cameraStream) {
    var ctx = capture.getContext('2d');
    var img = new Image();
    ctx.drawImage(stream, 0, 0, capture.width, capture.height);
    img.src = capture.toDataURL("image/png");
    img.width = 340;
    var d1 = capture.toDataURL("image/png");
    var res = d1.replace("data:image/png;base64,", "");

    var average = values / length;

    console.log(average)
    console.log(Math.round(average - 40));

    if (average) {
      $.post("/video_feed", {
        data: { 'imgData': res, 'voice_db': average, 'testid': tid }
      },
        function (data) {
          console.log(data);
        });
    }

  }
  setTimeout(captureSnapshot, 5000);
}

$(document).ready(function () {
  var url = window.location.href;
  var list = url.split('/');
  var time = parseInt($('#time').text()), display = $('#time');
  startTimer(time, display);
  sendTime();
  flag_time = true;
})

var flag_time = true;
function startTimer(duration, display) {
  var timer = duration, hours, minutes, seconds;

  var interval = setInterval(function () {
    console.log(timer);
    hours = parseInt(timer / 3600, 10);
    minutes = parseInt((timer % 3600) / 60, 10);
    seconds = parseInt(timer % 60, 10);
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    display.text(hours + ":" + minutes + ":" + seconds);
    if (--timer < 0) {
      submitformexam();
      clearInterval(interval);
      flag_time = false;
    }
  }, 1000);
}

function sendTime() {
  var intervalTime = setInterval(function () {
    if (flag_time == false) {
      clearInterval(intervalTime);
    }
    var time = $('#time').text();
    var [hh, mm, ss] = time.split(':');
    hh = parseInt(hh);
    mm = parseInt(mm);
    ss = parseInt(ss);
    var seconds = hh * 3600 + mm * 60 + ss;
    $.ajax({
      type: 'POST',
      dataType: "json",
      url: "/test_update_time",
      data: { time: seconds, testid: tid },
    });
    if (flag_time == false) {
      clearInterval(intervalTime);
    }
  }, 5000);
}
function submitformexam() {
  // Stop recording
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = function () {
      uploadVideo().then(() => {
        document.forms["subj"].submit();
      });
    };
    mediaRecorder.stop();
  } else {
    document.forms["subj"].submit();
  }
}




window.addEventListener('selectstart', function (e) { e.preventDefault(); });
$(document).ready(function () {
  $('body').bind('select cut copy paste', function (e) {
    e.preventDefault();
  });

  $("body").on("contextmenu", function (e) {
    return false;
  });
});

document.addEventListener('keyup', (e) => {
  if (e.key == 'PrintScreen') {
    navigator.clipboard.writeText('');
    alert('Screenshots disabled!');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key == 'p') {
    alert('This section is not allowed to print or export to PDF');
    e.cancelBubble = true;
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});
