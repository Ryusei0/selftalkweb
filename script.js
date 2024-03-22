import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

document.getElementById('toggleResponse').addEventListener('click', toggleResponse);

let Id; // グローバルスコープでuserIdを宣言
// グローバル変数を定義
let specialMode = true;

// ページの読み込みが完了した後に実行される関数を定義
window.onload = function() {
    init(); // 3Dシーンの初期化
    animate(); // アニメーションループの開始
    // 音声再生許可コンテナの作成
    const container = document.createElement('div');
    container.id = 'audioPermissionContainer';
    document.body.appendChild(container);

    // 音声再生許可ボタンの作成
    const allowButton = document.createElement('button');
    allowButton.id = 'allowButton';
    allowButton.classList.add('audioPermissionButton');
    allowButton.textContent = '音声再生を許可';
    allowButton.addEventListener('click', () => onAudioPlaybackDecision(true));
    container.appendChild(allowButton);

    // 音声再生許可を拒否するボタンの作成
    const denyButton = document.createElement('button');
    denyButton.id = 'denyButton';
    denyButton.classList.add('audioPermissionButton');
    denyButton.textContent = '許可しない';
    denyButton.addEventListener('click', () => onAudioPlaybackDecision(false));
    container.appendChild(denyButton);
};

// 音声再生許可の状態
let audioPlaybackAllowed = false;

// 音声再生の許可/不許可の決定を処理する関数
function onAudioPlaybackDecision(allowed) {
    if (allowed) {
        audioPlaybackAllowed = true;
    startPlayAudio();
   
    } else {
        // 音声再生許可が拒否された場合の処理
        alert('音声再生が許可されませんでした。');
    }
    // ボタンを非表示にする
    document.getElementById('audioPermissionContainer').style.display = 'none';
}

function resetViewport() {
    let viewportMeta = document.querySelector("meta[name=viewport]");
    if (!viewportMeta) {
        viewportMeta = document.createElement("meta");
        viewportMeta.name = "viewport";
        document.getElementsByTagName("head")[0].appendChild(viewportMeta);
    }
    viewportMeta.setAttribute("content","width=device-width, initial-scale=1.0, user-scalable=no");
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const y = 0;
camera.position.set(0, y, 1.5);//下にも使ってる（更新）
// グローバル変数の宣言部分
let currentAudio = null;
let currentVideoElement = null; // 動画要素を追跡するために追加
let isPlaying = false;
let currentIndex = 0; // 現在のカードのインデックスを追跡
let cards = []; // Use let if you plan to reassign cards
// 現在のリストが元のリストかどうかを追跡
let isOriginalList = true;
let currentDisplayedURL = ''; // 現在表示されているURLを追跡

let model = null; // モデルの参照を保持するための変数
let pivot = new THREE.Object3D(); // 新しい支点オブジェクト
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 0.5;
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(0.4, 2, 8);
directionalLight.castShadow = true;
scene.add(directionalLight);
// ライトをカメラに追加する
camera.add(directionalLight);

const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -7;
plane.receiveShadow = true;
scene.add(plane);

const radius = 8;
const videoTextures = [];
const cardWidth = 2.56;
const cardHeight = 1.44;
// カードの座標を保存する配列
let cardPositions = [];
let cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight);

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
loader.setDRACOLoader(dracoLoader);

let mixer;
loader.load('https://s3.ap-northeast-3.amazonaws.com/testunity1.0/webar/Vmodel.glb', function (gltf) {
  scene.add(gltf.scene);
  gltf.scene.scale.set(1.4, 1.4, 1.4);
  // モデルのBoundingBoxを計算
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const height = box.max.y - box.min.y; // モデルの高さ
  const lookAtHeight = height / 1; // 上から1/5の地点
  // モデルをカメラに追加する際の位置調整
  gltf.scene.position.set(0, -5.2+lookAtHeight, -1); // Y位置を調整
  // カメラにモデルを子供として追加
  camera.add(gltf.scene);
  // ここでモデルを180度回転
  gltf.scene.rotation.y = Math.PI;
  // シーンにカメラを追加
  scene.add(camera);
  model = gltf.scene; // モデルの参照を保存
  
  // 口のシェイプキーの名前リスト
  const mouthShapeKeys = [
    'Fcl_MTH_A', 'Fcl_MTH_I', 'Fcl_MTH_U', 'Fcl_MTH_E', 'Fcl_MTH_O',
    // 他の口に関するシェイプキーを追加...
  ];
  // 顔や瞬きのシェイプキーの名前リスト（ランダムな動き用）
const faceShapeKeys = [
    'Fcl_ALL_Fun', 'Fcl_ALL_Joy',
    // 他の顔や瞬きに関するシェイプキーを追加...
  ];
  
  // 口のシェイプキーのインデックスを取得
  let mouthShapeKeysIndices = [];
  let faceShapeKeysIndices = [];
  gltf.scene.traverse(function (node) {
    if (node.isMesh) {
      if (mouthShapeKeysIndices.length === 0) {
        mouthShapeKeys.forEach(key => {
          const index = node.morphTargetDictionary[key];
          if (index !== undefined) {
            mouthShapeKeysIndices.push(index);
          }
        });
      }
      if (faceShapeKeysIndices.length === 0) {
        faceShapeKeys.forEach(key => {
          const index = node.morphTargetDictionary[key];
          if (index !== undefined) {
            faceShapeKeysIndices.push(index);
          }
        });    }
    }
  });
  
  // リップシンクのアニメーションを更新する関数
function updateLipSync() {
    const audioElement1 = document.getElementById('audioPlayer');
    const audioElement2 = document.getElementById('audioPlayer2');
    
    if ((audioElement1 && (audioElement1.paused || audioElement1.ended)) &&
        (audioElement2 && (audioElement2.paused || audioElement2.ended))) {
      // 両方の音声の再生が停止したら口を閉じる
      mouthShapeKeysIndices.forEach(index => {
        model.traverse(function (node) {
          if (node.isMesh && node.morphTargetInfluences) {
            node.morphTargetInfluences[index] = 0;
          }
        });
      });
    } else {
      // 口のシェイプキーの値をランダムに設定
      mouthShapeKeysIndices.forEach(index => {
        const randomValue = Math.random();
        let mouthOpenness;
        
        if (randomValue < 0.8) {
          // 10%の確率で口を完全に閉じる
          mouthOpenness = 0;
        } else {
          // 残りの90%の確率でランダムな口の開き具合を設定
          mouthOpenness = Math.random();
        }
        
        model.traverse(function (node) {
          if (node.isMesh && node.morphTargetInfluences) {
            node.morphTargetInfluences[index] = mouthOpenness;
          }
        });
      });
    }
    
    // ランダムな時間間隔で次のフレームでアニメーションを更新
    const randomInterval = Math.random() * 200 + 80; // 50ms～150msの間でランダムな時間間隔
    setTimeout(updateLipSync, randomInterval);
  }
  
  // 音声の再生が始まったらリップシンクのアニメーションを開始
  const audioElement1 = document.getElementById('audioPlayer');
  const audioElement2 = document.getElementById('audioPlayer2');
  
  if (audioElement1) {
    audioElement1.onplay = () => {
      if (audioPlaybackAllowed) {
        updateLipSync();
      }
    };
  }
  
  if (audioElement2) {
    audioElement2.onplay = () => {
      if (audioPlaybackAllowed) {
        updateLipSync();
      }
    };
  }

//ここから瞬き

// ランダムな顔や瞬きの動きを更新する関数
function updateRandomFaceMovement() {
    // 顔や瞬きのシェイプキーの値をランダムに設定
    faceShapeKeysIndices.forEach(index => {
      const randomValue = Math.random();
      let shapeKeyValue;
      
      if (randomValue < 0.6) {
        // 80%の確率で顔や瞬きのシェイプキーを0に設定
        shapeKeyValue = 0;
      } else {
        // 残りの20%の確率でランダムな値を設定
        shapeKeyValue = Math.random();
      }
      
      model.traverse(function (node) {
        if (node.isMesh && node.morphTargetInfluences) {
          node.morphTargetInfluences[index] = shapeKeyValue;      }
      });
    });
    
    // ランダムな時間間隔で次のフレームでアニメーションを更新
    const randomInterval = Math.random() * 3000 + 1000; // 1000ms～4000msの間でランダムな時間間隔
    setTimeout(updateRandomFaceMovement, randomInterval);
  }
  
  // ランダムな顔や瞬きの動きを開始
  updateRandomFaceMovement();

}, undefined, function (error) {
console.error(error);
});



const clock = new THREE.Clock();

// 動画リストの準備
const videos = [
    { category: "大学について",title:"list1", name: "ビデオ1",samnail:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%A4%A7%E5%AD%A6%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6.jpg", url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%A4%A7%E5%AD%A6%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6.jpg" },
    { category: "作業療法学専攻", title:"list2",name: "ビデオ2",samnail:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E4%BD%9C%E6%A5%AD%E7%99%82%E6%B3%95.png" , url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E4%BD%9C%E6%A5%AD%E7%99%82%E6%B3%95.png" },
    { category: "理学療法学専攻", title:"list2",name: "ビデオ0",samnail:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95.png", url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/FirstAI.jpg" },
    { category: "和歌山の未来", title:"list2",name: "ビデオ3",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%92%8C%E6%AD%8C%E5%B1%B1%E3%81%AB%E3%81%AF%E3%81%82%E3%81%AA%E3%81%9F%E3%81%8B%E3%82%99%E5%BF%85%E8%A6%81%E3%81%A6%E3%82%99%E3%81%99.jpg" , url:  "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%92%8C%E6%AD%8C%E5%B1%B1%E3%81%AB%E3%81%AF%E3%81%82%E3%81%AA%E3%81%9F%E3%81%8B%E3%82%99%E5%BF%85%E8%A6%81%E3%81%A6%E3%82%99%E3%81%99.jpg" },
    // 他の動画をここに追加
];


// 複数のリストを保持する配列
const allLists = [
    {
        id: "和歌山の未来",
        videos: [
            {planeid:1,category:"１：理学療法とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.1_20240317_122546_3a77fdeef63e4cadb875c9da016a9539.mp3",time:17},
                {planeid:1,category:"２：理学療法士とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.2_20240317_122621_edee0f2ed8d54f558302397a243361c0.mp3",time:12},
         {planeid:1,category:"３：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.3_20240317_060639_b45c1a15a2c349d88e3458cd1579125b.mp3",time:17},
                {planeid:1,category:"４：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.4.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.4_20240317_060654_2f93f9b949e14f68be757648ce2043ad.mp3",time:12},
                {planeid:1,category:"５：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.5_20240317_060711_ee1810e1a1d8490c9d2441f5e401345c.mp3",time:17},
                {planeid:1,category:"６：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.6.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.6_20240317_060731_4d97b33d84af440eb42ff1f70a7793c3.mp3",time:12},
         {planeid:1,category:"７：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.7_20240317_060816_578aa7b36cbf4fe4a056a573e6fae9e8.mp3",time:17},
                {planeid:1,category:"８：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.8.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.8_20240318_004059_da664ce8cafe436bb09dc8060ccecf04.mp3",time:12},
                {planeid:1,category:"９：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.9_20240317_060857_f3f3009e55844d60b1f7b84b701720ac.mp3",time:17},
                {planeid:1,category:"１０：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.10.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.10_20240317_060916_98d0d8d4d1fc460bb3f9992565665712.mp3",time:12},
         {planeid:1,category:"１１：理学療法",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.11_20240317_060940_e7f8ff6bd2fe4c3a96fa64efdf384d36.mp3",time:17},
                {planeid:1,category:"１２：理学療法で学ぶこと",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.12_20240317_060959_a2e75a5d93bd4d9f894dd48380406d58.mp3",time:12},
                {planeid:1,category:"１３：リハビリ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.13_20240317_061014_50146caf70e54cd99f203cf31ef10d13.mp3",time:17},
                {planeid:1,category:"１４：リハビリの工夫",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.14.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.14_20240318_004124_466bba264abf4902bbde39c9118a144a.mp3",time:12},
         {planeid:1,category:"１５：最新技術の活用",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.15_20240317_061046_81c1c0e5348643379cfa46eaa43cfe80.mp3",time:17},
                {planeid:1,category:"１６：理学療法の面白さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.16_20240318_004152_db7990584b224320bc5ae6b2822d505d.mp3",time:12},
                {planeid:1,category:"１７：理学療法士になるには？",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.17.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.17_20240317_061125_ff3c430f5f184f1fad57e885887866ad.mp3",time:17},
                {planeid:1,category:"１８：理学療法士になるまで",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.18_20240317_061152_c886926e52d042bebd3465894b2abd88.mp3",time:12},
         {planeid:1,category:"１９：弊学の良さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.19_20240317_061209_2a9c0547ab484a2db24c44bafa626e83.mp3",time:17},
                {planeid:1,category:"２０：病院での仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.20_20240317_061236_3cd49460fb834a109a7edbec51b4f94b.mp3",time:12},
                {planeid:1,category:"２１：スポーツチームでの仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.21_20240317_061253_a9e2bc48146a42498949643e6da0cfd1.mp3",time:17},
                {planeid:1,category:"２２：ホームケア",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.22_20240317_061313_49e87b657d4f45589421bf9b2d49501f.mp3",time:12},
         {planeid:1,category:"理学療法の世界",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.23_20240317_061333_0d992a38f097458aa5e08b4d313d6933.mp3",time:17},
        ]
    },
    {
        id: "大学について",
        videos:  [
            {planeid:1,category:"１：理学療法とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.1_20240317_122546_3a77fdeef63e4cadb875c9da016a9539.mp3",time:17},
                {planeid:1,category:"２：理学療法士とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.2_20240317_122621_edee0f2ed8d54f558302397a243361c0.mp3",time:12},
         {planeid:1,category:"３：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.3_20240317_060639_b45c1a15a2c349d88e3458cd1579125b.mp3",time:17},
                {planeid:1,category:"４：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.4.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.4_20240317_060654_2f93f9b949e14f68be757648ce2043ad.mp3",time:12},
                {planeid:1,category:"５：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.5_20240317_060711_ee1810e1a1d8490c9d2441f5e401345c.mp3",time:17},
                {planeid:1,category:"６：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.6.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.6_20240317_060731_4d97b33d84af440eb42ff1f70a7793c3.mp3",time:12},
         {planeid:1,category:"７：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.7_20240317_060816_578aa7b36cbf4fe4a056a573e6fae9e8.mp3",time:17},
                {planeid:1,category:"８：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.8.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.8_20240318_004059_da664ce8cafe436bb09dc8060ccecf04.mp3",time:12},
                {planeid:1,category:"９：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.9_20240317_060857_f3f3009e55844d60b1f7b84b701720ac.mp3",time:17},
                {planeid:1,category:"１０：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.10.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.10_20240317_060916_98d0d8d4d1fc460bb3f9992565665712.mp3",time:12},
         {planeid:1,category:"１１：理学療法",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.11_20240317_060940_e7f8ff6bd2fe4c3a96fa64efdf384d36.mp3",time:17},
                {planeid:1,category:"１２：理学療法で学ぶこと",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.12_20240317_060959_a2e75a5d93bd4d9f894dd48380406d58.mp3",time:12},
                {planeid:1,category:"１３：リハビリ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.13_20240317_061014_50146caf70e54cd99f203cf31ef10d13.mp3",time:17},
                {planeid:1,category:"１４：リハビリの工夫",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.14.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.14_20240318_004124_466bba264abf4902bbde39c9118a144a.mp3",time:12},
         {planeid:1,category:"１５：最新技術の活用",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.15_20240317_061046_81c1c0e5348643379cfa46eaa43cfe80.mp3",time:17},
                {planeid:1,category:"１６：理学療法の面白さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.16_20240318_004152_db7990584b224320bc5ae6b2822d505d.mp3",time:12},
                {planeid:1,category:"１７：理学療法士になるには？",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.17.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.17_20240317_061125_ff3c430f5f184f1fad57e885887866ad.mp3",time:17},
                {planeid:1,category:"１８：理学療法士になるまで",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.18_20240317_061152_c886926e52d042bebd3465894b2abd88.mp3",time:12},
         {planeid:1,category:"１９：弊学の良さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.19_20240317_061209_2a9c0547ab484a2db24c44bafa626e83.mp3",time:17},
                {planeid:1,category:"２０：病院での仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.20_20240317_061236_3cd49460fb834a109a7edbec51b4f94b.mp3",time:12},
                {planeid:1,category:"２１：スポーツチームでの仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.21_20240317_061253_a9e2bc48146a42498949643e6da0cfd1.mp3",time:17},
                {planeid:1,category:"２２：ホームケア",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.22_20240317_061313_49e87b657d4f45589421bf9b2d49501f.mp3",time:12},
         {planeid:1,category:"理学療法の世界",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.23_20240317_061333_0d992a38f097458aa5e08b4d313d6933.mp3",time:17},
        ]
    },
    {
        id: "理学療法学専攻",
        videos: [
            {planeid:1,category:"１：理学療法とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.1_20240317_122546_3a77fdeef63e4cadb875c9da016a9539.mp3",time:17},
                {planeid:1,category:"２：理学療法士とは",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.2_20240317_122621_edee0f2ed8d54f558302397a243361c0.mp3",time:12},
         {planeid:1,category:"３：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.3_20240317_060639_b45c1a15a2c349d88e3458cd1579125b.mp3",time:17},
                {planeid:1,category:"４：理学療法の例１",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.3.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.4.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.4_20240317_060654_2f93f9b949e14f68be757648ce2043ad.mp3",time:12},
                {planeid:1,category:"５：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.5_20240317_060711_ee1810e1a1d8490c9d2441f5e401345c.mp3",time:17},
                {planeid:1,category:"６：理学療法の例２",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.5.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.6.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.6_20240317_060731_4d97b33d84af440eb42ff1f70a7793c3.mp3",time:12},
         {planeid:1,category:"７：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.7_20240317_060816_578aa7b36cbf4fe4a056a573e6fae9e8.mp3",time:17},
                {planeid:1,category:"８：理学療法の例３",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.7.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.8.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.8_20240318_004059_da664ce8cafe436bb09dc8060ccecf04.mp3",time:12},
                {planeid:1,category:"９：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.9_20240317_060857_f3f3009e55844d60b1f7b84b701720ac.mp3",time:17},
                {planeid:1,category:"１０：理学療法の例４",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.9.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.10.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.10_20240317_060916_98d0d8d4d1fc460bb3f9992565665712.mp3",time:12},
         {planeid:1,category:"１１：理学療法",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.11.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.11_20240317_060940_e7f8ff6bd2fe4c3a96fa64efdf384d36.mp3",time:17},
                {planeid:1,category:"１２：理学療法で学ぶこと",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.12.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.12_20240317_060959_a2e75a5d93bd4d9f894dd48380406d58.mp3",time:12},
                {planeid:1,category:"１３：リハビリ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.13_20240317_061014_50146caf70e54cd99f203cf31ef10d13.mp3",time:17},
                {planeid:1,category:"１４：リハビリの工夫",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.13.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.14.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.14_20240318_004124_466bba264abf4902bbde39c9118a144a.mp3",time:12},
         {planeid:1,category:"１５：最新技術の活用",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.15.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.15_20240317_061046_81c1c0e5348643379cfa46eaa43cfe80.mp3",time:17},
                {planeid:1,category:"１６：理学療法の面白さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.16.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.16_20240318_004152_db7990584b224320bc5ae6b2822d505d.mp3",time:12},
                {planeid:1,category:"１７：理学療法士になるには？",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.17.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.2.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.17_20240317_061125_ff3c430f5f184f1fad57e885887866ad.mp3",time:17},
                {planeid:1,category:"１８：理学療法士になるまで",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.18.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.18_20240317_061152_c886926e52d042bebd3465894b2abd88.mp3",time:12},
         {planeid:1,category:"１９：弊学の良さ",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.19.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.19_20240317_061209_2a9c0547ab484a2db24c44bafa626e83.mp3",time:17},
                {planeid:1,category:"２０：病院での仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.20.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.20_20240317_061236_3cd49460fb834a109a7edbec51b4f94b.mp3",time:12},
                {planeid:1,category:"２１：スポーツチームでの仕事",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.21.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.21_20240317_061253_a9e2bc48146a42498949643e6da0cfd1.mp3",time:17},
                {planeid:1,category:"２２：ホームケア",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.22.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.22_20240317_061313_49e87b657d4f45589421bf9b2d49501f.mp3",time:12},
         {planeid:1,category:"理学療法の世界",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/%E5%A4%A7%E5%AD%A6%E3%80%80%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/1.23.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%A4%A7%E5%AD%A6%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%951.23_20240317_061333_0d992a38f097458aa5e08b4d313d6933.mp3",time:17},
        ]
    },
    {
        id: "当サイトについて",
        videos: [
            {planeid:1,category:"当サイトについて",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%A4%A7%E5%AD%A6%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240215_085026_858dab12be6142398953cfd2297c9480.mp3",time:17},
                {planeid:1,category:"作業療法学専攻",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E4%BD%9C%E6%A5%AD%E7%99%82%E6%B3%95.png",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%B0%8E%E5%85%A5%EF%BC%92_20240216_032001_465ed5af894146c09e7c40d5b9f48f81.mp3",time:12},
         {planeid:1,category:"理学療法学専攻",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E7%90%86%E5%AD%A6%E7%99%82%E6%B3%95.png",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/0.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%83%98%E3%82%9A%E3%82%A4%E3%83%B3_20240216_032031_b3ab9655d6464c5d84b285e16366779d.mp3",time:17},
                {planeid:1,category:"和歌山の未来",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E5%A4%A7%E5%AD%A6/%E5%92%8C%E6%AD%8C%E5%B1%B1%E3%81%AB%E3%81%AF%E3%81%82%E3%81%AA%E3%81%9F%E3%81%8B%E3%82%99%E5%BF%85%E8%A6%81%E3%81%A6%E3%82%99%E3%81%99.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/3.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E8%A7%A3%E6%B1%BA%E3%81%B8_20240216_032100_0901556cc47146f2b45982d016f93958.mp3",time:12},
        ]
    },
];

// alternateVideosの初期化
let alternateVideos = [];


function init() {
    regenerateCards(videos); // アプリケーション起動時に元のリストに基づいてカードを生成
    updateCardPositions(); // カードの位置を更新
    // その他の初期化処理...
}

function findClosestCardInFrontOfCamera() {
    let closestIndex = -1;
    let closestDistance = Infinity; // 最も近い距離を初期化

    // カメラから各カードへの距離を計算し、最も近いものを見つける
    cards.forEach((card, index) => {
        const distance = camera.position.distanceTo(card.position); // カメラからカードへの距離

        if (distance < closestDistance) {
            closestDistance = distance; // 最も近い距離を更新
            closestIndex = index; // 最も近いカードのインデックスを更新
        }
    });
    return closestIndex; // 最も近いカードのインデックスを返す
}

function playCenterMedia(index) {
    const playButton = document.getElementById('playCenterVideo');
    const activeList = isOriginalList ? videos : alternateVideos; // 現在のアクティブリストを取得
    if (index !== undefined) {
      currentIndex = index;
    } else {
      currentIndex = findClosestCardInFrontOfCamera();
    }
    const mediaInfo = activeList[currentIndex]; // 現在のメディア情報を取得
    // カードの位置を取得
    const cardPosition = cardPositions[currentIndex];
    if (cardPosition) {
      // カードの中心からカメラまでのオフセット（半径 + 追加のオフセット）
      const cameraOffset = 8; // 半径が6なので、半径に等しい値を初期値として使用
      const additionalOffset = 4.5; // カードとカメラの間の追加の距離
      // カメラの位置を円周上のカードに合わせて更新し、追加のオフセットを考慮
      camera.position.x = cardPosition.x * (cameraOffset + additionalOffset) / cameraOffset;
      camera.position.y = 0; // Y座標は変更なし
      camera.position.z = cardPosition.z * (cameraOffset + additionalOffset) / cameraOffset;
      // カメラがシーンの原点（カードの中心点を向くようにする）
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    const card = cards[currentIndex]; // 現在のカードを取得
    currentVideoElement = card.userData.videoElement; // ビデオ要素を取得
    // displayMedia関数を使用してメディアを表示。動画または画像ファイルの場合
    displayMedia(mediaInfo.url);
    // 再生中のメディアをクリア
    if (currentVideoElement) {
      currentVideoElement.pause();
      currentVideoElement.currentTime = 0;
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    // 動画の再生ロジックをここに追加
    if (mediaInfo.url.endsWith('.mp4') || mediaInfo.url.endsWith('.mov')) {
      const videoPlayer = document.getElementById('videoPlayer');
      videoPlayer.src = mediaInfo.url; // メディアソースを設定
      videoPlayer.load(); // メディアをロード
      videoPlayer.oncanplay = function() {
        if (isPlaying) { // isPlayingフラグがtrueの時のみ再生
          videoPlayer.play().then(() => {
            playButton.textContent = '停止';
          }).catch(error => {
            console.error('Playback failed:', error);
          });
        }
      };
    }
    if (mediaInfo.mp3) {
      currentAudio = document.getElementById('audioPlayer');
      currentAudio.src = mediaInfo.mp3;
      const playbackRate = document.getElementById('playbackRate').value; // 再生速度を取得
      currentAudio.playbackRate = playbackRate; // 再生速度を設定
      currentAudio.play();
      isPlaying = true; // 再生状態を更新
      if (playButton.textContent !=='停止') {
        playButton.textContent = '停止'; // ユーザーが操作した場合のみラベルを更新
        }
        currentAudio.onended = () => {
        if (isPlaying) { // 自動再生で次のメディアに進む場合
        let nextIndex = (currentIndex + 1) % activeList.length;
        playCenterMedia(nextIndex); // 直接次のインデックスを指定して再生
        }
        };
        }
        }

function displayMedia(url) {
    const videoPlayer = document.getElementById('videoPlayer');
    const imageDisplay = document.getElementById('imageDisplay');
    const contentContainer = document.getElementById('contentContainer');

    // URLの拡張子を取得
    const extension = url.split('.').pop().toLowerCase();

    // 動画または画像ファイルの場合の処理を分ける
    if (extension === 'mp4' || extension === 'webm' || extension === 'mov') {
        // 動画ファイルの場合
        videoPlayer.src = url;
        videoPlayer.style.display = 'block';
        imageDisplay.style.display = 'none';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        // 画像ファイルの場合
        imageDisplay.src = url;
        imageDisplay.style.display = 'block';
        videoPlayer.style.display = 'none';
    }

    // コンテンツコンテナを表示
    contentContainer.style.display = 'block';
}



// ユーザー操作によるメディアの停止
function stopMedia(){
    const playButton = document.getElementById('playCenterVideo'); // playButtonをローカルで取得
    const videoPlayer = document.getElementById('videoPlayer');
    const imageDisplay = document.getElementById('imageDisplay');
    const contentContainer = document.getElementById('contentContainer');
        // メディアを停止
        if (currentVideoElement) {
            currentVideoElement.pause();
            currentVideoElement.currentTime = 0;
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        // コンテナを非表示にする
        videoPlayer.style.display = 'none';
        imageDisplay.style.display = 'none';
        contentContainer.style.display = 'none';
        isPlaying = false; // 再生状態を更新
        playButton.textContent = '再生'; 
}

// イベントリスナーの設定
document.getElementById('playCenterVideo').addEventListener('click', () => {
    if (isPlaying) {
        stopMedia(); // ユーザーが停止を要求
        // 最も近いカードのインデックスを取得
    const closestCardIndex = findClosestCardInFrontOfCamera();
    const activeList = isOriginalList ? videos : alternateVideos;
        const closestCardURL = activeList[closestCardIndex].samnail; // 最も近いカードのURLを取得
        // URLが以前と異なる場合のみメディアを更新
            displayMedia(closestCardURL);
            currentDisplayedURL = closestCardURL; // 現在表示されているURLを更新
    } else {
        let index = findClosestCardInFrontOfCamera();
        playCenterMedia(index); // ユーザーが再生を要求
    }
});


// カテゴリラベルを更新する関数
function updateCategoryLabel() {
    const closestCardIndex = findClosestCardInFrontOfCamera();
    const categoryLabel = document.getElementById('videoListContainer');
    const activeList = isOriginalList ? videos : alternateVideos; // 現在アクティブなリストを選択

    if (closestCardIndex !== -1) {
        const closestCard = activeList[closestCardIndex]; // アクティブなリストからカードを選択
        categoryLabel.textContent = `${closestCard.category}`;
    } else {
        categoryLabel.textContent = 'カテゴリーが見つかりません';
    }
    if (audioPlaybackAllowed) {
        if ('vibrate' in navigator) {
            // 短い振動（200ミリ秒）を実行
            navigator.vibrate(200);
        }
    } else {
        console.log('振動禁止');
    }

}

//ビデオプレーンの切り替え

function regenerateCards(items) {
    // 既存のカードとその座標をクリア
    cards.forEach(card => {
        scene.remove(card);
        if (card.material.map) card.material.map.dispose();
        card.material.dispose();
        card.geometry.dispose();
    });
    cards.length = 0;
    cardPositions.length = 0; // 座標配列もリセット
    videoTextures.forEach(texture => texture.dispose()); // すべてのテクスチャをクリア
    videoTextures.length = 0;

    items.forEach((item, index) => {
        // 画像のロード
        const texture = new THREE.TextureLoader().load(item.samnail); // 'thumbnail'属性を使用してテクスチャをロード

        videoTextures.push(texture);

        const cardMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        card.userData = { index: index, type: 'image', title: item.title }; // すべて画像として扱う

        // シーンにカードを追加
        scene.add(card);
        cards.push(card); // カード配列にカードを追加
    });

    currentIndex = 0; // 最初のカードを中心に設定
    updateCardPositions(); // カードの位置を更新
}


// カードの位置を更新した後、カメラを初期位置に戻す
function resetCameraPosition() {
    
    camera.position.set(0, y, 12.5);//下にも使ってる（更新）

    // カメラがシーンの中心を向くようにする
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}


// カードの位置を更新する関数
function updateCardPositions() {
    if (cards.length == 0) return; // カードがなければ何もしない

    // カード間の角度を計算
    const cardOffset = 2 * Math.PI / cards.length;

    // 各カードの位置を計算して更新
    cards.forEach((card, index) => {
        // カードの配置角度を計算
        const angle = cardOffset * index;
        const x = radius * Math.sin(angle); // 円周上のX座標
        const z = radius * Math.cos(angle); // 円周上のZ座標

        // カードを新しい位置に配置
        card.position.set(x, 1.8, z);
        card.lookAt(new THREE.Vector3(0, 0, 0)); // カードが原点（カメラの位置）を向くようにする

        // カードの座標を保存
        cardPositions[index] = { x: x, y: 1.8, z: z };
    });

    // 中心に来るカードの位置を設定する
    const centerCardPosition = cardPositions[currentIndex];
    if (centerCardPosition) {
        cards[currentIndex].position.set(0, 1.8, radius);
    }
    resetCameraPosition();
}


// カメラに最も近いカードのtitle属性を基にalternateVideosを更新する関数
function updateAlternateVideosBasedOnClosestCard() {
    // カメラに最も近いカードのインデックスを取得
    const closestCardIndex = findClosestCardInFrontOfCamera();
    
    // カメラに最も近いカードのtitle属性（リストID）を取得
    const closestCardTitle = videos[closestCardIndex].category;
    
    alternateVideos = [];

    // targetIdに一致するリストを探す
    const targetList = allLists.find(list => list.id === closestCardTitle);

    // 該当するリストが見つかった場合、そのvideosをalternateVideosに設定
    if (closestCardTitle) {
        alternateVideos = targetList.videos;
    }
}

// カメラに最も近いカードのtitle属性を基にalternateVideosを更新する関数
function backupdateAlternateVideosBasedOnClosestCard() {
    
    // カメラに最も近いカードのtitle属性（リストID）を取得
    const closestCardTitle = videos[0].category;
    
    alternateVideos = [];

    // targetIdに一致するリストを探す
    const targetList = allLists.find(list => list.id === closestCardTitle);

    // 該当するリストが見つかった場合、そのvideosをalternateVideosに設定
    if (closestCardTitle) {
        alternateVideos = targetList.videos;
    }
}

document.getElementById('changeListButton').addEventListener('click', () => {
    // リストの状態を切り替える
    isOriginalList = !isOriginalList;

    // ボタンのテキストと表示状態を切り替える
    if (isOriginalList) {
        backupdateAlternateVideosBasedOnClosestCard();
    // 新しいリストでカードを再生成
    const newVideos = isOriginalList ? videos : alternateVideos;
    regenerateCards(newVideos);
        document.getElementById('playCenterVideo').style.display = 'none'; // 「再生」ボタンを非表示にする
       // document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
        stopMedia(); // ユーザーが停止を要求
    } else {
        updateAlternateVideosBasedOnClosestCard();
    // 新しいリストでカードを再生成
    const newVideos = isOriginalList ? videos : alternateVideos;
    regenerateCards(newVideos);
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
     //   document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
    }
});

// カメラの制限を設定/解除するためのフラグ
let isCameraLocked = true;

// カメラの垂直回転を制限する
function lockCameraRotation() {
    controls.minPolarAngle = Math.PI / 2; // 水平面のみ
    controls.maxPolarAngle = Math.PI / 2; // 水平面のみ
    isCameraLocked = true;
}
// モデルがカメラを見続けるようにする
function ensureModelFacesCamera() {
    scene.traverse(function (node) {
        if (node.isMesh) {
            node.lookAt(camera.position);
        }
    });
}

// レンダリングループ
function animate() {
    ensureModelFacesCamera(); // モデルがカメラを向くように更新
    controls.update(); // 必要に応じてコントロールを更新
    renderer.render(scene, camera);
    updateCategoryLabel(); // カテゴリラベルを更新
    requestAnimationFrame(animate);
    findClosestCardInFrontOfCamera();
    // 最も近いカードのインデックスを取得
    const closestCardIndex = findClosestCardInFrontOfCamera();
    const activeList = isOriginalList ? videos : alternateVideos;

    if (closestCardIndex !== -1 && activeList[closestCardIndex]) {
        const closestCardURL = activeList[closestCardIndex].samnail; // 最も近いカードのURLを取得
        // URLが以前と異なる場合のみメディアを更新
        if (currentDisplayedURL !== closestCardURL) {
            displayMedia(closestCardURL);
            currentDisplayedURL = closestCardURL; // 現在表示されているURLを更新
        }
    }
    if (pivot) {
        pivot.lookAt(camera.position); // 支点がカメラの位置を向く
    }
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    // カードがカメラを向くように更新
    cards.forEach((card) => {
        card.lookAt(camera.position);
    });

    renderer.render(scene, camera);
}

// 初期状態でカメラの回転を制限
lockCameraRotation();

// レンダリングループ
function render() {
    requestAnimationFrame(render);
    renderer.setClearColor(0xF1EFE7, 1); // ここで背景色を設定
    renderer.render(scene, camera);
}

render();

// カードのサイズをウィンドウサイズに応じて調整する関数
function resizeCards() {
    const newVideos = isOriginalList ? videos : alternateVideos;
    regenerateCards(newVideos);
}

window.addEventListener('resize', function() {
    updateCardPositions();
    resizeCards();
    resetViewport();
});


//ここから会話リアルuniv
let audioQueueuniv = []; // 再生待ちの音声URLを保持するキュー

//ここまで

document.addEventListener('DOMContentLoaded', function() {
   // Socket.IOの接続を管理する関数
   async function initializeSocketConnection() {
    try {
        const socket = io.connect("https://selftalk.onrender.com");

        socket.on('connect', function() {
            console.log('Connected to the server.');

            // 新たに追加したボタンのイベントリスナーを設定
            document.getElementById('specialButton').addEventListener('click', function() {
                // specialModeがtrueならfalseに、falseならtrueに設定
    specialMode = !specialMode;

    // specialModeの状態に応じて異なる動作を行う
    if (specialMode) {
        this.textContent = '質問モード';
        console.log('Special mode enabled');
    } else {
        this.textContent = '深掘りモード';
        console.log('Special mode disabled');
    }
    socket.emit('restart', {'id': Id });
            });
             // 新たに追加したボタンのイベントリスナーを設定
             document.getElementById('restart').addEventListener('click', function() {

                socket.emit('restart', {'id': Id });
                console.log('restart');
            });
            // 新たに追加したボタンのイベントリスナーを設定
            document.getElementById('company').addEventListener('click', function() {

                socket.emit('company', {'id': Id });
                console.log('company');
            });
            document.getElementById('sendButton').addEventListener('click', function() {
                const text = document.getElementById('textInput').value;
                if (text) {
                    // specialModeがtrueの時、エンドポイントを変更
                    const endpoint = specialMode ? 'specialEndpoint' : 'textuniv';
                    socket.emit(endpoint, { 'text': text, 'id': Id });
                    console.log(`Sent text to the server (${endpoint}):`, text);

                    // 送信直後にテキストボックスをクリア
                    document.getElementById('textInput').value = '';
                    if (audioPlaybackAllowed) {
                        checkAndPlayAudio();
                    } else {
                        console.log('Audio playback not allowed by the user.');
                    }
                }
            });
        });

        return socket;
        } catch (error) {
            console.error('Failed to initialize socket connection:', error);
        }
    }

    // IDを生成し、サーバーからのイベントをリッスンする関数
    function setupEventListeners(socket, Id) {
        if (!socket) return;

        console.log(`Listening on audio_url_${Id}`);
        socket.on(`audio_url_${Id}`, function(data) {
            console.log('Received audio URL from the server:', data.url);
            if (audioPlaybackAllowed) {
                queueAudiouniv(data.url);
            } else {
                console.log('Audio playback not allowed by the user.');
            }
        });

        socket.on(`response_${Id}`, function(data) {
            console.log('Success:', data.response);
            document.getElementById('responseContainer').textContent = '応答: ' + data.response;

            if (data.global_contentss) {
                const contents = data.global_contentss.split(',').reduce((acc, current) => {
                    const [key, value] = current.split(':');
                    acc[key.trim()] = value.trim();
                    return acc;
                }, {});

                console.log('Parsed contents:', contents);
                answerposition(contents['id'], contents['category']);
            }
               // フォーカスを外して画面のズームをリセットする
        document.getElementById('textInput').blur();
        
        // 必要に応じてビューポートをリセットする
        resetViewport();
        });
    }

    // ユーザーIDを生成
    const Id = crypto.randomUUID();
    console.log(`Generated User ID: ${Id}`);

    // Socket.IOの接続を初期化し、イベントリスナーを設定
    initializeSocketConnection().then(socket => {
        setupEventListeners(socket, Id);
    });
});

function startPlayAudio() {
    if (!isPlaying2) {
        console.log('pretalkstart');
       
            const audioFiles = [
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E5%A5%B3%E6%80%A7/%E5%A5%B3%E6%80%A7%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240322_062756_75e3613a9c464a3d97b7523c191caf29.mp3',
                
            ];
            // ランダムに1つ選択
            const selectedFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            queueAudiouniv(selectedFile); // 選択された音声をキューに追加
    }
}
// 音声の再生状態を確認し、必要に応じて再生を開始する関数
function checkAndPlayAudio() {
    if (!isPlaying2) {
        console.log('pretalkstart');
        setTimeout(() => {
            const audioFiles = [
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E5%A5%B3%E6%80%A7/%E5%A5%B3%E6%80%A7%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%882_20240322_062907_cb6658177eaa4dffa1560bc9ac7456b2.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E5%A5%B3%E6%80%A7/%E5%A5%B3%E6%80%A7%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%883_20240322_062928_20146c36efc242d492dac362a7e26fe2.mp3',
            ];
            // ランダムに1つ選択
            const selectedFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            queueAudiouniv(selectedFile); // 選択された音声をキューに追加

        }, 1500); // 1秒遅延させてから音声を再生
    }
}

 // オーディオをキューに追加し、再生を試みる関数
 function queueAudiouniv(audioUrl) {
  audioQueueuniv.push(audioUrl); // キューにURLを追加
  if (!isPlaying2) {
      playNextAudiouniv(); // 再生中でなければ次の音声を再生
  }
}

// キューから次の音声を再生する関数
function playNextAudiouniv() {
    if (audioQueueuniv.length > 0 && !isPlaying2) {
    isPlaying2 = true;
    const url = audioQueueuniv.shift(); // キューから次のURLを取得し、キューから削除
    const audio = document.getElementById('audioPlayer2');
    audio.src = url;
    audio.play().then(() => {
    console.log(`Playing audio URL: ${url}`);
    }).catch(error => {
    console.error(`Error playing ${url}:`, error);
    });
    audio.onended = () => {
    isPlaying2 = false; // 再生が終了したらフラグを下ろし、次の音声を再生
    playNextAudiouniv();
    };
    } else if (audioQueueuniv.length === 0) {
    isPlaying2 = false; // キューが空になったら再生中フラグを下ろす
    }
    }

// 修正されたanswerposition関数（仮の実装）
function answerposition(id, category) {
    // idとcategoryに基づいて処理を行う
    // リストの状態を切り替える
    isOriginalList = !isOriginalList;
    
    // （リストID）を取得
    const closestCardTitle =id
    
    alternateVideos = [];

    // targetIdに一致するリストを探す
    const targetList = allLists.find(list => list.id === closestCardTitle);

    // 該当するリストが見つかった場合、そのvideosをalternateVideosに設定
    if (closestCardTitle) {
        alternateVideos = targetList.videos;
    }

    // 新しいリストでカードを再生成
    const newVideos = isOriginalList ? videos : alternateVideos;
    regenerateCards(newVideos);

    // 指定されたカテゴリに一致する要素のインデックスを見つける
    const categoryToMatch = category;
    let matchingIndex = -1; // 一致する要素がない場合は-1を保持

    for (let i = 0; i < newVideos.length; i++) {
      if (newVideos[i].category === categoryToMatch) {
        matchingIndex = i;
        break; // 一致する要素が見つかったらループを抜ける
    }
}

// カードの位置を取得
const cardPosition = cardPositions[matchingIndex];
    if (cardPosition) {
        // カードの中心からカメラまでのオフセット（半径 + 追加のオフセット）
        const cameraOffset = 8; // 半径が6なので、半径に等しい値を初期値として使用
        const additionalOffset = 4.5; // カードとカメラの間の追加の距離

        // カメラの位置を円周上のカードに合わせて更新し、追加のオフセットを考慮
        camera.position.x = cardPosition.x * (cameraOffset + additionalOffset) / cameraOffset;
        camera.position.y = 0; // Y座標は変更なし
        camera.position.z = cardPosition.z * (cameraOffset + additionalOffset) / cameraOffset;

        // カメラがシーンの原点（カードの中心点を向くようにする）
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }


    // ボタンのテキストと表示状態を切り替える
    if (isOriginalList) {
        document.getElementById('playCenterVideo').style.display = 'none'; // 「再生」ボタンを非表示にする
      //  document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
        stopMedia(); // ユーザーが停止を要求
    } else {
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
       // document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
    }
};

function toggleResponse() {
    var responseContainer = document.getElementById('responseContainer');
    var toggleButton = document.getElementById('toggleResponse');
    if (responseContainer.style.display === 'none') {
     responseContainer.style.display = 'block';
     toggleButton.textContent = '返答を隠す';
    } else {
     responseContainer.style.display = 'none';
     toggleButton.textContent = '返答を表示';
    }
 }

 var selectedVideoIndex = -1; // 選択されたビデオのインデックスを初期化

 // メニュー内に現在アクティブなリストの全てのtitleをボタンとして表示する関数
 function updateMenuTitles() {
    const activeList = isOriginalList ? videos : alternateVideos;
    const menu = document.getElementById('menuContent');
    menu.innerHTML = '';

    activeList.forEach((video, index) => {
        const button = document.createElement('button');
        button.textContent = video.category;
        button.className = 'video-button';
        button.setAttribute('data-index', index);
        button.addEventListener('click', function() {
            selectedVideoIndex = this.getAttribute('data-index');
            console.log("Selected video index: ", selectedVideoIndex);

            if (isOriginalList) {
                // リストの状態がtrueの場合、既存の処理を実行
                // リストの状態を切り替える
                isOriginalList = !isOriginalList;

                updateAlternateVideosBasedOnList();
                // 新しいリストでカードを再生成
                const newVideos = isOriginalList ? videos : alternateVideos;
                regenerateCards(newVideos);
                // ボタンのテキストと表示状態を切り替える
    if (isOriginalList) {
        document.getElementById('playCenterVideo').style.display = 'none'; // 「再生」ボタンを非表示にする
       // document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
    } else {
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
        //document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
    }
            } else {
                playCenterMedia(selectedVideoIndex); 
                console.log("Alternate process for non-original list");
            }

            toggleMenu(); // メニューを閉じる
        });
        menu.appendChild(button);
    });
}

function toggleMenu() {
    const menuallContent = document.getElementById('menuallContent');
    const menuContent = document.getElementById('menuContent');
    const hamburger = document.querySelector('.hamburger-menu');
    
    // メニューとハンバーガーメニューの表示を切り替える
    if (menuallContent.style.display === 'block') {
      menuallContent.style.display = 'none';
      menuContent.style.display = 'none';
      hamburger.classList.remove('change'); // ハンバーガーメニューを元に戻す
    } else {
      menuallContent.style.display = 'block';
      menuContent.style.display = 'block';
      hamburger.classList.add('change'); // ハンバーガーメニューをXマークに変更する
    }
  }
  

// ハンバーガーメニューをクリックしたときのイベントリスナー
document.querySelector('.hamburger-menu').addEventListener('click', function() {
    updateMenuTitles();
    toggleMenu(); // メニューの表示/非表示を切り替える
});

  // ページの読み込みが完了したらinit関数を呼び出し
window.addEventListener('load', init);

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('myModal')) {
        document.getElementById('myModal').style.display = 'none';
        // モーダルを表示するボタンを再表示する
        document.getElementById('showModalButton').style.display = 'block';
    }
});


// カメラに最も近いカードのcategory属性を基にalternateVideosを更新する関数
function updateAlternateVideosBasedOnList() {
    
    const closestCardIndex = selectedVideoIndex;
    
    // カメラに最も近いカードのtitle属性（リストID）を取得
    const closestCardTitle = videos[closestCardIndex].category;
    
    alternateVideos = [];

    // targetIdに一致するリストを探す
    const targetList = allLists.find(list => list.id === closestCardTitle);

    // 該当するリストが見つかった場合、そのvideosをalternateVideosに設定
    if (closestCardTitle) {
        alternateVideos = targetList.videos;
    }
}

document.getElementById('playbackRate').addEventListener('change', function() {
    const playbackRate = this.value;
    if (currentAudio) {
      currentAudio.playbackRate = playbackRate;
    }
  });  

let isPlaying2 = false; // 現在再生中かどうかを示すフラグ