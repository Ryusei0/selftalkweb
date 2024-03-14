import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

document.getElementById('toggleResponse').addEventListener('click', toggleResponse);

// ページの読み込みが完了した後に実行される関数を定義
window.onload = function() {
    init(); // 3Dシーンの初期化
    animate(); // アニメーションループの開始
};

function resetViewport() {
    let viewportMeta = document.querySelector("meta[name=viewport]");
    if (!viewportMeta) {
        viewportMeta = document.createElement("meta");
        viewportMeta.name = "viewport";
        document.getElementsByTagName("head")[0].appendChild(viewportMeta);
    }
    viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0");
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const y = 0;
camera.position.set(0, y, 12.5);
// グローバル変数の宣言部分
let currentAudio = null;
let currentVideoElement = null; // 動画要素を追跡するために追加
let isPlaying = false;
let currentIndex = 0; // 現在のカードのインデックスを追跡
let cards = []; // Use let if you plan to reassign cards
// 現在のリストが元のリストかどうかを追跡
let isOriginalList = true;
let currentDisplayedURL = ''; // 現在表示されているURLを追跡


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

const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -7;
plane.receiveShadow = true;
scene.add(plane);

const radius = 8;
const videoTextures = [];
const cardWidth = 3.2;
const cardHeight = 1.8;
// カードの座標を保存する配列
let cardPositions = [];
let cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight);

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
loader.setDRACOLoader(dracoLoader);

let mixer;

loader.load('https://s3.ap-northeast-3.amazonaws.com/testunity1.0/webar/223S.gltf', function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.scale.set(0.114, 0.114, 0.114);
    
    // モデルの位置を調整
    gltf.scene.position.y = -6; // Y軸（上下位置）を調整。モデルを下に移動させる
    gltf.scene.position.z = 1; // Z軸（前後位置）を調整。必要に応じて前後に移動
    gltf.scene.position.x = -0.3;

    gltf.scene.traverse(function (node) {
        if (node.isMesh) { node.castShadow = true; }
    });
    mixer = new THREE.AnimationMixer(gltf.scene);
    if (gltf.animations.length) {
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });
    }
}, undefined, function (error) {
    console.error(error);
});

const clock = new THREE.Clock();

// 動画リストの準備
const videos = [
    { category: "当サイトについて",title:"list1", name: "ビデオ1",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg", url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg" },
    { category: "私たちの目指す未来", title:"list2",name: "ビデオ2",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E7%A7%81%E3%81%9F%E3%81%A1%E3%81%AE%E6%9C%AA%E6%9D%A5.jpg" , url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E7%A7%81%E3%81%9F%E3%81%A1%E3%81%AE%E6%9C%AA%E6%9D%A5.jpg" },
    { category: "FirstAIについて", title:"list2",name: "ビデオ0",samnail:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/FirstAI.jpg", url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/FirstAI.jpg" },
    { category: "事業詳細", title:"list2",name: "ビデオ3",samnail:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E4%BA%8B%E6%A5%AD%E8%A9%B3%E7%B4%B0.jpg" , url: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E4%BA%8B%E6%A5%AD%E8%A9%B3%E7%B4%B0.jpg" },
    // 他の動画をここに追加
];


// 複数のリストを保持する配列
const allLists = [
    {
        id: "当サイトについて",
        videos: [
            {planeid:1,category
                :"当サイトについて",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/Artificial+intelligence+to+Enhance+Language+Skills+Presentation+in+Blue+and+Purple+3D+Modern+Style+(2).mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240215_085026_858dab12be6142398953cfd2297c9480.mp3",time:17},
                {planeid:1,category
                :"こんな経験ありますか",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/Artificial+intelligence+to+Enhance+Language+Skills+Presentation+in+Blue+and+Purple+3D+Modern+Style+(1).mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%B0%8E%E5%85%A5%EF%BC%92_20240216_032001_465ed5af894146c09e7c40d5b9f48f81.mp3",time:12},
         {planeid:1,category
                :"webサイトの限界",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/Artificial+intelligence+to+Enhance+Language+Skills+Presentation+in+Blue+and+Purple+3D+Modern+Style+(2).mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%83%98%E3%82%9A%E3%82%A4%E3%83%B3_20240216_032031_b3ab9655d6464c5d84b285e16366779d.mp3",time:17},
                {planeid:1,category
                :"こんな経験なくしましょう",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/Artificial+intelligence+to+Enhance+Language+Skills+Presentation+in+Blue+and+Purple+3D+Modern+Style+(1).mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E8%A7%A3%E6%B1%BA%E3%81%B8_20240216_032100_0901556cc47146f2b45982d016f93958.mp3",time:12},
        {planeid:1,category
                :"私たちの強み",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/Artificial+intelligence+to+Enhance+Language+Skills+Presentation+in+Blue+and+Purple+3D+Modern+Style+(1).mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E7%89%B9%E5%BE%B4_20240216_032128_fbadab376de74be0bf32af0c4915ef87.mp3",time:12},
        ]
    },
    {
        id: "私たちの目指す未来",
        videos: [
            {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240215_085026_858dab12be6142398953cfd2297c9480.mp3",time:17},
                {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%B0%8E%E5%85%A5%EF%BC%92_20240216_032001_465ed5af894146c09e7c40d5b9f48f81.mp3",time:12},
         {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/0.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%83%98%E3%82%9A%E3%82%A4%E3%83%B3_20240216_032031_b3ab9655d6464c5d84b285e16366779d.mp3",time:17},
                {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/3.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E8%A7%A3%E6%B1%BA%E3%81%B8_20240216_032100_0901556cc47146f2b45982d016f93958.mp3",time:12},
        ]
    },
    {
        id: "FirstAIについて",
        videos: [
            {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240215_085026_858dab12be6142398953cfd2297c9480.mp3",time:17},
                {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%B0%8E%E5%85%A5%EF%BC%92_20240216_032001_465ed5af894146c09e7c40d5b9f48f81.mp3",time:12},
         {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/0.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%83%98%E3%82%9A%E3%82%A4%E3%83%B3_20240216_032031_b3ab9655d6464c5d84b285e16366779d.mp3",time:17},
                {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/3.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E8%A7%A3%E6%B1%BA%E3%81%B8_20240216_032100_0901556cc47146f2b45982d016f93958.mp3",time:12},
        ]
    },
    {
        id: "事業詳細",
        videos: [
            {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/1.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88_20240215_085026_858dab12be6142398953cfd2297c9480.mp3",time:17},
                {planeid:1,category:"大学について",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/2.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E5%B0%8E%E5%85%A5%EF%BC%92_20240216_032001_465ed5af894146c09e7c40d5b9f48f81.mp3",time:12},
         {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/0.mp4",text:"当サイトは、次世代の会話型ウェブサイトです。従来のサイトと違い、あなたが情報を探したり、欲しかった情報が見つけられずに、再検索したりする必要はありません。圧倒的に詳しく、そして分かりやすく、あなたの欲しい情報を届けます。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E3%83%98%E3%82%9A%E3%82%A4%E3%83%B3_20240216_032031_b3ab9655d6464c5d84b285e16366779d.mp3",time:17},
                {planeid:1,category:"学校生活",samnail: "https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E6%AC%A1%E4%B8%96%E4%BB%A3%E3%82%B5%E3%82%A4%E3%83%88.jpg",url
                :"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/videos/3.mp4",text:"私たちの強みは、圧倒的に賢いことです。情報量の制限はなく、あなたと1対1のコミュニケーションを実現します。何か知りたいことがあれば、下のテキストボックスから質問してくださいね。",mp3:"https://s3.ap-northeast-3.amazonaws.com/testunity1.0/audios/%E8%A7%A3%E6%B1%BA%E3%81%B8_20240216_032100_0901556cc47146f2b45982d016f93958.mp3",time:12},
        ]
    },
    // 他のリストをここに追加...
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
    if (mediaInfo.url.endsWith('.mp4')) {
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
        currentAudio = new Audio(mediaInfo.mp3);
        const playbackRate = document.getElementById('playbackRate').value; // 再生速度を取得
        currentAudio.playbackRate = playbackRate; // 再生速度を設定
        currentAudio.play();
        isPlaying = true; // 再生状態を更新
        if (playButton.textContent !== '停止') {
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
    if (extension === 'mp4' || extension === 'webm') {
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
        let texture;
        const isVideo = item.url.endsWith('.mp4');

        if (isVideo) {
            // 動画要素の作成
        const videoElement = document.createElement('video');
        videoElement.src = item.url;
        videoElement.crossOrigin = "anonymous";
        videoElement.preload = 'auto';
        // 動画の自動再生やループを無効化
        videoElement.muted = true; // ミュートは必要ですが、自動再生はしません
        videoElement.loop = false; // ループを無効化

        // テクスチャを動画から作成
        texture = new THREE.VideoTexture(videoElement);
        } else {
            // 画像の場合、THREE.TextureLoaderを使用してテクスチャをロード
            texture = new THREE.TextureLoader().load(item.url);
        }

        videoTextures.push(texture);

        const cardMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        card.userData = { index: index, type: isVideo ? 'video' : 'image', title: item.title };

        // シーンにカードを追加
        scene.add(card);
        cards.push(card); // カード配列にカードを追加
    });

    currentIndex = 0; // 最初のカードを中心に設定
    updateCardPositions(); // カードの位置を更新
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
        card.position.set(x, 0, z);
        card.lookAt(new THREE.Vector3(0, 0, 0)); // カードが原点（カメラの位置）を向くようにする

        // カードの座標を保存
        cardPositions[index] = { x: x, y: 0, z: z };
    });

    // 中心に来るカードの位置を設定する
    const centerCardPosition = cardPositions[currentIndex];
    if (centerCardPosition) {
        cards[currentIndex].position.set(0, 0, radius);
    }
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

document.getElementById('changeListButton').addEventListener('click', () => {
    // リストの状態を切り替える
    isOriginalList = !isOriginalList;

    updateAlternateVideosBasedOnClosestCard();
    // 新しいリストでカードを再生成
    const newVideos = isOriginalList ? videos : alternateVideos;
    regenerateCards(newVideos);

    // ボタンのテキストと表示状態を切り替える
    if (isOriginalList) {
        document.getElementById('playCenterVideo').style.display = 'none'; // 「再生」ボタンを非表示にする
        document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
        stopMedia(); // ユーザーが停止を要求
    } else {
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
        document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
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

// ウィンドウのリサイズイベントでカードのリサイズ関数を呼び出す
window.addEventListener('resize', resizeCards);

//ここから会話リアルuniv
let audioQueueuniv = []; // 再生待ちの音声URLを保持するキュー

//document.getElementById('inputContainer').onsubmit = function(event) {
 //   listenForAudioUrluniv();
  //  event.preventDefault();  // フォームのデフォルト送信を防止
 //   var userInput = document.getElementById('userInput').value;
 //   var responseContainer = document.getElementById('responseContainer');

    // 送信直後にテキストボックスをクリア
 //   document.getElementById('userInput').value = '';
  //  const data = { text: userInput };
  //  const backendUrl = 'http://127.0.0.1:8000/textuniv';

 //   fetch(backendUrl, {
   //   method: 'POST',
     // headers: {
    //      'Content-Type': 'application/json',
 //     },
//      body: JSON.stringify(data),
//  })
//  .then(response => response.json())
//  .then(data => {
 //     console.log('Success:', data);
  //    responseContainer.textContent = '応答: ' + data.response; // 応答をページに表示
 //     
  // サーバーからの応答に基づいてさらなる処理を行う
 //     if (data.global_contentss) {
      // global_contentss の値を解析する（例: "id: list1,category: 当サイトについて"）
  //      const contents = data.global_contentss.split(',').reduce((acc, current) => {
 //      const [key, value] = current.split(':');
  //      acc[key.trim()] = value.trim();
  //      return acc;
//        }, {});

  //      console.log('Parsed contents:', contents);
    // 修正後のanswerposition関数を呼び出す
  //      answerposition(contents['id'], contents['category']);
 //   }
//    })
 //  .catch((error) => {
//      console.error('Error:', error);
//  })
//  .finally(() => {
    // フォーカスを外して画面のズームをリセットする
//    document.getElementById('userInput').blur();

    // 必要に応じてビューポートをリセットする
 //   resetViewport();
//});
//};

//追加したところ継続通信
document.addEventListener('DOMContentLoaded', function() {
    var socket = io.connect("ws://127.0.0.1:8000");

    socket.on('connect', function() {
        console.log('Connected to the server.');

        // サーバーへメッセージ送信の例
        document.getElementById('sendButton').onclick = function() {
            var text = document.getElementById('textInput').value;
            socket.emit('textuniv', {'text': text});
            console.log('Sent text to the server:', text);
            document.getElementById('textInput').value = '';
            checkAndPlayAudio();
        };
    });

    socket.on('audio_url', function(data) {
        console.log('Received audio URL from the server:', data.url);
        // ここで受け取ったURLを使って何かする
        const audioUrl = data.url; // 正しくURLを取得
  console.log("Received audio URL: ", audioUrl);
  queueAudiouniv(audioUrl); // 修正: 受け取ったURLをキューに追加し、再生を試みる
    });
    socket.on('response', function(data) {
    console.log('Success:', data.response);
    responseContainer.textContent = '応答: ' + data.response; // 応答をページに表示
    // フォーカスを外して画面のズームをリセットする
document.getElementById('textInput').blur();

// 必要に応じてビューポートをリセットする
resetViewport();
});
});
//ここまで


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
    const audio = new Audio(url);
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

// ここまで

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
        document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
        stopMedia(); // ユーザーが停止を要求
    } else {
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
        document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
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
        document.getElementById('showModalButton').style.display = 'none'; // 「詳しく見る」ボタンを非表示にする
        document.getElementById('changeListButton').textContent = '詳細';
    } else {
        document.getElementById('playCenterVideo').style.display = 'block'; // 「再生」ボタンを表示する
        document.getElementById('changeListButton').textContent = '戻る'; // ボタンのテキストを「戻る」に変更
        document.getElementById('showModalButton').style.display = 'block'; // 「戻る」ボタンを表示する
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

// メニューの表示/非表示を切り替える関数
function toggleMenu() {
    const menuallContent = document.getElementById('menuallContent');
    const menuContent = document.getElementById('menuContent');
    if (menuallContent.style.display === 'block') {
        menuallContent.style.display = 'none';
        menuContent.style.display = 'none';
    } else {
        menuallContent.style.display = 'block';
        menuContent.style.display = 'block';
    }
}

// ハンバーガーメニューをクリックしたときのイベントリスナー
document.querySelector('.hamburger-menu').addEventListener('click', function() {
    updateMenuTitles();
    toggleMenu(); // メニューの表示/非表示を切り替える
});

  // ページの読み込みが完了したらinit関数を呼び出し
window.addEventListener('load', init);

// モーダルの表示・非表示の制御にボタンの表示状態を追加
document.getElementById('showModalButton').addEventListener('click', function() {
    document.getElementById('myModal').style.display = 'block';
    // モーダルを表示するボタンを非表示にする
    this.style.display = 'none';
    populateModalContent();
});

document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('myModal').style.display = 'none';
    // モーダルを表示するボタンを再表示する
    document.getElementById('showModalButton').style.display = 'block';
});

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

// モーダルに文字と画像を追加する関数
function populateModalContent() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = ''; // コンテンツをクリア

    // 文字の追加
    const textContent = document.createElement('p');
    textContent.textContent = 'ここにモーダルのテキストが表示されます。';
    textContent.style.color = ' white';
    modalBody.appendChild(textContent);

    // 画像の追加
    const image = document.createElement('img');
    image.src = 'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/image/%E4%BA%8B%E6%A5%AD%E8%A9%B3%E7%B4%B0.jpg';
    image.alt = '画像の説明';
    image.classList.add('modal-image'); // CSSクラスを適用
    modalBody.appendChild(image);
}

document.getElementById('playbackRate').addEventListener('change', function() {
    const playbackRate = this.value;
    if (currentAudio) {
      currentAudio.playbackRate = playbackRate;
    }
  });  


//ここから会話リアル

// 切り替えボタンのクリックイベントリスナーを設定
document.getElementById('lockCameraButton').addEventListener('click', function() {
    // 各要素を取得
    var inputContainer = document.getElementById('inputContainer');
    var textForm = document.getElementById('textForm');
    listenForAudioUrl();

    // inputContainerとtextFormの表示状態を切り替える
    if (window.getComputedStyle(inputContainer).display === 'none') {
        inputContainer.style.display = 'flex'; // inputContainerを表示
        textForm.style.display = 'none'; // textFormを非表示
    } else {
        inputContainer.style.display = 'none'; // inputContainerを非表示
        textForm.style.display = 'flex'; // textFormを表示
    }
});

let audioQueue = []; // 再生待ちの音声URLを保持するキュー
let isPlaying2 = false; // 現在再生中かどうかを示すフラグ

// 音声の再生状態を確認し、必要に応じて再生を開始する関数
function checkAndPlayAudio() {
    if (!isPlaying2) {
        console.log('pretalkstart');
        setTimeout(() => {
            const audioFiles = [
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%88%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%A8%E3%83%BC%E3%81%86%E3%82%93%E3%81%86%E3%82%93%E3%81%9D%E3%81%86%E3%81%9F%E3%82%99%E3%82%88%E3%81%AD%E3%83%BC%E3%83%BC%E3%81%A3_20240313_092232_dcec76db40fe42d69b4f1d41276b1883.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%86%E3%83%BC%E3%82%93%E3%81%AA%E3%82%8B%E3%81%BB%E3%81%A8%E3%82%99%E3%81%AD%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A1%E3%82%87%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%A8%E5%BE%85%E3%81%A3%E3%81%A6%E3%81%AD_20240313_092208_c6b4304e09b447f18f997407c2ae33c4.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%86%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%82%93%E3%81%9D%E3%81%86%E3%81%9F%E3%82%99%E3%82%88%E3%81%AD%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%86%E3%82%93%E3%81%86%E3%82%93_20240313_092145_735ef3f41cf64ca1bbf4cbe6065edf23.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%86%E3%82%93%E3%81%86%E3%82%93%E3%81%A1%E3%82%87%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%A8%E5%BE%85%E3%81%A3%E3%81%A6%E3%81%AD%E3%81%9D%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%9F%E3%82%99%E3%82%88%E3%81%AD%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC_20240313_092059_9c27620ac70244a2b86d1f3d8515e68e.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%A1%E3%82%87%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%A8%E5%BE%85%E3%81%A3%E3%81%A6%E3%81%AD%E3%81%9D%E3%81%86%E3%81%9F%E3%82%99%E3%82%88%E3%81%AD%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%86%E3%82%93%E3%81%86%E3%82%93_20240313_092030_e230ebdc48c84c6692e176443423dc4c.mp3',
                'https://s3.ap-northeast-3.amazonaws.com/testunity1.0/pretalk/%E3%81%88%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A3%E3%81%A8%E3%83%BC%E3%81%9D%E3%81%86%E3%81%9F%E3%82%99%E3%82%88%E3%81%AD%E3%83%BC%E3%83%BC%E3%83%BC%E3%81%A3_20240313_091952_caea7c56e51e44cdb2e018dd076e5a9d.mp3',
                // 他にも追加可能
            ];
            // ランダムに1つ選択
            const selectedFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            queueAudiouniv(selectedFile); // 選択された音声をキューに追加

        }, 1500); // 1秒遅延させてから音声を再生
    }
}
document.getElementById('textForm').onsubmit = function(event) {
    event.preventDefault();  // フォームのデフォルト送信を防止
    const textInput = document.getElementById('textInput').value;
    const data = { text: textInput };
    const backendUrl = 'http://127.0.0.1:8000/text';

    fetch(backendUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
      console.log('Success:', data);
  })
  .catch((error) => {
      console.error('Error:', error);
  })
};

function listenForAudioUrl() {
    const eventSourceUrl = 'http://127.0.0.1:8000/events';
    const eventSource = new EventSource(eventSourceUrl);
    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      const audioUrl = data.url; // 正しくURLを取得
      console.log("Received audio URL: ", audioUrl);
      queueAudio(audioUrl); // 修正: 受け取ったURLをキューに追加し、再生を試みる
  };  

    eventSource.onerror = function(event) {
        console.error("EventSource failed.");
        eventSource.close();  // エラーが発生したら接続を閉じる
    };
}

 // オーディオをキューに追加し、再生を試みる関数
 function queueAudio(audioUrl) {
  audioQueue.push(audioUrl); // キューにURLを追加
  if (!isPlaying2) {
      playNextAudio(); // 再生中でなければ次の音声を再生
  }
}

// キューから次の音声を再生する関数
function playNextAudio() {
  if (audioQueue.length > 0 && !isPlaying2) {
    isPlaying2 = true;
    const url = audioQueue.shift(); // キューから次のURLを取得し、キューから削除
    const audio = new Audio(url);
    audio.play().then(() => {
      console.log(`Playing audio URL: ${url}`);
    }).catch(error => {
      console.error(`Error playing ${url}:`, error);
    });
    audio.onended = () => {
      isPlaying2 = false; // 再生が終了したらフラグを下ろし、次の音声を再生
      playNextAudio();
    };
  } else if (audioQueue.length === 0) {
    isPlaying2 = false; // キューが空になったら再生中フラグを下ろす
  }
}

// ここまで