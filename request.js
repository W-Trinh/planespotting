async function getQuartier() {
    const response = await fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recensement-population-2019-grands-quartiers-population&q=');
    const myJson = await response.json(); 

    const data = [];

    myJson["records"].forEach(quartier =>{
        const poly = []
        for (const tabPoint of quartier["fields"]["geo_shape"]["coordinates"]){
            for (const point of tabPoint){
                const np = []
                np.push(point[1],point[0])
                poly.push(np)
            }
        }

        data.push({
            "quartier": quartier["fields"]["lib_grd_quart"],
            "population": Math.floor(quartier["fields"]["p19_pop"]),
            "point":quartier["fields"]["geo_point_2d"],
            "polygon":poly,
        })
    }

        )

    console.log(data)
    return data
}

async function getMarker(){
    const data = await getQuartier()
    
    data.forEach(quartier =>{;
        poly = L.polygon(quartier["polygon"],{color: 'blue'}).addTo(map);
        mark = L.marker(quartier["point"]).bindPopup(quartier["quartier"] + " : " + quartier["population"]).addTo(map);
    }
    )
}