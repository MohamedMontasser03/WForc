let SW = null;
let language = null;
const body = document.body;
const header = document.getElementsByTagName("header")[0];
const foot = document.getElementsByTagName("footer")[0];

/* Start PWA Handling */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", {
      scope: "/",
    })
    .then((registration) => {
      SW =
        registration.installing || registration.waiting || registration.active;
    });

  navigator.serviceWorker.addEventListener("controllerchange", async () => {
    SW = navigator.serviceWorker.controller;
  });

  navigator.serviceWorker.addEventListener("message", (e) => {
    switch (e.data.type) {
      case 0:
        break;
    }
  });
}

function sendMessage(data) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(data);
  }
}

/* End PWA Handling */

/* Start SPA Handling */
const parent = document.getElementById("page");

const appinit = () => {
  let base = `https://api.weatherapi.com/v1`;
  let key = "72db3d3cceb14a7e950173148212010";

  let weathCard = document.getElementsByClassName("cur")[0];
  let loc = document.getElementById("loc");
  let hoursec = document.getElementsByClassName("hourly")[0];
  let daysec = document.getElementsByClassName("daily")[0];
  /* Start Click Events */
  let clickables = document.querySelectorAll("[click]");
  HandleClicks(clickables, fetchWeather);
  /* End Click Events */

  /* Start Handle Weather Fetch */

  async function fetchWeather(lat, long) {
    try {
      let [rdata, rdataforc] = await Promise.all([
        fetch(
          `${base}/current.json?key=${key}&q=${lat},${long}${
            language !== "en" ? `&lang=${language}` : ""
          }`
        ),
        fetch(
          `${base}/forecast.json?key=${key}&q=${lat},${long}&days=3${
            language !== "en" ? `&lang=${language}` : ""
          }`
        ),
      ]);
      let [data, dataforc] = await Promise.all([
        rdata.json(),
        rdataforc.json(),
      ]);
      setcurWeath(data);
      loc.textContent = `${data.location.name} - ${data.location.region} - ${data.location.country}`;

      /* Start Hourly Forcast Styling */
      let hourCards = document.querySelectorAll(".hourly .weath");
      for (let i = 0; i < hourCards.length; i++) {
        const el = hourCards[i];
        let date = new Date(Date.parse(data.location.localtime));
        date.setHours(date.getHours() + i);
        let hour = (+date.getHours() + i) % 24;
        let day = +date.getHours() + i >= 24;
        const res = dataforc.forecast.forecastday[+day].hour[hour];

        el.children[0].textContent = date.toLocaleString(language, {
          hour: "numeric",
        });
        el.children[1].setAttribute(
          "src",
          `res/icons/weather/64x64/${+res.is_day ? "day" : "night"}/${
            res.condition.icon.split("/")[6]
          }`
        );
        templateArgs(el.children[2], res.temp_c + "°", res.feelslike_c + "°");
        templateArgs(el.children[3], res.condition.text);
      }
      /* End Hourly Forcast Styling */

      /* Start Daily Forcast Styling */
      let dayCard = document.querySelectorAll(".daily .weath");
      for (let i = 0; i < dayCard.length; i++) {
        const el = dayCard[i];

        let day = new Date(Date.parse(data.location.localtime));
        day.setDate(day.getDate() + i);
        const res = dataforc.forecast.forecastday[i].day;

        el.children[0].textContent = day.toLocaleString(language, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        el.children[1].children[0].setAttribute(
          "src",
          `res/icons/weather/64x64/day/${res.condition.icon.split("/")[6]}`
        );
        el.children[1].children[1].setAttribute(
          "src",
          `res/icons/weather/64x64/night/${res.condition.icon.split("/")[6]}`
        );
        templateArgs(el.children[2], res.maxtemp_c + "°", res.mintemp_c + "°");
        templateArgs(el.children[3], res.avgtemp_c + "°");
        templateArgs(
          el.children[4],
          res.condition.text === "Sunny" ? "Clear" : res.condition.text
        );
      }
      /* End Daily Forcast Styling */

      LoadDone();
    } catch (err) {
      console.log(err);
    }
  }

  navigator.geolocation.getCurrentPosition(
    (loc) => fetchWeather(loc.coords.latitude, loc.coords.longitude),
    (err) => fetchWeather(0, 0),
    {
      enableHighAccuracy: true,
      timeout: 2500,
    }
  );

  function setcurWeath(data) {
    /* Start Setting Up main weather */
    let isDay = +data.current.is_day;

    const el = weathCard;

    el.children[0].textContent = new Date(
      Date.parse(data.location.localtime)
    ).toLocaleString(language, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    templateArgs(el.children[2], data.current.condition.text);
    el.children[3].children[0].setAttribute(
      "src",
      `res/icons/weather/64x64/${isDay ? "day" : "night"}/${
        data.current.condition.icon.split("/")[6]
      }`
    );
    el.children[3].children[1].textContent = data.current.temp_c + "°";
    el.children[3].children[1].style.color = isDay ? "yellow" : "aqua";
    templateArgs(el.children[3].children[2], `${data.current.feelslike_c}°`);
    templateArgs(el.children[4].children[0], data.current.cloud);
    templateArgs(
      el.children[4].children[1],
      `${data.current.wind_kph} Kilometer/Hour ${data.current.wind_dir}`
    );
    templateArgs(el.children[4].children[2], data.current.humidity);
    templateArgs(
      el.children[4].children[3],
      data.current.pressure_mb + " milli-bar"
    );
    templateArgs(el.children[4].children[4], data.current.uv);

    /* End Setting Up main weather */
  }

  /* End Handle Weather Fetch */

  /* Start Animation Handler */

  /* Start Loading Handler */

  function LoadDone() {
    foot.style.removeProperty("transform");
    hoursec.style.removeProperty("display");
    daysec.style.removeProperty("display");
    document.getElementsByClassName("ref")[0].style.removeProperty("display");
    // locSearch.parentElement.style.removeProperty("display");

    let loader = document.querySelectorAll(".loading");
    for (let i = 0; i < loader.length; i++) {
      const el = loader[i];
      el.classList.remove("load-anim-both");
      el.classList.remove("load-anim-l");
      el.classList.remove("load-anim-around");
      el.style.removeProperty("--del");

      el.classList.remove("loading");
    }
  }

  /* End Loading Handler */

  /* Start Fadin Handler */
  var observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.setProperty("--playfade", "running");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.333,
    }
  );

  let fadins = document.querySelectorAll(".fadin");
  for (let i = 0; i < fadins.length; i++) {
    const el = fadins[i];
    observer.observe(el);
  }

  /* End Fadin Handler */

  /* End Animation Handler */
};

const pages = {
  "/": {
    html: "app.html",
    title: 0,
    js: appinit,
  },
  "/about": {
    html: "about.html",
    title: 2,
    js: () => {},
  },
  404: {
    html: "404.html",
    title: 8,
    js: () => {
      history.replaceState(null, null, "/404");
    },
  },
};

async function handleTranslation(page) {
  let langMsgs = await (
    await fetch(`./pages/${language}/messages.json`)
  ).json();
  document.title = langMsgs[page.title];
  if (body.parentElement.getAttribute("lang") === language) {
    return;
  }
  body.parentElement.setAttribute("lang", language);
  let elToTrans = document.querySelectorAll("[msg]");
  let ttpToTrans = document.querySelectorAll("[ttp-msg]");

  elToTrans.forEach((el) => {
    el.textContent = langMsgs[el.getAttribute("msg")];
  });
  ttpToTrans.forEach((el) => {
    el.setAttribute("tool-tip", langMsgs[el.getAttribute("ttp-msg")]);
  });
}

async function navigate(addres) {
  let page = pages[addres] || pages["404"];
  let html = await fetch(`./pages/${language}/` + page.html);
  await handleTranslation(page);

  parent.innerHTML = await html.text();

  let [lang, home, about] = document.querySelectorAll("header li");

  switch (location.pathname) {
    case "/":
      home.classList.add("active");
      about.classList.remove("active");
      break;
    case "/about":
      home.classList.remove("active");
      about.classList.add("active");
      break;
    default:
      home.classList.remove("active");
      about.classList.remove("active");
  }

  page.js();
}

window.addEventListener("popstate", (e) => {
  navigate(location.pathname);
});
window.addEventListener("storage", (e) => {
  if (e.key === "lang" && language != e.newValue) {
    setLanguage(e.newValue);
  }
});

/* End SPA Handling */

function switchLang() {
  switch (language) {
    case "ar":
      body.style.setProperty("direction", "rtl");
      break;
    case "en":
      body.style.setProperty("direction", "ltr");
      break;
    default:
      break;
  }
}

function setLanguage(lang) {
  let langB = document.getElementsByClassName("lang")[0];

  if (langB.classList.contains(lang) && language) {
    return;
  }

  langB.classList.replace(langB.classList.item(1), lang);
  localStorage.setItem("lang", lang);
  language = lang;
  navigate(location.pathname);
  switchLang();
}

window.onload = () => {
  setLanguage(localStorage.getItem("lang") || "en");

  const onBodyResize = new ResizeObserver((entries) => {
    let BOS =
      parent.clientHeight + header.clientHeight + foot.clientHeight >
      innerHeight;
    body.style.height = BOS ? "100%" : "100vh";

    foot.style.setProperty(
      "transform",
      `translateY(calc(${
        body.clientHeight - foot.offsetTop - foot.clientHeight
      }px ${!BOS ? "- 1rem" : ""} ))`
    );
  });

  onBodyResize.observe(parent);

  /* Start Click Events */
  let clickables = document.querySelectorAll("[click]");
  HandleClicks(clickables);
  /* End Click Events */
};

function HandleClicks(clickables, fetchWeather) {
  clickables.forEach((el, i, p) => {
    el.onclick = (e) => {
      switch (el.getAttribute("click")) {
        case "refw":
          el.style.setProperty("--play", "running");
          navigator.geolocation.getCurrentPosition(
            async (loc) => {
              await fetchWeather(loc.coords.latitude, loc.coords.longitude);
              el.style.setProperty("--play", "paused");
            },
            (err) => fetchWeather(0, 0),
            {
              enableHighAccuracy: true,
              timeout: 2500,
            }
          );
          break;
        case "lang":
          setLanguage(localStorage.getItem("lang") === "en" ? "ar" : "en");
          break;
        case "link":
          if (!el.classList.contains("active")) {
            const lnk = el.getAttribute("lnk");

            history.pushState(null, null, lnk);
            navigate(lnk);
          }
          break;
        case "cpyemail":
          navigator.clipboard.writeText("mohamed.montasser0385@gmail.com");
          useAlert("Email Copied");
          break;
        case "cpyphone":
          navigator.clipboard.writeText("+201090376725");
          useAlert("Phone Number Copied");
          break;
        default:
          el.onclick = (e) => e.preventDefault();
      }
    };
  });
}

/* Start Simple Html/Css Templating */

function templateArgs(element, ...args) {
  for (let i = 0; i < args.length; i++) {
    const value = args[i];
    element.innerHTML = element.innerHTML.replace("-$-", value);
  }
}

/* Start Tool tip Handling */
let tooltip = document.getElementById("tool-tip");
let tooltipEls = document.querySelectorAll("[tool-tip]");

tooltipEls.forEach((el, i, p) => {
  el.onmouseenter = (e) => {
    tooltip.textContent = el.getAttribute("tool-tip");
    tooltip.style.setProperty(
      "top",
      `${el.getBoundingClientRect().y + +el.getAttribute("tool-tip-top")}px`
    );
    tooltip.style.setProperty(
      "left",
      `${el.getBoundingClientRect().x + el.clientWidth + 5}px`
    );
    tooltip.style.setProperty("display", `block`);
    if (innerWidth - tooltip.offsetLeft < tooltip.clientWidth) {
      tooltip.style.setProperty(
        "left",
        `${el.getBoundingClientRect().x - tooltip.clientWidth - 5}px`
      );
    }
    if (innerHeight - tooltip.offsetTop < tooltip.clientHeight) {
      tooltip.style.setProperty(
        "top",
        `${
          el.getBoundingClientRect().y + +el.getAttribute("tool-tip-top") - 27
        }px`
      );
    }
  };
  el.onmouseleave = (e) => {
    tooltip.style.setProperty("display", `none`);
  };
});
/* End Tool tip Handling */

/* Start Alert Handling */
let alert = document.getElementById("alert");

function useAlert(msg) {
  alert.style.setProperty("display", "block");
  alert.textContent = msg;
  setTimeout(() => {
    alert.style.setProperty("display", "none");
  }, 2000);
}
/* End Alert Handling */

/* End Simple Html/Css Templating */
