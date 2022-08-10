class MapOSM {
    constructor() {
        this.map;

        this.locator = document.querySelector(".map__locate");
        this.setMarkerButton = document.querySelector(".map__set__marker");
        this.markerLabelInput = document.querySelector(".map__marker__label");
        this.markersList = document.querySelector(".markers__list");

        this.initMap();
        this.eventHandlers();
    }

    initMap() {
        this.map = L.map("map").setView([46.498, 2.208], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
            className: "map-tiles",
        }).addTo(this.map);

        this.map.zoomControl.remove();

        L.control
            .zoom({
                position: "bottomleft",
            })
            .addTo(this.map);

        this.markerIcon = L.icon({
            iconUrl: "images/marker.png",

            iconSize: [32, 32], // size of the icon

            iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62], // the same for the shadow
            // popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
        });

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

        window.addEventListener("keydown", (e) => {
            if (e.key == "t") {
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
    }

    setUserLocation() {
        this.map.locate({ setView: true, maxZoom: 16 });
    }

    addMarker(coord, index, tooltip = "") {
        if (coord) {
            console.log(coord);
            let marker = L.marker([coord.lat, coord.lng], {
                icon: this.markerIcon,
            });

            if (tooltip) {
                marker.bindTooltip(tooltip, {
                    direction: "top",
                    offset: [-15, -10],
                    permanent: true,
                });
            }

            marker.addTo(this.map);

            window.currentMarkers.push(marker);
        }
    }

    onLocationError(e) {
        alert(e.message);
    }

    onLocationFound(e) {
        console.log(e);

        this.updateUserLocation(e);
        this.map.flyTo(window.userLocation, 12);

        // L.marker(e.latlng)
        //     .addTo(this.map)
        //     .bindPopup("You are within " + radius + " meters from this point")
        //     .openPopup();

        // L.circle(e.latlng, radius).addTo(this.map);
    }

    updateUserLocation(e) {
        window.userLocation = { lat: e.latitude, lng: e.longitude };
    }

    getCurrentPosition() {
        let currentPosition = this.map.getCenter();

        if (
            window.userLocation &&
            Object.keys(window.userLocation).length > 0
        ) {
            currentPosition = window.userLocation;
        }

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

            window.currentMarkers.forEach((marker) => {
                console.log(marker);
                let li = document.createElement("li");
                let coord = document.createElement("strong");

                const latLng = marker.getLatLng();
                const tooltip = marker.getTooltip();
                li.classList.add("map__marker");
                li.setAttribute("lat", latLng.lat);
                li.setAttribute("lng", latLng.lng);

                coord.textContent = latLng.lat + ";" + latLng.lng;
                li.appendChild(coord);

                if (tooltip) {
                    let tooltipContent = document.createElement("p");
                    tooltipContent.innerHTML = tooltip.getContent();
                    li.appendChild(tooltipContent);
                }

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
}
