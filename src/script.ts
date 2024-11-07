import { Loader } from "@googlemaps/js-api-loader";

const clientId = "Client ID"; // Replace with your client id
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
var average = 0;

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    var accessToken = await getAccessToken(clientId, code);
}

const loader = new Loader({
        apiKey: "API Key" //replace with api key
    });

    await loader.load();


const btn = document.getElementById("calculate-button");
let playName = <HTMLInputElement> document.getElementById("playlist-form");
let destName = <HTMLInputElement> document.getElementById("destination-form");
btn.addEventListener("click", (e:Event) => calculate(playName.value, destName.value));
  

async function calculate(name:string, destination:name) { 
    let durationMS = 0; 
    let playlist = await fetchPlaylist(accessToken, name);
    let total = playlist.playlists.items[0].tracks.total;
    let trackResponse = await fetchTracks(accessToken, playlist.playlists.items[0].tracks.href);
    for (let i = 0; i < trackResponse.items.length; i++) {
        durationMS += trackResponse.items[i].track.duration_ms;
    }
    let durationS = durationMS / 1000;
    average = durationS/total;
    fetchPos(destination);
    loading();
}

async function fetchPos(destination:string) {
    
    navigator.geolocation.getCurrentPosition(function(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        let pos = new google.maps.LatLng(lat, lon);
        console.log(lat);
        console.log(lon);
        console.log(pos);
        fetchRoute(pos, destination);
    });
    
}

async function fetchRoute(originPos: any, destination: string) {
    var directionsService = new google.maps.DirectionsService();
    let route = await directionsService
    .route({
      origin: 
        originPos,
      destination: {
        query: destination,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    })
    populateUI(route);
}

async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
  const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchPlaylist(token: string, name: string): Promise<any> {
    var formatName:string = name.replace(" ", "+").replace("&", "%26")
    var url:string = "https://api.spotify.com/v1/search?q="+formatName+"&type=playlist"
    let result = await fetch(url, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    // console.log(result.json());
    return await result.json();
}

async function fetchTracks(token: string, url: string): Promise<any> {
    let result = await fetch(url, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    // console.log(result.json());
    return await result.json();
}

function loading() {
    document.getElementById("song")!.innerText = "...";
    document.getElementById("time")!.innerText = "...";
    document.getElementById("distance")!.innerText = "...";
}

async function populateUI(route: any) {
    let num = Math.floor(route.routes[0].legs[0].duration.value / average);
    document.getElementById("song")!.innerText = num;
    document.getElementById("time")!.innerText = route.routes[0].legs[0].duration.text;
    document.getElementById("distance")!.innerText = route.routes[0].legs[0].distance.text;
}