
const weatherStatus = document.querySelector("#weather-status");

const weatherDescriptions = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분적으로 흐림",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  56: "약한 어는 이슬비",
  57: "강한 어는 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  66: "약한 어는 비",
  67: "강한 어는 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "약한 눈 소나기",
  86: "강한 눈 소나기",
  95: "천둥번개",
  96: "약한 우박을 동반한 천둥번개",
  99: "강한 우박을 동반한 천둥번개",
};

function showLocationError(error) {
  if (error.code === 1) {
    weatherStatus.textContent =
      "위치 권한이 차단되어 있어요. 브라우저 사이트 설정에서 위치를 허용해 주세요.";
  } else if (error.code === 2) {
    weatherStatus.textContent =
      "현재 위치를 확인할 수 없어요. 기기의 위치 서비스가 켜져 있는지 확인해 주세요.";
  } else if (error.code === 3) {
    weatherStatus.textContent = "위치 확인 시간이 초과됐어요. 다시 시도해 주세요.";
  } else {
    weatherStatus.textContent = "위치를 확인하지 못했어요. 다시 시도해 주세요.";
  }
}

async function showWeather(position) {
  const { latitude, longitude } = position.coords;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,relative_humidity_2m,weather_code",
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo 요청 실패: HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const units = data.current_units;
    if (
      !current ||
      typeof current.temperature_2m !== "number" ||
      typeof current.relative_humidity_2m !== "number" ||
      typeof current.weather_code !== "number" ||
      typeof current.time !== "string" ||
      !units ||
      typeof units.temperature_2m !== "string" ||
      typeof units.relative_humidity_2m !== "string"
    ) {
      throw new Error("Open-Meteo 응답에 현재 날씨 정보가 없습니다.");
    }

    const description = weatherDescriptions[current.weather_code] || "날씨 정보";
    console.log("현재 위치 날씨:", {
      time: current.time,
      weatherCode: current.weather_code,
      description,
      temperature: `${current.temperature_2m}${units.temperature_2m}`,
      humidity: `${current.relative_humidity_2m}${units.relative_humidity_2m}`,
    });
    weatherStatus.textContent = `${description} · ${current.temperature_2m}${units.temperature_2m} · 습도 ${current.relative_humidity_2m}${units.relative_humidity_2m} · ${current.time}`;
  } catch (error) {
    console.error("날씨 정보를 불러오지 못했습니다.", error);
    weatherStatus.textContent =
      "날씨 정보를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";
  }
}

function loadCurrentWeather() {
  if (!("geolocation" in navigator)) {
    weatherStatus.textContent =
      "이 브라우저는 위치 정보를 지원하지 않아요. 최신 브라우저에서 다시 시도해 주세요.";
    return;
  }

  if (!window.isSecureContext) {
    weatherStatus.textContent =
      "위치 정보는 보안 연결에서만 사용할 수 있어요. Live Server 주소(http://127.0.0.1)를 열어 주세요.";
    return;
  }

  weatherStatus.textContent = "위치 권한을 확인하고 있어요...";
  navigator.geolocation.getCurrentPosition(
    showWeather,
    function (error) {
      showLocationError(error);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

loadCurrentWeather();
