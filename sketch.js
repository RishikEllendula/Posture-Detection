let cap;
let poseNet;
let singlePose, skeleton;
let smoothPose = null; // For smoothing

function setup() {
  createCanvas(800, 500);
  cap = createCapture(VIDEO);
  cap.size(800, 500);
  cap.hide();
  poseNet = ml5.poseNet(cap, modelLoaded);
  poseNet.on('pose', receive);
}

function receive(poses) {
  if (poses.length > 0) {
    singlePose = poses[0].pose;
    skeleton = poses[0].skeleton;
    // Smoothing
    if (!smoothPose) {
      // First frame, just copy
      smoothPose = JSON.parse(JSON.stringify(singlePose));
    } else {
      // Smooth each keypoint
      for (let i = 0; i < singlePose.keypoints.length; i++) {
        smoothPose.keypoints[i].position.x = lerp(
          smoothPose.keypoints[i].position.x,
          singlePose.keypoints[i].position.x,
          0.5 // Smoothing factor (0.1 = very smooth, 0.9 = less smooth)
        );
        smoothPose.keypoints[i].position.y = lerp(
          smoothPose.keypoints[i].position.y,
          singlePose.keypoints[i].position.y,
          0.5
        );
      }
    }
  }
}

function modelLoaded() {
  console.log("Model loaded");
}

function draw() {
  image(cap, 0, 0, 800, 500);
  if (smoothPose) {
    fill(0, 255, 0);
    noStroke();
    for (let i = 0; i < smoothPose.keypoints.length; i++) {
      ellipse(smoothPose.keypoints[i].position.x, smoothPose.keypoints[i].position.y, 20);
    }
    // Draw skeleton using smoothPose
    if (skeleton) {
      stroke(255, 255, 255);
      strokeWeight(3);
      for (let j = 0; j < skeleton.length; j++) {
        let partA = smoothPose.keypoints.find(k => k.part === skeleton[j][0].part);
        let partB = smoothPose.keypoints.find(k => k.part === skeleton[j][1].part);
        if (partA && partB) {
          line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
      }
    }
    // Draw nostril holes (estimated)
    let nose = smoothPose.keypoints.find(k => k.part === "nose");
    let leftEye = smoothPose.keypoints.find(k => k.part === "leftEye");
    let rightEye = smoothPose.keypoints.find(k => k.part === "rightEye");
    if (nose && leftEye && rightEye && nose.score > 0.2 && leftEye.score > 0.2 && rightEye.score > 0.2) {
      let noseX = nose.position.x;
      let noseY = nose.position.y;
      let dx = rightEye.position.x - leftEye.position.x;
      let dy = rightEye.position.y - leftEye.position.y;
      let length = Math.sqrt(dx * dx + dy * dy);
      let offsetX = (dx / length) * 15;
      let offsetY = (dy / length) * 15;
      let leftNostrilX = noseX - offsetX;
      let leftNostrilY = noseY - offsetY;
      let rightNostrilX = noseX + offsetX;
      let rightNostrilY = noseY + offsetY;
      fill(0, 0, 255);
      ellipse(leftNostrilX, leftNostrilY, 18, 18);
      ellipse(rightNostrilX, rightNostrilY, 18, 18);
    }
  }
}