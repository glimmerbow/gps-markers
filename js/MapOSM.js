class MapOSM {
    constructor() {
        this.map;

        this.localStorageKey = "userMarkers";

        this.locator = document.querySelector(".map__locate");
        this.setMarkerButton = document.querySelector(".map__set__marker");
        this.clearMarkersButton = document.querySelector(
            ".map__clear__markers"
        );
        this.markerLabelInput = document.querySelector(".map__marker__label");
        this.markerLabelAutocomplete = document.querySelector(
            ".autocomplete__results"
        );
        this.markersList = document.querySelector(".markers__list");

        this.locationAllowed =
            localStorage.getItem("locationAllowed") === "true";

        this.loader = new MiniLoader(document.querySelector(".loader"));

        this.initMap();
        this.eventHandlers();
        this.setUserMarkers();
    }

    initMap() {
        this.map = L.map("map").setView([46.498, 2.208], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
            className: "map-tiles",
            scrollWheelZoom: "center",
        }).addTo(this.map);

        this.map.zoomControl.remove();

        L.control
            .zoom({
                position: "bottomleft",
            })
            .addTo(this.map);

        // this.markerIcon = L.icon({
        //     iconUrl: "images/marker.png",

        //     iconSize: [32, 32], // size of the icon

        //     iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
        //     // shadowAnchor: [4, 62], // the same for the shadow
        //     // popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
        // });

        this.map.on("locationerror", this.onLocationError.bind(this));
        this.map.on("locationfound", this.onLocationFound.bind(this));
    }

    resetMap() {
        this.map.remove();
        this.initMap();
    }

    eventHandlers() {
        if (this.locator) {
            this.locator.addEventListener("click", (e) => {
                e.preventDefault();

                this.setUserLocation();
            });
        }
        if (this.setMarkerButton) {
            this.setMarkerButton.addEventListener("click", (e) => {
                e.preventDefault();

                this.setMarkerOnUserPosition();
                this.updateMarkersList();
            });
        }

        if (this.clearMarkersButton) {
            this.clearMarkersButton.addEventListener("click", (e) => {
                e.preventDefault();

                this.clearAllMarkers();
            });
        }
        if (this.markerLabelInput && this.markerLabelAutocomplete) {
            this.markerLabelInput.addEventListener("click", (e) => {
                this.markerLabelAutocomplete.classList.add("open");
            });

            const lis = this.markerLabelAutocomplete.querySelectorAll("li");

            if (lis.length > 0) {
                lis.forEach((li) => {
                    li.addEventListener("click", (e) => {
                        this.markerLabelAutocomplete.classList.remove("open");
                        this.markerLabelInput.value = e.target.textContent;
                        this.markerLabelInput.focus();
                    });
                });
            }
        }
        window.addEventListener("keydown", (e) => {
            if (e.key == "$") {
                this.setMarkerOnUserPosition();
                this.updateMarkersList();
            }
        });

        this.markersList.addEventListener("click", (e) => {
            if (
                e.target.classList.contains("map__marker") ||
                e.target.closest(".map__marker")
            ) {
                const marker = e.target.closest(".map__marker");
                this.addRoutingToMarker({
                    lat: marker.getAttribute("lat"),
                    lng: marker.getAttribute("lng"),
                });
            }
        });

        if (this.locationAllowed) {
            this.setUserLocation();
        }
    }

    clearAllMarkers() {
        localStorage.removeItem(this.localStorageKey);
        this.currentMarkers = [];
        this.currentMarkersData = [];

        this.clearMarkersList();
        this.resetMap();
    }

    setUserMarkers() {
        this.getMarkersStorage();

        if (window.window.currentMarkersData.length > 0) {
            window.window.currentMarkersData.forEach((marker) => {
                this.addMarker(marker.coord, marker.index, marker.tooltip);
            });
        }

        this.updateMarkersList();
    }

    setUserLocation() {
        this.loader.add();
        this.map.locate({ setView: true, maxZoom: 16 });
    }

    addMarker(coord, index, tooltip = "") {
        if (coord) {
            let marker = L.marker([coord.lat, coord.lng], {
                // icon: this.markerIcon,
            });

            if (tooltip) {
                marker.bindTooltip(tooltip, {
                    direction: "top",
                    offset: [-15, -10],
                    permanent: true,
                });
            }

            marker.addTo(this.map);

            // For map
            window.currentMarkers.push(marker);
            // For data storing
            window.currentMarkersData.push({
                coord: coord,
                index: index,
                tooltip: tooltip,
            });

            this.updateMarkersStorage();
        }
    }

    onLocationError(e) {
        alert(e.message);
        this.loader.remove();
    }

    onLocationFound(e) {
        console.log(e);

        this.updateUserLocation(e);
        this.map.flyTo(window.userLocation, 12);

        if (!this.locationAllowed) {
            this.locationAllowed = true;
            localStorage.setItem("locationAllowed", true);
        }

        this.loader.remove();
    }

    updateUserLocation(e) {
        window.userLocation = { lat: e.latitude, lng: e.longitude };
    }

    getCurrentPosition() {
        let currentPosition = this.map.getCenter();

        // if (
        //     window.userLocation &&
        //     Object.keys(window.userLocation).length > 0
        // ) {
        //     currentPosition = window.userLocation;
        // }

        return currentPosition;
    }

    setMarkerOnUserPosition() {
        const value = this.markerLabelInput.value || "";

        this.addMarker(this.getCurrentPosition(), "userLocation", value);

        this.markerLabelInput.value = "";
    }

    updateMarkersList() {
        if (window.currentMarkers.length > 0) {
            this.clearMarkersList();

            window.currentMarkers.forEach((marker, index) => {
                let li = document.createElement("li");
                let coord = document.createElement("small");
                let tooltipContent = document.createElement("strong");

                const latLng = marker.getLatLng();
                const tooltip = marker.getTooltip();
                li.classList.add("map__marker");
                li.setAttribute("lat", latLng.lat);
                li.setAttribute("lng", latLng.lng);

                tooltipContent.innerHTML = tooltip
                    ? tooltip.getContent()
                    : "Marqueur " + (index + 1);

                coord.textContent = latLng.lat + ";" + latLng.lng;

                li.appendChild(tooltipContent);
                li.appendChild(coord);

                this.markersList.appendChild(li);
            });

            this.markersList.parentNode.classList.add("open");
        }
    }

    clearMarkersList() {
        while (this.markersList.firstChild) {
            this.markersList.removeChild(this.markersList.lastChild);
        }
    }

    addRoutingToMarker(markerPosition) {
        const currentPosition = this.getCurrentPosition();

        this.addRouting(currentPosition, markerPosition);
    }

    addRouting(from, to) {
        this.routing = L.Routing.control({
            waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
            routeWhileDragging: true,
            // geocoder: L.Control.Geocoder.nominatim(),
        });
        this.routing.addTo(this.map);
    }

    getMarkersStorage() {
        const markers = localStorage.getItem(this.localStorageKey);

        if (markers) {
            window.window.currentMarkersData = JSON.parse(markers);
        }
    }

    updateMarkersStorage() {
        localStorage.setItem(
            this.localStorageKey,
            JSON.stringify(window.currentMarkersData)
        );
    }
}
